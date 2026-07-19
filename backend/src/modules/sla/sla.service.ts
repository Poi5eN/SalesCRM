import prisma from '@/config/database.js';

interface SLAConfig {
  thresholdHours: number;
  fallbackStrategy: 'roundRobin' | 'managerDefined';
  fallbackUserId?: string; // For managerDefined, the manager who receives reassigned leads
}

export class SLAService {
  /**
   * Get SLA config for a tenant
   */
  static async getConfig(tenantId: string): Promise<SLAConfig> {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    const settings = (tenant?.settings as any) || {};
    return settings.slaConfig || { thresholdHours: 24, fallbackStrategy: 'roundRobin' };
  }

  /**
   * Update SLA config for a tenant
   */
  static async updateConfig(tenantId: string, config: Partial<SLAConfig>) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    const settings = (tenant?.settings as any) || {};
    const current = settings.slaConfig || { thresholdHours: 24, fallbackStrategy: 'roundRobin' };

    return await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        settings: {
          ...settings,
          slaConfig: { ...current, ...config },
        },
      },
    });
  }

  /**
   * Check all leads for SLA breaches and auto-reassign if needed.
   * Definition of "untouched": no logged interaction (call, email, WhatsApp, note, stage change)
   * in the configured threshold period. Simply viewing a lead does NOT count as touched.
   *
   * This should be called by a cron/scheduled job.
   */
  static async checkAndReassign(tenantId: string) {
    const config = await this.getConfig(tenantId);
    const thresholdDate = new Date(Date.now() - config.thresholdHours * 60 * 60 * 1000);
    const systemUser = await this.getSystemUser(tenantId);

    // Find leads that have been untouched beyond the SLA threshold
    // "Untouched" = no logged interaction since threshold
    const staleLeads = await prisma.lead.findMany({
      where: {
        tenantId,
        deletedAt: null,
        isConverted: false,
        assignedToId: { not: null },
        lastActivityAt: { lt: thresholdDate },
      },
      select: {
        id: true,
        title: true,
        assignedToId: true,
        lastActivityAt: true,
        stageId: true,
      },
      take: 50,
    });

    if (staleLeads.length === 0) return { reassigned: 0, total: 0 };

    // Get all active salesRep and salesManager users for round robin
    const activeReps = await prisma.user.findMany({
      where: {
        tenantId,
        status: 'active',
        role: { in: ['salesRep', 'salesManager'] },
      },
      select: { id: true, firstName: true, lastName: true },
    });

    if (activeReps.length === 0) return { reassigned: 0, total: staleLeads.length };

    let reassignedCount = 0;

    for (let i = 0; i < staleLeads.length; i++) {
      const lead = staleLeads[i];

      // Skip leads that have had ANY activity since the threshold (double check)
      const recentActivity = await prisma.activityLog.count({
        where: {
          tenantId,
          leadId: lead.id,
          createdAt: { gte: thresholdDate },
        },
      });

      if (recentActivity > 0) continue;

      // Round robin assignment: cycle through active reps, excluding current owner
      const candidatePool = activeReps.filter(r => r.id !== lead.assignedToId);
      if (candidatePool.length === 0) continue; // Skip if no other active reps
      const newAssignee = candidatePool[i % candidatePool.length];

      await prisma.$transaction(async (tx) => {
        await tx.lead.update({
          where: { id: lead.id },
          data: {
            assignedToId: newAssignee.id,
            lastActivityAt: new Date(),
          },
        });

        // Log the reassignment event visibly
        await tx.activityLog.create({
          data: {
            tenantId,
            userId: systemUser?.id || newAssignee.id,
            entityId: lead.id,
            entityType: 'lead',
            leadId: lead.id,
            action: 'auto_reassigned',
            metadata: {
              fromUserId: lead.assignedToId,
              toUserId: newAssignee.id,
              reason: 'SLA_breach',
              thresholdHours: config.thresholdHours,
              lastActivityAt: lead.lastActivityAt,
              message: `Auto-reassigned from previous owner — ${config.thresholdHours}h SLA breach`,
            },
          },
        });
      });

      reassignedCount++;
    }

    return { reassigned: reassignedCount, total: staleLeads.length };
  }

  /**
   * Get the count of leads currently at risk of SLA breach
   */
  static async getAtRiskCount(tenantId: string) {
    const config = await this.getConfig(tenantId);
    const thresholdDate = new Date(Date.now() - config.thresholdHours * 60 * 60 * 1000);

    return await prisma.lead.count({
      where: {
        tenantId,
        deletedAt: null,
        isConverted: false,
        assignedToId: { not: null },
        lastActivityAt: { lt: thresholdDate },
      },
    });
  }

  /**
   * Grace period config endpoint: returns the configured threshold for display
   */
  static async getThreshold(tenantId: string) {
    const config = await this.getConfig(tenantId);
    return { thresholdHours: config.thresholdHours, fallbackStrategy: config.fallbackStrategy };
  }

  private static async getSystemUser(tenantId: string) {
    // Find or use an admin user as the system actor for auto-reassignments
    const system = await prisma.user.findFirst({
      where: { tenantId, role: 'admin', status: 'active' },
      select: { id: true, firstName: true, lastName: true },
    });
    return system;
  }
}
