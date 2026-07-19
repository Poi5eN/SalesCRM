import prisma from '@/config/database.js';

export class CommentService {
  /**
   * Add a comment to an entity
   */
  static async addComment(params: {
    tenantId: string;
    userId: string;
    entityType: string;
    entityId: string;
    body: string;
    mentions?: string[]; // user IDs mentioned
  }) {
    const comment = await prisma.activityLog.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId,
        entityType: params.entityType as any,
        entityId: params.entityId,
        action: 'comment',
        newValue: { body: params.body, mentions: params.mentions || [] },
        metadata: { isComment: true, mentions: params.mentions || [] },
      },
    });

    // Create notifications for mentioned users
    if (params.mentions && params.mentions.length > 0) {
      const mentionedUsers = await prisma.user.findMany({
        where: {
          id: { in: params.mentions },
          tenantId: params.tenantId,
          status: 'active',
        },
        select: { id: true },
      });

      const commentingUser = await prisma.user.findUnique({
        where: { id: params.userId },
        select: { firstName: true, lastName: true },
      });

      const notifications = mentionedUsers.map(u => ({
        tenantId: params.tenantId,
        userId: u.id,
        type: 'mention' as any,
        title: `${commentingUser?.firstName || 'Someone'} mentioned you`,
        body: params.body.length > 100 ? params.body.substring(0, 100) + '...' : params.body,
        link: `/${params.entityType}s?id=${params.entityId}`,
        entityType: params.entityType,
        entityId: params.entityId,
        channel: 'in_app' as any,
        metadata: { commentId: comment.id, mentionerId: params.userId },
      }));

      if (notifications.length > 0) {
        await prisma.notification.createMany({ data: notifications as any });
      }
    }

    return comment;
  }

  /**
   * Get comments for an entity
   */
  static async getComments(tenantId: string, entityType: string, entityId: string) {
    const comments = await prisma.activityLog.findMany({
      where: {
        tenantId,
        entityType: entityType as any,
        entityId,
        action: 'comment',
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    });

    return comments.map(c => ({
      id: c.id,
      body: (c.newValue as any)?.body || '',
      mentions: (c.newValue as any)?.mentions || [],
      user: c.user,
      createdAt: c.createdAt,
    }));
  }
}
