/**
 * License Service & Limited-Access Engine
 * 
 * Manages:
 * 1. Cryptographic license key generation
 * 2. Order-based license creation with configurable limits (1-2 downloads, 30 days)
 * 3. Atomic download quota verification
 * 4. Interruption-aware stream tracking
 * 5. Audit logging
 */

const crypto = require('crypto');

class LicenseService {
    /**
     * Generate an uppercase formatted license key: LIC-SVRP-YYYY-XXXX-XXXX
     */
    generateLicenseKey() {
        const year = new Date().getFullYear();
        const rand1 = crypto.randomBytes(2).toString('hex').toUpperCase();
        const rand2 = crypto.randomBytes(3).toString('hex').toUpperCase();
        return `LIC-SVRP-${year}-${rand1}-${rand2}`;
    }

    /**
     * Calculate expiry date from product duration (default 30 days)
     */
    calculateExpiry(days = 30) {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + (parseInt(days) || 30));
        return expiry;
    }

    /**
     * Creates license records for each purchased product in an order.
     * Idempotent: If licenses already exist for this order, returns existing.
     */
    async createLicensesForOrder(order, models, session = null) {
        const { License, Product, AuditLog } = models;
        const createdLicenses = [];

        for (const item of order.items) {
            // Check if license already generated for this order & item
            const existing = await License.findOne({
                orderId: order._id,
                productId: item.productId
            });

            if (existing) {
                createdLicenses.push(existing);
                continue;
            }

            // Fetch product configuration for downloadLimit and duration
            const product = await Product.findOne({ id: item.productId });
            const downloadLimit = product?.downloadLimit || 2;
            const durationDays = product?.licenseDurationDays || 30;
            const storageProvider = product?.storageProvider || 'local';
            const storageFileId = product?.storageFileId || '';

            const license = new License({
                licenseKey: this.generateLicenseKey(),
                orderId: order._id,
                userId: order.userId,
                productId: item.productId,
                productName: item.name || product?.name || '3D Model Asset',
                customerEmail: order.email,
                purchaseDate: order.createdAt || new Date(),
                startDate: new Date(),
                expiryDate: this.calculateExpiry(durationDays),
                maxDownloads: downloadLimit,
                downloadCount: 0,
                status: 'Active',
                storageProvider: storageProvider,
                storageFileId: storageFileId,
                fileUrl: item.downloadUrl || product?.mediaUrl || ''
            });

            await license.save();
            createdLicenses.push(license);

            // Audit Log
            await AuditLog.create({
                licenseId: license._id,
                orderId: order._id,
                userId: order.userId,
                eventType: 'LICENSE_CREATED',
                details: {
                    licenseKey: license.licenseKey,
                    maxDownloads: downloadLimit,
                    expiryDate: license.expiryDate,
                    productName: license.productName
                }
            });
        }

        return createdLicenses;
    }

    /**
     * Validates whether a license is authorized to perform a download.
     * Handles automatic transition to Expired or LimitReached.
     */
    async validateLicenseAccess(licenseKey, models) {
        const { License, AuditLog } = models;
        const license = await License.findOne({ licenseKey });

        if (!license) {
            return { authorized: false, code: 404, message: 'License key not found.' };
        }

        if (license.status === 'Revoked') {
            return {
                authorized: false,
                code: 403,
                message: `This license has been revoked. Reason: ${license.revokedReason || 'Administrative revocation'}. Please contact support.`
            };
        }

        const now = new Date();
        if (now > new Date(license.expiryDate)) {
            if (license.status !== 'Expired') {
                license.status = 'Expired';
                await license.save();
                await AuditLog.create({
                    licenseId: license._id,
                    orderId: license.orderId,
                    userId: license.userId,
                    eventType: 'LICENSE_EXPIRED',
                    details: { expiredAt: now }
                });
            }
            return {
                authorized: false,
                code: 403,
                message: `Access expired on ${new Date(license.expiryDate).toLocaleDateString('en-IN')}. The permitted 30-day download window has ended.`
            };
        }

        if (license.downloadCount >= license.maxDownloads) {
            if (license.status !== 'LimitReached') {
                license.status = 'LimitReached';
                await license.save();
                await AuditLog.create({
                    licenseId: license._id,
                    orderId: license.orderId,
                    userId: license.userId,
                    eventType: 'LIMIT_REACHED',
                    details: { downloadCount: license.downloadCount, maxDownloads: license.maxDownloads }
                });
            }
            return {
                authorized: false,
                code: 403,
                message: `Permitted download limit reached (${license.downloadCount} of ${license.maxDownloads} downloads completed). Further downloads are locked.`
            };
        }

        return { authorized: true, license };
    }

    /**
     * Increments the download counter only after verified stream completion.
     */
    async recordSuccessfulDownload(licenseId, ipAddress, userAgent, models) {
        const { License, AuditLog } = models;

        const updatedLicense = await License.findOneAndUpdate(
            { _id: licenseId, downloadCount: { $lt: 999 } },
            {
                $inc: { downloadCount: 1 },
                $set: { lastDownloadedAt: new Date() }
            },
            { new: true }
        );

        if (!updatedLicense) return null;

        // If newly reached or exceeded limit, mark LimitReached
        if (updatedLicense.downloadCount >= updatedLicense.maxDownloads) {
            updatedLicense.status = 'LimitReached';
            await updatedLicense.save();
        }

        await AuditLog.create({
            licenseId: updatedLicense._id,
            orderId: updatedLicense.orderId,
            userId: updatedLicense.userId,
            eventType: 'DOWNLOAD_SUCCESS',
            ipAddress: ipAddress || '127.0.0.1',
            userAgent: userAgent || 'Client',
            details: {
                newDownloadCount: updatedLicense.downloadCount,
                maxDownloads: updatedLicense.maxDownloads,
                status: updatedLicense.status
            }
        });

        return updatedLicense;
    }
}

module.exports = new LicenseService();
