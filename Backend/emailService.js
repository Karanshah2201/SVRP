const nodemailer = require('nodemailer');

/**
 * Validates that all required SMTP configuration variables are present
 * Returns structured validation object without exposing secrets
 */
const validateSmtpConfig = () => {
    const user = (process.env.SMTP_USER || process.env.EMAIL_USER || '').trim();
    const rawPass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || '').trim();
    const host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;
    const from = process.env.EMAIL_FROM || (user ? `Your 3D Model Store <${user}>` : '');

    const missing = [];
    if (!user) missing.push('SMTP_USER (or EMAIL_USER)');
    if (!rawPass) missing.push('SMTP_PASS (or EMAIL_PASS)');
    if (!host) missing.push('SMTP_HOST');
    if (!port || isNaN(port)) missing.push('SMTP_PORT');

    return {
        isValid: missing.length === 0,
        missing,
        config: {
            host,
            port,
            secure,
            userConfigured: Boolean(user),
            passConfigured: Boolean(rawPass),
            from
        }
    };
};

/**
 * Configure Nodemailer transporter based on .env variables
 * Configures Gmail SMTP with port 587, secure: false, and STARTTLS
 */
const getTransporter = () => {
    const user = (process.env.SMTP_USER || process.env.EMAIL_USER || '').trim();
    const rawPass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || '').trim();
    const pass = rawPass.replace(/\s+/g, ''); // Remove spaces from 16-char Google App Password
    const host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const secure = process.env.SMTP_SECURE === 'true';

    if (!user || !pass) {
        return null; // Simulation mode
    }

    return nodemailer.createTransport({
        host,
        port,
        secure, // false for port 587 (uses STARTTLS)
        requireTLS: port === 587,
        auth: {
            user,
            pass
        },
        tls: {
            rejectUnauthorized: true,
            minVersion: 'TLSv1.2'
        }
    });
};

/**
 * Verify SMTP connection and credentials
 * Returns actionable error explanations without exposing credentials
 */
const verifySmtpConnection = async () => {
    const validation = validateSmtpConfig();
    if (!validation.isValid) {
        return {
            success: false,
            error: `Missing required SMTP configuration variables: ${validation.missing.join(', ')}`,
            actionable: 'Please configure SMTP_USER, SMTP_PASS, SMTP_HOST, and SMTP_PORT in your .env file.'
        };
    }

    const transporter = getTransporter();
    if (!transporter) {
        return {
            success: false,
            error: 'Transporter could not be created from current environment settings.',
            actionable: 'Ensure SMTP_USER and SMTP_PASS are set in .env.'
        };
    }

    try {
        await transporter.verify();
        return {
            success: true,
            message: `SMTP connection established and verified successfully with ${validation.config.host}:${validation.config.port}`
        };
    } catch (err) {
        let actionable = 'Check your SMTP settings in .env.';
        if (err.code === 'EAUTH' || (err.response && err.response.includes('535'))) {
            actionable = 'Authentication failed. If using Gmail, verify you are using a 16-character App Password (not your normal Gmail password), and that 2-Step Verification is enabled on your Google account.';
        } else if (err.code === 'ESOCKET' || err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
            actionable = `Failed to connect to ${validation.config.host}:${validation.config.port}. Check if your network or firewall allows outbound TCP traffic on port ${validation.config.port}.`;
        }

        return {
            success: false,
            error: err.message,
            code: err.code,
            actionable
        };
    }
};

/**
 * Generate responsive HTML email for order approval with Google Drive / OneDrive links
 */
