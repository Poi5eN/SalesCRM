import prisma from '@/config/database.js';

interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  criteria: { type: string; threshold: number };
}

const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_deal', key: 'first_deal', name: 'First Deal Closed', description: 'Close your first deal', icon: '🎯', criteria: { type: 'deals_won', threshold: 1 } },
  { id: 'rising_star', key: 'rising_star', name: 'Rising Star', description: 'Close 5 deals', icon: '🌟', criteria: { type: 'deals_won', threshold: 5 } },
  { id: 'deal_machine', key: 'deal_machine', name: 'Deal Machine', description: 'Close 25 deals', icon: '🏆', criteria: { type: 'deals_won', threshold: 25 } },
  { id: 'rainmaker', key: 'rainmaker', name: 'Rainmaker', description: 'Close 100 deals', icon: '👑', criteria: { type: 'deals_won', threshold: 100 } },
  { id: 'first_million', key: 'first_million', name: 'First Million', description: 'Generate $1M in revenue', icon: '💎', criteria: { type: 'revenue', threshold: 1000000 } },
  { id: 'lead_generator', key: 'lead_generator', name: 'Lead Generator', description: 'Create 50 leads', icon: '📋', criteria: { type: 'leads_created', threshold: 50 } },
  { id: 'pro_communicator', key: 'pro_communicator', name: 'Pro Communicator', description: 'Log 100 communications', icon: '💬', criteria: { type: 'communications', threshold: 100 } },
  { id: 'streak_7', key: 'streak_7', name: 'Week Warrior', description: 'Log activity 7 days in a row', icon: '🔥', criteria: { type: 'streak', threshold: 7 } },
  { id: 'streak_30', key: 'streak_30', name: 'Monthly Master', description: 'Log activity 30 days in a row', icon: '⚡', criteria: { type: 'streak', threshold: 30 } },
  { id: 'speedy_closer', key: 'speedy_closer', name: 'Speedy Closer', description: 'Close a deal within 7 days of creation', icon: '⏱️', criteria: { type: 'fast_close', threshold: 1 } },
  { id: 'team_player', key: 'team_player', name: 'Team Player', description: 'Complete 50 tasks', icon: '🤝', criteria: { type: 'tasks_completed', threshold: 50 } },
  { id: 'sla_hero', key: 'sla_hero', name: 'SLA Hero', description: 'Respond to all leads within 24 hours for 30 days', icon: '🦸', criteria: { type: 'sla_responded', threshold: 30 } },
];

export class GamificationService {
  static getAchievements(): Achievement[] {
    return ACHIEVEMENTS;
  }

