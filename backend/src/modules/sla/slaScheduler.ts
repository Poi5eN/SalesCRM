import prisma from '@/config/database.js';
import { SLAService } from './sla.service.js';

const INTERVAL_MS = 60 * 60 * 1000; // 1 hour

let intervalHandle: ReturnType<typeof setInterval> | null = null;

/**
 * Run the SLA breach check for ALL active tenants.
 * Fetches all active tenants and runs checkAndReassign for each one.
 */
async function runSlaCheckForAllTenants() {
  const startTime = Date.now();
  console.log(`[SLAScheduler] Starting SLA breach check for all tenants...`);

  try {
    const activeTenants = await prisma.tenant.findMany({
      where: {
        status: 'active',
        deletedAt: null,
      },
      select: { id: true, name: true, slug: true },
    });

    if (activeTenants.length === 0) {
      console.log(`[SLAScheduler] No active tenants found. Skipping.`);
      return;
    }

    console.log(`[SLAScheduler] Checking ${activeTenants.length} tenants for SLA breaches...`);

    let totalReassigned = 0;
    let totalChecked = 0;

    for (const tenant of activeTenants) {
      try {
        const result = await SLAService.checkAndReassign(tenant.id);
        totalReassigned += result.reassigned;
        totalChecked += result.total;

        if (result.reassigned > 0) {
          console.log(`[SLAScheduler] Tenant "${tenant.name}" (${tenant.slug}): ${result.reassigned}/${result.total} leads reassigned.`);
        }
      } catch (err) {
        console.error(`[SLAScheduler] Error checking tenant "${tenant.name}" (${tenant.slug}):`, err);
      }
    }

    const elapsed = Date.now() - startTime;
    console.log(`[SLAScheduler] Complete. ${totalReassigned} leads reassigned across ${activeTenants.length} tenants. Duration: ${elapsed}ms`);
  } catch (err) {
    console.error('[SLAScheduler] Fatal error during SLA check:', err);
  }
}

/**
 * Start the SLA scheduler. Runs immediately on start, then every INTERVAL_MS.
 */
export function startSLAScheduler() {
  if (intervalHandle) {
    console.warn('[SLAScheduler] Already running. Stopping and restarting...');
    stopSLAScheduler();
  }

  console.log(`[SLAScheduler] Starting SLA breach checks every ${INTERVAL_MS / 60000} minutes...`);

  // Run immediately on startup (after a short delay to let the server initialize)
  setTimeout(() => {
    runSlaCheckForAllTenants();
  }, 5000);

  // Then run on the interval
  intervalHandle = setInterval(runSlaCheckForAllTenants, INTERVAL_MS);
}

/**
 * Stop the SLA scheduler.
 */
export function stopSLAScheduler() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    console.log('[SLAScheduler] Stopped.');
  }
}