const buildOrderEmailHtml = (order, customNote = '') => {
    const orderIdDisplay = order._id ? order._id.toString().slice(-8).toUpperCase() : 'N/A';
    const items = order.items || [];
    const fromName = process.env.EMAIL_FROM_NAME || 'Shri Vishwakarma Rail Production';
    const siteUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const expiryTime = new Date((order.createdAt ? new Date(order.createdAt).getTime() : Date.now()) + 48 * 60 * 60 * 1000);
    const formattedExpiry = expiryTime.toUTCString();

    const itemsHtml = items.map((item, idx) => {
        const driveUrl = item.driveUrl || '';
        const hasDriveLink = Boolean(driveUrl && driveUrl.trim());

        return `
            <div style="background-color: #ffffff; border: 1px solid #e2d9f3; border-radius: 12px; padding: 20px; margin-bottom: 16px; box-shadow: 0 2px 6px rgba(17, 0, 36, 0.04);">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="vertical-align: top;">
                            <div style="font-size: 11px; font-weight: 700; color: #6b558f; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Item #${idx + 1} • Digital Asset</div>
                            <div style="font-size: 18px; font-weight: 800; color: #110024; margin-bottom: 6px;">${item.name || '3D Model Asset'}</div>
                            <div style="font-size: 13px; color: #4a3b69; margin-bottom: 12px;">Quantity: <strong>${item.quantity || 1}</strong> &nbsp;|&nbsp; Price: <strong>${item.price || 'Included'}</strong></div>
                        </td>
                    </tr>
                </table>

                ${hasDriveLink ? `
                    <div style="background: linear-gradient(135deg, #f8f6fc 0%, #efeaf7 100%); border: 1px solid #d7cde8; border-radius: 10px; padding: 16px; margin-top: 10px;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                            <span style="font-size: 12px; font-weight: 800; color: #330068; text-transform: uppercase; letter-spacing: 0.05em;">
                                ⏱️ 48-Hour Cloud Access Link
                            </span>
                        </div>
                        <p style="font-size: 12px; color: #4a3b69; margin: 0 0 12px 0; line-height: 1.5;">
                            Access is active for <strong>exactly 48 hours</strong> and will be automatically revoked on:<br/>
                            <strong style="color: #b45309; font-family: monospace;">${formattedExpiry}</strong>.<br/>
                            <em>Please download and save all 3D model files to your local drive immediately.</em>
                        </p>
                        <div style="margin: 12px 0 10px 0;">
                            <a href="${(process.env.FRONTEND_URL || 'http://localhost:5173')}/orders" target="_blank" style="display: inline-block; background-color: #330068; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 24px; border-radius: 8px; box-shadow: 0 4px 12px rgba(51, 0, 104, 0.25);">
                                📥 Access & Download 3D Files &rarr;
                            </a>
                        </div>
                        <div style="font-size: 11px; color: #6b558f; margin-top: 8px;">
                            Secure Portal: <a href="${(process.env.FRONTEND_URL || 'http://localhost:5173')}/orders" target="_blank" style="color: #330068; text-decoration: underline;">Open My Orders Dashboard</a>
                        </div>
                    </div>
                ` : `
                    <div style="background-color: #fdfaf3; border: 1px solid #f6e6be; border-radius: 8px; padding: 12px; margin-top: 10px; font-size: 12px; color: #8a6514;">
                        ℹ️ This item will be accessible in your account dashboard. For custom asset files, our team will provide the link shortly.
                    </div>
                `}
            </div>
        `;
    }).join('');

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your 3D Model Access Links</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f0f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #110024; -webkit-font-smoothing: antialiased;">
        <table style="width: 100%; border-collapse: collapse; background-color: #f3f0f7; padding: 30px 10px;">
            <tr>
                <td align="center">
                    <!-- Email Container -->
                    <table style="width: 100%; max-width: 640px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(17, 0, 36, 0.08); margin: 20px 0;">
                        <!-- Header Banner -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #110024 0%, #330068 100%); padding: 36px 32px; text-align: left; color: #ffffff;">
                                <div style="font-size: 12px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; color: #c4b0ea; margin-bottom: 8px;">
                                    ${fromName} • DIGITAL ASSET DELIVERY
                                </div>
                                <h1 style="margin: 0; font-size: 26px; font-weight: 800; line-height: 1.2; color: #ffffff;">
                                    Payment Verified!
                                </h1>
                                <p style="margin: 8px 0 0 0; font-size: 14px; color: #d7cde8;">
                                    Your 3D model files are now available for download.
                                </p>
                            </td>
                        </tr>

                        <!-- Order Summary Pill -->
                        <tr>
                            <td style="padding: 24px 32px 10px 32px; background-color: #ffffff;">
                                <table style="width: 100%; border-collapse: collapse; background-color: #f8f6fc; border: 1px solid #e9e2f5; border-radius: 12px; padding: 16px;">
                                    <tr>
                                        <td style="padding: 12px 16px;">
                                            <span style="font-size: 11px; font-weight: 700; color: #6b558f; text-transform: uppercase;">Order ID</span><br>
                                            <strong style="font-size: 15px; color: #110024; font-family: monospace;">#${orderIdDisplay}</strong>
                                        </td>
                                        <td style="padding: 12px 16px;">
                                            <span style="font-size: 11px; font-weight: 700; color: #6b558f; text-transform: uppercase;">Status</span><br>
                                            <span style="display: inline-block; background-color: #10b981; color: #ffffff; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 999px;">VERIFIED & APPROVED</span>
                                        </td>
                                        <td style="padding: 12px 16px; text-align: right;">
                                            <span style="font-size: 11px; font-weight: 700; color: #6b558f; text-transform: uppercase;">Total Paid</span><br>
                                            <strong style="font-size: 16px; color: #330068;">₹${order.totalAmount || 0}</strong>
                                        </td>
                                    </tr>
                                    ${order.transactionId ? `
                                    <tr>
                                        <td colspan="3" style="padding: 8px 16px 12px 16px; border-top: 1px solid #e9e2f5; font-size: 11px; color: #6b558f;">
                                            Transaction Reference / UTR: <strong style="font-family: monospace; color: #110024;">${order.transactionId}</strong>
                                        </td>
                                    </tr>
                                    ` : ''}
                                </table>
                            </td>
                        </tr>

                        <!-- Custom Note if any -->
                        ${customNote ? `
                        <tr>
                            <td style="padding: 10px 32px 0 32px;">
                                <div style="background-color: #efeaf7; border-left: 4px solid #330068; padding: 12px 16px; border-radius: 6px; font-size: 13px; color: #330068;">
                                    <strong>Admin Note:</strong> ${customNote}
                                </div>
                            </td>
                        </tr>
                        ` : ''}

                        <!-- Main Content (Items & Download links) -->
                        <tr>
                            <td style="padding: 20px 32px 10px 32px;">
                                <h2 style="font-size: 16px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #110024; margin: 0 0 16px 0;">
                                    📦 Your 3D Model Download Links:
                                </h2>
                                ${itemsHtml}
                            </td>
                        </tr>

                        <!-- Instructions & Notice -->
                        <tr>
                            <td style="padding: 10px 32px 24px 32px;">
                                <div style="background-color: #fbfaff; border: 1px dashed #d7cde8; border-radius: 12px; padding: 18px;">
                                    <div style="font-size: 13px; font-weight: 700; color: #110024; margin-bottom: 6px;">💡 How to access and use your 3D assets:</div>
                                    <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #4a3b69; line-height: 1.6;">
                                        <li>Click the Google Drive / OneDrive button above to open the model files.</li>
                                        <li>Download the package (.zip, .fbx, .obj, .blend, textures) to your local workstation.</li>
                                        <li>If you need access from a specific Google/Microsoft account, please reply to this email with your preferred email address.</li>
                                        <li>You can also view this order anytime in your <a href="${siteUrl}/orders" target="_blank" style="color: #330068; font-weight: 700; text-decoration: underline;">Order History</a> on our website.</li>
                                    </ul>
                                </div>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f8f6fc; padding: 24px 32px; text-align: center; border-top: 1px solid #e9e2f5;">
                                <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: #110024;">
                                    ${fromName}
                                </p>
                                <p style="margin: 0; font-size: 11px; color: #9071b8;">
                                    Thank you for your business. For support, reply to this email or visit our website.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;
};

