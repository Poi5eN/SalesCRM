import prisma from '@/config/database.js';

export class CampaignService {
  static async listCampaigns(tenantId: string, filters: any) {
    const { search, platform, status, page = 1, limit = 10 } = filters;
    const limitNum = Number(limit);
    const pageNum = Number(page);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      tenantId,
      deletedAt: null,
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      ...(platform ? { platform } : {}),
      ...(status ? { status } : {}),
    };

    const [rawCampaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { leads: true }
          },
          leads: {
            where: { isConverted: true },
            select: { id: true }
          }
        }
      }),
      prisma.campaign.count({ where }),
    ]);

    const campaigns = rawCampaigns.map(campaign => {
      const leadsCount = campaign._count.leads;
      const convertedCount = campaign.leads.length;
      const budget = Number(campaign.budget);
      
      const costPerLead = leadsCount > 0 ? budget / leadsCount : 0;
      const conversionRate = leadsCount > 0 ? (convertedCount / leadsCount) * 100 : 0;

      // Omit loading full leads array to keep payload slim
      const { leads, ...rest } = campaign;

      return {
        ...rest,
        leadsCount,
        costPerLead,
        conversionRate,
      };
    });

    return {
      data: campaigns,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    };
  }

  static async getCampaign(tenantId: string, id: string) {
    const campaign = await prisma.campaign.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        _count: {
          select: { leads: true }
        },
        leads: {
          where: { isConverted: true },
          select: { id: true }
        }
      }
    });

    if (!campaign) {
      throw { status: 404, message: 'Campaign not found' };
    }

    const leadsCount = campaign._count.leads;
    const convertedCount = campaign.leads.length;
    const budget = Number(campaign.budget);
    
    const costPerLead = leadsCount > 0 ? budget / leadsCount : 0;
    const conversionRate = leadsCount > 0 ? (convertedCount / leadsCount) * 100 : 0;

    const { leads, ...rest } = campaign;

    return {
      ...rest,
      leadsCount,
      costPerLead,
      conversionRate,
    };
  }

  static async createCampaign(tenantId: string, data: any) {
    return await prisma.campaign.create({
      data: {
        ...data,
        tenantId,
      }
    });
  }

  static async updateCampaign(tenantId: string, id: string, data: any) {
    const campaign = await prisma.campaign.findFirst({
      where: { id, tenantId, deletedAt: null }
    });

    if (!campaign) {
      throw { status: 404, message: 'Campaign not found' };
    }

    return await prisma.campaign.update({
      where: { id },
      data,
    });
  }

  static async deleteCampaign(tenantId: string, id: string) {
    const campaign = await prisma.campaign.findFirst({
      where: { id, tenantId, deletedAt: null }
    });

    if (!campaign) {
      throw { status: 404, message: 'Campaign not found' };
    }

    // Soft delete
    return await prisma.campaign.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }
}
