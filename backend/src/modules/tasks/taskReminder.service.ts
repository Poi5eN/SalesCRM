import prisma from '@/config/database.js';

export class TaskReminderService {
  /**
   * Check for tasks that need reminders sent.
   * Looks for tasks where:
   * - dueAt is within the next 24 hours
   * - reminderAt is set and is in the past
   * - reminderSent is false
   * - status is not 'completed' or 'cancelled'
   *
   * In a production app, this would trigger email/SMS/push notifications.
   * For now, we mark them as reminderSent so the frontend can display them.
   */
  static async processDueReminders(tenantId?: string) {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const where: any = {
      reminderSent: false,
      deletedAt: null,
      status: { notIn: ['completed', 'cancelled'] },
      OR: [
        // Tasks with an explicit reminder time that has passed
        { reminderAt: { lte: now, not: null } },
        // Tasks due within the next 24 hours without a specific reminder set
        { reminderAt: null, dueAt: { gte: now, lte: in24Hours } },
      ],
    };

    if (tenantId) {
      where.tenantId = tenantId;
    }

    const tasksDue = await prisma.task.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        lead: { select: { title: true } },
        deal: { select: { title: true } },
      },
      take: 100,
    });

    if (tasksDue.length === 0) return { reminded: 0 };

    // Mark all as reminded
    const taskIds = tasksDue.map(t => t.id);
    await prisma.task.updateMany({
      where: { id: { in: taskIds } },
      data: { reminderSent: true },
    });

    // Log reminder activities for each task
    for (const task of tasksDue) {
      const parentContext = task.lead?.title || task.deal?.title || '';
      const entityType = task.leadId ? 'lead' : task.dealId ? 'deal' : 'task';
      const entityId = task.leadId || task.dealId || task.id;
      const leadId = task.leadId || undefined;
      const dealId = task.dealId || undefined;

      // Fire-and-forget activity log
      prisma.activityLog.create({
        data: {
          tenantId: task.tenantId,
          userId: task.assignedTo?.id || task.createdById,
          entityId,
          entityType: entityType as any,
          leadId,
          dealId,
          action: 'task_reminder',
          metadata: {
            taskId: task.id,
            taskTitle: task.title,
            dueAt: task.dueAt,
            assignedTo: task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : null,
            context: parentContext,
            message: `Reminder: Task \"${task.title}\" is due ${task.dueAt ? 'soon' : 'now'}`,
          },
        },
      }).catch(() => {});
    }

    return { reminded: tasksDue.length };
  }

  /**
   * Get tasks that need attention for a specific user.
   * Returns counts of due tasks, overdue tasks, and tasks with pending reminders.
   */
  static async getUserTaskDigest(tenantId: string, userId: string) {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const [dueCount, overdueCount, reminderCount] = await Promise.all([
      prisma.task.count({
        where: {
          tenantId,
          assignedToId: userId,
          deletedAt: null,
          dueAt: { gte: now, lte: in24Hours },
          status: { notIn: ['completed', 'cancelled'] },
        },
      }),
      prisma.task.count({
        where: {
          tenantId,
          assignedToId: userId,
          deletedAt: null,
          dueAt: { lt: now },
          status: { notIn: ['completed', 'cancelled'] },
        },
      }),
      prisma.task.count({
        where: {
          tenantId,
          assignedToId: userId,
          deletedAt: null,
          reminderSent: true,
          status: { notIn: ['completed', 'cancelled'] },
        },
      }),
    ]);

    return { dueCount, overdueCount, reminderCount };
  }
}