/**
 * Plain text fallback version of order email
 */
const buildOrderEmailText = (order, customNote = '') => {
    const orderIdDisplay = order._id ? order._id.toString().slice(-8).toUpperCase() : 'N/A';
    const items = order.items || [];
    let text = `PAYMENT VERIFIED - 3D MODEL ASSET DELIVERY\n`;
    text += `==========================================\n\n`;
    text += `Order ID: #${orderIdDisplay}\n`;
    text += `Customer Email: ${order.email}\n`;
    text += `Total Paid: ₹${order.totalAmount || 0}\n`;
    if (order.transactionId) text += `Transaction Reference: ${order.transactionId}\n`;
    if (customNote) text += `Admin Note: ${customNote}\n`;
    text += `\nPRODUCTS & CLOUD DOWNLOAD LINKS:\n`;
    text += `--------------------------------\n`;

    items.forEach((item, idx) => {
        text += `\n${idx + 1}. ${item.name} (Qty: ${item.quantity || 1})\n`;
        if (item.driveUrl) {
            text += `   Google Drive / OneDrive Link: ${item.driveUrl}\n`;
        } else {
            text += `   Link: Check your order dashboard on the website.\n`;
        }
    });

    text += `\n\nInstructions: Open the link(s) above to download the 3D files (.fbx, .obj, .blend, textures).\n`;
    text += `Thank you for your purchase from Shri Vishwakarma Rail Production!\n`;
    return text;
};

