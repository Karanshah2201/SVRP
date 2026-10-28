/**
 * Payment & Checkout Routes (Razorpay + Test Mode)
 */

const express = require('express');
const crypto = require('crypto');
const { sendOrderApprovedEmail } = require('../emailService');
const licenseService = require('../services/licenseService');
const accessGrantService = require('../services/accessGrantService');

function createPaymentRouter(models, authenticateToken) {
    const router = express.Router();
    const { Order, Product, Cart, License, AuditLog, User, AccessGrant } = models;

    const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
    const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';

    const isRazorpayConfigured = !!(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);

    // ==========================================
    // 1. Create Razorpay Order
    // ==========================================
    router.post('/create-razorpay-order', authenticateToken, async (req, res) => {
        try {
            const { items, email, mobile, termsAccepted } = req.body;

            if (!termsAccepted) {
                return res.status(400).json({ message: 'You must accept the License Terms and Limitations before proceeding.' });
            }

            if (!email) {
                return res.status(400).json({ message: 'Valid email address is required.' });
            }

            if (!items || items.length === 0) {
                return res.status(400).json({ message: 'Cart cannot be empty.' });
            }

            // Calculate total server-side to prevent client price tampering
            const productIds = items.map(i => i.productId);
            const products = await Product.find({ id: { $in: productIds } });

            let totalRupees = 0;
            const orderItems = items.map(item => {
                const product = products.find(p => p.id === item.productId);
                const priceNum = parseFloat(String(product?.price || '0').replace(/[^0-9.]/g, '')) || 0;
                totalRupees += priceNum * (item.quantity || 1);

                return {
                    productId: item.productId,
                    name: product?.name || item.name,
                    price: product?.price,
                    quantity: item.quantity || 1,
                    image: product?.image || item.image,
                    downloadUrl: product?.mediaUrl || '',
                    driveUrl: product?.driveUrl || '',
                    fileFormats: product?.fileFormats || ['.blend', '.fbx', '.obj', '.glb'],
                    fileSize: product?.fileSize || '45 MB'
                };
            });

            const amountInPaise = Math.round(totalRupees * 100);

            let razorpayOrderId = '';
            if (isRazorpayConfigured) {
                // Call official Razorpay Orders API
                const authHeader = 'Basic ' + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
                const razorpayRes = await fetch('https://api.razorpay.com/v1/orders', {
                    method: 'POST',
                    headers: {
                        'Authorization': authHeader,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        amount: amountInPaise,
                        currency: 'INR',
                        receipt: `rcpt_${Date.now().toString().slice(-8)}`,
                        payment_capture: 1,
                        notes: {
                            customerEmail: email,
                            userId: req.user.id
                        }
                    })
                });

                if (!razorpayRes.ok) {
                    const errText = await razorpayRes.text();
                    console.error('Razorpay Order Creation Error:', errText);
                    return res.status(502).json({ message: 'Payment gateway rejected order creation. Please try again.' });
                }

                const rzpData = await razorpayRes.json();
                razorpayOrderId = rzpData.id;
            } else {
                // Simulated Razorpay Order ID for sandbox evaluation
                razorpayOrderId = `order_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            }

            // Create Pending Order record in DB
            const order = new Order({
                userId: req.user.id,
                email,
                mobile: mobile || '',
                items: orderItems,
                totalAmount: totalRupees,
                paymentMethod: 'razorpay',
                razorpayOrderId,
                status: 'Pending',
                termsAccepted: true,
                termsAcceptedAt: new Date()
            });

            await order.save();

            // Audit Log
            await AuditLog.create({
                orderId: order._id,
                userId: req.user.id,
                eventType: 'PAYMENT_INITIATED',
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                details: {
                    totalRupees,
                    razorpayOrderId,
                    isLiveGateway: isRazorpayConfigured
                }
            });

            res.json({
                success: true,
                orderId: order._id,
                razorpayOrderId,
                amount: amountInPaise,
                currency: 'INR',
                key: RAZORPAY_KEY_ID || 'rzp_test_simulation_mode',
                isSimulation: !isRazorpayConfigured
            });

        } catch (error) {
            console.error('Create Razorpay Order Error:', error);
            res.status(500).json({ message: 'Failed to initiate payment. Please try again.' });
        }
    });

    // ==========================================
    // 2. Verify Razorpay Payment Signature
    // ==========================================
    router.post('/verify-signature', authenticateToken, async (req, res) => {
        try {
            const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

            const order = await Order.findById(orderId);
            if (!order) {
                return res.status(404).json({ message: 'Order not found.' });
            }

            let isValid = false;

            if (isRazorpayConfigured) {
                const body = `${razorpay_order_id}|${razorpay_payment_id}`;
                const expectedSignature = crypto
                    .createHmac('sha256', RAZORPAY_KEY_SECRET)
                    .update(body.toString())
                    .digest('hex');

                isValid = (expectedSignature === razorpay_signature);
            } else {
                // In simulation mode without live credentials, verify non-empty fields
                isValid = !!(razorpay_order_id && razorpay_payment_id);
            }

            if (!isValid) {
                await AuditLog.create({
                    orderId: order._id,
                    userId: req.user.id,
                    eventType: 'PAYMENT_FAILED',
                    details: { reason: 'HMAC signature verification failed' }
                });
                return res.status(400).json({ message: 'Payment signature verification failed. Transaction flagged.' });
            }

            // Idempotent: If already approved, return existing licenses
            if (order.status === 'Approved') {
                const existingLicenses = await License.find({ orderId: order._id });
                return res.json({
                    success: true,
                    message: 'Payment already verified.',
                    orderId: order._id,
                    licenses: existingLicenses
                });
            }

            // Update order status
            order.status = 'Approved';
            order.razorpayPaymentId = razorpay_payment_id;
            order.razorpaySignature = razorpay_signature || 'verified_signature';
            order.transactionId = razorpay_payment_id;
            await order.save();

            // Clear user's active cart
            await Cart.findOneAndDelete({ userId: req.user.id });

            // Generate Licenses automatically
            const createdLicenses = await licenseService.createLicensesForOrder(order, { License, Product, AuditLog });

            // Automatically grant 48-Hour access to Google Drive / OneDrive original files
            const createdAccessGrants = await accessGrantService.grantAccessForOrder(order, { AccessGrant, Product, AuditLog });

            // Send Access Notification Email
            try {
                const emailResult = await sendOrderApprovedEmail(order);
                if (emailResult.success) {
                    order.emailSent = true;
                    order.emailSentAt = new Date();
                    order.emailStatus = emailResult.simulated ? 'Simulated' : 'Sent';
                    await order.save();
                }
            } catch (mailErr) {
                console.error('Email dispatch error on payment approval:', mailErr.message);
            }

            // Audit Log
            await AuditLog.create({
                orderId: order._id,
                userId: req.user.id,
                eventType: 'PAYMENT_VERIFIED',
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                details: {
                    paymentId: razorpay_payment_id,
                    licensesCount: createdLicenses.length
                }
            });

            res.json({
                success: true,
                message: 'Payment verified successfully! Access granted to your 3D models.',
                orderId: order._id,
                licenses: createdLicenses
            });

        } catch (error) {
            console.error('Verify Signature Error:', error);
            res.status(500).json({ message: 'Error verifying payment signature.' });
        }
    });

    // ==========================================
    // 3. Razorpay Server Webhook (HMAC-SHA256)
    // ==========================================
    router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
        try {
            const signature = req.headers['x-razorpay-signature'];
            if (!signature && RAZORPAY_WEBHOOK_SECRET) {
                return res.status(400).send('Webhook signature missing');
            }

            if (RAZORPAY_WEBHOOK_SECRET) {
                const expectedSignature = crypto
                    .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
                    .update(req.body)
                    .digest('hex');

                if (signature !== expectedSignature) {
                    console.warn('Webhook signature mismatch detected');
                    return res.status(400).send('Invalid webhook signature');
                }
            }

            const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

            if (event.event === 'order.paid' || event.event === 'payment.captured') {
                const paymentPayload = event.payload.payment.entity;
                const razorpayOrderId = paymentPayload.order_id;

                const order = await Order.findOne({ razorpayOrderId });
                if (order && order.status !== 'Approved') {
                    order.status = 'Approved';
                    order.razorpayPaymentId = paymentPayload.id;
                    order.transactionId = paymentPayload.id;
                    await order.save();

                    // Generate licenses & 48-Hour cloud access grants
                    await licenseService.createLicensesForOrder(order, { License, Product, AuditLog });
                    await accessGrantService.grantAccessForOrder(order, { AccessGrant, Product, AuditLog });
                    await sendOrderApprovedEmail(order);
                }
            }

            res.status(200).json({ status: 'ok' });
        } catch (error) {
            console.error('Razorpay Webhook Error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // ==========================================
    // 4. Instant Test Checkout (Zero-Friction Dev/Demo Mode)
    // ==========================================
    router.post('/test-checkout', authenticateToken, async (req, res) => {
        try {
            const { items, email, mobile, termsAccepted } = req.body;

            if (!termsAccepted) {
                return res.status(400).json({ message: 'You must acknowledge the License Terms and Limitations.' });
            }

            if (!items || items.length === 0) {
                return res.status(400).json({ message: 'Cart cannot be empty.' });
            }

            const productIds = items.map(i => i.productId);
            const products = await Product.find({ id: { $in: productIds } });

            let totalRupees = 0;
            const orderItems = items.map(item => {
                const product = products.find(p => p.id === item.productId);
                const priceNum = parseFloat(String(product?.price || '0').replace(/[^0-9.]/g, '')) || 0;
                totalRupees += priceNum * (item.quantity || 1);

                return {
                    productId: item.productId,
                    name: product?.name || item.name,
                    price: product?.price,
                    quantity: item.quantity || 1,
                    image: product?.image || item.image,
                    downloadUrl: product?.mediaUrl || '',
                    driveUrl: product?.driveUrl || '',
                    fileFormats: product?.fileFormats || ['.blend', '.fbx', '.obj', '.glb'],
                    fileSize: product?.fileSize || '45 MB'
                };
            });

            const testTxId = `TEST_PAY_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

            const order = new Order({
                userId: req.user.id,
                email: email || req.user.email || 'customer@example.com',
                mobile: mobile || '',
                items: orderItems,
                totalAmount: totalRupees,
                paymentMethod: 'test',
                transactionId: testTxId,
                status: 'Approved', // Instantly approved for testing
                termsAccepted: true,
                termsAcceptedAt: new Date()
            });

            await order.save();
            await Cart.findOneAndDelete({ userId: req.user.id });

            // Generate active licenses & 48-Hour cloud access grants
            const createdLicenses = await licenseService.createLicensesForOrder(order, { License, Product, AuditLog });
            const createdAccessGrants = await accessGrantService.grantAccessForOrder(order, { AccessGrant, Product, AuditLog });

            // Attempt email notification
            await sendOrderApprovedEmail(order);

            // Audit Log
            await AuditLog.create({
                orderId: order._id,
                userId: req.user.id,
                eventType: 'PAYMENT_VERIFIED',
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                details: {
                    mode: 'test-checkout',
                    totalRupees,
                    licensesCount: createdLicenses.length
                }
            });

            res.json({
                success: true,
                message: 'Test order completed and licenses activated!',
                orderId: order._id,
                licenses: createdLicenses
            });

        } catch (error) {
            console.error('Test Checkout Error:', error);
            res.status(500).json({ message: 'Error completing test checkout.' });
        }
    });

    return router;
}

module.exports = createPaymentRouter;
