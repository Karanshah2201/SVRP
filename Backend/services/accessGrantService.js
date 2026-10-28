/**
 * 48-Hour Automatic Cloud Access Grant & Revocation Engine
 * 
 * Supports:
 * 1. Customer-specific Google Drive / Microsoft OneDrive access granting upon payment verification
 * 2. Strict 48-Hour (2-day) access lifespan
 * 3. Automated background scheduled revocation (idempotent, exponential backoff)
 * 4. Absolute file safety: only customer sharing permissions are removed, original files are NEVER deleted
 * 5. Full audit logging & state transitions: pending -> active -> revoking -> expired/revoked/failed
 */

const googleDriveService = require('./googleDriveService');
const oneDriveService = require('./oneDriveService');

class AccessGrantService {
    constructor() {
        this.defaultDurationHours = parseInt(process.env.ACCESS_GRANT_DURATION_HOURS || '48', 10);
        this.maxRetries = parseInt(process.env.REVOCATION_MAX_RETRIES || '5', 10);
    }

    /**
     * Extracts a file or folder ID from various Google Drive or OneDrive URL formats
     */
    extractStorageId(urlOrId) {
        if (!urlOrId) return '';
        const str = String(urlOrId).trim();

        // Already a clean ID (alphanumeric with hyphens/underscores, no slashes or protocols)
        if (!str.includes('/') && !str.includes('http')) {
            return str;
        }

        // Google Drive folder: /folders/ID
        const gFolderMatch = str.match(/\/folders\/([a-zA-Z0-9_-]+)/);
        if (gFolderMatch) return gFolderMatch[1];

        // Google Drive file: /file/d/ID
        const gFileMatch = str.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (gFileMatch) return gFileMatch[1];

        // Google Drive open?id=ID
        const gIdParam = str.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (gIdParam) return gIdParam[1];

        // OneDrive item ID or fallback clean string
        const oneDriveMatch = str.match(/\/items\/([a-zA-Z0-9_-]+)/);
        if (oneDriveMatch) return oneDriveMatch[1];

        return str;
    }

    /**
     * Determines storage provider ('gdrive' | 'onedrive') based on product configuration or URL
     */
    detectProvider(product, rawUrl) {
        if (product?.storageProvider && ['gdrive', 'onedrive'].includes(product.storageProvider)) {
            return product.storageProvider;
        }
        const checkStr = `${product?.driveUrl || ''} ${rawUrl || ''}`.toLowerCase();
        if (checkStr.includes('onedrive') || checkStr.includes('1drv.ms') || checkStr.includes('sharepoint')) {
            return 'onedrive';
        }
        return 'gdrive';
    }

    /**
     * Calculate expiry date (default exactly 48 hours = 2 days from grant time)
     */
    calculateExpiry(hours = null) {
        const durationHours = hours || this.defaultDurationHours;
        const expiry = new Date();
        expiry.setTime(expiry.getTime() + durationHours * 60 * 60 * 1000);
        return expiry;
    }

