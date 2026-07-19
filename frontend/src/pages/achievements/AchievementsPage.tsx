import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Flame, Award, TrendingUp, Crown, Medal, Star, Target, Zap } from 'lucide-react';
import * as gamificationApi from '@/api/gamification.api.ts';

const RANK_ICONS = [
  { icon: Crown, color: 'text-amber-500', bg: 'bg-amber-100' },
  { icon: Medal, color: 'text-slate-400', bg: 'bg-slate-100' },
  { icon: Medal, color: 'text-amber-700', bg: 'bg-amber-100' },
];

export default function AchievementsPage() {
  const [tab, setTab] = useState<'achievements' | 'leaderboard' | 'streak'>('achievements');

  const { data: achievData } = useQuery({
    queryKey: ['gamification-achievements'],
    queryFn: () => gamificationApi.getAchievements(),
  });

  const { data: leaderboardData } = useQuery({
    queryKey: ['gamification-leaderboard'],
    queryFn: () => gamificationApi.getLeaderboard(),
    enabled: tab === 'leaderboard',
  });

  const { data: streakData } = useQuery({
    queryKey: ['gamification-streak'],
    queryFn: () => gamificationApi.getStreak(),
    enabled: tab === 'streak',
  });

  const progress = achievData?.data?.data?.progress || [];
  const earned = achievData?.data?.data?.earned || [];
  const leaderboard = leaderboardData?.data?.data || [];
  const streak = streakData?.data?.data;

  return (
    <div className="space-y-8">
      {/* Page header — matches app pattern: title left, view toggle right */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1>Achievements</h1>
          <p>Track your performance, earn badges, and climb the leaderboard.</p>
        </div>
        <div className="flex items-center gap-1 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-1 shadow-sm">
          {[
            { id: 'achievements', label: 'Achievements', icon: Trophy },
            { id: 'leaderboard', label: 'Leaderboard', icon: TrendingUp },
            { id: 'streak', label: 'Streak', icon: Flame },
          ].map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  tab === t.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Streak Tab */}
      {tab === 'streak' && (
        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl p-8 text-white shadow-xl text-center">
          <Flame className="h-16 w-16 mx-auto mb-4 drop-shadow-lg" />
          <p className="text-6xl font-black tracking-tight">{streak?.currentStreak || 0}</p>
          <p className="text-xl font-bold mt-2 text-orange-100">Day Streak</p>
          <p className="text-sm text-orange-200 mt-4 max-w-md mx-auto">
            Log activity every day to build your streak. Your longest streak is <span className="font-black text-white">{streak?.longestStreak || 0}</span> days.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <div className="bg-white/20 rounded-2xl p-4 backdrop-blur-sm min-w-32">
              <p className="text-2xl font-black">{streak?.currentStreak || 0}</p>
              <p className="text-xs text-orange-100 font-bold uppercase tracking-widest mt-1">Current</p>
            </div>
            <div className="bg-white/20 rounded-2xl p-4 backdrop-blur-sm min-w-32">
              <p className="text-2xl font-black">{streak?.longestStreak || 0}</p>
              <p className="text-xs text-orange-100 font-bold uppercase tracking-widest mt-1">Best</p>
            </div>
            <div className="bg-white/20 rounded-2xl p-4 backdrop-blur-sm min-w-32">
              <p className="text-2xl font-black">{streak?.hasActivityToday ? '🔥' : '💤'}</p>
              <p className="text-xs text-orange-100 font-bold uppercase tracking-widest mt-1">{streak?.hasActivityToday ? 'Active Today' : 'No Activity'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Achievements Tab */}
      {tab === 'achievements' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {progress.map((a: any) => (
            <div
              key={a.id}
              className={`bg-[var(--card-bg)] border rounded-2xl p-5 transition-all hover:shadow-md ${
                a.earned ? 'border-emerald-200 dark:border-emerald-800' : 'border-[var(--border)] opacity-70'
              }`}
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl">{a.icon}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-black text-[var(--text-primary)]">{a.name}</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">{a.description}</p>
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] font-bold text-[var(--text-muted)] mb-1">
                      <span>{a.earned ? 'Completed' : 'Progress'}</span>
                      <span>{a.current}/{a.target}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          a.earned ? 'bg-emerald-500' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${Math.min(100, (a.current / a.target) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Leaderboard Tab */}
      {tab === 'leaderboard' && (
        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-[var(--border)]">
            <h2 className="text-lg font-black text-[var(--text-primary)] tracking-tight">Team Leaderboard</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Ranked by composite performance score</p>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {leaderboard.map((entry: any, i: number) => {
              const RankIcon = RANK_ICONS[i]?.icon;
              const rankColor = RANK_ICONS[i]?.color || 'text-slate-500';
              const rankBg = RANK_ICONS[i]?.bg || 'bg-slate-50';

              return (
                <div key={entry.userId} className="flex items-center gap-4 p-5 hover:bg-[var(--sidebar-item-active-bg)]/30 transition-colors">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${rankBg} ${rankColor}`}>
                    {RankIcon ? <RankIcon className="h-5 w-5" /> : <span className="text-sm font-black">#{i + 1}</span>}
                  </div>
                  <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-black text-sm">
                    {entry.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[var(--text-primary)]">{entry.name}</p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {entry.dealsWon} deals won · ${(entry.revenue / 1000).toFixed(1)}k revenue · {entry.tasksCompleted} tasks
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-[var(--text-primary)]">{entry.score.toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Points</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
