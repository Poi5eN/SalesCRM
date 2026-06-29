import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import validate from '../../middleware/validate.js';
import authGuard from '../../middleware/authGuard.js';
import rbacGuard from '../../middleware/rbacGuard.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { registerTenantSchema, loginSchema, inviteUserSchema, acceptInviteSchema } from './auth.schemas.js';
const router = Router();
/**
 * @swagger
 * /api/auth/register-tenant:
 *   post:
 *     summary: Register a new tenant and admin user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tenantName, firstName, lastName, email, password]
 *             properties:
 *               tenantName: { type: string }
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       201:
 *         description: Tenant registered successfully
 */
router.post('/register-tenant', validate(registerTenantSchema), asyncHandler(AuthController.registerTenant));
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user and get tokens
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/login', validate(loginSchema), asyncHandler(AuthController.login));
/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh token cookie
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Token refreshed
 */
router.post('/refresh', asyncHandler(AuthController.refresh));
/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Clear cookies and logout
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', authGuard, asyncHandler(AuthController.logout));
/**
 * @swagger
 * /api/auth/invite:
 *   post:
 *     summary: Invite a new user to the tenant
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, roleId]
 *             properties:
 *               email: { type: string }
 *               roleId: { type: string }
 *     responses:
 *       200:
 *         description: Invitation sent
 */
router.post('/invite', authGuard, rbacGuard('users', 'create'), validate(inviteUserSchema), asyncHandler(AuthController.invite));
/**
 * @swagger
 * /api/auth/accept-invite:
 *   post:
 *     summary: Accept user invitation
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password, firstName, lastName]
 *             properties:
 *               token: { type: string }
 *               password: { type: string }
 *               firstName: { type: string }
 *               lastName: { type: string }
 *     responses:
 *       200:
 *         description: Invitation accepted
 */
router.post('/accept-invite', validate(acceptInviteSchema), asyncHandler(AuthController.acceptInvite));
/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user details
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User details
 */
router.get('/me', authGuard, asyncHandler(AuthController.me));
export default router;
