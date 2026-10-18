const nodemailer = require('nodemailer');

/**
 * Configure Nodemailer transporter based on .env variables
 */
const getTransporter = () => {
    const user = process.env.EMAIL_USER || process.env.SMTP_USER;
    const rawPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
    const pass = rawPass ? rawPass.trim().replace(/\s+/g, '') : '';
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    if (!user || !pass) {
        return null; // Simulation mode
    }

    if (host) {
        return nodemailer.createTransport({
            host,
            port,
            secure,
            auth: { user, pass }
        });
    }

    // Default to Gmail if host not specified
    return nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass }
    });
};

/**
 * Generate responsive HTML email for order approval with Google Drive / OneDrive links
 */
const buildOrderEmailHtml = (order, customNote = '') => {
    const orderIdDisplay = order._id ? order._id.toString().slice(-8).toUpperCase() : 'N/A';
    const items = order.items || [];
    const fromName = process.env.EMAIL_FROM_NAME || 'SVRP Rail Works';
    const siteUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

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
                        <div style="font-size: 12px; font-weight: 700; color: #330068; margin-bottom: 8px; display: flex; align-items: center;">
                            ☁️ <span>Google Drive / OneDrive Cloud Access Link:</span>
                        </div>
                        <div style="margin: 12px 0 10px 0;">
                            <a href="${driveUrl}" target="_blank" style="display: inline-block; background-color: #330068; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 24px; border-radius: 8px; box-shadow: 0 4px 12px rgba(51, 0, 104, 0.25);">
                                📥 Access & Download 3D Model Files &rarr;
                            </a>
                        </div>
                        <div style="font-size: 11px; color: #6b558f; word-break: break-all; margin-top: 8px;">
                            Direct URL: <a href="${driveUrl}" target="_blank" style="color: #330068; text-decoration: underline;">${driveUrl}</a>
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
    text += `Thank you for your purchase from SVRP Rail Works!\n`;
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
        : `SVRP Rail Works <${process.env.EMAIL_USER || 'orders@svrp.com'}>`;

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

module.exports = {
    sendOrderApprovedEmail,
    buildOrderEmailHtml,
    buildOrderEmailText
};
