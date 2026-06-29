import prisma from '@/config/database.js';

export class EmailTemplateService {
  static async listTemplates(tenantId: string) {
    return await prisma.emailTemplate.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { usageCount: 'desc' },
      include: { createdBy: { select: { firstName: true, lastName: true } } }
    });
  }

  static async createTemplate(tenantId: string, userId: string, data: any) {
    return await prisma.emailTemplate.create({
      data: { 
        ...data, 
        tenantId, 
        createdById: userId 
      }
    });
  }

  static async getTemplate(tenantId: string, id: string) {
    const template = await prisma.emailTemplate.findFirst({
      where: { id, tenantId, deletedAt: null }
    });
    if (!template) throw { status: 404, message: 'Template not found' };
    return template;
  }

  static async updateTemplate(tenantId: string, id: string, data: any) {
    return await prisma.emailTemplate.update({
      where: { id, tenantId },
      data
    });
  }

  static async deleteTemplate(tenantId: string, id: string) {
    return await prisma.emailTemplate.update({
      where: { id, tenantId },
      data: { deletedAt: new Date(), isActive: false }
    });
  }

  static async previewTemplate(tenantId: string, id: string, context: { leadId?: string; contactId?: string; dealId?: string }, userId: string) {
    const template = await this.getTemplate(tenantId, id);
    
    const dataContext: any = {};

    // 1. Fetch System Context
    const [user, tenant] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.tenant.findUnique({ where: { id: tenantId } })
    ]);
    dataContext.user = user;
    dataContext.tenant = tenant;

    // 2. Fetch Entity Context
    if (context.leadId) {
      const lead = await prisma.lead.findUnique({ 
        where: { id: context.leadId },
        include: { contact: { include: { company: true } }, company: true }
      });
      if (lead) {
        dataContext.lead = lead;
        dataContext.contact = lead.contact || dataContext.contact;
        dataContext.company = lead.company || lead.contact?.company || dataContext.company;
      }
    }

    if (context.dealId) {
      const deal = await prisma.deal.findUnique({ 
        where: { id: context.dealId },
        include: { contact: { include: { company: true } }, company: true }
      });
      if (deal) {
        dataContext.deal = deal;
        dataContext.contact = deal.contact || dataContext.contact;
        dataContext.company = deal.company || deal.contact?.company || dataContext.company;
      }
    }

    if (context.contactId && !dataContext.contact) {
      const contact = await prisma.contact.findUnique({ 
        where: { id: context.contactId },
        include: { company: true }
      });
      if (contact) {
        dataContext.contact = contact;
        dataContext.company = contact.company || dataContext.company;
      }
    }

    return {
      subject: this.interpolate(template.subject, dataContext),
      body: this.interpolate(template.body, dataContext)
    };
  }

  static interpolate(text: string, context: any): string {
    return text.replace(/\{\{(.*?)\}\}/g, (match, path) => {
      const parts = path.trim().split('.');
      let value = context;
      
      for (const part of parts) {
        if (value && typeof value === 'object' && part in value) {
          value = value[part];
        } else {
          value = undefined;
          break;
        }
      }
      
      return value !== undefined && value !== null ? String(value) : match;
    });
  }

  static async incrementUsage(id: string) {
    return await prisma.emailTemplate.update({
      where: { id },
      data: { usageCount: { increment: 1 } }
    });
  }
}
