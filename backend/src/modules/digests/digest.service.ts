import prisma from '@/config/database.js';
import { NotificationService } from '@/modules/notifications/notification.service.js';

export class DigestService {
  /**
   * Generate monthly lost-leads digest for all active users
   */
  static async generateMonthlyLostLeadsDigest() {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const tenants = await prisma.tenant.findMany({
      where: { status: 'active' },
      select: { id: true },
    });

    for (const tenant of tenants) {
      try {
        await this.generateTenantLostLeadsDigest(tenant.id, firstOfLastMonth, firstOfMonth);
      } catch (err) {
        console.error(`[Digest] Failed for tenant ${tenant.id}:`, err);
      }
    }
  }

  /**
   * Generate lost-leads digest for a single tenant
   */
  static async generateTenantLostLeadsDigest(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ) {
    // Find leads that were converted to lost deals
    const lostDealIds = await prisma.deal.findMany({
      where: { tenantId, status: 'lost' },
      select: { sourceLeadId: true },
    });
    const convertedLostLeadIds = lostDealIds
      .map(d => d.sourceLeadId)
      .filter((id): id is string => id !== null);

    // Find leads at a final stage (that may be a lost equivalent)
    const finalStageIds = await prisma.pipelineStage.findMany({
      where: { tenantId, isFinal: true, type: 'lead' },
      select: { id: true },
    });
    const finalStageIdSet = new Set(finalStageIds.map(s => s.id));

    // Combine both approaches to find lost leads
    const allLeads = await prisma.lead.findMany({
      where: {
        tenantId,
        deletedAt: null,
        OR: [
          { id: { in: convertedLostLeadIds } },
          { stageId: { in: Array.from(finalStageIdSet) } },
        ],
      },
      include: {
        stage: true,
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        contact: { select: { firstName: true, lastName: true, email: true, phone: true } },
      },
    });

    if (allLeads.length === 0) return;

    // Send digest to all active sales reps and managers
    const activeUsers = await prisma.user.findMany({
      where: {
        tenantId,
        status: 'active',
        OR: [
          { role: 'salesRep' },
          { role: 'salesManager' },
          { role: 'admin' },
        ],
      },
      select: { id: true },
    });

    if (activeUsers.length === 0) return;

    const summary = allLeads.map(l => ({
      title: l.title,
      contact: l.contact ? `${l.contact.firstName} ${l.contact.lastName || ''}` : 'Unknown',
      email: l.contact?.email || null,
      phone: l.contact?.phone || null,
      stage: l.stage?.name || 'Unknown',
      assignedTo: l.assignedTo ? `${l.assignedTo.firstName} ${l.assignedTo.lastName}` : 'Unassigned',
      lostDate: l.updatedAt.toISOString(),
    }));

    const body = `Monthly Lost Leads Digest (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})\n\n` +
      `${allLeads.length} lead(s) were marked as lost.\n\n` +
      summary.map(s => `• ${s.title} (${s.contact}) — ${s.stage} — ${s.assignedTo}`).join('\n') +
      '\n\nReview these for possible re-engagement.';

    // Notify each active user
    for (const user of activeUsers) {
      await NotificationService.notify({
        tenantId,
        userId: user.id,
        type: 'digest',
        title: `📊 Monthly Lost Leads Digest — ${allLeads.length} leads lost`,
        body,
        link: '/reports',
        entityType: 'lead',
        metadata: { digestType: 'monthly_lost_leads', count: allLeads.length, summary },
      });
    }

    console.log(`[Digest] Lost leads digest sent to ${activeUsers.length} users in tenant ${tenantId}: ${allLeads.length} leads`);
    return { tenantId, lostLeadsCount: allLeads.length, notifiedUsers: activeUsers.length };
  }

  /**
   * Generate weekly activity digest
   */
  static async generateWeeklyDigest() {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const tenants = await prisma.tenant.findMany({
      where: { status: 'active' },
      select: { id: true },
    });

    for (const tenant of tenants) {
      try {
        await this.generateTenantWeeklyDigest(tenant.id, sevenDaysAgo, now);
      } catch (err) {
        console.error(`[Digest] Weekly digest failed for tenant ${tenant.id}:`, err);
      }
    }
  }

  static async generateTenantWeeklyDigest(tenantId: string, startDate: Date, endDate: Date) {
    const activeUsers = await prisma.user.findMany({
      where: {
        tenantId,
        status: 'active',
        role: { in: ['salesRep', 'salesManager', 'admin'] },
      },
      select: { id: true, firstName: true, lastName: true },
    });

    for (const user of activeUsers) {
      // Count user's activity for the week
      const [dealsWon, leadsCreated, tasksCompleted, commsLogged] = await Promise.all([
        prisma.deal.count({ where: { tenantId, assignedToId: user.id, status: 'won', closedAt: { gte: startDate } } }),
        prisma.lead.count({ where: { tenantId, createdById: user.id, createdAt: { gte: startDate } } }),
        prisma.task.count({ where: { tenantId, assignedToId: user.id, status: 'completed', completedAt: { gte: startDate } } }),
        prisma.communication.count({ where: { tenantId, userId: user.id, createdAt: { gte: startDate } } }),
      ]);

      const body = `📈 Your Weekly Activity Digest\n\n` +
        `Period: ${startDate.toLocaleDateString()} — ${endDate.toLocaleDateString()}\n\n` +
        `✅ Deals Won: ${dealsWon}\n` +
        `📋 Leads Created: ${leadsCreated}\n` +
        `📝 Tasks Completed: ${tasksCompleted}\n` +
        `💬 Communications Logged: ${commsLogged}\n\n` +
        `Keep up the great work! 🚀`;

      await NotificationService.notify({
        tenantId,
        userId: user.id,
        type: 'digest',
        title: `📈 Your Weekly Activity Summary`,
        body,
        link: '/reports',
        metadata: {
          digestType: 'weekly',
          stats: { dealsWon, leadsCreated, tasksCompleted, commsLogged },
        },
      });
    }
  }
}
