import prisma from '@/config/database.ts';
import { v4 as uuidv4 } from 'uuid';

export class ProposalService {
  static async listProposals(tenantId: string, filters: any) {
    const { status, dealId, contactId, createdById, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
      deletedAt: null,
      ...(status ? { status: status as any } : {}),
      ...(dealId ? { dealId } : {}),
      ...(contactId ? { contactId } : {}),
      ...(createdById ? { createdById } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.proposal.findMany({
        where,
        skip,
        take: Math.min(limit, 100),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, title: true, status: true, version: true, totalAmount: true, 
          currency: true, validUntil: true, createdAt: true,
          deal: { select: { title: true } },
          contact: { select: { firstName: true, lastName: true } },
          createdBy: { select: { firstName: true, lastName: true } }
        }
      }),
      prisma.proposal.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  static async createProposal(tenantId: string, userId: string, data: any) {
    const { items, ...header } = data;
    const totals = this.calculateTotals(items);

    return await prisma.$transaction(async (tx) => {
      const proposal = await tx.proposal.create({
        data: {
          ...header,
          ...totals,
          tenantId,
          createdById: userId,
          publicToken: uuidv4(),
          items: {
            create: items.map((item: any, idx: number) => ({
              ...item,
              position: idx,
              totalPrice: this.calculateItemTotal(item)
            }))
          }
        },
        include: { items: true }
      });

      return proposal;
    });
  }

  static async getProposal(tenantId: string, id: string) {
    const proposal = await prisma.proposal.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        items: { orderBy: { position: 'asc' } },
        deal: true,
        contact: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        revisions: {
          select: { id: true, version: true, status: true, createdAt: true },
          orderBy: { version: 'desc' }
        }
      }
    });