    /**
     * Grants 48-Hour access to all products in an approved order.
     * Idempotent: checks for existing grants first to prevent duplicate grants on webhook retries.
     */
    async grantAccessForOrder(order, models) {
        const { AccessGrant, Product, AuditLog } = models;
        const grants = [];

        if (!order || !order.items || order.items.length === 0) {
            return grants;
        }

        const customerEmail = order.email;
        const customerId = order.userId;

        for (let i = 0; i < order.items.length; i++) {
            const item = order.items[i];
            const productId = item.productId;

            // 1. Idempotency Check: Don't create duplicate grants for the same purchase
            let existingGrant = await AccessGrant.findOne({
                orderId: order._id,
                productId: productId
            });

            if (existingGrant) {
                grants.push(existingGrant);
                // Ensure order item has the active link if still valid
                if (existingGrant.status === 'active' && new Date() < new Date(existingGrant.expiresAt)) {
                    item.driveUrl = existingGrant.accessLink;
                }
                continue;
            }

            // 2. Fetch product specs
            const product = await Product.findOne({ id: productId });
            const provider = this.detectProvider(product, item.driveUrl);
            const rawStorageId = product?.storageFileId || item.driveUrl || product?.driveUrl || `sample_3d_${productId}`;
            const storageFileId = this.extractStorageId(rawStorageId);

            const now = new Date();
            const expiresAt = this.calculateExpiry();

            // 3. Grant access via Cloud Provider API (Google Drive or Microsoft OneDrive)
            let grantResult = { success: false };
            if (provider === 'onedrive') {
                grantResult = await oneDriveService.grantUserAccess(storageFileId, customerEmail);
            } else {
                grantResult = await googleDriveService.grantUserAccess(storageFileId, customerEmail, expiresAt);
            }

            const accessLink = grantResult.accessLink || item.driveUrl || product?.driveUrl || `https://drive.google.com/drive/folders/${storageFileId}`;

            // 4. Record AccessGrant in Database
            const grant = new AccessGrant({
                orderId: order._id,
                customerId: customerId,
                customerEmail: customerEmail,
                productId: productId,
                productName: item.name || product?.name || '3D Model Asset',
                storageProvider: provider,
                storageFileId: storageFileId,
                permissionId: grantResult.permissionId || '',
                sharingLinkId: grantResult.permissionId || '',
                accessLink: accessLink,
                accessGrantedAt: now,
                expiresAt: expiresAt,
                status: 'active',
                revocationAttempts: 0
            });

            await grant.save();
            grants.push(grant);

            // Update item driveUrl on the order so customer sees it
            item.driveUrl = accessLink;

            // 5. Audit Log
            await AuditLog.create({
                orderId: order._id,
                userId: customerId,
                eventType: 'ACCESS_GRANTED',
                details: {
                    grantId: grant._id,
                    productId: productId,
                    productName: grant.productName,
                    customerEmail: customerEmail,
                    provider: provider,
                    storageFileId: storageFileId,
                    permissionId: grant.permissionId,
                    accessGrantedAt: now,
                    expiresAt: expiresAt,
                    durationHours: this.defaultDurationHours
                }
            });
        }

        await order.save();
        return grants;
    }