  /**
   * Get user's earned achievements with progress
   */
  static async getUserAchievements(tenantId: string, userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            communications: true,
            assignedTasks: { where: { status: 'completed' } },
            createdLeads: true,
          },
        },
        assignedDeals: {
          where: { status: 'won' },
          select: { value: true, createdAt: true, closedAt: true },
        },
      },
    });

    if (!user) return { earned: [], available: [] };

    const dealsWon = user.assignedDeals.length;
    const revenue = user.assignedDeals.reduce((sum, d) => sum + Number(d.value), 0);
    const leadsCreated = user._count.createdLeads;
    const comms = user._count.communications;
    const tasksCompleted = user._count.assignedTasks;

    // Count fast closes (won within 7 days)
    const fastCloses = user.assignedDeals.filter(d => {
      if (!d.closedAt) return false;
      const days = (d.closedAt.getTime() - d.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return days <= 7;
    }).length;

    // Calculate activity streak (simplified: count consecutive days with activity)
    const last30Days = await prisma.activityLog.count({
      where: {
        userId,
        tenantId,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });

    const earnedAchievements = ACHIEVEMENTS.filter(a => {
      switch (a.criteria.type) {
        case 'deals_won': return dealsWon >= a.criteria.threshold;
        case 'revenue': return revenue >= a.criteria.threshold;
        case 'leads_created': return leadsCreated >= a.criteria.threshold;
        case 'communications': return comms >= a.criteria.threshold;
        case 'tasks_completed': return tasksCompleted >= a.criteria.threshold;
        case 'fast_close': return fastCloses >= a.criteria.threshold;
        case 'streak': return last30Days >= a.criteria.threshold;
        case 'sla_responded': return last30Days >= a.criteria.threshold; // proxy
        default: return false;
      }
    });

    const availableAchievements = ACHIEVEMENTS.filter(a => !earnedAchievements.find(e => e.id === a.id));

    const progress = ACHIEVEMENTS.map(a => {
      let current = 0;
      switch (a.criteria.type) {
        case 'deals_won': current = dealsWon; break;
        case 'revenue': current = revenue; break;
        case 'leads_created': current = leadsCreated; break;
        case 'communications': current = comms; break;
        case 'tasks_completed': current = tasksCompleted; break;
        case 'fast_close': current = fastCloses; break;
        case 'streak': current = last30Days; break;
        case 'sla_responded': current = last30Days; break;
      }
      return { ...a, current, target: a.criteria.threshold, earned: current >= a.criteria.threshold };
    });

    return { earned: earnedAchievements, available: availableAchievements, progress };
  }

  /**
   * Get team leaderboard
   */
  static async getLeaderboard(tenantId: string) {
    const users = await prisma.user.findMany({
      where: { tenantId, status: 'active' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        _count: {
          select: {
            assignedDeals: { where: { status: 'won' } },
            communications: true,
            assignedTasks: { where: { status: 'completed' } },
          },
        },
        assignedDeals: {
          where: { status: 'won' },
          select: { value: true },
        },
      },
    });

    const leaderboard = users
      .map(u => {
        const revenue = u.assignedDeals.reduce((sum, d) => sum + Number(d.value), 0);
        const dealsWon = u._count.assignedDeals;
        const comms = u._count.communications;
        const tasksDone = u._count.assignedTasks;

        // Composite score
        const score = (dealsWon * 100) + (revenue / 1000) + (comms * 2) + (tasksDone * 5);

        return {
          userId: u.id,
          name: `${u.firstName} ${u.lastName}`,
          avatarUrl: u.avatarUrl,
          score: Math.round(score),
          dealsWon,
          revenue,
          communications: comms,
          tasksCompleted: tasksDone,
        };
      })
      .sort((a, b) => b.score - a.score)
      .map((u, i) => ({ ...u, rank: i + 1 }));

    return leaderboard;
  }

  /**
   * Check and award new achievements
   */
  static async checkAchievements(tenantId: string, userId: string) {
    const result = await this.getUserAchievements(tenantId, userId);
    return result.earned;
  }

  /**
   * Get streak info
   */
  static async getStreak(tenantId: string, userId: string) {
    const recentActivity = await prisma.activityLog.findMany({
      where: {
        userId,
        tenantId,
        createdAt: { gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    // Calculate consecutive days with activity
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 60; i++) {
      const day = new Date(today);
      day.setDate(day.getDate() - i);

      const hasActivity = recentActivity.some(a => {
        const actDay = new Date(a.createdAt);
        actDay.setHours(0, 0, 0, 0);
        return actDay.getTime() === day.getTime();
      });

      if (hasActivity) {
        streak++;
      } else if (i === 0) {
        // No activity today — streak is 0 unless they did something today
        break;
      } else {
        break;
      }
    }

    // Get longest streak
    let longestStreak = streak;
    let currentRun = 0;
    for (let i = 0; i < 60; i++) {
      const day = new Date(today);
      day.setDate(day.getDate() - i);
      const hasActivity = recentActivity.some(a => {
        const actDay = new Date(a.createdAt);
        actDay.setHours(0, 0, 0, 0);
        return actDay.getTime() === day.getTime();
      });
      if (hasActivity) {
        currentRun++;
        longestStreak = Math.max(longestStreak, currentRun);
      } else {
        currentRun = 0;
      }
    }

    return { currentStreak: streak, longestStreak, hasActivityToday: streak > 0 };
  }
}
