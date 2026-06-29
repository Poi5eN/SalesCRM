import prisma from '../../config/database.js';
export class ActivityService {
    static async listActivities(tenantId, limit = 10) {
        return await prisma.activityLog.findMany({
            where: { tenantId },
            take: Math.min(limit, 50),
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { firstName: true, lastName: true, avatarUrl: true } }
            }
        });
    }
}
