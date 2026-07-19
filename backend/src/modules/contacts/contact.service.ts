import prisma from '@/config/database.js';
import { normalizePhoneForStorage } from '@/utils/phone.js';

export class ContactService {
  static async listContacts(tenantId: string, filters: any) {
    const { companyId, tag, search, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', includeDeleted = false } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
      ...(includeDeleted ? {} : { deletedAt: null }),
      ...(companyId ? { companyId } : {}),
      ...(tag ? { tags: { has: tag } } : {}),
      ...(search ? {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ]
      } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: Math.min(limit, 100),
        orderBy: { [sortBy]: sortOrder },
        include: {
          company: { select: { id: true, name: true } }
        }
      }),
      prisma.contact.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  /**
   * Normalized phone matching: strips formatting and compares trailing digits.
   * This catches "+91 98765 43210" matching "9876543210" or "+1 (555) 123-4567".
   */
  private static buildPhoneCondition(phone: string) {
    const normalized = normalizePhoneForStorage(phone);
    if (!normalized) return null;
    // Use the last 10 digits for fuzzy matching — catches most formatting differences
    const last10 = normalized.slice(-10);
    return { phone: { contains: last10 } };
  }

  static async createContact(tenantId: string, userId: string, data: any, force = false) {
    // Duplicate detection with normalized phone matching
    if (!force) {
      const conditions: any[] = [];

      if (data.email) {
        conditions.push({ email: data.email });
      }

      if (data.phone) {
        const phoneCondition = this.buildPhoneCondition(data.phone);
        if (phoneCondition) {
          conditions.push(phoneCondition);
        }
      }

      if (conditions.length > 0) {
        const duplicates = await prisma.contact.findMany({
          where: {
            tenantId,
            deletedAt: null,
            OR: conditions,
          },
          select: { id: true, firstName: true, lastName: true, email: true, phone: true }
        });

        if (duplicates.length > 0) {
          return { duplicates };
        }
      }
    }

    return await prisma.contact.create({
      data: {
        ...data,
        tenantId,
        createdById: userId,
      }
    });
  }

  static async checkDuplicate(tenantId: string, email?: string, phone?: string) {
    const conditions: any[] = [];

    if (email) {
      conditions.push({ email });
    }

    if (phone) {
      const phoneCondition = this.buildPhoneCondition(phone);
      if (phoneCondition) {
        conditions.push(phoneCondition);
      }
    }

    if (conditions.length === 0) return [];

    return await prisma.contact.findMany({
      where: {
        tenantId,
        deletedAt: null,
        OR: conditions,
      },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true }
    });
  }

  static async getContact(tenantId: string, id: string) {
    const contact = await prisma.contact.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        company: true,
        _count: {
          select: { leads: true, deals: true }
        },
        communications: {
          orderBy: { occurredAt: 'desc' },
          take: 1,
          select: { occurredAt: true }
        }
      }
    });

    if (!contact) throw { status: 404, message: 'Contact not found' };

    const lastCommunicationDate = contact.communications[0]?.occurredAt || null;

    return {
      ...contact,
      openLeadsCount: contact._count.leads,
      openDealsCount: contact._count.deals,
      lastCommunicationDate,
    };
  }

  static async updateContact(tenantId: string, id: string, data: any) {
    return await prisma.contact.update({
      where: { id, tenantId },
      data
    });
  }

  static async deleteContact(tenantId: string, id: string) {
    const openDeals = await prisma.deal.count({
      where: { contactId: id, tenantId, status: 'open' }
    });

    if (openDeals > 0) {
      throw { status: 400, message: `Cannot delete contact with ${openDeals} open deals`, code: 'HAS_OPEN_DEALS' };
    }

    return await prisma.contact.update({
      where: { id, tenantId },
      data: { deletedAt: new Date() }
    });
  }

  static async mergeContacts(tenantId: string, sourceId: string, targetId: string, userId: string) {
    if (sourceId === targetId) throw { status: 400, message: 'Cannot merge a contact into itself' };

    return await prisma.$transaction(async (tx) => {
      // 1. Reassign Leads
      await tx.lead.updateMany({
        where: { contactId: sourceId, tenantId },
        data: { contactId: targetId }
      });

      // 2. Reassign Deals
      await tx.deal.updateMany({
        where: { contactId: sourceId, tenantId },
        data: { contactId: targetId }
      });

      // 3. Reassign Tasks
      await tx.task.updateMany({
        where: { contactId: sourceId, tenantId },
        data: { contactId: targetId }
      });

      // 4. Reassign Communications
      await tx.communication.updateMany({
        where: { contactId: sourceId, tenantId },
        data: { contactId: targetId }
      });

      // 5. Reassign Proposals
      await tx.proposal.updateMany({
        where: { contactId: sourceId, tenantId },
        data: { contactId: targetId }
      });

      // 6. Log activity
      await tx.activityLog.create({
        data: {
          tenantId,
          userId,
          entityId: targetId,
          entityType: 'contact',
          action: 'merge',
          metadata: { mergedFromId: sourceId }
        }
      });

      // 7. Soft delete source
      await tx.contact.update({
        where: { id: sourceId, tenantId },
        data: { deletedAt: new Date() }
      });

      return { success: true };
    });
  }

  static async getTimeline(tenantId: string, id: string) {
    const [tasks, comms, deals, activities] = await Promise.all([
      prisma.task.findMany({ where: { contactId: id, tenantId }, orderBy: { createdAt: 'desc' } }),
      prisma.communication.findMany({ where: { contactId: id, tenantId }, orderBy: { occurredAt: 'desc' } }),
      prisma.deal.findMany({ where: { contactId: id, tenantId }, orderBy: { createdAt: 'desc' } }),
      prisma.activityLog.findMany({ where: { entityId: id, entityType: 'contact', tenantId }, orderBy: { createdAt: 'desc' } }),
    ]);

    const timeline = [
      ...tasks.map(t => ({ type: 'task', date: t.createdAt, data: t })),
      ...comms.map(c => ({ type: 'communication', date: c.occurredAt, data: c })),
      ...deals.map(d => ({ type: 'deal', date: d.createdAt, data: d })),
      ...activities.map(a => ({ type: 'activity', date: a.createdAt, data: a })),
    ];

    return timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}
