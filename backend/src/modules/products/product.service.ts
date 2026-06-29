import prisma from '@/config/database.js';

export class ProductService {
  static async listProducts(tenantId: string, filters: any) {
    const { status, type, category, search, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
      deletedAt: null,
      ...(status ? { status: status as any } : {}),
      ...(type ? { type: type as any } : {}),
      ...(category ? { category } : {}),
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ]
      } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: Math.min(limit, 100),
        orderBy: { name: 'asc' },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  static async createProduct(tenantId: string, data: any) {
    return await prisma.product.create({
      data: { ...data, tenantId }
    });
  }

  static async getProduct(tenantId: string, id: string) {
    const product = await prisma.product.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        _count: {
          select: { dealProducts: true }
        }
      }
    });

    if (!product) throw { status: 404, message: 'Product not found' };

    return {
      ...product,
      usageCount: product._count.dealProducts
    };
  }

  static async updateProduct(tenantId: string, id: string, data: any) {
    return await prisma.product.update({
      where: { id, tenantId },
      data
    });
  }

  static async deleteProduct(tenantId: string, id: string) {
    const openDealsCount = await prisma.deal.count({
      where: {
        tenantId,
        status: 'open',
        dealProducts: { some: { productId: id } }
      }
    });

    if (openDealsCount > 0) {
      throw { 
        status: 400, 
        message: `Cannot delete product used in ${openDealsCount} open deals`, 
        code: 'PRODUCT_IN_USE' 
      };
    }

    return await prisma.product.update({
      where: { id, tenantId },
      data: { deletedAt: new Date() }
    });
  }
}
