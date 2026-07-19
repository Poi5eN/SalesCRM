import prisma from '@/config/database.js';
import { Prisma } from '@prisma/client';
import { StageTransitionService } from '../stage-transitions/stageTransition.service.js';

export class DealService {
  static async listDeals(tenantId: string, filters: any) {
    const { 
      stageId, status, assignedToId, contactId, companyId, 
      minValue, maxValue, expectedCloseAtFrom, expectedCloseAtTo,
      createdAtFrom, createdAtTo, isStale,
      page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' 
    } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
      deletedAt: null,
      ...(stageId ? { stageId } : {}),
      ...(status ? { status: status as any } : {}),
      ...(assignedToId ? { assignedToId } : {}),
      ...(contactId ? { contactId } : {}),
      ...(companyId ? { companyId } : {}),
      ...(minValue || maxValue ? {
        value: {
          ...(minValue ? { gte: minValue } : {}),
          ...(maxValue ? { lte: maxValue } : {}),
        }
      } : {}),
      ...(expectedCloseAtFrom || expectedCloseAtTo ? {
        expectedCloseAt: {
          ...(expectedCloseAtFrom ? { gte: new Date(expectedCloseAtFrom) } : {}),
          ...(expectedCloseAtTo ? { lte: new Date(expectedCloseAtTo) } : {}),
        }
      } : {}),
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
      where.status = 'open';
    }

    const [data, total] = await Promise.all([
      prisma.deal.findMany({
        where,
        skip,
        take: Math.min(limit, 100),
        orderBy: { [sortBy]: sortOrder },
        include: {
          stage: { select: { name: true } },
          contact: { select: { firstName: true, lastName: true } },
          company: { select: { name: true } },
          assignedTo: { select: { firstName: true, lastName: true } },
        }
      }),
      prisma.deal.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  static async getDealBoard(tenantId: string) {
    const stages = await prisma.pipelineStage.findMany({
      where: { tenantId, type: 'deal', isArchived: false },
      orderBy: { position: 'asc' },
      include: {
        deals: {
          where: { deletedAt: null, status: 'open' },
          include: {
            contact: { select: { firstName: true, lastName: true } },
            assignedTo: { select: { firstName: true, lastName: true } }
          }
        }
      }
    });

    return stages.map(stage => {
      const totalValue = stage.deals.reduce((sum, deal) => sum + Number(deal.value || 0), 0);
      return {
        stage,
        deals: stage.deals,
        totalCount: stage.deals.length,
        totalValue
      };
    });
  }

  static async getForecast(tenantId: string) {
    const deals = await prisma.deal.findMany({
      where: { 
        tenantId, 
        status: 'open', 
        expectedCloseAt: { not: null },
        deletedAt: null
      }
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);

    const calculateForPeriod = (start: Date, end: Date | null) => {
      const periodDeals = deals.filter(d => {
        const date = new Date(d.expectedCloseAt!);
        return date >= start && (end ? date < end : true);
      });

      const expected = periodDeals.reduce((sum, d) => sum + Number(d.value), 0);
      const weighted = periodDeals.reduce((sum, d) => sum + (Number(d.value) * (d.probability / 100)), 0);

      return { expected, weighted };
    };

    return {
      thisMonth: calculateForPeriod(startOfMonth, startOfNextMonth),
      nextMonth: calculateForPeriod(startOfNextMonth, new Date(startOfNextMonth.getFullYear(), startOfNextMonth.getMonth() + 1, 1)),
      thisQuarter: calculateForPeriod(startOfQuarter, new Date(startOfQuarter.getFullYear(), startOfQuarter.getMonth() + 3, 1)),
    };
  }

  static async createDeal(tenantId: string, userId: string, data: any) {
    return await prisma.deal.create({
      data: {
        ...data,
        tenantId,
        createdById: userId,
        assignedToId: data.assignedToId || userId,
        lastActivityAt: new Date()
      }
    });
  }

  static async getDeal(tenantId: string, id: string) {
    const deal = await prisma.deal.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        contact: true,
        company: true,
        stage: true,
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        dealProducts: { include: { product: true } },
        _count: { select: { tasks: true, proposals: true } },
        communications: { orderBy: { occurredAt: 'desc' }, take: 1 }
      }
    });

    if (!deal) throw { status: 404, message: 'Deal not found' };

    return {
      ...deal,
      lastCommunication: deal.communications[0] || null,
      proposalsCount: deal._count.proposals,
      tasksCount: deal._count.tasks
    };
  }

