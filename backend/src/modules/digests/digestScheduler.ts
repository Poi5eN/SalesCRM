import { DigestService } from './digest.service.js';

let weeklyInterval: ReturnType<typeof setInterval> | null = null;
let monthlyInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Start the digest schedulers:
 * - Weekly digest: every 7 days (check every hour if it's Monday morning)
 * - Monthly lost-leads digest: 1st of every month
 */
export function startDigestScheduler() {
  console.log('[DigestScheduler] Starting digest schedulers...');

  // Weekly digest: run every Sunday at 8 AM (check every hour)
  const checkWeekly = async () => {
    const now = new Date();
    if (now.getDay() === 0 && now.getHours() === 8) {
      console.log('[DigestScheduler] Running weekly digest...');
      try {
        await DigestService.generateWeeklyDigest();
        console.log('[DigestScheduler] Weekly digest completed.');
      } catch (err) {
        console.error('[DigestScheduler] Weekly digest failed:', err);
      }
    }
  };

  // Check every hour for weekly digest
  weeklyInterval = setInterval(checkWeekly, 60 * 60 * 1000);
  
  // Also check immediately on startup (if it's Sunday)
  checkWeekly();

  // Monthly lost-leads digest: run on the 1st at 9 AM (check every 6 hours)
  const checkMonthly = async () => {
    const now = new Date();
    if (now.getDate() === 1 && now.getHours() === 9) {
      console.log('[DigestScheduler] Running monthly lost-leads digest...');
      try {
        await DigestService.generateMonthlyLostLeadsDigest();
        console.log('[DigestScheduler] Monthly lost-leads digest completed.');
      } catch (err) {
        console.error('[DigestScheduler] Monthly digest failed:', err);
      }
    }
  };

  // Check every 6 hours for monthly digest
  monthlyInterval = setInterval(checkMonthly, 6 * 60 * 60 * 1000);

  // Also check immediately on startup
  checkMonthly();
}

export function stopDigestScheduler() {
  if (weeklyInterval) {
    clearInterval(weeklyInterval);
    weeklyInterval = null;
  }
  if (monthlyInterval) {
    clearInterval(monthlyInterval);
    monthlyInterval = null;
  }
  console.log('[DigestScheduler] Digest schedulers stopped.');
}
