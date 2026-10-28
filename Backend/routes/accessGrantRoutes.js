/**
 * Cloud 48-Hour Access Grant & Revocation Router
 * 
 * Provides:
 * 1. Customer: View my active/expired Google Drive & OneDrive access grants with live expiry countdown
 * 2. Admin: View, search, and monitor all access grants (active, expired, revoked, failed)
 * 3. Admin: Manual immediate revocation & retry for failed revocations
 * 4. Admin: Force immediate background sweep execution
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const accessGrantService = require('../services/accessGrantService');
const revocationScheduler = require('../services/revocationScheduler');

function createAccessGrantRouter(models, authenticateToken, isAdmin) {
    const router = express.Router();
    const { AccessGrant, Product, Order, AuditLog, User, License } = models;
    const JWT_SECRET = process.env.JWT_SECRET;

    // ==========================================
    // 0. Secure Access Gateway: Only allows access if grant & license are actively valid
    // ==========================================
    router.get('/open/:id', async (req, res) => {
        try {
            const authHeader = req.headers['authorization'];
            let token = authHeader && authHeader.split(' ')[1];
            if (token === 'undefined' || token === 'null') token = undefined;
            if (!token) token = req.cookies?.token;
            if (!token && req.query.token) token = req.query.token;

            if (!token) {
                return res.status(401).send(`
                    <!DOCTYPE html>
                    <html>
                    <head><title>Sign In Required - SVRP</title></head>
                    <body style="font-family:system-ui,sans-serif;background:#0f172a;color:#f8fafc;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:20px;">
                        <div style="background:#1e293b;border:1px solid #334155;border-radius:16px;padding:32px;max-width:440px;text-align:center;">
                            <h2 style="color:#ffffff;margin-bottom:8px;">Authentication Required</h2>
                            <p style="color:#94a3b8;font-size:14px;margin-bottom:24px;">Please sign in to your SVRP account to access your purchased 3D model files.</p>
                            <a href="/login" style="display:inline-block;padding:12px 24px;background:#4a148c;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:13px;">Sign In</a>
                        </div>
                    </body>
                    </html>
                `);
            }

            let decoded;
            try {
                decoded = jwt.verify(token, JWT_SECRET);
            } catch (err) {
                return res.status(401).send(`
                    <!DOCTYPE html>
                    <html>
                    <head><title>Session Expired - SVRP</title></head>
                    <body style="font-family:system-ui,sans-serif;background:#0f172a;color:#f8fafc;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:20px;">
                        <div style="background:#1e293b;border:1px solid #334155;border-radius:16px;padding:32px;max-width:440px;text-align:center;">
                            <h2 style="color:#ffffff;margin-bottom:8px;">Session Expired</h2>
                            <p style="color:#94a3b8;font-size:14px;margin-bottom:24px;">Your session has expired. Please log in again to continue.</p>
                            <a href="/login" style="display:inline-block;padding:12px 24px;background:#4a148c;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:13px;">Log In</a>
                        </div>
                    </body>
                    </html>
                `);
            }

            const grant = await AccessGrant.findById(req.params.id);
            if (!grant) {
                return res.status(404).send('Access record not found.');
            }

            // Verify ownership
            const isOwner = grant.customerId.toString() === decoded.id.toString();
            const user = await User.findById(decoded.id);
            const isAdminUser = user && user.role === 'admin';

            if (!isOwner && !isAdminUser) {
                return res.status(403).send('Access denied: You do not own this order.');
            }

            // Sync with License state if linked
            if (License) {
                const lic = await License.findOne({ orderId: grant.orderId, productId: grant.productId });
                if (lic && lic.status === 'Revoked' && grant.status !== 'revoked') {
                    grant.status = 'revoked';
                    grant.revokedAt = new Date();
                    await grant.save();
                }
            }

            const now = new Date();
            const isOverdue = now > new Date(grant.expiresAt);
            const isBlocked = ['revoked', 'expired'].includes(grant.status) || isOverdue;

            if (isBlocked) {
                if (grant.status === 'active' && isOverdue) {
                    grant.status = 'expired';
                    grant.revokedAt = now;
                    await grant.save();
                }

                const reason = grant.status === 'revoked'
                    ? 'Access to this file was revoked by the store administrator.'
                    : 'The temporary 48-hour access window for this 3D model has expired.';

                return res.status(403).send(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Access Locked - SVRP</title>
                        <meta name="viewport" content="width=device-width, initial-scale=1">
                    </head>
                    <body style="font-family:system-ui,-apple-system,sans-serif;background:#0f172a;color:#f8fafc;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:20px;">
                        <div style="background:#1e293b;border:1px solid rgba(239,68,68,0.3);border-radius:16px;padding:32px;max-width:480px;text-align:center;box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);">
                            <div style="width:48px;height:48px;background:rgba(239,68,68,0.15);color:#ef4444;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:16px;">✕</div>
                            <h2 style="color:#ffffff;margin:0 0 8px 0;font-size:20px;font-weight:800;">Cloud Link Locked</h2>
                            <p style="color:#94a3b8;font-size:14px;line-height:1.5;margin:0 0 20px 0;">${reason}</p>
                            <div style="background:#0f172a;border-radius:10px;padding:12px;font-size:12px;color:#cbd5e1;margin-bottom:24px;text-align:left;">
                                <div style="margin-bottom:4px;"><strong>Asset:</strong> ${grant.productName}</div>
                                <div style="margin-bottom:4px;"><strong>Status:</strong> <span style="color:#ef4444;font-weight:bold;text-transform:uppercase;">${grant.status}</span></div>
                                <div><strong>Revoked / Expired At:</strong> ${new Date(grant.revokedAt || grant.expiresAt).toLocaleString('en-IN')}</div>
                            </div>
                            <a href="/orders" style="display:inline-block;padding:12px 24px;background:#4a148c;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:13px;">Return to Orders</a>
                        </div>
                    </body>
                    </html>
                `);
            }

            // Audit access (safely wrapped so logging warnings never block customer file access)
            try {
                if (AuditLog) {
                    await AuditLog.create({
                        orderId: grant.orderId,
                        userId: decoded.id,
                        eventType: 'CLOUD_LINK_ACCESSED',
                        ipAddress: req.ip,
                        userAgent: req.headers['user-agent'] || '',
                        details: {
                            grantId: grant._id,
                            productName: grant.productName,
                            provider: grant.storageProvider
                        }
                    });
                }
            } catch (auditErr) {
                console.warn('[AccessGateway] Non-fatal audit log warning:', auditErr.message);
            }

            // Redirect to actual underlying cloud asset link
            let destination = grant.accessLink;
            if (!destination) {
                destination = `https://drive.google.com/drive/folders/${grant.storageFileId}`;
            }
            return res.redirect(destination);
        } catch (error) {
            console.error('Error opening access grant:', error);
            res.status(500).send('Server error accessing cloud link.');
        }
    });

    // ==========================================
    // 1. Customer: Get My Access Grants
    // ==========================================
    router.get('/my-grants', authenticateToken, async (req, res) => {
        try {
            const grants = await AccessGrant.find({ customerId: req.user.id })
                .sort({ createdAt: -1 });

            const now = new Date();
            const enriched = grants.map(g => {
                const isOverdue = now > new Date(g.expiresAt);
                const isExpired = isOverdue || ['expired', 'revoked'].includes(g.status);
                const remainingMs = Math.max(0, new Date(g.expiresAt).getTime() - now.getTime());

                // Security Rule: Mask/hide active link if expired or revoked
                const safeLink = isExpired ? '' : g.accessLink;

                let computedStatus = g.status;
                if (g.status === 'active' && isOverdue) {
                    computedStatus = 'expired';
                }

                return {
                    _id: g._id,
                    orderId: g.orderId,
                    productId: g.productId,
                    productName: g.productName,
                    storageProvider: g.storageProvider,
                    accessLink: safeLink,
                    accessGrantedAt: g.accessGrantedAt,
                    expiresAt: g.expiresAt,
                    status: computedStatus,
                    isExpired: isExpired,
                    remainingMs: remainingMs,
                    remainingHours: (remainingMs / (1000 * 60 * 60)).toFixed(1),
                    revokedAt: g.revokedAt,
                    notice: isExpired 
                        ? 'Your 48-hour access window has ended. Downloaded copies remain on your local device.' 
                        : 'Access is active for 48 hours. Please save files to your local drive before expiration.'
                };
            });

            res.json(enriched);
        } catch (error) {
            console.error('Error fetching customer access grants:', error);
            res.status(500).json({ message: 'Error retrieving cloud access grants.' });
        }
    });

    // ==========================================
    // 2. Admin: List All Access Grants with Filters
    // ==========================================
    router.get('/admin/grants', authenticateToken, isAdmin, async (req, res) => {
        try {
            const { status, search, limit = 50, page = 1 } = req.query;
            let query = {};

            if (status && status !== 'all') {
                query.status = status;
            }

            if (search) {
                query.$or = [
                    { customerEmail: { $regex: search, $options: 'i' } },
                    { productName: { $regex: search, $options: 'i' } },
                    { permissionId: { $regex: search, $options: 'i' } }
                ];
            }

            const parsedLimit = parseInt(limit, 10);
            const parsedPage = parseInt(page, 10);
            const skip = (parsedPage - 1) * parsedLimit;

            const [grants, total] = await Promise.all([
                AccessGrant.find(query).sort({ createdAt: -1 }).skip(skip).limit(parsedLimit),
                AccessGrant.countDocuments(query)
            ]);

            const now = new Date();
            const [activeCount, expiredCount, revokedCount, failedCount] = await Promise.all([
                AccessGrant.countDocuments({ status: 'active', expiresAt: { $gt: now } }),
                AccessGrant.countDocuments({ $or: [{ status: 'expired' }, { status: 'active', expiresAt: { $lte: now } }] }),
                AccessGrant.countDocuments({ status: 'revoked' }),
                AccessGrant.countDocuments({ status: 'failed' })
            ]);

            res.json({
                grants,
                total,
                page: parsedPage,
                totalPages: Math.ceil(total / parsedLimit),
                stats: {
                    active: activeCount,
                    expired: expiredCount,
                    revoked: revokedCount,
                    failed: failedCount,
                    totalAll: total
                }
            });
        } catch (error) {
            console.error('Error fetching admin access grants:', error);
            res.status(500).json({ message: 'Error retrieving access grants.' });
        }
    });

    // ==========================================
    // 3. Admin: Manually Revoke an Access Grant Immediately
    // ==========================================
    router.post('/admin/grants/:id/revoke', authenticateToken, isAdmin, async (req, res) => {
        try {
            const { id } = req.params;
            const { reason } = req.body;

            const grant = await AccessGrant.findById(id);
            if (!grant) {
                return res.status(404).json({ message: 'Access grant not found.' });
            }

            const result = await accessGrantService.revokeAccess(
                grant,
                models,
                reason || `Manual Admin Revocation by ${req.user.email || req.user.id}`
            );

            if (result.success) {
                // Synchronize with linked License and Order
                try {
                    if (License) {
                        await License.updateMany(
                            { orderId: grant.orderId, productId: grant.productId },
                            { $set: { status: 'Revoked', revokedAt: new Date(), revokedReason: reason || 'Revoked by Administrator' } }
                        );
                    }
                    if (Order) {
                        await Order.updateOne(
                            { _id: grant.orderId, 'items.productId': grant.productId },
                            { $set: { 'items.$.driveUrl': '' } }
                        );
                    }
                } catch (syncErr) {
                    console.error('Error synchronizing grant revocation with License/Order:', syncErr);
                }

                res.json({
                    success: true,
                    message: `Access revoked successfully for ${grant.customerEmail}. Original cloud files remain untouched.`,
                    grant
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: `Revocation failed: ${result.error}`,
                    grant
                });
            }
        } catch (error) {
            console.error('Error revoking grant:', error);
            res.status(500).json({ message: 'Error executing revocation.', error: error.message });
        }
    });

    // ==========================================
    // 4. Admin: Retry Failed Revocation
    // ==========================================
    router.post('/admin/grants/:id/retry', authenticateToken, isAdmin, async (req, res) => {
        try {
            const { id } = req.params;
            const grant = await AccessGrant.findById(id);
            if (!grant) {
                return res.status(404).json({ message: 'Access grant not found.' });
            }

            grant.status = 'active'; // Reset to active so service will attempt provider call
            grant.revocationAttempts = 0; // Reset counter for manual retry
            await grant.save();

            const result = await accessGrantService.revokeAccess(grant, models, 'Admin Manual Retry');

            if (result.success) {
                res.json({
                    success: true,
                    message: `Retry successful! Access revoked for ${grant.customerEmail}.`,
                    grant
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: `Retry failed: ${result.error}`,
                    grant
                });
            }
        } catch (error) {
            console.error('Error retrying revocation:', error);
            res.status(500).json({ message: 'Error executing retry.', error: error.message });
        }
    });

    // ==========================================
    // 5. Admin: Force Immediate Background Revocation Sweep
    // ==========================================
    router.post('/admin/run-scheduler', authenticateToken, isAdmin, async (req, res) => {
        try {
            const result = await revocationScheduler.runSweep(models);
            res.json({
                success: true,
                message: 'Revocation scheduler sweep completed.',
                result
            });
        } catch (error) {
            console.error('Error triggering scheduler sweep:', error);
            res.status(500).json({ message: 'Error running scheduler sweep.', error: error.message });
        }
    });

    return router;
}

module.exports = createAccessGrantRouter;
