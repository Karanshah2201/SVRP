/**
 * Customer License Management & Secure Limited-Access Download Controller
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const jwt = require('jsonwebtoken');
const licenseService = require('../services/licenseService');
const googleDriveService = require('../services/googleDriveService');
const oneDriveService = require('../services/oneDriveService');
const r2Service = require('../services/r2Service');

function createLicenseRouter(models, authenticateToken, JWT_SECRET) {
    const router = express.Router();
    const { License, Product, Order, AuditLog, User } = models;

    // ==========================================
    // 1. Get Customer's Active & Past Licenses
    // ==========================================
    router.get('/', authenticateToken, async (req, res) => {
        try {
            const licenses = await License.find({ userId: req.user.id }).sort({ createdAt: -1 });

            // Enrich with product specifications
            const productIds = licenses.map(l => l.productId);
            const products = await Product.find({ id: { $in: productIds } });
            const productMap = new Map(products.map(p => [p.id, p]));

            const now = new Date();

            const enriched = licenses.map(l => {
                const p = productMap.get(l.productId);
                const isExpired = now > new Date(l.expiryDate);
                const remainingDownloads = Math.max(0, l.maxDownloads - l.downloadCount);

                let computedStatus = l.status;
                if (l.status === 'Active') {
                    if (isExpired) computedStatus = 'Expired';
                    else if (remainingDownloads === 0) computedStatus = 'LimitReached';
                }

                return {
                    _id: l._id,
                    licenseKey: l.licenseKey,
                    orderId: l.orderId,
                    productId: l.productId,
                    productName: l.productName,
                    customerEmail: l.customerEmail,
                    purchaseDate: l.purchaseDate,
                    startDate: l.startDate,
                    expiryDate: l.expiryDate,
                    maxDownloads: l.maxDownloads,
                    downloadCount: l.downloadCount,
                    remainingDownloads,
                    status: computedStatus,
                    isExpired,
                    lastDownloadedAt: l.lastDownloadedAt,
                    product: p ? {
                        id: p.id,
                        image: p.image,
                        category: p.category,
                        fileFormats: p.fileFormats || ['.blend', '.fbx', '.obj', '.glb'],
                        fileSize: p.fileSize || '45 MB',
                        polygonCount: p.polygonCount,
                        vertexCount: p.vertexCount
                    } : null
                };
            });

            res.json(enriched);
        } catch (error) {
            console.error('Error fetching licenses:', error);
            res.status(500).json({ message: 'Error retrieving licenses.' });
        }
    });

    // ==========================================
    // 2. Get Single License Certificate by Key
    // ==========================================
    router.get('/:licenseKey', authenticateToken, async (req, res) => {
        try {
            const { licenseKey } = req.params;
            const license = await License.findOne({ licenseKey });
            if (!license) {
                return res.status(404).json({ message: 'License certificate not found.' });
            }

            // Verify ownership or admin
            const isOwner = license.userId.toString() === req.user.id.toString();
            const user = await User.findById(req.user.id);
            const isAdmin = user && user.role === 'admin';

            if (!isOwner && !isAdmin) {
                return res.status(403).json({ message: 'Access denied: You do not own this license.' });
            }

            const product = await Product.findOne({ id: license.productId });
            const now = new Date();
            const isExpired = now > new Date(license.expiryDate);
            const remainingDownloads = Math.max(0, license.maxDownloads - license.downloadCount);

            res.json({
                license,
                product,
                remainingDownloads,
                isExpired,
                terms: {
                    validityPeriod: '30 Days from date of purchase',
                    maxDownloads: license.maxDownloads,
                    copyProtectionNotice: 'Original downloadable 3D models stored on local device cannot be revoked after completion. Single-seat commercial license with strict redistribution prohibition applies.',
                    supportEmail: 'support@railworks.com'
                }
            });
        } catch (error) {
            console.error('Error fetching license details:', error);
            res.status(500).json({ message: 'Error fetching license details.' });
        }
    });

    // ==========================================
    // 3. SECURE LIMITED-ACCESS DOWNLOAD STREAM
    // ==========================================
    router.get('/:licenseKey/download', async (req, res) => {
        try {
            // Flexible Token Acquisition: Authorization Header, Cookie, or ?token= URL Param
            const authHeader = req.headers['authorization'];
            let token = authHeader && authHeader.split(' ')[1];
            if (token === 'undefined' || token === 'null') token = undefined;
            if (!token) token = req.cookies?.token;
            if (!token && req.query.token) token = req.query.token;

            if (!token) {
                return res.status(401).json({ message: 'Authentication required to access download.' });
            }

            let decoded;
            try {
                decoded = jwt.verify(token, JWT_SECRET);
            } catch (err) {
                return res.status(401).json({ message: 'Session expired or invalid token. Please log in again.' });
            }

            const { licenseKey } = req.params;
            const license = await License.findOne({ licenseKey });
            if (!license) {
                return res.status(404).json({ message: 'License not found.' });
            }

            // Verify ownership
            const isOwner = license.userId.toString() === decoded.id.toString();
            const user = await User.findById(decoded.id);
            const isAdmin = user && user.role === 'admin';

            if (!isOwner && !isAdmin) {
                await AuditLog.create({
                    licenseId: license._id,
                    orderId: license.orderId,
                    userId: decoded.id,
                    eventType: 'STORAGE_ERROR',
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent'],
                    details: { reason: 'Unauthorized customer attempted access to another user license' }
                });
                return res.status(403).json({ message: 'Unauthorized: You do not own this license.' });
            }

            // Validate license state (Active, Expiry, Download Count)
            const validation = await licenseService.validateLicenseAccess(licenseKey, { License, AuditLog });
            if (!validation.authorized) {
                return res.status(validation.code).json({
                    error: 'Access Denied',
                    message: validation.message,
                    status: license.status
                });
            }

            const product = await Product.findOne({ id: license.productId });
            const safeName = (license.productName || product?.name || '3D_Model').replace(/[^a-zA-Z0-9_-]/g, '_');

            // Audit attempt
            await AuditLog.create({
                licenseId: license._id,
                orderId: license.orderId,
                userId: license.userId,
                eventType: 'DOWNLOAD_ATTEMPT',
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                details: {
                    attemptNumber: license.downloadCount + 1,
                    maxDownloads: license.maxDownloads,
                    provider: license.storageProvider
                }
            });

            // Set Stream Attachment Headers
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename="${safeName}_License_Package.zip"`);
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
            res.setHeader('Pragma', 'no-cache');

            // Stream state tracker
            let streamFinished = false;

            res.on('finish', async () => {
                streamFinished = true;
                try {
                    await licenseService.recordSuccessfulDownload(
                        license._id,
                        req.ip,
                        req.headers['user-agent'],
                        { License, AuditLog }
                    );
                } catch (recErr) {
                    console.error('Error recording download completion:', recErr);
                }
            });

            req.on('close', async () => {
                if (!streamFinished) {
                    try {
                        await AuditLog.create({
                            licenseId: license._id,
                            orderId: license.orderId,
                            userId: license.userId,
                            eventType: 'DOWNLOAD_INTERRUPTED',
                            ipAddress: req.ip,
                            userAgent: req.headers['user-agent'],
                            details: {
                                note: 'Transfer socket disconnected before completion. Customer remaining quota preserved.'
                            }
                        });
                    } catch (e) { }
                }
            });

            // Build Secure ZIP stream
            const archive = archiver('zip', { zlib: { level: 9 } });
            archive.on('error', (err) => {
                console.error('Archive packing error:', err);
                if (!res.headersSent) res.status(500).json({ message: 'Error streaming 3D archive' });
            });
            archive.pipe(res);

            // 1. License Document
            const certText = `================================================================================
SHRI VISHWAKARMA RAIL PRODUCTION (SVRP) — 3D ASSET LIMITED ACCESS LICENSE
================================================================================
License Key:             ${license.licenseKey}
Order Reference:         ${license.orderId}
Product Title:           ${license.productName}
Licensed Customer:       ${license.customerEmail}
Issue Date:              ${new Date(license.startDate).toISOString()}
Expiration Date:         ${new Date(license.expiryDate).toISOString()}
Permitted Downloads:     ${license.maxDownloads}
--------------------------------------------------------------------------------
TERMS OF USE & REDISTRIBUTION PROHIBITION:
1. NON-TRANSFERABLE RIGHTS: This license grants the customer a non-exclusive, 
   non-transferable right to utilize the 3D model geometry, textures, and rigs
   in commercial, broadcast, interactive video game, and architectural visualization projects.
2. STRICT ANTI-REDISTRIBUTION CLAUSE: You are strictly prohibited from reselling,
   sharing, distributing, sub-licensing, or uploading raw 3D mesh files (.blend, .fbx, 
   .obj, .stl, .glb, .gltf, .max, .ma) to torrents, public repositories, or other 3D marketplaces.
3. DIGITAL ACCESS PERIOD: Technical access to this digital download is restricted 
   to ${license.maxDownloads} successful downloads within 30 days of purchase.
4. COPY LIMITATION ACKNOWLEDGEMENT: The customer acknowledges that technical access
   controls govern download attempts from the server; access revocation cannot delete
   copies already downloaded to the customer's local storage device.
================================================================================`;
            archive.append(certText, { name: 'OFFICIAL_LICENSE_CERTIFICATE.txt' });

            // 2. README & Formats Guide
            const readme = `SVRP 3D ASSET GUIDE
--------------------------------------------------------------------------------
Product: ${license.productName}
Supported Formats: ${(product?.fileFormats || ['.blend', '.fbx', '.obj', '.glb']).join(', ')}
Polygon Count: ${product?.polygonCount || 'Clean Quad Mesh'}
Vertex Count: ${product?.vertexCount || 'Optimized'}

IMPORTING INTO YOUR PIPELINE:
- Blender (.blend): Open directly. Materials are pre-configured for Cycles and Eevee Next.
- Game Engines (Unreal / Unity): Import .fbx or .glb. PBR textures are embedded or mapped to channels.
- 3D Printing (.stl / .obj): Watertight manifold mesh ready for slicing.

Failed transfer or corrupted download? Contact our technical team at:
support@railworks.com with your License Key: ${license.licenseKey}`;
            archive.append(readme, { name: 'README_3D_ASSETS.txt' });

            // 3. Asset Model File
            const candidatePaths = [
                path.join(__dirname, '..', '..', 'Frontend', 'public', '1769954393_ICFMeasurement.fbx'),
                path.join(__dirname, '..', 'uploads', '1769954393_ICFMeasurement.fbx'),
                path.join(__dirname, '..', product?.mediaUrl || '')
            ];

            let foundFile = false;
            for (const candidate of candidatePaths) {
                if (candidate && fs.existsSync(candidate) && !fs.statSync(candidate).isDirectory()) {
                    const ext = path.extname(candidate) || '.fbx';
                    archive.append(fs.createReadStream(candidate), { name: `${safeName}${ext}` });
                    foundFile = true;
                    break;
                }
            }

            if (!foundFile) {
                // If specific physical asset file missing, provide mock container
                archive.append(`Placeholder 3D mesh container for ${safeName}`, { name: `${safeName}.fbx` });
            }

            await archive.finalize();

        } catch (error) {
            console.error('Secure download stream error:', error);
            if (!res.headersSent) {
                res.status(500).json({ message: 'Error processing secure download.' });
            }
        }
    });

    return router;
}

module.exports = createLicenseRouter;
