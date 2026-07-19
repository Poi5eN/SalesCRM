import apiClient from './client.ts';

export const getAchievements = () =>
  apiClient.get('/gamification/achievements');

export const getAchievementDefs = () =>
  apiClient.get('/gamification/achievements/definitions');

export const getLeaderboard = () =>
  apiClient.get('/gamification/leaderboard');

export const getStreak = () =>
  apiClient.get('/gamification/streak');
