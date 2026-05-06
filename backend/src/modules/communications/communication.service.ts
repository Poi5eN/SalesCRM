import prisma from '@/config/database.ts';

export class CommunicationService {
  static async listCommunications(tenantId: string, filters: any) {
    const { leadId, dealId, contactId, type, sourceType, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
      deletedAt: null,
      ...(leadId ? { leadId } : {}),
      ...(dealId ? { dealId } : {}),
      ...(contactId ? { contactId } : {}),
      ...(type ? { type: type as any } : {}),
      ...(sourceType ? { sourceType: sourceType as any } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.communication.findMany({
        where,
        skip,
        take: Math.min(limit, 100),
        orderBy: { occurredAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true } },
          contact: { select: { firstName: true, lastName: true } },
        }
      }),
      prisma.communication.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  static async createCommunication(tenantId: string, userId: string, data: any) {
    return await prisma.communication.create({
      data: {
        ...data,
        tenantId,
        userId,
        occurredAt: data.occurredAt ? new Date(data.occurredAt) : new Date()
      }
    });
  }

  static async getCommunication(tenantId: string, id: string) {
    const comm = await prisma.communication.findFirst({
      where: { id, tenantId }
    });
    if (!comm) throw { status: 404, message: 'Communication not found' };
    return comm;
  }

  static async updateCommunication(tenantId: string, id: string, data: any) {
    return await prisma.communication.update({
      where: { id, tenantId },
      data
    });
  }

  static async deleteCommunication(tenantId: string, id: string) {
    return await prisma.communication.update({
      where: { id, tenantId },
      data: { deletedAt: new Date() }
    });
  }
}
