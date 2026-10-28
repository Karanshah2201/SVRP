/**
 * Admin License & Limited-Access Control Router
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const googleDriveService = require('../services/googleDriveService');
const oneDriveService = require('../services/oneDriveService');
const r2Service = require('../services/r2Service');
const accessGrantService = require('../services/accessGrantService');

function createAdminLicenseRouter(models, authenticateToken, isAdmin) {
    const router = express.Router();
    const { License, Product, Order, AuditLog, User, AccessGrant } = models;

    // Apply Admin Guard to all routes except login
    router.use((req, res, next) => {
        if (req.path === '/login') return next();
        authenticateToken(req, res, () => isAdmin(req, res, next));
    });

    // ==========================================
    // 1. List All Licenses with Filters
    // ==========================================
    router.get('/licenses', async (req, res) => {
        try {
            const { status, search, limit = 50, page = 1 } = req.query;
            let query = {};

            if (status && status !== 'all') {
                query.status = status;
            }

            if (search) {
                query.$or = [
                    { licenseKey: { $regex: search, $options: 'i' } },
                    { customerEmail: { $regex: search, $options: 'i' } },
                    { productName: { $regex: search, $options: 'i' } }
                ];
            }

            const parsedLimit = parseInt(limit);
            const parsedPage = parseInt(page);
            const skip = (parsedPage - 1) * parsedLimit;

            const [licenses, total] = await Promise.all([
                License.find(query).sort({ createdAt: -1 }).skip(skip).limit(parsedLimit),
                License.countDocuments(query)
            ]);

            // Quick Stats
            const [activeCount, expiredCount, revokedCount, limitReachedCount] = await Promise.all([
                License.countDocuments({ status: 'Active' }),
                License.countDocuments({ status: 'Expired' }),
                License.countDocuments({ status: 'Revoked' }),
                License.countDocuments({ status: 'LimitReached' })
            ]);

            res.json({
                licenses,
                total,
                page: parsedPage,
                totalPages: Math.ceil(total / parsedLimit),
                stats: {
                    active: activeCount,
                    expired: expiredCount,
                    revoked: revokedCount,
                    limitReached: limitReachedCount,
                    totalAll: activeCount + expiredCount + revokedCount + limitReachedCount
                }
            });
        } catch (error) {
            console.error('Error fetching admin licenses:', error);
            res.status(500).json({ message: 'Error retrieving licenses.' });
        }
    });

    // ==========================================
    // 2. Revoke License Access
    // ==========================================
    router.post('/licenses/:licenseKey/revoke', async (req, res) => {
        try {
            const { licenseKey } = req.params;
            const { reason } = req.body;

            const license = await License.findOne({ licenseKey });
            if (!license) {
                return res.status(404).json({ message: 'License not found.' });
            }

            license.status = 'Revoked';
            license.revokedAt = new Date();
            license.revokedReason = reason || 'Revoked by Store Administrator';
            await license.save();

            // If Google Drive user permission was created, revoke it
            if (license.storageProvider === 'gdrive' && license.storageFileId) {
                try {
                    await googleDriveService.revokeUserAccess(license.storageFileId, license.customerEmail);
                } catch (gErr) {
                    console.warn('Google Drive revocation note:', gErr.message);
                }
            }

            // Revoke and sync any linked 48-Hour Access Grant
            if (AccessGrant) {
                try {
                    const grant = await AccessGrant.findOne({
                        orderId: license.orderId,
                        productId: license.productId
                    });
                    if (grant) {
                        grant.status = 'revoked';
                        grant.revokedAt = license.revokedAt;
                        grant.lastRevocationError = '';
                        await grant.save();
                        await accessGrantService.revokeAccess(grant, models, `License Revoked: ${license.revokedReason}`);
                    }
                } catch (grantErr) {
                    console.warn('AccessGrant sync revocation note:', grantErr.message);
                }
            }

            // Immediately clear driveUrl from Order item so customer cannot access it
            if (Order) {
                try {
                    await Order.updateOne(
                        { _id: license.orderId, 'items.productId': license.productId },
                        { $set: { 'items.$.driveUrl': '' } }
                    );
                } catch (orderErr) {
                    console.warn('Order driveUrl clear note:', orderErr.message);
                }
            }

            // Write Audit Log
            await AuditLog.create({
                licenseId: license._id,
                orderId: license.orderId,
                userId: license.userId,
                eventType: 'LICENSE_REVOKED',
                details: {
                    reason: license.revokedReason,
                    revokedByAdmin: req.user?.id || req.user?._id || 'admin'
                }
            });

            res.json({
                success: true,
                message: `License ${licenseKey} has been revoked. Further access is locked.`,
                license
            });
        } catch (error) {
            console.error('Error revoking license:', error);
            res.status(500).json({ message: 'Error revoking license.' });
        }
    });

    // ==========================================
    // 3. Restore Revoked License
    // ==========================================
    router.post('/licenses/:licenseKey/restore', async (req, res) => {
        try {
            const { licenseKey } = req.params;
            const license = await License.findOne({ licenseKey });
            if (!license) {
                return res.status(404).json({ message: 'License not found.' });
            }

            license.status = 'Active';
            license.revokedAt = null;
            license.revokedReason = '';
            await license.save();

            await AuditLog.create({
                licenseId: license._id,
                orderId: license.orderId,
                userId: license.userId,
                eventType: 'LICENSE_RESTORED',
                details: { restoredByAdmin: req.user.id }
            });

            res.json({
                success: true,
                message: `License ${licenseKey} restored to Active status.`,
                license
            });
        } catch (error) {
            console.error('Error restoring license:', error);
            res.status(500).json({ message: 'Error restoring license.' });
        }
    });

    // ==========================================
    // 4. Reset Download Count
    // ==========================================
    router.put('/licenses/:licenseKey/reset-downloads', async (req, res) => {
        try {
            const { licenseKey } = req.params;
            const { maxDownloads } = req.body;

            const license = await License.findOne({ licenseKey });
            if (!license) {
                return res.status(404).json({ message: 'License not found.' });
            }

            license.downloadCount = 0;
            if (maxDownloads && !isNaN(parseInt(maxDownloads))) {
                license.maxDownloads = parseInt(maxDownloads);
            }
            if (license.status === 'LimitReached') {
                license.status = 'Active';
            }
            await license.save();

            await AuditLog.create({
                licenseId: license._id,
                orderId: license.orderId,
                userId: license.userId,
                eventType: 'LICENSE_RESTORED',
                details: {
                    action: 'RESET_DOWNLOAD_COUNT',
                    newMaxDownloads: license.maxDownloads,
                    performedBy: req.user.id
                }
            });

            res.json({
                success: true,
                message: `Download counter reset to 0 for ${licenseKey}.`,
                license
            });
        } catch (error) {
            console.error('Error resetting downloads:', error);
            res.status(500).json({ message: 'Error resetting downloads.' });
        }
    });

    // ==========================================
    // 5. Extend Expiry Date
    // ==========================================
    router.put('/licenses/:licenseKey/extend-expiry', async (req, res) => {
        try {
            const { licenseKey } = req.params;
            const { days = 30 } = req.body;

            const license = await License.findOne({ licenseKey });
            if (!license) {
                return res.status(404).json({ message: 'License not found.' });
            }

            const currentExpiry = new Date(license.expiryDate);
            const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
            baseDate.setDate(baseDate.getDate() + parseInt(days));

            license.expiryDate = baseDate;
            if (license.status === 'Expired') {
                license.status = 'Active';
            }
            await license.save();

            await AuditLog.create({
                licenseId: license._id,
                orderId: license.orderId,
                userId: license.userId,
                eventType: 'LICENSE_RESTORED',
                details: {
                    action: 'EXTEND_EXPIRY',
                    extendedDays: days,
                    newExpiry: license.expiryDate
                }
            });

            res.json({
                success: true,
                message: `Expiry extended by ${days} days until ${license.expiryDate.toLocaleDateString('en-IN')}.`,
                license
            });
        } catch (error) {
            console.error('Error extending expiry:', error);
            res.status(500).json({ message: 'Error extending expiry.' });
        }
    });

    // ==========================================
    // 6. Security Audit Logs Query
    // ==========================================
    router.get('/audit-logs', async (req, res) => {
        try {
            const { eventType, limit = 100 } = req.query;
            let query = {};
            if (eventType && eventType !== 'all') {
                query.eventType = eventType;
            }

            const logs = await AuditLog.find(query)
                .sort({ timestamp: -1 })
                .limit(parseInt(limit))
                .populate('userId', 'email fullname');

            res.json(logs);
        } catch (error) {
            console.error('Error fetching audit logs:', error);
            res.status(500).json({ message: 'Error fetching audit logs.' });
        }
    });

    // ==========================================
    // 7. Cloud Storage Health & Stats
    // ==========================================
    router.get('/storage-stats', async (req, res) => {
        try {
            const uploadsDir = path.join(__dirname, '..', 'uploads');
            let localFilesCount = 0;
            let localTotalBytes = 0;

            if (fs.existsSync(uploadsDir)) {
                const files = fs.readdirSync(uploadsDir);
                localFilesCount = files.length;
                for (const f of files) {
                    const stats = fs.statSync(path.join(uploadsDir, f));
                    localTotalBytes += stats.size;
                }
            }

            const storageStatus = {
                googleDrive: {
                    configured: googleDriveService.isConfigured(),
                    clientEmail: googleDriveService.clientEmail || 'Not Configured',
                    folderId: googleDriveService.folderId ? 'Configured (Hidden)' : 'Not Configured'
                },
                oneDrive: {
                    configured: oneDriveService.isConfigured(),
                    clientId: oneDriveService.clientId ? 'Configured' : 'Not Configured',
                    tenantId: oneDriveService.tenantId
                },
                cloudflareR2: {
                    configured: r2Service.isConfigured(),
                    accountId: r2Service.accountId ? 'Configured' : 'Not Configured',
                    bucketName: r2Service.bucketName,
                    egressFeeNotice: 'ZERO Egress Bandwidth Fees (Permanent)'
                },
                localRepository: {
                    directory: 'Backend/uploads',
                    fileCount: localFilesCount,
                    totalSizeMB: (localTotalBytes / (1024 * 1024)).toFixed(2)
                }
            };

            res.json(storageStatus);
        } catch (error) {
            console.error('Error checking storage stats:', error);
            res.status(500).json({ message: 'Error fetching storage health.' });
        }
    });

    return router;
}

module.exports = createAdminLicenseRouter;
