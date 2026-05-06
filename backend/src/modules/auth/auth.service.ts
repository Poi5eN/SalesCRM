import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import prisma from '@/config/database.ts';
import { generateAccessToken, generateRefreshToken } from '@/utils/jwt.ts';
import { env } from '@/config/env.ts';
import { UserRole, UserStatus } from '@prisma/client';
import { RBACService } from '../rbac/rbac.service.ts';

export class AuthService {
  static async registerTenant(data: any) {
    const { tenantName, tenantSlug, adminEmail, adminPassword, adminFirstName, adminLastName } = data;

    // Check slug uniqueness
    const existingTenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (existingTenant) {
      throw { status: 400, message: 'Tenant slug already exists', code: 'SLUG_EXISTS' };
    }

    const passwordHash = await bcrypt.hash(adminPassword, 12);

    return await prisma.$transaction(async (tx) => {
      // 1. Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          name: tenantName,
          slug: tenantSlug,
        },
      });

      // 2. Seed Default Pipeline Stages
      const leadStages = [
        { name: 'New', position: 0, isDefault: true, type: 'lead', isSystem: true },
        { name: 'Contacted', position: 1, type: 'lead', isSystem: true },
        { name: 'Qualified', position: 2, type: 'lead', isSystem: true },
        { name: 'Proposal Sent', position: 3, type: 'lead', isSystem: true },
        { name: 'Negotiation', position: 4, type: 'lead', isSystem: true },
      ];

      const dealStages = [
        { name: 'Discovery', position: 0, isDefault: true, type: 'deal', isSystem: true },
        { name: 'Proposal', position: 1, type: 'deal', isSystem: true },
        { name: 'Negotiation', position: 2, type: 'deal', isSystem: true },
        { name: 'Contract Sent', position: 3, type: 'deal', isSystem: true },
        { name: 'Won', position: 4, isFinal: true, type: 'deal', isSystem: true },
        { name: 'Lost', position: 5, isFinal: true, type: 'deal', isSystem: true },
      ];

      await tx.pipelineStage.createMany({
        data: [...leadStages, ...dealStages].map(s => ({ ...s, tenantId: tenant.id }))
      });

      // 3. Seed Default RBAC
      const { adminRole } = await RBACService.seedDefaults(tenant.id, tx);

      // 4. Create Admin User
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: adminEmail,
          passwordHash,
          firstName: adminFirstName,
          lastName: adminLastName,
          role: 'admin',
          status: 'active',
        },
      });

      // Assign role to user
      await tx.userTenantRole.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
          roleId: adminRole.id,
        }
      });

      // 5. Generate Tokens
      const tokens = this.issueTokens(user);
      const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);

      await tx.user.update({
        where: { id: user.id },
        data: { refreshToken: refreshTokenHash }
      });

      return { user: this.omitPassword(user), accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, tenant };
    });
  }

  static async login(data: any) {
    const { email, password } = data;

    const user = await prisma.user.findFirst({
      where: { email },
      include: { 
        userRoles: { 
          include: { 
            role: { 
              include: { 
                permissions: { 
                  include: { permission: true } 
                } 
              } 
            } 
          } 
        } 
      }
    });

    if (!user || !user.passwordHash) {
      throw { status: 401, message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' };
    }

    if (user.status !== 'active') {
      throw { status: 403, message: `Your account is ${user.status}`, code: 'USER_NOT_ACTIVE' };
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw { status: 401, message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' };
    }

    const tokens = this.issueTokens(user);
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { 
        refreshToken: refreshTokenHash,
        lastLoginAt: new Date()
      }
    });

    const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId } });

    return { user: this.omitPassword(user), accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, tenant };
  }

  static async refresh(refreshToken: string) {
    // This is simplified: in a real app, you'd decode the refresh token to get userId
    // For now, let's assume we find the user by this token (hashed match needed)
    // Actually, verifyToken should be used.
    const jwt = await import('jsonwebtoken');
    try {
      const decoded = jwt.default.verify(refreshToken, env.JWT_REFRESH_SECRET) as any;
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });

      if (!user || !user.refreshToken || !(await bcrypt.compare(refreshToken, user.refreshToken))) {
        throw { status: 401, message: 'Invalid refresh token', code: 'INVALID_REFRESH_TOKEN' };
      }

      const tokens = this.issueTokens(user);
      const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);

      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: refreshTokenHash }
      });

      return tokens;
    } catch (err) {
      throw { status: 401, message: 'Invalid or expired refresh token', code: 'INVALID_REFRESH_TOKEN' };
    }
  }

  static async logout(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null }
    });
  }

  static async inviteUser(data: any, inviter: any) {
    const { email, firstName, lastName, role } = data;

    const existingUser = await prisma.user.findFirst({
      where: { email, tenantId: inviter.tenantId }
    });

    if (existingUser) {
      throw { status: 400, message: 'User already exists in this tenant', code: 'USER_EXISTS' };
    }

    const inviteToken = uuidv4();
    const inviteExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72h

    const user = await prisma.user.create({
      data: {
        tenantId: inviter.tenantId,
        email,
        firstName,
        lastName,
        role,
        status: 'invited',
        inviteToken,
        inviteExpiresAt,
        invitedById: inviter.id,
      }
    });

    // In a real app, send email here
    const inviteLink = `${env.FRONTEND_URL}/accept-invite?token=${inviteToken}`;
    
    return { user: this.omitPassword(user), inviteLink };
  }

  static async acceptInvite(data: any) {
    const { inviteToken, password, firstName, lastName } = data;

    const user = await prisma.user.findUnique({
      where: { inviteToken }
    });

    if (!user || !user.inviteExpiresAt || user.inviteExpiresAt < new Date()) {
      throw { status: 400, message: 'Invalid or expired invite token', code: 'INVALID_INVITE_TOKEN' };
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        firstName,
        lastName,
        status: 'active',
        inviteToken: null,
        inviteExpiresAt: null,
      }
    });

    return this.omitPassword(updatedUser);
  }

  static async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw { status: 404, message: 'User not found', code: 'USER_NOT_FOUND' };
    }

    const permissions = user.userRoles.flatMap(ur => 
      ur.role.permissions.map(rp => `${rp.permission.resource}:${rp.permission.action}`)
    );

    return { ...this.omitPassword(user), permissions };
  }

  private static issueTokens(user: any) {
    const payload = { 
      id: user.id, 
      tenantId: user.tenantId, 
      email: user.email, 
      role: user.role 
    };
    return {
      accessToken: generateAccessToken(payload),
      refreshToken: generateRefreshToken(payload),
    };
  }

  private static omitPassword(user: any) {
    const { passwordHash, refreshToken, resetToken, ...rest } = user;
    return rest;
  }
}