/**
 * Send order approval email with download links to customer
 * Returns: { success: boolean, simulated: boolean, message: string }
 */
const sendOrderApprovedEmail = async (order, customNote = '') => {
    if (!order || !order.email) {
        return { success: false, message: 'Customer email is missing' };
    }

    const transporter = getTransporter();
    const orderIdDisplay = order._id ? order._id.toString().slice(-8).toUpperCase() : 'N/A';
    const subject = `Your 3D Model Download Links - Order #${orderIdDisplay} Verified`;
    const fromAddress = (process.env.EMAIL_FROM && process.env.EMAIL_FROM.trim())
        ? process.env.EMAIL_FROM
        : `Shri Vishwakarma Rail Production <${process.env.EMAIL_USER || 'orders@svrp.com'}>`;

    const htmlContent = buildOrderEmailHtml(order, customNote);
    const textContent = buildOrderEmailText(order, customNote);

    // Simulation mode if credentials not provided
    if (!transporter) {
        console.log('\n================================================================');
        console.log(' [EMAIL SIMULATION] Live SMTP credentials not configured in .env');
        console.log(` To: ${order.email}`);
        console.log(` Subject: ${subject}`);
        console.log(' Products & Drive Links:');
        (order.items || []).forEach((item, i) => {
            console.log(`   ${i + 1}. ${item.name} -> Drive URL: ${item.driveUrl || '(No Drive link set)'}`);
        });
        console.log('================================================================\n');

        return {
            success: true,
            simulated: true,
            message: 'Email simulated to console (Configure SMTP in .env for live customer email delivery)'
        };
    }

    try {
        const info = await transporter.sendMail({
            from: fromAddress,
            to: order.email,
            subject,
            text: textContent,
            html: htmlContent
        });

        console.log(`[EMAIL SENT] Order #${orderIdDisplay} download links sent to ${order.email} (MessageId: ${info.messageId})`);
        return {
            success: true,
            simulated: false,
            message: `Email sent to ${order.email}`,
            messageId: info.messageId
        };
    } catch (error) {
        console.error(`[EMAIL ERROR] Failed to send email for order #${orderIdDisplay}:`, error.message);
        return {
            success: false,
            simulated: false,
            error: error.message,
            message: `Failed to send email: ${error.message}`
        };
    }
};

/**
 * Sends a test email to the configured TEST_EMAIL_TO address
 * Verifies that SMTP credentials and connection are functional
 */
