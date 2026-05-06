import prisma from '@/config/database.ts';
import { subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export const getAnalyticsSummary = async (tenantId: string, period: string) => {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case '7d':
      startDate = subDays(now, 7);
      break;
    case '30d':
      startDate = subDays(now, 30);
      break;
    case '90d':
      startDate = subDays(now, 90);
      break;
    case '12m':
      startDate = subMonths(now, 12);
      break;
    default:
      startDate = subDays(now, 30);
  }

  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);

  // 1. Leads Data
  const [totalLeads, newLeads, convertedLeads, leadsByStage, leadsBySource] = await Promise.all([
    prisma.lead.count({ where: { tenantId } }),
    prisma.lead.count({ where: { tenantId, createdAt: { gte: startDate } } }),
    prisma.lead.count({ where: { tenantId, isConverted: true, convertedAt: { gte: startDate } } }),
    prisma.lead.groupBy({
      by: ['stageId'],
      where: { tenantId },
      _count: { _all: true },
      _sum: { estimatedValue: true },
    }),
    prisma.lead.groupBy({
      by: ['source'],
      where: { tenantId },
      _count: { _all: true },
    }),
  ]);

  // Enrich leadsByStage with names
  const stages = await prisma.pipelineStage.findMany({
    where: { tenantId, type: 'lead' },
    select: { id: true, name: true },
  });

  const leadsByStageEnriched = leadsByStage.map(item => ({
    stageId: item.stageId,
    stageName: stages.find(s => s.id === item.stageId)?.name || 'Unknown',
    count: item._count._all,
    value: Number(item._sum.estimatedValue || 0),
  })).sort((a, b) => b.count - a.count);

  // More accurate avg time to convert using manual calc
  const convertedLeadsData = await prisma.lead.findMany({
    where: { tenantId, isConverted: true, convertedAt: { gte: startDate } },
    select: { createdAt: true, convertedAt: true },
  });
  const totalDiff = convertedLeadsData.reduce((acc, lead) => {
    if (lead.convertedAt) {
      return acc + (lead.convertedAt.getTime() - lead.createdAt.getTime());
    }
    return acc;
  }, 0);
  const avgTimeToConvertHours = convertedLeadsData.length > 0 
    ? (totalDiff / convertedLeadsData.length) / (1000 * 60 * 60) 
    : 0;

  // 2. Deals Data
  const [totalDeals, dealsByStatus, dealsByStage, allDealsValue] = await Promise.all([
    prisma.deal.count({ where: { tenantId } }),
    prisma.deal.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: { _all: true },
      _sum: { value: true },
    }),
    prisma.deal.groupBy({
      by: ['stageId'],
      where: { tenantId, status: 'open' },
      _count: { _all: true },
    }),
    prisma.deal.aggregate({
      where: { tenantId },
      _avg: { value: true },
    }),
  ]);

  const dealStatusMap = dealsByStatus.reduce((acc: any, curr) => {
    acc[curr.status] = { count: curr._count._all, value: Number(curr._sum.value || 0) };
    return acc;
  }, {});

  const openDealsCount = dealStatusMap['open']?.count || 0;
  const wonDealsCount = dealStatusMap['won']?.count || 0;
  const lostDealsCount = dealStatusMap['lost']?.count || 0;
  const totalWonValue = dealStatusMap['won']?.value || 0;

  const dealStages = await prisma.pipelineStage.findMany({
    where: { tenantId, type: 'deal' },
    select: { id: true, name: true },
  });

  const dealsByStageEnriched = dealsByStage.map(item => ({
    stageId: item.stageId,
    stageName: dealStages.find(s => s.id === item.stageId)?.name || 'Unknown',
    count: item._count._all,
  }));

  const forecastData = await prisma.deal.findMany({
    where: {
      tenantId,
      status: 'open',
      expectedCloseAt: { gte: thisMonthStart, lte: thisMonthEnd },
    },
    select: { value: true, probability: true },
  });

  const forecastThisMonth = forecastData.reduce((acc, d) => acc + Number(d.value), 0);
  const forecastWeighted = forecastData.reduce((acc, d) => acc + (Number(d.value) * (d.probability / 100)), 0);

  // 3. Tasks Data
  const [totalTasks, completedTasks, overdueTasks] = await Promise.all([
    prisma.task.count({ where: { tenantId } }),
    prisma.task.count({ where: { tenantId, status: 'completed', completedAt: { gte: startDate } } }),
    prisma.task.count({ where: { tenantId, status: 'pending', dueAt: { lt: now } } }),
  ]);

  // 4. Communications Data
  const [totalComms, commsByType] = await Promise.all([
    prisma.communication.count({ where: { tenantId, occurredAt: { gte: startDate } } }),
    prisma.communication.groupBy({
      by: ['type'],
      where: { tenantId, occurredAt: { gte: startDate } },
      _count: { _all: true },
    }),
  ]);

  // 5. Top Reps
  const topRepsRaw = await prisma.user.findMany({
    where: { tenantId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      _count: {
        select: {
          createdLeads: { where: { createdAt: { gte: startDate } } },
          assignedDeals: { where: { status: 'won', closedAt: { gte: startDate } } },
        },
      },
      assignedDeals: {
        where: { status: 'won', closedAt: { gte: startDate } },
        select: { value: true },
      },
    },
    take: 10,
  });

  const topReps = topRepsRaw.map(rep => ({
    userId: rep.id,
    name: `${rep.firstName} ${rep.lastName}`,
    leadsCreated: rep._count.createdLeads,
    dealsWon: rep._count.assignedDeals,
    wonValue: rep.assignedDeals.reduce((acc, d) => acc + Number(d.value), 0),
  })).sort((a, b) => b.wonValue - a.wonValue);

  return {
    leads: {
      total: totalLeads,
      new: newLeads,
      converted: convertedLeads,
      byStage: leadsByStageEnriched,
      bySource: leadsBySource.map(s => ({ source: s.source, count: s._count._all })),
      conversionRate: totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
      avgTimeToConvert: avgTimeToConvertHours,
    },
    deals: {
      total: totalDeals,
      open: openDealsCount,
      won: wonDealsCount,
      lost: lostDealsCount,
      totalWonValue,
      avgDealValue: Number(allDealsValue._avg.value || 0),
      winRate: (wonDealsCount + lostDealsCount) > 0 ? (wonDealsCount / (wonDealsCount + lostDealsCount)) * 100 : 0,
      byStage: dealsByStageEnriched,
      forecastThisMonth,
      forecastWeighted,
    },
    tasks: {
      total: totalTasks,
      completed: completedTasks,
      overdue: overdueTasks,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
    },
    communications: {
      total: totalComms,
      byType: commsByType.map(c => ({ type: c.type, count: c._count._all })),
      avgPerLead: totalLeads > 0 ? totalComms / totalLeads : 0,
    },
    topReps,
  };
};

export const getActivityHeatmap = async (tenantId: string) => {
  const now = new Date();
  const oneYearAgo = subMonths(now, 12);

  const activities = await prisma.activityLog.findMany({
    where: {
      tenantId,
      createdAt: { gte: oneYearAgo },
    },
    select: { createdAt: true },
  });

  const heatmap: Record<string, number> = {};
  activities.forEach(a => {
    const date = a.createdAt.toISOString().split('T')[0];
    heatmap[date] = (heatmap[date] || 0) + 1;
  });

  return Object.entries(heatmap).map(([date, count]) => ({ date, count }));
};
