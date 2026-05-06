import prisma from '@/config/database.ts';
import { DEFAULT_RULES } from './leadScoring.types.ts';
import { type ScoringRule } from './leadScoring.types.ts';

export class LeadScoringService {
  static async getRules(tenantId: string): Promise<ScoringRule[]> {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    const settings = tenant?.settings as any;
    return settings?.leadScoringRules || DEFAULT_RULES;
  }

  static async updateRules(tenantId: string, rules: ScoringRule[]) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    const settings = (tenant?.settings as any) || {};

    return await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        settings: {
          ...settings,
          leadScoringRules: rules
        }
      }
    });
  }

  static calculateScore(lead: any, rules: ScoringRule[]): number {
    let score = 0;
    const now = new Date();

    for (const rule of rules) {
      if (!rule.isActive) continue;

      let match = false;
      try {
        // Condition mapping
        switch (rule.id) {
          case 'has_email':
            match = !!(lead.contact?.email || lead.email);
            break;
          case 'has_phone':
            match = !!(lead.contact?.phone || lead.phone);
            break;
          case 'has_company':
            match = !!(lead.companyId || lead.company);
            break;
          case 'priority_high':
            match = lead.priority === 'high' || lead.priority === 'urgent';
            break;
          case 'priority_medium':
            match = lead.priority === 'medium';
            break;
          case 'source_referral':
            match = lead.source === 'referral';
            break;
          case 'has_close_date':
            match = !!lead.expectedCloseAt;
            break;
          case 'had_communication':
            // In LeadService, we often pass communicationCount or we can check communications relation
            match = (lead.communicationCount || (lead._count?.communications ?? 0)) > 0;
            break;
          case 'recent_activity':
            const lastActivity = new Date(lead.lastActivityAt || lead.createdAt || now);
            const diffDays = (now.getTime() - lastActivity.getTime()) / (1000 * 3600 * 24);
            match = diffDays <= 7;
            break;
        }
      } catch (e) {
        console.error(`Error calculating rule ${rule.id}:`, e);
      }

      if (match) score += rule.points;
    }

    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Recalculates and updates the score for a specific lead
   */
  static async syncLeadScore(tenantId: string, leadId: string) {
    const [lead, rules] = await Promise.all([
      prisma.lead.findFirst({
        where: { id: leadId, tenantId },
        include: {
          contact: true,
          company: true,
          _count: { select: { communications: true } }
        }
      }),
      this.getRules(tenantId)
    ]);

    if (!lead) return null;

    const score = this.calculateScore(lead, rules);

    if (score !== lead.score) {
      return await prisma.lead.update({
        where: { id: leadId },
        data: { score }
      });
    }

    return lead;
  }
}