  static async updateDeal(tenantId: string, id: string, data: any, userId: string) {
    const oldDeal = await prisma.deal.findUnique({ where: { id, tenantId }, include: { stage: true } });
    if (!oldDeal) throw { status: 404, message: 'Deal not found' };

    if (data.stageId && data.stageId !== oldDeal.stageId) {
      const newStage = await prisma.pipelineStage.findUnique({ where: { id: data.stageId, tenantId } });
      if (!newStage) throw { status: 400, message: 'Invalid deal stage' };

      // Fetch user role for validation
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const userRole = user?.role || 'salesRep';

      // Validate transition against stage-skip policy
      const validation = await StageTransitionService.validateTransition(
        tenantId, userId, userRole, 'deal', oldDeal.stageId, data.stageId
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
        entityType: 'deal',
        fromStageId: oldDeal.stageId,
        toStageId: data.stageId,
        fromStageName: oldDeal.stage.name || null,
        toStageName: newStage.name,
        actorId: userId,
        isSkipOverride: validation.isSkipOverride,
        skippedStages: validation.skippedStages,
        metadata: { updatePayload: data },
      });

      this.logActivity(tenantId, userId, id, 'stage_changed', {
        oldValue: { stageId: oldDeal.stageId, stageName: oldDeal.stage.name },
        newValue: { stageId: data.stageId, stageName: newStage?.name },
        isSkipOverride: validation.isSkipOverride,
        skippedStages: validation.skippedStages,
      });
      data.lastActivityAt = new Date();
    }

    if (data.status && data.status !== oldDeal.status) {
      if (['won', 'lost'].includes(data.status)) {
        data.closedAt = new Date();
      } else {
        data.closedAt = null;
      }
    }

    return await prisma.deal.update({
      where: { id },
      data
    });
  }

  static async addProduct(tenantId: string, dealId: string, productData: any) {
    const { productId, quantity, unitPrice, discount } = productData;
    const totalPrice = (unitPrice * quantity) * (1 - (discount / 100));

    return await prisma.dealProduct.create({
      data: {
        dealId,
        productId,
        quantity,
        unitPrice,
        discount,
        totalPrice,
        notes: productData.notes
      }
    });
  }

  static async removeProduct(tenantId: string, dealId: string, productId: string) {
    return await prisma.dealProduct.delete({
      where: { dealId_productId: { dealId, productId } }
    });
  }

  static async getTimeline(tenantId: string, id: string) {
    const [tasks, comms, activities] = await Promise.all([
      prisma.task.findMany({ where: { dealId: id, tenantId }, orderBy: { createdAt: 'desc' } }),
      prisma.communication.findMany({ where: { dealId: id, tenantId }, orderBy: { occurredAt: 'desc' } }),
      prisma.activityLog.findMany({ where: { entityId: id, entityType: 'deal', tenantId }, orderBy: { createdAt: 'desc' } }),
    ]);

    const timeline = [
      ...tasks.map(t => ({ type: 'task', date: t.createdAt, data: t })),
      ...comms.map(c => ({ type: 'communication', date: c.occurredAt, data: c })),
      ...activities.map(a => ({ type: 'activity', date: a.createdAt, data: a })),
    ];

    return timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  private static logActivity(tenantId: string, userId: string, entityId: string, action: string, metadata: any) {
    prisma.activityLog.create({
      data: { tenantId, userId, entityId, entityType: 'deal', dealId: entityId, action, metadata }
    }).catch(console.error);

    prisma.deal.update({
      where: { id: entityId },
      data: { lastActivityAt: new Date() }
    }).catch(console.error);
  }
}
