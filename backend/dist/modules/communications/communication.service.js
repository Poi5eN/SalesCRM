import prisma from '../../config/database.js';
export class CommunicationService {
    static async listCommunications(tenantId, filters) {
        const { leadId, dealId, contactId, type, sourceType, page = 1, limit = 10 } = filters;
        const skip = (page - 1) * limit;
        const where = {
            tenantId,
            deletedAt: null,
            ...(leadId ? { leadId } : {}),
            ...(dealId ? { dealId } : {}),
            ...(contactId ? { contactId } : {}),
            ...(type ? { type: type } : {}),
            ...(sourceType ? { sourceType: sourceType } : {}),
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
    static async createCommunication(tenantId, userId, data) {
        return await prisma.communication.create({
            data: {
                ...data,
                tenantId,
                userId,
                occurredAt: data.occurredAt ? new Date(data.occurredAt) : new Date()
            }
        });
    }
    static async getCommunication(tenantId, id) {
        const comm = await prisma.communication.findFirst({
            where: { id, tenantId }
        });
        if (!comm)
            throw { status: 404, message: 'Communication not found' };
        return comm;
    }
    static async updateCommunication(tenantId, id, data) {
        return await prisma.communication.update({
            where: { id, tenantId },
            data
        });
    }
    static async deleteCommunication(tenantId, id) {
        return await prisma.communication.update({
            where: { id, tenantId },
            data: { deletedAt: new Date() }
        });
    }
}
