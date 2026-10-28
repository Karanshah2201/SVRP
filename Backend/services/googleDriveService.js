/**
 * Google Drive API v3 Service Adapter
 * 
 * Secure server-to-server integration using Google Service Account credentials.
 * Implements:
 * 1. Stream-based downloading (alt=media) so client never sees Google Drive raw links
 * 2. Idempotent permission grant (drive.permissions.create)
 * 3. Idempotent permission revocation (drive.permissions.delete)
 * 4. Graceful fallback when credentials are not configured in .env
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class GoogleDriveService {
    constructor() {
        this.clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL || '';
        this.privateKey = (process.env.GOOGLE_DRIVE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
        this.folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || '';
        this.cachedToken = null;
        this.tokenExpiry = 0;
    }

    isConfigured() {
        return !!(this.clientEmail && this.privateKey);
    }

    /**
     * Generates a signed OAuth2 JWT for Google APIs (Service Account flow)
     */
    async getAccessToken() {
        if (!this.isConfigured()) {
            throw new Error('Google Drive service account credentials are not configured in .env');
        }

        const now = Math.floor(Date.now() / 1000);
        if (this.cachedToken && this.tokenExpiry > now + 60) {
            return this.cachedToken;
        }

        const header = {
            alg: 'RS256',
            typ: 'JWT'
        };

        const claim = {
            iss: this.clientEmail,
            scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file',
            aud: 'https://oauth2.googleapis.com/token',
            exp: now + 3600,
            iat: now
        };

        const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
        const encodedClaim = Buffer.from(JSON.stringify(claim)).toString('base64url');
        const signInput = `${encodedHeader}.${encodedClaim}`;

        const signer = crypto.createSign('RSA-SHA256');
        signer.update(signInput);
        const signature = signer.sign(this.privateKey, 'base64url');
        const assertion = `${signInput}.${signature}`;

        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                assertion: assertion
            })
        });

        if (!tokenResponse.ok) {
            const errBody = await tokenResponse.text();
            throw new Error(`Failed to obtain Google OAuth access token: ${errBody}`);
        }

        const data = await tokenResponse.json();
        this.cachedToken = data.access_token;
        this.tokenExpiry = now + (data.expires_in || 3600);
        return this.cachedToken;
    }

    /**
     * Fetches file metadata (name, size, mimeType)
     */
    async getFileMetadata(fileId) {
        if (!this.isConfigured()) {
            return {
                id: fileId,
                name: 'model_archive.zip',
                size: 45000000,
                mimeType: 'application/zip',
                simulated: true
            };
        }

        const token = await this.getAccessToken();
        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,size,mimeType`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
            throw new Error(`Google Drive API error: ${res.statusText}`);
        }

        return await res.json();
    }

    /**
     * Opens a readable binary stream for a Drive fileId
     */
    async getFileStream(fileId) {
        if (!this.isConfigured()) {
            return null; // Will fallback to local repository
        }

        const token = await this.getAccessToken();
        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
            throw new Error(`Failed to stream file from Google Drive: ${res.statusText}`);
        }

        return res.body;
    }

    /**
     * Grant read permission to a specific customer Google account.
     * Idempotent & non-destructive: only adds a reader permission to the existing file/folder.
     */
    async grantUserAccess(fileId, email, expiresAt = null) {
        if (!this.isConfigured()) {
            return {
                success: true,
                simulated: true,
                permissionId: `sim_gdrive_perm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                accessLink: fileId.startsWith('http') ? fileId : `https://drive.google.com/drive/folders/${fileId}`
            };
        }

        try {
            const token = await this.getAccessToken();
            const bodyPayload = {
                role: 'reader',
                type: 'user',
                emailAddress: email
            };

            // Support native Google Workspace expirationTime (RFC 3339 formatted timestamp)
            if (expiresAt) {
                bodyPayload.expirationTime = new Date(expiresAt).toISOString();
            }

            let res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions?sendNotificationEmail=false`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bodyPayload)
            });

            // Fallback for personal @gmail.com accounts if expirationTime is rejected by Google
            if (!res.ok && bodyPayload.expirationTime) {
                const errText = await res.text();
                if (errText.includes('expirationTime') || errText.includes('account type') || res.status === 400) {
                    console.warn('[GoogleDriveService] Native expirationTime not supported on this Google account. Falling back to backend scheduler.');
                    delete bodyPayload.expirationTime;
                    res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions?sendNotificationEmail=false`, {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(bodyPayload)
                    });
                } else {
                    throw new Error(`Google Drive API permission grant failed (${res.status}): ${errText}`);
                }
            }

            if (!res.ok) {
                const err = await res.text();
                throw new Error(`Google Drive API permission grant failed (${res.status}): ${err}`);
            }

            const data = await res.json();
            const accessLink = `https://drive.google.com/drive/folders/${fileId}`;

            return {
                success: true,
                permissionId: data.id,
                accessLink,
                nativeExpiration: !!data.expirationTime
            };
        } catch (error) {
            console.error('Google Drive grant error:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Revoke read permission for a customer.
     * CRITICAL RULE: Calls permissions.delete ONLY. Never deletes or alters the underlying file/folder.
     * Idempotent: HTTP 404 means the permission is already absent, which is treated as success.
     */
    async revokeUserAccess(fileId, permissionId) {
        if (!this.isConfigured() || !permissionId || permissionId.startsWith('sim_')) {
            return { success: true, simulated: true };
        }

        try {
            const token = await this.getAccessToken();
            // Official Google Drive API permission delete endpoint
            const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions/${permissionId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.status === 404) {
                // Idempotent: Permission already deleted
                return { success: true, alreadyRevoked: true, note: 'Permission was already removed from Google Drive' };
            }

            if (!res.ok) {
                const err = await res.text();
                throw new Error(`Google Drive API permission deletion failed (${res.status}): ${err}`);
            }

            return { success: true };
        } catch (error) {
            console.error('Google Drive revoke error:', error.message);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new GoogleDriveService();
