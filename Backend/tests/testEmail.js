
/**
 * Safe Backend SMTP Email Verification Test Script
 * 
 * Tests the Gmail SMTP integration without exposing credentials:
 * 1. Loads actual backend .env file.
 * 2. Validates required SMTP variables without printing secrets.
 * 3. Verifies connection with Gmail SMTP server on port 587 (STARTTLS).
 * 4. Sends a verification test email strictly to TEST_EMAIL_TO (never to customers).
 * 5. Reports server acceptance (messageId, response, accepted recipients).
 * 6. Displays actionable errors if connection or authentication fails.
 */

const path = require('path');
const dotenv = require('dotenv');

// 1. Explicitly load backend .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const emailService = require('../emailService');

function maskEmail(email) {
    if (!email || typeof email !== 'string') return 'Not Set';
    const parts = email.split('@');
    if (parts.length !== 2) return 'Invalid Email Format';
    const user = parts[0];
    const domain = parts[1];
    const maskedUser = user.length <= 2
        ? user[0] + '*'
        : user[0] + '*'.repeat(user.length - 2) + user[user.length - 1];
    return `${maskedUser}@${domain}`;
}

async function runEmailTest() {
    console.log('================================================================');
    console.log('📧 Backend Gmail SMTP Integration Test');
    console.log('================================================================\n');

    // 2. Validate configuration presence
    console.log('Step 1: Inspecting SMTP Environment Variables...');
    const validation = emailService.validateSmtpConfig();

    const user = (process.env.SMTP_USER || process.env.EMAIL_USER || '').trim();
    const rawPass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || '').trim();
    const cleanPass = rawPass.replace(/\s+/g, '');
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = process.env.SMTP_PORT || '587';
    const secure = process.env.SMTP_SECURE || 'false';
    const testRecipient = (process.env.TEST_EMAIL_TO || user).trim();

    console.log(`  • SMTP_HOST    : ${host ? `Configured [${host}]` : '❌ Missing'}`);
    console.log(`  • SMTP_PORT    : ${port ? `Configured [${port}]` : '❌ Missing'}`);
    console.log(`  • SMTP_SECURE  : Configured [${secure}] (STARTTLS: ${port === '587' ? 'Enabled' : 'Disabled'})`);
    console.log(`  • SMTP_USER    : ${user ? `Configured [${maskEmail(user)}]` : '❌ Missing'}`);
    console.log(`  • SMTP_PASS    : ${cleanPass ? `Configured [${cleanPass.length} chars, masked: ****]` : '❌ Missing'}`);
    console.log(`  • TEST_EMAIL_TO: ${testRecipient ? `Configured [${maskEmail(testRecipient)}]` : '❌ Missing'}`);

    if (!validation.isValid) {
        console.error('\n❌ FAIL: Missing required environment variables:');
        validation.missing.forEach(v => console.error(`   - ${v}`));
        console.error('\nPlease update your Backend/.env file with the missing variables.\n');
        process.exit(1);
    }

    if (!testRecipient) {
        console.error('\n❌ FAIL: TEST_EMAIL_TO is not configured in Backend/.env.');
        console.error('Please add: TEST_EMAIL_TO=your-test-email@gmail.com\n');
        process.exit(1);
    }

    console.log('\nStep 2: Testing SMTP Handshake and Authentication...');
    const verifyResult = await emailService.verifySmtpConnection();

    if (!verifyResult.success) {
        console.error('\n❌ FAIL: SMTP Handshake / Authentication Failed');
        console.error(`  Error Code   : ${verifyResult.code || 'UNKNOWN'}`);
        console.error(`  Error Message: ${verifyResult.error}`);
        console.error(`  Guidance     : ${verifyResult.actionable}\n`);
        process.exit(1);
    }

    console.log(`  ✅ ${verifyResult.message}`);

    console.log(`\nStep 3: Sending Test Message to ${maskEmail(testRecipient)}...`);
    const sendResult = await emailService.sendTestEmail({ to: testRecipient });

    if (!sendResult.success) {
        console.error('\n❌ FAIL: SMTP Server Rejected Message');
        console.error(`  Error Code   : ${sendResult.code || 'UNKNOWN'}`);
        console.error(`  Error Message: ${sendResult.error}`);
        console.error(`  Guidance     : ${sendResult.actionable}\n`);
        process.exit(1);
    }

    console.log('\n================================================================');
    console.log('🎉 SMTP Test Passed: Message Successfully Accepted by Gmail!');
    console.log('================================================================');
    console.log(`  • Status          : 250 OK - Accepted`);
    console.log(`  • Message ID      : ${sendResult.messageId}`);
    console.log(`  • Accepted By     : ${JSON.stringify(sendResult.accepted)}`);
    console.log(`  • Server Response : ${sendResult.response}`);
    console.log(`  • Target Recipient: ${maskEmail(sendResult.recipient)}`);
    console.log('================================================================\n');

    process.exit(0);
}

runEmailTest().catch(err => {
    console.error('\n❌ Unexpected error running SMTP test:', err.message);
    process.exit(1);
});
