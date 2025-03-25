require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path')
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'build')));

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const FARMERS_SUBACCOUNT_CODE = "ACCT_vdz831vfm2ouz9l";
const TRANSPORTER_SUBACCOUNT_CODE = "ACCT_wvknbrcabu1x2dt";

// Function to generate a unique reference
const generateUniqueReference = (prefix) => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substr(2, 5);
    return `${prefix}_${timestamp}_${randomStr}`.toUpperCase();
};

// In-memory store for pending orders (replace with a database in production)
let pendingOrders = [];

app.post('/api/initialize-authorization', async (req, res) => {
    console.log('Initialize Authorization Request:', req.body); // Log incoming request
    const { email, amount } = req.body;

    try {
        const response = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            {
                email,
                amount, // Small amount (e.g., 100 kobo = ZAR 1.00)
                currency: 'ZAR',
                reference: generateUniqueReference('AUTH'),
                metadata: { type: 'initial_authorization', save_card: true },
            },
            { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
        );

        console.log('Paystack Initialize Response:', response.data);

        res.json({ status: 'success', data: response.data.data });
    } catch (error) {
        console.error('Error initializing authorization:', {
            message: error.message,
            response: error.response?.data || null,
            status: error.response?.status,
        });
        res.status(500).json({ status: 'error', message: 'Failed to initialize authorization' });
    }
});

app.post('/api/initialize-transaction', async (req, res) => {
    const { email, subtotal, shipping, cart } = req.body;
    const cartValueInKobo = Math.round(subtotal * 100); // subtotal includes tax
    const shippingInKobo = Math.round(shipping * 100);
    const totalInKobo = cartValueInKobo + shippingInKobo;

    try {
        // Simplified split calculation with minimum thresholds
        const splitConfig = {
            type: "flat",
            bearer_type: "account",
            subaccounts: [
                {
                    subaccount: FARMERS_SUBACCOUNT_CODE,
                    share: Math.max(Math.round(cartValueInKobo * 0.875), 1), // At least 1 kobo
                },
                {
                    subaccount: TRANSPORTER_SUBACCOUNT_CODE,
                    share: shippingInKobo,
                },
            ],
        };

        // Remove transaction_charge to avoid minimum amount issues
        const response = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            {
                email,
                amount: totalInKobo,
                currency: 'ZAR',
                reference: generateUniqueReference('FRESH'),
                metadata: { cart, subtotal, shipping, type: 'full_payment' },
                split: splitConfig,
            },
            { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
        );

        res.json({
            status: 'success', 
            data: {
                reference: response.data.data.reference,
                transactionId: response.data.data.id,
                ...response.data.data
            }
        });
    } catch (error) {
        console.error('Transaction Initialization Error:', {
            message: error.response?.data || error.message,
            config: error.config
        });
        res.status(500).json({ 
            status: 'error', 
            message: 'Payment initialization failed',
            details: error.response?.data || error.message 
        });
    }
});

// Verify transaction
app.post('/api/verify-transaction', async (req, res) => {
    const { reference, email } = req.body; // Simplified to only require reference and email

    try {
        console.log('Verifying transaction with reference:', reference, 'for email:', email);
        const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            },
        });

        console.log('Paystack Verify Response (Full):', JSON.stringify(response.data, null, 2)); // Detailed logging
        if (response.data.data.status === 'success') {
            const authorizationData = response.data.data.authorization;
            if (!authorizationData || !authorizationData.authorization_code) {
                console.warn('No authorization code found in Paystack response:', response.data.data);
                return res.status(400).json({ status: 'failed', message: 'No authorization code found in transaction' });
            }
            res.json({ status: 'success', data: response.data.data }); // Return full Paystack response data
        } else {
            res.status(400).json({ status: 'failed', message: 'Payment not successful' });
        }
    } catch (error) {
        console.error('Error verifying transaction:', error.response?.data || error.message);
        res.status(500).json({ status: 'error', message: 'Verification failed' });
    }
});

app.post('/api/pay-on-delivery', async (req, res) => {
    const { cart, total, email, authorizationCode } = req.body;

    try {
        if (!authorizationCode) {
            return res.status(400).json({
                status: 'error',
                message: 'No authorization code provided for Pay on Delivery'
            });
        }

        const reference = generateUniqueReference('POD');
        const subtotal = cart.reduce((sum, item) => sum + item.price * (item.cartQuantity || 1), 0);
        const shipping = 5 * 10; // 5km at R10/km

        // Store order without pre-authorization
        const order = {
            id: `ORD-${Date.now()}`,
            items: cart,
            total: parseFloat(total),
            status: 'Pending',
            paymentMethod: 'Pay on Delivery',
            email,
            authorizationCode,
            paystackReference: reference,
            createdAt: new Date(),
            subtotal,
            shipping,
        };
        pendingOrders.push(order);

        res.json({ status: 'success', order, reference });
    } catch (error) {
        console.error('Pay on Delivery Error:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Error processing pay on delivery'
        });
    }
});

