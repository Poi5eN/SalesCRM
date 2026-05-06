import prisma from '@/config/database.ts';

export class CompanyService {
  static async listCompanies(tenantId: string, filters: any) {
    const { industry, size, country, tag, search, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', includeDeleted = false } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
      ...(includeDeleted ? {} : { deletedAt: null }),
      ...(industry ? { industry } : {}),
      ...(size ? { size } : {}),
      ...(country ? { country } : {}),
      ...(tag ? { tags: { has: tag } } : {}),
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip,
        take: Math.min(limit, 100),
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: { contacts: true, deals: true }
          }
        }
      }),
      prisma.company.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    };
  }

  static async createCompany(tenantId: string, userId: string, data: any) {
    return await prisma.company.create({
      data: {
        ...data,
        tenantId,
        createdById: userId,
      }
    });
  }

  static async getCompany(tenantId: string, id: string) {
    const company = await prisma.company.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        _count: {
          select: { contacts: true, deals: true }
        },
        deals: {
          where: { status: 'open' },
          select: { value: true }
        }
      }
    });

    if (!company) throw { status: 404, message: 'Company not found' };

    const openDealValue = company.deals.reduce((sum, d) => sum + Number(d.value), 0);

    return {
      ...company,
      openDealValue,
      dealCount: company._count.deals,
      contactCount: company._count.contacts,
    };
  }

  static async updateCompany(tenantId: string, id: string, data: any) {
    return await prisma.company.update({
      where: { id, tenantId },
      data
    });
  }

  static async deleteCompany(tenantId: string, id: string) {
    const openDeals = await prisma.deal.count({
      where: { companyId: id, tenantId, status: 'open' }
    });

    if (openDeals > 0) {
      throw { status: 400, message: `Cannot delete company with ${openDeals} open deals`, code: 'HAS_OPEN_DEALS' };
    }

    return await prisma.company.update({
      where: { id, tenantId },
      data: { deletedAt: new Date() }
    });
  }

  static async listContacts(tenantId: string, id: string) {
    return await prisma.contact.findMany({
      where: { companyId: id, tenantId, deletedAt: null },
      orderBy: { firstName: 'asc' }
    });
  }

  static async listDeals(tenantId: string, id: string) {
    return await prisma.deal.findMany({
      where: { companyId: id, tenantId, deletedAt: null },
      orderBy: { createdAt: 'desc' }
    });
  }
}