    /**
     * Revokes access for a single AccessGrant.
     * CRITICAL SAFETY RULE: Only deletes the customer's permission/sharing link.
     * Never deletes, moves, or alters the underlying file or folder.
     * Idempotent: repeated calls on already revoked records return cleanly.
     */
    async revokeAccess(grant, models, triggerReason = 'Automatic 48-Hour Expiry') {
        const { AuditLog } = models;

        if (!grant) return { success: false, message: 'Grant record is null' };

        // Idempotency: If already revoked or expired, no provider API call needed
        if (['revoked', 'expired'].includes(grant.status)) {
            return { success: true, alreadyRevoked: true, status: grant.status };
        }

        grant.status = 'revoking';
        await grant.save();

        let revokeResult = { success: false };

        try {
            if (grant.storageProvider === 'onedrive') {
                revokeResult = await oneDriveService.revokeAccess(grant.storageFileId, grant.permissionId);
            } else {
                revokeResult = await googleDriveService.revokeUserAccess(grant.storageFileId, grant.permissionId);
            }
        } catch (apiError) {
            revokeResult = { success: false, error: apiError.message };
        }

        const now = new Date();

        if (revokeResult.success) {
            // Mark revoked/expired
            const isManualRevoke = triggerReason.toLowerCase().includes('manual') || triggerReason.toLowerCase().includes('revoke');
            grant.status = isManualRevoke ? 'revoked' : 'expired';
            grant.revokedAt = now;
            grant.lastRevocationError = '';
            await grant.save();

            // Synchronize with Order (wipe driveUrl so customer cannot access file)
            if (models.Order && typeof models.Order.updateOne === 'function') {
                try {
                    await models.Order.updateOne(
                        { _id: grant.orderId, 'items.productId': grant.productId },
                        { $set: { 'items.$.driveUrl': '' } }
                    );
                } catch (orderErr) {
                    console.warn('[AccessGrantService] Order driveUrl clear note:', orderErr.message);
                }
            }

            // Synchronize with License (set to Revoked or Expired)
            if (models.License && typeof models.License.updateMany === 'function') {
                try {
                    await models.License.updateMany(
                        { orderId: grant.orderId, productId: grant.productId },
                        {
                            $set: {
                                status: isManualRevoke ? 'Revoked' : 'Expired',
                                revokedAt: now,
                                revokedReason: triggerReason
                            }
                        }
                    );
                } catch (licErr) {
                    console.warn('[AccessGrantService] License sync note:', licErr.message);
                }
            }

            await AuditLog.create({
                orderId: grant.orderId,
                userId: grant.customerId,
                eventType: 'ACCESS_REVOKED',
                details: {
                    grantId: grant._id,
                    productId: grant.productId,
                    customerEmail: grant.customerEmail,
                    provider: grant.storageProvider,
                    permissionId: grant.permissionId,
                    triggerReason: triggerReason,
                    revokedAt: now
                }
            });

            return { success: true, grant };
        } else {
            // Increment retry counter
            grant.revocationAttempts = (grant.revocationAttempts || 0) + 1;
            grant.lastRevocationError = revokeResult.error || 'Unknown provider error during revocation';

            if (grant.revocationAttempts >= this.maxRetries) {
                grant.status = 'failed';
                await grant.save();

                await AuditLog.create({
                    orderId: grant.orderId,
                    userId: grant.customerId,
                    eventType: 'ACCESS_REVOCATION_FAILED',
                    details: {
                        grantId: grant._id,
                        productId: grant.productId,
                        customerEmail: grant.customerEmail,
                        provider: grant.storageProvider,
                        attempts: grant.revocationAttempts,
                        error: grant.lastRevocationError,
                        alert: 'CRITICAL: Automatic revocation failed after maximum retry attempts. Manual admin intervention required.'
                    }
                });

                console.error(`[AccessGrantService] CRITICAL: Revocation failed for Grant ${grant._id} after ${grant.revocationAttempts} attempts: ${grant.lastRevocationError}`);
            } else {
                // Revert to active so scheduler will retry with backoff
                grant.status = 'active';
                await grant.save();

                await AuditLog.create({
                    orderId: grant.orderId,
                    userId: grant.customerId,
                    eventType: 'ACCESS_REVOCATION_RETRY',
                    details: {
                        grantId: grant._id,
                        attempt: grant.revocationAttempts,
                        error: grant.lastRevocationError
                    }
                });
            }

            return { success: false, error: grant.lastRevocationError, attempts: grant.revocationAttempts };
        }
    }

    /**
     * Batch job: Finds all active access grants whose expiresAt <= now and revokes them.
     * Runs regularly in background and immediately on server boot.
     */
    async processExpiredGrants(models) {
        const { AccessGrant } = models;
        const now = new Date();

        // Find active or failed grants that have passed their 48-hour expiration
        const overdueGrants = await AccessGrant.find({
            status: { $in: ['active', 'failed'] },
            expiresAt: { $lte: now }
        }).limit(100);

        if (overdueGrants.length === 0) {
            return { checked: 0, revoked: 0, failed: 0 };
        }

        console.log(`[AccessGrantService] Found ${overdueGrants.length} expired access grant(s) to revoke.`);

        let revokedCount = 0;
        let failedCount = 0;

        for (const grant of overdueGrants) {
            try {
                const res = await this.revokeAccess(grant, models, 'Automatic 48-Hour Expiry');
                if (res.success) {
                    revokedCount++;
                } else {
                    failedCount++;
                }
            } catch (err) {
                failedCount++;
                console.error(`[AccessGrantService] Error revoking grant ${grant._id}:`, err.message);
            }
        }

        return {
            checked: overdueGrants.length,
            revoked: revokedCount,
            failed: failedCount
        };
    }
}

module.exports = new AccessGrantService();
