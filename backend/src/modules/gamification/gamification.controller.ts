import { Request, Response } from 'express';
import { GamificationService } from './gamification.service.js';
import { success } from '@/utils/response.js';
import asyncHandler from '@/utils/asyncHandler.js';

export const getMyAchievements = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const userId = req.user!.id;
  const achievements = await GamificationService.getUserAchievements(tenantId, userId);
  return success(res, achievements, 'Achievements fetched');
});

export const getLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const leaderboard = await GamificationService.getLeaderboard(tenantId);
  return success(res, leaderboard, 'Leaderboard fetched');
});

export const getStreak = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const userId = req.user!.id;
  const streak = await GamificationService.getStreak(tenantId, userId);
  return success(res, streak, 'Streak fetched');
});

export const getAchievementDefs = asyncHandler(async (req: Request, res: Response) => {
  const achievements = GamificationService.getAchievements();
  return success(res, achievements, 'Achievement definitions fetched');
});
