import prisma from '@/config/database.js';

export class TaskService {
  static async listTasks(tenantId: string, filters: any) {
    const { 
      status, type, priority, assignedToId, leadId, dealId, contactId, 
      dueBefore, dueAfter, isOverdue,
      page = 1, limit = 10, sortBy = 'dueAt', sortOrder = 'asc' 
    } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
      deletedAt: null,
      ...(status ? { status: status as any } : {}),
      ...(type ? { type: type as any } : {}),
      ...(priority ? { priority: priority as any } : {}),
      ...(assignedToId ? { assignedToId } : {}),
      ...(leadId ? { leadId } : {}),
      ...(dealId ? { dealId } : {}),
      ...(contactId ? { contactId } : {}),
      ...(dueBefore || dueAfter ? {
        dueAt: {
          ...(dueBefore ? { lte: new Date(dueBefore) } : {}),
          ...(dueAfter ? { gte: new Date(dueAfter) } : {}),
        }
      } : {}),
      ...(isOverdue ? { status: 'overdue' } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: Math.min(limit, 100),
        orderBy: { [sortBy]: sortOrder },
        include: {
          assignedTo: { select: { firstName: true, lastName: true } },
          lead: { select: { title: true } },
          deal: { select: { title: true } },
          contact: { select: { firstName: true, lastName: true } },
        }
      }),
      prisma.task.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  static async createTask(tenantId: string, userId: string, data: any) {
    const status = data.dueAt && new Date(data.dueAt) < new Date() ? 'overdue' : 'pending';
    
    return await prisma.task.create({
      data: {
        ...data,
        tenantId,
        createdById: userId,
        assignedToId: data.assignedToId || userId,
        status: status as any
      }
    });
  }

  static async updateTask(tenantId: string, id: string, data: any) {
    if (data.status === 'completed') {
      data.completedAt = new Date();
    } else if (data.status && data.status !== 'completed') {
      data.completedAt = null;
    }

    return await prisma.task.update({
      where: { id, tenantId },
      data
    });
  }

  static async getUpcoming(tenantId: string, userId: string) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOf7Days = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);

    const tasks = await prisma.task.findMany({
      where: {
        tenantId,
        assignedToId: userId,
        dueAt: { gte: startOfToday, lte: endOf7Days },
        status: { notIn: ['completed', 'cancelled'] },
        deletedAt: null
      },
      include: {
        lead: { select: { title: true } },
        deal: { select: { title: true } },
      },
      orderBy: { dueAt: 'asc' }
    });

    return tasks;
  }

  static async getOverdue(tenantId: string, userId: string) {
    return await prisma.task.findMany({
      where: {
        tenantId,
        assignedToId: userId,
        OR: [
          { status: 'overdue' },
          { dueAt: { lt: new Date() }, status: { notIn: ['completed', 'cancelled'] } }
        ],
        deletedAt: null
      },
      orderBy: { dueAt: 'asc' }
    });
  }
}
