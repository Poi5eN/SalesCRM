import prisma from '@/config/database.js';
import type { TenantPlan } from '@prisma/client';

export interface PlanConfig {
  id: TenantPlan;
  name: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'annual';
  features: {
    maxUsers: number;
    maxLeads: number;
    maxDeals: number;
    maxStorage: string;
    aiFeatures: boolean;
    apiAccess: boolean;
    customFields: boolean;
    advancedReporting: boolean;
    integrations: boolean;
    slaManagement: boolean;
    prioritySupport: boolean;
  };
}

const PLANS: PlanConfig[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'USD',
    interval: 'monthly',
    features: {
      maxUsers: 2,
      maxLeads: 100,
      maxDeals: 50,
      maxStorage: '100 MB',
      aiFeatures: false,
      apiAccess: false,
      customFields: false,
      advancedReporting: false,
      integrations: false,
      slaManagement: false,
      prioritySupport: false,
    },
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    currency: 'USD',
    interval: 'monthly',
    features: {
      maxUsers: 5,
      maxLeads: 1000,
      maxDeals: 500,
      maxStorage: '1 GB',
      aiFeatures: true,
      apiAccess: false,
      customFields: true,
      advancedReporting: false,
      integrations: true,
      slaManagement: true,
      prioritySupport: false,
    },
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 79,
    currency: 'USD',
    interval: 'monthly',
    features: {
      maxUsers: 25,
      maxLeads: 10000,
      maxDeals: 5000,
      maxStorage: '10 GB',
      aiFeatures: true,
      apiAccess: true,
      customFields: true,
      advancedReporting: true,
      integrations: true,
      slaManagement: true,
      prioritySupport: true,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 249,
    currency: 'USD',
    interval: 'monthly',
    features: {
      maxUsers: 999,
      maxLeads: 999999,
      maxDeals: 999999,
      maxStorage: 'Unlimited',
      aiFeatures: true,
      apiAccess: true,
      customFields: true,
      advancedReporting: true,
      integrations: true,
      slaManagement: true,
      prioritySupport: true,
    },
  },
];

export class BillingService {
  static getPlans(): PlanConfig[] {
    return PLANS;
  }

  static getPlan(planId: TenantPlan): PlanConfig | undefined {
    return PLANS.find(p => p.id === planId);
  }

  static async getCurrentSubscription(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        plan: true,
        status: true,
        trialEndsAt: true,
        billingEmail: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            leads: true,
            deals: true,
          },
        },
      },
    });

    if (!tenant) throw { status: 404, message: 'Tenant not found' };

    const planConfig = this.getPlan(tenant.plan as TenantPlan);

    return {
      tenantId: tenant.id,
      name: tenant.name,
      plan: tenant.plan,
      planName: planConfig?.name || 'Unknown',
      status: tenant.status,
      trialEndsAt: tenant.trialEndsAt,
      billingEmail: tenant.billingEmail,
      usage: {
        users: tenant._count.users,
        leads: tenant._count.leads,
        deals: tenant._count.deals,
      },
      limits: planConfig?.features || null,
      price: planConfig?.price || 0,
      currency: planConfig?.currency || 'USD',
    };
  }

  static async changePlan(tenantId: string, newPlan: TenantPlan) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) throw { status: 404, message: 'Tenant not found' };

    const planConfig = this.getPlan(newPlan);
    if (!planConfig) throw { status: 400, message: 'Invalid plan' };

    // Check usage against new plan limits
    const usage = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        _count: {
          select: { users: true, leads: true, deals: true },
        },
      },
    });

    if (usage) {
      if (usage._count.users > planConfig.features.maxUsers) {
        throw {
          status: 400,
          message: `Cannot downgrade: ${usage._count.users} active users exceeds ${planConfig.features.maxUsers} limit for ${planConfig.name} plan`,
          code: 'USAGE_EXCEEDS_LIMIT',
        };
      }
    }

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { plan: newPlan },
    });

    return { plan: newPlan, planName: planConfig.name };
  }

  static async updateBillingEmail(tenantId: string, billingEmail: string) {
    return await prisma.tenant.update({
      where: { id: tenantId },
      data: { billingEmail },
    });
  }

  static async checkUsageLimits(tenantId: string): Promise<{
    withinLimits: boolean;
    warnings: string[];
  }> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: { select: { users: true, leads: true, deals: true } },
      },
    });

    if (!tenant) throw { status: 404, message: 'Tenant not found' };

    const planConfig = this.getPlan(tenant.plan as TenantPlan);
    if (!planConfig) return { withinLimits: true, warnings: [] };

    const warnings: string[] = [];
    if (tenant._count.users > planConfig.features.maxUsers) {
      warnings.push(`You have ${tenant._count.users} users (limit: ${planConfig.features.maxUsers})`);
    }
    if (tenant._count.leads > planConfig.features.maxLeads) {
      warnings.push(`You have ${tenant._count.leads} leads (limit: ${planConfig.features.maxLeads})`);
    }
    if (tenant._count.deals > planConfig.features.maxDeals) {
      warnings.push(`You have ${tenant._count.deals} deals (limit: ${planConfig.features.maxDeals})`);
    }

    return {
      withinLimits: warnings.length === 0,
      warnings,
    };
  }
}
