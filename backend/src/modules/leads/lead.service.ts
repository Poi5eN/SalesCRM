import prisma from '@/config/database.ts';

export class LeadService {
  static async listLeads(tenantId: string, filters: any) {
    const { 
      stageId, assignedToId, priority, source, isConverted, tag, search, 
      createdAtFrom, createdAtTo, isStale,
      page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' 
    } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
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
      const thresholdDays = (tenant?.settings as any)?.staleDaysThreshold || 14;
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
    const staleDays = (tenant?.settings as any)?.staleDaysThreshold || 14;

    const enrichedData = data.map(lead => ({
      ...lead,
      isStale: this.checkStale(lead.lastActivityAt, staleDays)
    }));

    return {
      data: enrichedData,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  static async getLeadBoard(tenantId: string) {
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
      const leads = (stage as any).leads || [];
      const totalValue = leads.reduce((sum: number, lead: any) => sum + Number(lead.estimatedValue || 0), 0);
      
      return {
        stage,
        leads,
        totalCount: leads.length,
        totalValue
      };
    });
  }

  static async createLead(tenantId: string, userId: string, data: any) {
    const score = this.calculateScore(data, false);
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

  static async getLead(tenantId: string, id: string) {
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

    if (!lead) throw { status: 404, message: 'Lead not found' };

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    const staleDays = (tenant?.settings as any)?.staleDaysThreshold || 14;

    return {
      ...lead,
      isStale: this.checkStale(lead.lastActivityAt, staleDays),
      taskCount: lead._count.tasks,
      communicationCount: lead._count.communications
    };
  }

  static async updateLead(tenantId: string, id: string, data: any, userId: string) {
    const oldLead = await prisma.lead.findUnique({ 
      where: { id, tenantId },
      include: { stage: true }
    });
    if (!oldLead) throw { status: 404, message: 'Lead not found' };

    // Validation for stage change
    if (data.stageId && data.stageId !== oldLead.stageId) {
      const newStage = await prisma.pipelineStage.findFirst({
        where: { id: data.stageId, tenantId, type: 'lead' }
      });
      if (!newStage) throw { status: 400, message: 'Invalid lead stage' };

      // Log activity (fire-and-forget)
      this.logActivity(tenantId, userId, id, 'stage_changed', {
        oldValue: { stageId: oldLead.stageId, stageName: oldLead.stage?.name },
        newValue: { stageId: data.stageId, stageName: newStage.name }
      });
      
      data.lastActivityAt = new Date();
    }

    const hasComm = await prisma.communication.count({ where: { leadId: id } }) > 0;
    const score = this.calculateScore({ ...oldLead, ...data }, hasComm);

    return await prisma.lead.update({
      where: { id },
      data: { ...data, score }
    });
  }

  static async assignLead(tenantId: string, id: string, assignedToId: string, userId: string) {
    const lead = await prisma.lead.findUnique({ where: { id, tenantId } });
    if (!lead) throw { status: 404, message: 'Lead not found' };

    const result = await prisma.lead.update({
      where: { id },
      data: { assignedToId }
    });

    this.logActivity(tenantId, userId, id, 'assigned', { assignedToId });

    return result;
  }

  static async convertToDeal(tenantId: string, id: string, data: any, userId: string) {
    const lead = await prisma.lead.findFirst({
      where: { id, tenantId, isConverted: false },
      include: { contact: true, company: true }
    });

    if (!lead) throw { status: 404, message: 'Lead not found or already converted' };

    // Validate deal stage
    const dealStage = await prisma.pipelineStage.findFirst({
      where: { id: data.dealStageId, tenantId, type: 'deal' }
    });
    if (!dealStage) throw { status: 400, message: 'Invalid deal stage' };

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

  static async getTimeline(tenantId: string, id: string) {
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

  private static calculateScore(data: any, hasCommunication: boolean) {
    let score = 0;
    if (data.email || (data.contact?.email)) score += 15;
    if (data.phone || (data.contact?.phone)) score += 10;
    if (data.companyId) score += 10;

    if (data.priority === 'high') score += 20;
    else if (data.priority === 'medium') score += 10;

    if (data.expectedCloseAt) score += 10;

    if (['referral', 'inbound'].includes(data.source)) score += 15;
    else if (data.source === 'cold_outreach') score += 5;

    if (hasCommunication) score += 10;

    return Math.min(score, 100);
  }

  private static checkStale(lastActivityAt: Date, thresholdDays: number) {
    const diff = (Date.now() - new Date(lastActivityAt).getTime()) / (1000 * 60 * 60 * 24);
    return diff > thresholdDays;
  }

  private static logActivity(tenantId: string, userId: string, entityId: string, action: string, metadata: any) {
    // Fire-and-forget
    prisma.activityLog.create({
      data: {
        tenantId,
        userId,
        entityId,
        entityType: 'lead',
        action,
        metadata
      }
    }).catch(err => console.error('Failed to log activity:', err));
  }
}