    if (!proposal) throw { status: 404, message: 'Proposal not found' };
    return proposal;
  }

  static async updateProposal(tenantId: string, id: string, data: any) {
    const proposal = await prisma.proposal.findUnique({ where: { id, tenantId } });
    if (!proposal) throw { status: 404, message: 'Proposal not found' };

    if (data.status) {
      this.validateStatusTransition(proposal.status, data.status);
    }

    return await prisma.proposal.update({
      where: { id },
      data
    });
  }

  static async addItem(tenantId: string, id: string, item: any) {
    const proposal = await this.ensureDraft(tenantId, id);
    
    return await prisma.$transaction(async (tx) => {
      await tx.proposalItem.create({
        data: {
          ...item,
          proposalId: id,
          totalPrice: this.calculateItemTotal(item)
        }
      });

      return await this.refreshProposalTotals(tx, id);
    });
  }

  static async updateItem(tenantId: string, proposalId: string, itemId: string, data: any) {
    await this.ensureDraft(tenantId, proposalId);

    return await prisma.$transaction(async (tx) => {
      const item = await tx.proposalItem.findUnique({ where: { id: itemId } });
      if (!item) throw { status: 404, message: 'Item not found' };

      const updatedData = { ...item, ...data };
      await tx.proposalItem.update({
        where: { id: itemId },
        data: {
          ...data,
          totalPrice: this.calculateItemTotal(updatedData)
        }
      });

      return await this.refreshProposalTotals(tx, proposalId);
    });
  }

  static async removeItem(tenantId: string, proposalId: string, itemId: string) {
    await this.ensureDraft(tenantId, proposalId);

    return await prisma.$transaction(async (tx) => {
      await tx.proposalItem.delete({ where: { id: itemId } });
      return await this.refreshProposalTotals(tx, proposalId);
    });
  }

  static async reviseProposal(tenantId: string, id: string, userId: string) {
    const original = await prisma.proposal.findUnique({
      where: { id, tenantId },
      include: { items: true }
    });
    if (!original) throw { status: 404, message: 'Proposal not found' };

    return await prisma.$transaction(async (tx) => {
      const newProposal = await tx.proposal.create({
        data: {
          tenantId,
          createdById: userId,
          dealId: original.dealId,
          contactId: original.contactId,
          title: original.title,
          currency: original.currency,
          notes: original.notes,
          terms: original.terms,
          subtotal: original.subtotal,
          taxAmount: original.taxAmount,
          totalAmount: original.totalAmount,
          discountAmount: original.discountAmount,
          version: original.version + 1,
          parentProposalId: original.id,
          publicToken: uuidv4(),
          status: 'draft',
          items: {
            create: original.items.map(item => ({
              productId: item.productId,
              name: item.name,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              taxRate: item.taxRate,
              totalPrice: item.totalPrice,
              position: item.position
            }))
          }
        },
        include: { items: true }
      });

      return newProposal;
    });
  }

  static async sendProposal(tenantId: string, id: string) {
    const proposal = await prisma.proposal.update({
      where: { id, tenantId },
      data: { status: 'sent', sentAt: new Date() }
    });

    return {
      proposal,
      shareableUrl: `https://app.yourcrm.com/p/${proposal.publicToken}`
    };
  }

  static async getPublicProposal(token: string) {
    const proposal = await prisma.proposal.findUnique({
      where: { publicToken: token },
      include: { items: { orderBy: { position: 'asc' } } }
    });

    if (!proposal) throw { status: 404, message: 'Proposal not found' };

    // Update status to viewed if it was sent
    if (proposal.status === 'sent') {
      await prisma.proposal.update({
        where: { id: proposal.id },
        data: { status: 'viewed', viewedAt: new Date() }
      });
    }

    return {
      title: proposal.title,
      items: proposal.items.map(i => ({
        name: i.name,
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discount: i.discount,
        taxRate: i.taxRate,
        totalPrice: i.totalPrice
      })),
      subtotal: proposal.subtotal,
      taxAmount: proposal.taxAmount,
      totalAmount: proposal.totalAmount,
      currency: proposal.currency,
      validUntil: proposal.validUntil,
      status: proposal.status
    };
  }

  static async respondPublicly(token: string, response: 'accepted' | 'rejected', comment?: string) {
    const proposal = await prisma.proposal.findUnique({ where: { publicToken: token } });
    if (!proposal) throw { status: 404, message: 'Proposal not found' };

    const status = response === 'accepted' ? 'accepted' : 'rejected';
    
    const updated = await prisma.proposal.update({
      where: { id: proposal.id },
      data: { status, respondedAt: new Date(), notes: comment ? `${proposal.notes}\nClient Comment: ${comment}` : proposal.notes }
    });

    // Activity Log (Non-blocking system user ID needed? Use proposal's createdById or a system user ID)
    prisma.activityLog.create({
      data: {
        tenantId: proposal.tenantId,
        userId: proposal.createdById, // Mocking as the creator for now
        entityId: proposal.id,
        entityType: 'proposal' as any,
        action: `client_${response}`,
        metadata: { comment }
      }
    }).catch(console.error);

    return updated;
  }

  private static calculateItemTotal(item: any) {
    const discountedPrice = Number(item.unitPrice) * (1 - (Number(item.discount || 0) / 100));
    return discountedPrice * Number(item.quantity);
  }

  private static calculateTotals(items: any[]) {
    let subtotal = 0;
    let taxAmount = 0;

    items.forEach(item => {
      const itemTotal = this.calculateItemTotal(item);
      subtotal += itemTotal;
      taxAmount += itemTotal * (Number(item.taxRate || 0) / 100);
    });

    return {
      subtotal,
      taxAmount,
      totalAmount: subtotal + taxAmount,
      discountAmount: 0 // Could implement header-level discount later
    };
  }

  private static async refreshProposalTotals(tx: any, id: string) {
    const items = await tx.proposalItem.findMany({ where: { proposalId: id } });
    const totals = this.calculateTotals(items);
    return await tx.proposal.update({
      where: { id },
      data: totals,
      include: { items: true }
    });
  }

  private static async ensureDraft(tenantId: string, id: string) {
    const proposal = await prisma.proposal.findUnique({ where: { id, tenantId } });
    if (!proposal) throw { status: 404, message: 'Proposal not found' };
    if (proposal.status !== 'draft') throw { status: 400, message: 'Only draft proposals can be modified' };
    return proposal;
  }

  private static validateStatusTransition(current: string, next: string) {
    const order = ['draft', 'sent', 'viewed', 'accepted', 'rejected'];
    const currentIndex = order.indexOf(current);
    const nextIndex = order.indexOf(next);

    if (nextIndex <= currentIndex && next !== 'rejected') {
      throw { status: 400, message: `Invalid status transition from ${current} to ${next}` };
    }
  }
}
