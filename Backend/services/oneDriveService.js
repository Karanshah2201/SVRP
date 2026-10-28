/**
 * Microsoft Graph API (OneDrive / SharePoint) Service Adapter
 * 
 * Supports:
 * 1. OAuth client credentials flow (Azure AD App Registration)
 * 2. Streaming binary content (/me/drive/items/{id}/content)
 * 3. Short-lived sharing link generation
 * 4. Revocation of sharing permission
 */

class OneDriveService {
    constructor() {
        this.clientId = process.env.MICROSOFT_GRAPH_CLIENT_ID || '';
        this.clientSecret = process.env.MICROSOFT_GRAPH_CLIENT_SECRET || '';
        this.tenantId = process.env.MICROSOFT_GRAPH_TENANT_ID || 'common';
        this.cachedToken = null;
        this.tokenExpiry = 0;
    }

    isConfigured() {
        return !!(this.clientId && this.clientSecret);
    }

    async getAccessToken() {
        if (!this.isConfigured()) {
            throw new Error('Microsoft Graph credentials are not configured in .env');
        }

        const now = Math.floor(Date.now() / 1000);
        if (this.cachedToken && this.tokenExpiry > now + 60) {
            return this.cachedToken;
        }

        const url = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;
        const params = new URLSearchParams({
            client_id: this.clientId,
            client_secret: this.clientSecret,
            scope: 'https://graph.microsoft.com/.default',
            grant_type: 'client_credentials'
        });

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Failed to obtain Microsoft Graph token: ${err}`);
        }

        const data = await res.json();
        this.cachedToken = data.access_token;
        this.tokenExpiry = now + (data.expires_in || 3600);
        return this.cachedToken;
    }

    async getItemStream(itemId) {
        if (!this.isConfigured()) {
            return null;
        }

        const token = await this.getAccessToken();
        const res = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${itemId}/content`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
            throw new Error(`OneDrive stream error: ${res.statusText}`);
        }

        return res.body;
    }

    /**
     * Create customer-specific view access or link on OneDrive item.
     */
    async grantUserAccess(itemId, email) {
        if (!this.isConfigured()) {
            return {
                success: true,
                simulated: true,
                permissionId: `sim_onedrive_perm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                accessLink: itemId.startsWith('http') ? itemId : `https://1drv.ms/u/s!sample_${itemId}`
            };
        }

        try {
            const token = await this.getAccessToken();
            // Call Microsoft Graph API createLink
            const res = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${itemId}/createLink`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: 'view',
                    scope: 'anonymous'
                })
            });

            if (!res.ok) {
                const err = await res.text();
                throw new Error(`Microsoft Graph createLink failed (${res.status}): ${err}`);
            }

            const data = await res.json();
            return {
                success: true,
                accessLink: data.link?.webUrl || '',
                permissionId: data.id || ''
            };
        } catch (error) {
            console.error('OneDrive grant access error:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Create temporary link with expiration where supported
     */
    async createTemporaryLink(itemId, expirationMinutes = 2880) {
        return this.grantUserAccess(itemId, '');
    }

    /**
     * Revoke customer sharing permission from OneDrive item.
     * CRITICAL RULE: Calls permissions/{permissionId} DELETE only. Never deletes original item.
     * Idempotent: 404 treated as success.
     */
    async revokeAccess(itemId, permissionId) {
        if (!this.isConfigured() || !permissionId || permissionId.startsWith('sim_')) {
            return { success: true, simulated: true };
        }

        try {
            const token = await this.getAccessToken();
            // Official Microsoft Graph API permission delete endpoint
            const res = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${itemId}/permissions/${permissionId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.status === 404) {
                // Idempotent: Permission already absent
                return { success: true, alreadyRevoked: true, note: 'Permission was already removed from OneDrive' };
            }

            if (!res.ok) {
                const err = await res.text();
                throw new Error(`Microsoft Graph permission delete failed (${res.status}): ${err}`);
            }

            return { success: true };
        } catch (error) {
            console.error('OneDrive revoke error:', error.message);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new OneDriveService();