const sendTestEmail = async (options = {}) => {
    const user = (process.env.SMTP_USER || process.env.EMAIL_USER || '').trim();
    const recipient = options.to || process.env.TEST_EMAIL_TO || user;

    if (!recipient) {
        return {
            success: false,
            error: 'No test recipient specified. Set TEST_EMAIL_TO in .env or provide a recipient.',
            actionable: 'Add TEST_EMAIL_TO=your-email@gmail.com in your .env file.'
        };
    }

    const verification = await verifySmtpConnection();
    if (!verification.success) {
        return {
            success: false,
            error: `SMTP Verification failed: ${verification.error}`,
            actionable: verification.actionable
        };
    }

    const transporter = getTransporter();
    const fromAddress = (process.env.EMAIL_FROM && process.env.EMAIL_FROM.trim())
        ? process.env.EMAIL_FROM
        : (user ? `Your 3D Model Store <${user}>` : 'Your 3D Model Store <orders@example.com>');

    const timestamp = new Date().toISOString();
    const subject = options.subject || `[Test] 3D Model Store Gmail SMTP Verification (${new Date().toLocaleTimeString('en-US')})`;

    const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="border-bottom: 2px solid #6366f1; padding-bottom: 12px; margin-bottom: 20px;">
                <h2 style="color: #0f172a; margin: 0; font-size: 20px;">📧 SMTP Test Email Verification</h2>
                <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">3D Model E-Commerce Platform</p>
            </div>
            <p style="color: #334155; font-size: 14px; line-height: 1.6;">
                This is a confirmation test email sent from your 3D model store backend using <strong>Nodemailer</strong> and <strong>Gmail SMTP (port 587 STARTTLS)</strong>.
            </p>
            <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 13px; font-family: monospace;">
                <div><strong>Status:</strong> <span style="color: #16a34a; font-weight: bold;">CONNECTED & ACCEPTED</span></div>
                <div style="margin-top: 6px;"><strong>Host:</strong> ${process.env.SMTP_HOST || 'smtp.gmail.com'}</div>
                <div style="margin-top: 6px;"><strong>Port:</strong> ${process.env.SMTP_PORT || '587'} (secure: false / STARTTLS)</div>
                <div style="margin-top: 6px;"><strong>Sender:</strong> ${fromAddress}</div>
                <div style="margin-top: 6px;"><strong>Recipient:</strong> ${recipient}</div>
                <div style="margin-top: 6px;"><strong>Timestamp:</strong> ${timestamp}</div>
            </div>
            <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 12px;">
                If you received this email, your Gmail SMTP App Password and server configuration are working correctly. Customer order download links will be delivered reliably.
            </p>
        </div>
    `;

    const textContent = `SMTP TEST EMAIL VERIFICATION\n`
        + `============================\n\n`
        + `This is a test email sent from your 3D model selling website.\n\n`
        + `Status: CONNECTED & ACCEPTED\n`
        + `Host: ${process.env.SMTP_HOST || 'smtp.gmail.com'}\n`
        + `Port: ${process.env.SMTP_PORT || '587'}\n`
        + `Sender: ${fromAddress}\n`
        + `Recipient: ${recipient}\n`
        + `Timestamp: ${timestamp}\n\n`
        + `Your Gmail SMTP configuration is working correctly.`;

    try {
        const info = await transporter.sendMail({
            from: fromAddress,
            to: recipient,
            subject,
            text: textContent,
            html: htmlContent
        });

        const maskedRecipient = recipient.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(Math.max(1, b.length)) + c);
        console.log(`[EMAIL TEST] Message accepted by SMTP server for ${maskedRecipient} (MessageId: ${info.messageId})`);

        return {
            success: true,
            messageId: info.messageId,
            accepted: info.accepted,
            rejected: info.rejected,
            response: info.response,
            recipient
        };
    } catch (err) {
        console.error(`[EMAIL TEST ERROR] Failed to send test message:`, err.message);
        return {
            success: false,
            error: err.message,
            code: err.code,
            actionable: 'Verify that TEST_EMAIL_TO is a valid email address and that your SMTP credentials permit sending to this recipient.'
        };
    }
};

module.exports = {
    sendOrderApprovedEmail,
    sendTestEmail,
    verifySmtpConnection,
    validateSmtpConfig,
    getTransporter,
    buildOrderEmailHtml,
    buildOrderEmailText
};
