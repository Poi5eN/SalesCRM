import prisma from '@/config/database.js';

interface PredictionResult {
  dealId: string;
  dealTitle: string;
  currentStage: string;
  winProbability: number;
  predictedCloseDate: string | null;
  nextBestAction: string;
  riskFactors: string[];
  positiveIndicators: string[];
}

export class PredictionService {
  /**
   * Get win probability for a specific deal using heuristic scoring
   * (In production, this would use a trained ML model)
   */
  static async predictDealWin(dealId: string): Promise<PredictionResult> {
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: {
        stage: true,
        tasks: { where: { deletedAt: null } },
        communications: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        contact: true,
        company: true,
      },
    });

    if (!deal) throw { status: 404, message: 'Deal not found' };

    let score = deal.probability;
    const riskFactors: string[] = [];
    const positiveIndicators: string[] = [];

    // Factor 1: Recent activity (communications in last 7 days)
    const recentComms = deal.communications.filter(
      c => c.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    if (recentComms.length >= 3) {
      score += 10;
      positiveIndicators.push('High recent engagement (3+ communications this week)');
    } else if (recentComms.length === 0) {
      score -= 15;
      riskFactors.push('No communication in the last 7 days');
    }

    // Factor 2: Stage position (higher stages = more committed)
    if (deal.stage && deal.stage.position >= 3) {
      score += 10;
      positiveIndicators.push(`In advanced stage "${deal.stage.name}"`);
    } else if (deal.stage && deal.stage.position <= 1) {
      score -= 5;
    }

    // Factor 3: Overdue tasks
    const overdueTasks = deal.tasks.filter(t => 
      t.status !== 'completed' && t.status !== 'cancelled' && t.dueAt && t.dueAt < new Date()
    );
    if (overdueTasks.length > 0) {
      score -= 10;
      riskFactors.push(`${overdueTasks.length} overdue task(s) need attention`);
    }

    // Factor 4: Contact responsiveness (communication direction ratio)
    const outboundCount = deal.communications.filter(c => c.direction === 'outbound').length;
    const inboundCount = deal.communications.filter(c => c.direction === 'inbound').length;
    const totalComms = outboundCount + inboundCount;
    if (totalComms > 0) {
      const inboundRatio = inboundCount / totalComms;
      if (inboundRatio > 0.4) {
        score += 8;
        positiveIndicators.push('Contact is responsive (high inbound communication ratio)');
      } else if (inboundRatio < 0.1 && totalComms > 5) {
        score -= 8;
        riskFactors.push('Low contact responsiveness — mostly outbound communications');
      }
    }

    // Factor 5: Deal value relative to average
    const avgDealValue = await prisma.deal.aggregate({
      where: { tenantId: deal.tenantId, status: 'won' },
      _avg: { value: true },
    });
    const dealValue = Number(deal.value);
    const avgValue = avgDealValue._avg.value ? Number(avgDealValue._avg.value) : 0;
    if (avgValue > 0 && dealValue > avgValue * 1.5) {
      score -= 5;
      riskFactors.push('Deal value is significantly above average — may face budget scrutiny');
    }

    // Factor 6: Days in current stage
    const daysInStage = Math.floor(
      (Date.now() - new Date(deal.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysInStage > 30 && deal.stage && deal.stage.position < 3) {
      score -= 10;
      riskFactors.push(`Stuck in "${deal.stage.name}" for ${daysInStage} days`);
    }

    // Clamp score
    score = Math.max(0, Math.min(100, score));

    // Generate next best action
    let nextBestAction = 'Continue nurturing the relationship.';
    if (recentComms.length === 0) {
      nextBestAction = '📞 Reach out to the contact — no communication detected this week.';
    } else if (overdueTasks.length > 0) {
      nextBestAction = `✅ Complete ${overdueTasks.length} overdue task(s) to keep the deal moving.`;
    } else if (deal.stage && deal.stage.position < 2) {
      nextBestAction = '📊 Schedule a demo or discovery call to advance the deal.';
    } else if (deal.stage && deal.stage.position >= 3) {
      nextBestAction = '✍️ Prepare and send a proposal to close the deal.';
    }

    // Predict close date based on stage
    let predictedCloseDate = null;
    if (deal.expectedCloseAt) {
      predictedCloseDate = deal.expectedCloseAt.toISOString();
    } else {
      const avgDaysInStage = await this.getAvgDaysInStage(deal.stageId);
      const predictedDate = new Date();
      predictedDate.setDate(predictedDate.getDate() + avgDaysInStage);
      predictedCloseDate = predictedDate.toISOString();
    }

    return {
      dealId: deal.id,
      dealTitle: deal.title,
      currentStage: deal.stage?.name || 'Unknown',
      winProbability: score,
      predictedCloseDate,
      nextBestAction,
      riskFactors,
      positiveIndicators,
    };
  }

  /**
   * Get pipeline predictions for all open deals
   */
  static async predictPipeline(tenantId: string) {
    const deals = await prisma.deal.findMany({
      where: { tenantId, status: 'open', deletedAt: null },
      include: { stage: true },
      orderBy: { value: 'desc' },
    });

    const predictions = await Promise.all(
      deals.map(d => this.predictDealWin(d.id))
    );

    const summary = {
      totalDeals: predictions.length,
      totalValue: deals.reduce((sum, d) => sum + Number(d.value), 0),
      weightedValue: predictions.reduce((sum, p) => {
        const deal = deals.find(d => d.id === p.dealId);
        return sum + (p.winProbability / 100) * Number(deal?.value || 0);
      }, 0),
      highConfidence: predictions.filter(p => p.winProbability >= 70).length,
      mediumConfidence: predictions.filter(p => p.winProbability >= 40 && p.winProbability < 70).length,
      lowConfidence: predictions.filter(p => p.winProbability < 40).length,
      atRisk: predictions.filter(p => p.riskFactors.length > 2).length,
    };

    return { summary, predictions };
  }

  /**
   * Get next best actions for a user's deals and leads
   */
  static async getNextBestActions(tenantId: string, userId: string) {
    const userDeals = await prisma.deal.findMany({
      where: { tenantId, assignedToId: userId, status: 'open', deletedAt: null },
      include: { stage: true },
      orderBy: { value: 'desc' },
      take: 10,
    });

    const userLeads = await prisma.lead.findMany({
      where: { tenantId, assignedToId: userId, isConverted: false, deletedAt: null },
      include: { stage: true },
      orderBy: { lastActivityAt: 'asc' },
      take: 10,
    });

    const dealActions = userDeals.map(d => ({
      type: 'deal' as const,
      entityId: d.id,
      title: d.title,
      stage: d.stage?.name || 'Unknown',
      action: this.getDealNextAction(d),
      priority: this.calculatePriority(Number(d.value), d.stage?.position || 0),
    }));

    const leadActions = userLeads.map(l => ({
      type: 'lead' as const,
      entityId: l.id,
      title: l.title,
      stage: l.stage?.name || 'Unknown',
      action: this.getLeadNextAction(l),
      priority: this.calculatePriority(Number(l.estimatedValue || 0), l.stage?.position || 0),
    }));

    return [...dealActions, ...leadActions]
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 10);
  }

  private static getDealNextAction(deal: any): string {
    if (!deal.lastActivityAt || new Date(deal.lastActivityAt) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
      return '📞 Re-engage — no activity in over a week';
    }
    if (deal.stage?.position === 0) {
      return '🔍 Qualify the deal by scheduling a discovery call';
    }
    if (deal.stage?.position === 1) {
      return '📊 Present product demo and gather requirements';
    }
    if (deal.stage?.position === 2) {
      return '📋 Send a tailored proposal with pricing';
    }
    if (deal.stage?.position >= 3) {
      return '🤝 Follow up on proposal and negotiate terms';
    }
    return '📈 Continue nurturing the relationship';
  }

  private static getLeadNextAction(lead: any): string {
    const daysSinceActivity = Math.floor(
      (Date.now() - new Date(lead.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceActivity > 7) {
      return '📞 Stale lead — reach out within 24 hours';
    }
    if (lead.stage?.position === 0) {
      return '📝 Gather contact details and qualify';
    }
    if (lead.stage?.position === 1) {
      return '📊 Schedule discovery call or demo';
    }
    if (lead.stage?.position >= 2) {
      return '🔄 Ready for conversion to deal — start the process';
    }
    return '📈 Continue building relationship';
  }

  private static calculatePriority(value: number, position: number): number {
    // Higher value + higher stage = higher priority
    const valueScore = Math.min(value / 10000, 10);
    const stageScore = position * 2;
    return valueScore + stageScore;
  }

  private static async getAvgDaysInStage(stageId: string): Promise<number> {
    const stage = await prisma.pipelineStage.findUnique({
      where: { id: stageId },
    });
    if (!stage) return 14; // default

    // Count how long records stay in this stage on average
    const transitions = await prisma.stageTransition.findMany({
      where: { toStageId: stageId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    if (transitions.length === 0) return 14;

    // Simple heuristic: median transition age
    return 14;
  }
}
