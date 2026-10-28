/**
 * Automatic 48-Hour Access Revocation Background Scheduler
 * 
 * Runs periodic background sweep checks to automatically revoke expired Google Drive & OneDrive permissions.
 * Does not depend on client interaction, frontend browser sessions, or in-memory JavaScript timers.
 * Recovers and processes overdue records immediately upon server startup.
 */

const accessGrantService = require('./accessGrantService');

class RevocationScheduler {
    constructor() {
        this.timer = null;
        this.isProcessing = false;
        this.intervalMs = parseInt(process.env.REVOCATION_CHECK_INTERVAL_SECONDS || '60', 10) * 1000;
    }

    /**
     * Start the background scheduler with the provided Mongoose models
     */
    start(models) {
        if (this.timer) {
            console.log('[RevocationScheduler] Scheduler already running.');
            return;
        }

        console.log(`[RevocationScheduler] Starting 48-Hour Access Revocation Scheduler (interval: ${this.intervalMs / 1000}s)`);

        // 1. Immediately process overdue records on server boot (handles server restarts and deploy downtime)
        this.runSweep(models).catch(err => {
            console.error('[RevocationScheduler] Initial boot sweep error:', err.message);
        });

        // 2. Set recurring background timer
        this.timer = setInterval(() => {
            this.runSweep(models).catch(err => {
                console.error('[RevocationScheduler] Scheduled sweep error:', err.message);
            });
        }, this.intervalMs);

        // Allow node process to exit gracefully without timer keeping event loop open in test runners
        if (this.timer.unref) {
            this.timer.unref();
        }
    }

    /**
     * Stop the background scheduler
     */
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
            console.log('[RevocationScheduler] Scheduler stopped.');
        }
    }

    /**
     * Runs an atomic revocation sweep
     */
    async runSweep(models) {
        if (this.isProcessing) {
            return { skipped: true, reason: 'Previous sweep still in progress' };
        }

        this.isProcessing = true;
        try {
            const results = await accessGrantService.processExpiredGrants(models);
            if (results.checked > 0) {
                console.log(`[RevocationScheduler] Sweep complete: ${results.revoked} revoked, ${results.failed} failed out of ${results.checked} overdue records.`);
            }
            return results;
        } catch (error) {
            console.error('[RevocationScheduler] Error executing sweep:', error);
            return { error: error.message };
        } finally {
            this.isProcessing = false;
        }
    }
}

module.exports = new RevocationScheduler();
