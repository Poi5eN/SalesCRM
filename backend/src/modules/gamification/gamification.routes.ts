import { Router } from 'express';
import authGuard from '@/middleware/authGuard.js';
import tenantResolver from '@/middleware/tenantResolver.js';
import {
  getMyAchievements,
  getLeaderboard,
  getStreak,
  getAchievementDefs,
} from './gamification.controller.js';

const router = Router();

router.use(authGuard);
router.use(tenantResolver);

router.get('/achievements', getMyAchievements);
router.get('/achievements/definitions', getAchievementDefs);
router.get('/leaderboard', getLeaderboard);
router.get('/streak', getStreak);

export default router;
