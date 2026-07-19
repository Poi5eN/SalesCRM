import prisma from '@/config/database.js';
import { LeadScoringService } from '../leadScoring/leadScoring.service.js';
import { StageTransitionService } from '../stage-transitions/stageTransition.service.js';
import { normalizePhone, normalizePhoneForStorage } from '@/utils/phone.js';

export class LeadService {
  static async listLeads(tenantId: string, filters: any) {
    const { 
      stageId, assignedToId, campaignId, priority, source, isConverted, tag, search, 
      createdAtFrom, createdAtTo, isStale,
      page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' 
    } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
      deletedAt: null,
      ...(stageId ? { stageId } : {}),
      ...(assignedToId ? { assignedToId } : {}),
      ...(campaignId ? { campaignId } : {}),
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
          assignedTo: { select: { firstName: true, lastName: true } },
          campaign: { select: { name: true } }
        }
      }),
      prisma.lead.count({ where }),
    ]);

    // Attach isStale and isFastTracked dynamically
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    const staleDays = (tenant?.settings as any)?.staleDaysThreshold || 14;

    const enrichedData = await Promise.all(data.map(async (lead) => ({
      ...lead,
      isStale: this.checkStale(lead.lastActivityAt, staleDays),
      isFastTracked: await StageTransitionService.hasBeenFastTracked(tenantId, lead.id)
    })));

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
    const rules = await LeadScoringService.getRules(tenantId);
    const score = LeadScoringService.calculateScore(data, rules);
    const lead = await prisma.lead.create({
      data: {
        ...data,
        tenantId,
        createdById: userId,
        assignedToId: data.assignedToId || userId,
        score,
        lastActivityAt: new Date()
      }
    });

    // Log a touchpoint activity if this lead matched an existing contact's phone
    // (duplicate detection happens via checkDuplicate endpoint on the frontend)
    if (data.contactId && data.source) {
      this.logActivity(tenantId, userId, lead.id, 'created', {
        source: data.source,
        campaignId: data.campaignId,
        contactId: data.contactId,
      });
    }

    return lead;
  }

  static async checkDuplicate(tenantId: string, title: string, contactId?: string, companyId?: string, phone?: string) {
    const conditions: any[] = [];

    if (title) {
      conditions.push({ title: { contains: title, mode: 'insensitive' } });
    }
    if (contactId) {
      conditions.push({ contactId });
    }
    if (companyId) {
      conditions.push({ companyId });
    }

    // Phone-based dedup with normalization
    if (phone) {
      const normalizedPhone = normalizePhoneForStorage(phone);
      if (normalizedPhone) {
        // Search for leads linked to contacts with matching phone
        const contactsWithPhone = await prisma.contact.findMany({
          where: {
            tenantId,
            deletedAt: null,
            phone: { contains: normalizedPhone.slice(-10) },
          },
          select: { id: true }
        });
        
        if (contactsWithPhone.length > 0) {
          conditions.push({
            contactId: { in: contactsWithPhone.map(c => c.id) }
          });
        }
      }
    }

    if (conditions.length === 0) {
      return [];
    }

    return await prisma.lead.findMany({
      where: {
        tenantId,
        deletedAt: null,
        OR: conditions,
      },
      take: 5,
      select: { id: true, title: true, isConverted: true }
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
        campaign: { select: { id: true, name: true } },
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
      isFastTracked: await StageTransitionService.hasBeenFastTracked(tenantId, id),
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

    // Stage change validation with stage-skip logic
    if (data.stageId && data.stageId !== oldLead.stageId) {
      const newStage = await prisma.pipelineStage.findFirst({
        where: { id: data.stageId, tenantId, type: 'lead' }
      });
      if (!newStage) throw { status: 400, message: 'Invalid lead stage' };

      // Fetch user role from the request context
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const userRole = user?.role || 'salesRep';

      // Validate transition against stage-skip policy
      const validation = await StageTransitionService.validateTransition(
        tenantId, userId, userRole, 'lead', oldLead.stageId, data.stageId
      );

      if (!validation.allowed) {
        throw {
          status: 403,
          message: validation.message || 'Stage transition not allowed',
          code: validation.reason,
        };
      }

      // Log stage transition (immutable audit trail)
      await StageTransitionService.logTransition(tenantId, {
        entityId: id,
        entityType: 'lead',
        fromStageId: oldLead.stageId,
        toStageId: data.stageId,
        fromStageName: oldLead.stage?.name || null,
        toStageName: newStage.name,
        actorId: userId,
        isSkipOverride: validation.isSkipOverride,
        skippedStages: validation.skippedStages,
        metadata: { updatePayload: data },
      });

      // Log activity (fire-and-forget)
      this.logActivity(tenantId, userId, id, 'stage_changed', {
        oldValue: { stageId: oldLead.stageId, stageName: oldLead.stage?.name },
        newValue: { stageId: data.stageId, stageName: newStage.name },
        isSkipOverride: validation.isSkipOverride,
        skippedStages: validation.skippedStages,
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
      include: { contact: true, company: true, campaign: true, stage: true }
    });

    if (!lead) throw { status: 404, message: 'Lead not found or already converted' };

    // §5.1: Gating — only allow conversion from Qualified stage (position >= 2) or later
    if (!lead.stage || lead.stage.position < 2) {
      throw {
        status: 403,
        message: 'Leads must be in Qualified stage or later before they can be converted to deals. Move the lead forward first.',
        code: 'CONVERSION_STAGE_GATE',
      };
    }

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
          // §5.4: Store convertedFromLeadId FK for audit traceability
          sourceLeadId: lead.id,
          // §5.2: Carry over source + campaign for source-level ROI reporting
          // Store source in tags or description for reporting continuity
          tags: [...(lead.tags || []), `converted_from_lead:${lead.id}`, `original_source:${lead.source}`],
        }
      });

      // Also link communications to the new deal for cross-visibility
      await tx.communication.updateMany({
        where: { leadId: lead.id, tenantId },
        data: { dealId: deal.id },
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
        leadId: entityId,
        action,
        metadata
      }
    }).catch(err => console.error('Failed to log activity:', err));
  }
}