app.post('/api/confirm-delivery', async (req, res) => {
    const { orderId, email, authorizationCode, reference } = req.body;

    try {
        const order = pendingOrders.find(o => o.id === orderId && o.email === email && o.status === 'Pending');
        if (!order) {
            return res.status(404).json({
                status: 'error',
                message: 'Order not found or not pending'
            });
        }

        const totalInKobo = Math.round(order.total * 100);
        const shippingInKobo = Math.round(order.shipping * 100);

        // Charge the authorization with split
        const chargeResponse = await axios.post(
            'https://api.paystack.co/transaction/charge_authorization',
            {
                email,
                amount: totalInKobo,
                currency: 'ZAR',
                authorization_code: authorizationCode,
                reference: generateUniqueReference('POD_CAPTURE'),
                metadata: { type: 'capture_for_pod', orderId },
                split: {
                    type: "flat",
                    bearer_type: "account",
                    subaccounts: [
                        {
                            subaccount: FARMERS_SUBACCOUNT_CODE,
                            share: Math.round(order.subtotal * 0.875 * 100), // 87.5% of subtotal
                            transaction_charge: Math.round(order.subtotal * 0.125 * 100), // 12.5% fee
                        },
                        {
                            subaccount: TRANSPORTER_SUBACCOUNT_CODE,
                            share: shippingInKobo, // 100% of shipping
                        },
                    ],
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!chargeResponse.data.status || chargeResponse.data.data.status !== 'success') {
            throw new Error(chargeResponse.data.message || 'Failed to charge pre-authorized payment');
        }

        order.status = 'Delivered';
        pendingOrders = pendingOrders.filter(o => o.id !== orderId);

        res.json({
            status: 'success',
            message: 'Delivery confirmed, payment processed with split applied',
            data: chargeResponse.data.data
        });
    } catch (error) {
        console.error('Error confirming delivery:', error.response?.data || error.message);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to confirm delivery and process payment'
        });
    }
});

// Save authorization code
app.post('/api/save-authorization', async (req, res) => {
    const { email, authorizationCode } = req.body;

    try {
        console.log(`Saving authorization for ${email}: ${authorizationCode}`);

        // Find the Paystack customer
        const customerResponse = await axios.get(
            `https://api.paystack.co/customer?email=${encodeURIComponent(email)}`,
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const customer = customerResponse.data.data[0];
        if (!customer) {
            throw new Error('Customer not found');
        }

        // Update customer metadata with the authorization code
        await axios.put(
            `https://api.paystack.co/customer/${customer.customer_code}`,
            {
                metadata: { authorization_code: authorizationCode },
            },
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        console.log(`Authorization saved for customer ${customer.customer_code}`);
        res.json({ status: 'success', message: 'Authorization saved successfully' });
    } catch (error) {
        console.error('Error saving authorization:', error.response?.data || error.message);
        res.status(500).json({ status: 'error', message: 'Failed to save authorization' });
    }
});

app.get('/api/pending-orders', async (req, res) => {
    const { email } = req.query;
    const userOrders = pendingOrders.filter(order => order.email === email && order.status === 'Pending');
    res.json({ orders: userOrders });
});

// Process refund for Pay Now (server-side only)
app.post('/api/request-refund', async (req, res) => {
    console.log('Received refund request:', req.body); // Debug the incoming request
    const { transactionId, amount, reason } = req.body; // Use 'transactionId' to match client request

    console.log('Transaction ID: ', transactionId, 'Amount: ', amount, 'Reason: ', reason);

    // Process refund via Paystack
    const refundResponse = await axios.post(
        'https://api.paystack.co/refund',
        {
            transaction: transactionId, // Use transaction ID as per Paystack docs
            amount: amount, // Amount in kobo (must be an integer)
            reason: reason || 'No reason provided', // Default to a fallback reason if not provided
        },
        {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
        }
    );

    console.log('Paystack Refund Response:', refundResponse.data); // Debug the refund response
    res.json({ status: 'success', message: 'Refund processed successfully.', data: refundResponse.data });
});

// Process refund for Pay on Delivery (simulated, server-side only)
app.post('/api/request-pod-refund', async (req, res) => {
    const { orderId, email, reason } = req.body;

    // Simulate manual processing for Pay on Delivery refunds (no Paystack call needed for MVP)
    console.log(`Simulating refund for Pay on Delivery order ${orderId} for ${email} with reason: ${reason}`);

    // In production, you might notify an admin via email/SMS or update a database
    res.json({ status: 'success', message: 'Pay on Delivery refund processing initiated. Admin notified for manual review.', data: { orderId, email, reason } });
});

// Catch-all route for SPA: Serve index.html for all non-API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

module.exports = app;