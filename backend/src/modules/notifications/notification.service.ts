import prisma from '@/config/database.js';
import type { NotificationType, NotificationChannel } from '@prisma/client';

export class NotificationService {
  /**
   * Create a notification for a user
   */
  static async notify(params: {
    tenantId: string;
    userId: string;
    type: NotificationType;
    title: string;
    body?: string;
    link?: string;
    entityType?: string;
    entityId?: string;
    channel?: NotificationChannel;
    metadata?: any;
  }) {
    return await prisma.notification.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        link: params.link,
        entityType: params.entityType || null,
        entityId: params.entityId || null,
        channel: params.channel || 'in_app',
        metadata: params.metadata || undefined,
      },
    });
  }

  /**
   * Notify multiple users at once
   */
  static async notifyMany(
    params: Omit<Parameters<typeof NotificationService.notify>[0], 'userId'>,
    userIds: string[]
  ) {
    const notifications = userIds.map(userId => ({
      tenantId: params.tenantId,
      userId,
      type: params.type,
      title: params.title,
      body: params.body,
      link: params.link,
      entityType: params.entityType || null,
      entityId: params.entityId || null,
      channel: params.channel || 'in_app',
      metadata: params.metadata || undefined,
    }));

    if (notifications.length === 0) return [];

    return await prisma.notification.createMany({
      data: notifications,
    });
  }

  /**
   * Get notifications for a user with pagination
   */
  static async list(tenantId: string, userId: string, filters: {
    page?: number;
    limit?: number;
    isRead?: boolean;
    type?: string;
  }) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
      userId,
      isArchived: false,
    };

    if (filters.isRead !== undefined) {
      where.isRead = filters.isRead;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    const [data, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(tenantId: string, userId: string) {
    return await prisma.notification.count({
      where: {
        tenantId,
        userId,
        isRead: false,
        isArchived: false,
      },
    });
  }

  /**
   * Mark notifications as read
   */
  static async markAsRead(tenantId: string, userId: string, ids: string[]) {
    return await prisma.notification.updateMany({
      where: {
        id: { in: ids },
        tenantId,
        userId,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(tenantId: string, userId: string) {
    return await prisma.notification.updateMany({
      where: {
        tenantId,
        userId,
        isRead: false,
        isArchived: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Archive a notification
   */
  static async archive(tenantId: string, userId: string, id: string) {
    return await prisma.notification.updateMany({
      where: {
        id,
        tenantId,
        userId,
      },
      data: { isArchived: true },
    });
  }

  /**
   * Send SLA breach notifications
   */
  static async notifySLABreach(params: {
    tenantId: string;
    leadId: string;
    leadTitle: string;
    oldAssigneeId: string;
    newAssigneeId: string;
    slaThresholdHours: number;
  }) {
    const { tenantId, leadId, leadTitle, oldAssigneeId, newAssigneeId, slaThresholdHours } = params;

    // Notify the old assignee
    await this.notify({
      tenantId,
      userId: oldAssigneeId,
      type: 'auto_reassignment',
      title: 'Lead reassigned due to SLA breach',
      body: `${leadTitle} was auto-reassigned after exceeding the ${slaThresholdHours}h SLA.`,
      link: `/leads?id=${leadId}`,
      entityType: 'lead',
      entityId: leadId,
      channel: 'both',
      metadata: { slaThresholdHours, reassignedTo: newAssigneeId },
    });

    // Notify the new assignee
    await this.notify({
      tenantId,
      userId: newAssigneeId,
      type: 'auto_reassignment',
      title: 'New lead assigned to you (SLA)',
      body: `${leadTitle} has been assigned to you due to SLA auto-reassignment.`,
      link: `/leads?id=${leadId}`,
      entityType: 'lead',
      entityId: leadId,
      channel: 'both',
      metadata: { slaThresholdHours, reassignedFrom: oldAssigneeId },
    });
  }

  /**
   * Notify task due reminders
   */
  static async notifyTaskDue(params: {
    tenantId: string;
    userId: string;
    taskId: string;
    taskTitle: string;
    dueAt: Date;
  }) {
    return await this.notify({
      tenantId: params.tenantId,
      userId: params.userId,
      type: 'task_due',
      title: `Task due: ${params.taskTitle}`,
      body: `Your task "${params.taskTitle}" is due ${params.dueAt.toISOString()}.`,
      link: `/tasks?id=${params.taskId}`,
      entityType: 'task',
      entityId: params.taskId,
      channel: 'in_app',
      metadata: { dueAt: params.dueAt.toISOString() },
    });
  }
}
