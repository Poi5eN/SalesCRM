import prisma from '../../config/database.js';
import { LeadScoringService } from '../leadScoring/leadScoring.service.js';
export class LeadService {
    static async listLeads(tenantId, filters) {
        const { stageId, assignedToId, priority, source, isConverted, tag, search, createdAtFrom, createdAtTo, isStale, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = filters;
        const skip = (page - 1) * limit;
        const where = {
            tenantId,
            deletedAt: null,
            ...(stageId ? { stageId } : {}),
            ...(assignedToId ? { assignedToId } : {}),
            ...(priority ? { priority } : {}),
            ...(source ? { source } : {}),
            ...(isConverted !== undefined ? { isConverted: isConverted === 'true' } : {}),
            ...(tag ? { tags: { has: tag } } : {}),
            ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
            ...(createdAtFrom || createdAtTo ? {
                createdAt: {
                    ...(createdAtFrom ? { gte: new Date(createdAtFrom) } : {}),
                    ...(createdAtTo ? { lte: new Date(createdAtTo) } : {}),
                }
            } : {}),
        };
        if (isStale === 'true') {
            const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
            const thresholdDays = tenant?.settings?.staleDaysThreshold || 14;
            const threshold = new Date(Date.now() - thresholdDays * 24 * 60 * 60 * 1000);
            where.lastActivityAt = { lte: threshold };
        }
        const [data, total] = await Promise.all([
            prisma.lead.findMany({
                where,
                skip,
                take: Math.min(limit, 100),
                orderBy: { [sortBy]: sortOrder },
                include: {
                    contact: { select: { firstName: true, lastName: true, email: true } },
                    company: { select: { name: true } },
                    stage: { select: { name: true } },
                    assignedTo: { select: { firstName: true, lastName: true } }
                }
            }),
            prisma.lead.count({ where }),
        ]);
        // Attach isStale dynamically
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        const staleDays = tenant?.settings?.staleDaysThreshold || 14;
        const enrichedData = data.map(lead => ({
            ...lead,
            isStale: this.checkStale(lead.lastActivityAt, staleDays)
        }));
        return {
            data: enrichedData,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
        };
    }
    static async getLeadBoard(tenantId) {
        const stages = await prisma.pipelineStage.findMany({
            where: { tenantId, type: 'lead', isArchived: false },
            orderBy: { position: 'asc' },
            include: {
                leads: {
                    where: { deletedAt: null, isConverted: false },
                    include: {
                        contact: { select: { firstName: true, lastName: true } },
                        assignedTo: { select: { firstName: true, lastName: true } }
                    }
                }
            }
        });
        return stages.map(stage => {
            const leads = stage.leads || [];
            const totalValue = leads.reduce((sum, lead) => sum + Number(lead.estimatedValue || 0), 0);
            return {
                stage,
                leads,
                totalCount: leads.length,
                totalValue
            };
        });
    }
    static async createLead(tenantId, userId, data) {
        const rules = await LeadScoringService.getRules(tenantId);
        const score = LeadScoringService.calculateScore(data, rules);
        return await prisma.lead.create({
            data: {
                ...data,
                tenantId,
                createdById: userId,
                assignedToId: data.assignedToId || userId,
                score,
                lastActivityAt: new Date()
            }
        });
    }
    static async checkDuplicate(tenantId, title, contactId, companyId) {
        return await prisma.lead.findMany({
            where: {
                tenantId,
                deletedAt: null,
                OR: [
                    { title: { contains: title, mode: 'insensitive' } },
                    ...(contactId ? [{ contactId }] : []),
                    ...(companyId ? [{ companyId }] : []),
                ],
            },
            take: 5,
            select: { id: true, title: true, isConverted: true }
        });
    }
    static async getLead(tenantId, id) {
        const lead = await prisma.lead.findFirst({
            where: { id, tenantId, deletedAt: null },
            include: {
                contact: true,
                company: true,
                stage: true,
                assignedTo: { select: { id: true, firstName: true, lastName: true } },
                _count: {
                    select: { tasks: true, communications: true }
                }
            }
        });
        if (!lead)
            throw { status: 404, message: 'Lead not found' };
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        const staleDays = tenant?.settings?.staleDaysThreshold || 14;
        return {
            ...lead,
            isStale: this.checkStale(lead.lastActivityAt, staleDays),
            taskCount: lead._count.tasks,
            communicationCount: lead._count.communications
        };
    }
    static async updateLead(tenantId, id, data, userId) {
        const oldLead = await prisma.lead.findUnique({
            where: { id, tenantId },
            include: { stage: true }
        });
        if (!oldLead)
            throw { status: 404, message: 'Lead not found' };
        // Validation for stage change
        if (data.stageId && data.stageId !== oldLead.stageId) {
            const newStage = await prisma.pipelineStage.findFirst({
                where: { id: data.stageId, tenantId, type: 'lead' }
            });
            if (!newStage)
                throw { status: 400, message: 'Invalid lead stage' };
            // Log activity (fire-and-forget)
            this.logActivity(tenantId, userId, id, 'stage_changed', {
                oldValue: { stageId: oldLead.stageId, stageName: oldLead.stage?.name },
                newValue: { stageId: data.stageId, stageName: newStage.name }
            });
            data.lastActivityAt = new Date();
        }
        const hasComm = await prisma.communication.count({ where: { leadId: id } }) > 0;
        const rules = await LeadScoringService.getRules(tenantId);
        const score = LeadScoringService.calculateScore({ ...oldLead, ...data, communicationCount: hasComm ? 1 : 0 }, rules);
        return await prisma.lead.update({
            where: { id },
            data: { ...data, score }
        });
    }
    static async assignLead(tenantId, id, assignedToId, userId) {
        const lead = await prisma.lead.findUnique({ where: { id, tenantId } });
        if (!lead)
            throw { status: 404, message: 'Lead not found' };
        const result = await prisma.lead.update({
            where: { id },
            data: { assignedToId }
        });
        this.logActivity(tenantId, userId, id, 'assigned', { assignedToId });
        return result;
    }
    static async convertToDeal(tenantId, id, data, userId) {
        const lead = await prisma.lead.findFirst({
            where: { id, tenantId, isConverted: false },
            include: { contact: true, company: true }
        });
        if (!lead)
            throw { status: 404, message: 'Lead not found or already converted' };
        // Validate deal stage
        const dealStage = await prisma.pipelineStage.findFirst({
            where: { id: data.dealStageId, tenantId, type: 'deal' }
        });
        if (!dealStage)
            throw { status: 400, message: 'Invalid deal stage' };
        return await prisma.$transaction(async (tx) => {
            const deal = await tx.deal.create({
                data: {
                    tenantId,
                    title: data.dealTitle,
                    value: data.dealValue,
                    stageId: data.dealStageId,
                    expectedCloseAt: data.expectedCloseAt,
                    contactId: lead.contactId,
                    companyId: lead.companyId,
                    assignedToId: lead.assignedToId,
                    createdById: userId,
                }
            });
            const updatedLead = await tx.lead.update({
                where: { id },
                data: {
                    isConverted: true,
                    convertedAt: new Date(),
                    convertedToDealId: deal.id,
                }
            });
            return { lead: updatedLead, deal };
        });
    }
    static async getTimeline(tenantId, id) {
        const [tasks, comms, activities] = await Promise.all([
            prisma.task.findMany({ where: { leadId: id, tenantId }, orderBy: { createdAt: 'desc' } }),
            prisma.communication.findMany({ where: { leadId: id, tenantId }, orderBy: { occurredAt: 'desc' } }),
            prisma.activityLog.findMany({ where: { entityId: id, entityType: 'lead', tenantId }, orderBy: { createdAt: 'desc' } }),
        ]);
        const timeline = [
            ...tasks.map(t => ({ type: 'task', date: t.createdAt, data: t })),
            ...comms.map(c => ({ type: 'communication', date: c.occurredAt, data: c })),
            ...activities.map(a => ({ type: 'activity', date: a.createdAt, data: a })),
        ];
        return timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    static checkStale(lastActivityAt, thresholdDays) {
        const diff = (Date.now() - new Date(lastActivityAt).getTime()) / (1000 * 60 * 60 * 24);
        return diff > thresholdDays;
    }
    static logActivity(tenantId, userId, entityId, action, metadata) {
        // Fire-and-forget
        prisma.activityLog.create({
            data: {
                tenantId,
                userId,
                entityId,
                entityType: 'lead',
                leadId: entityId,
                action,
                metadata
            }
        }).catch(err => console.error('Failed to log activity:', err));
    }
}
