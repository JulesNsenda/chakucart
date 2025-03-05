// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

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
        const response = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            {
                email,
                amount: totalInKobo,
                currency: 'ZAR',
                reference: generateUniqueReference('FRESH'),
                metadata: { cart, subtotal, shipping, type: 'full_payment' },
                split: {
                    type: 'flat',
                    subaccounts: [
                        {
                            subaccount: 'ACCT_vdz831vfm2ouz9l',
                            share: Math.round(subtotal * 0.875 * 100), // 87.5% of cart value
                            transaction_charge: Math.round(subtotal * 0.125 * 100), // 12.5% of cart value
                            bearer: "subaccount" // subaccount pays Paystack charges
                        },
                        {
                            subaccount: 'ACCT_wvknbrcabu1x2dt',
                            share: shippingInKobo, // 100% of shipping
                        },
                    ],
                },
            },
            { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
        );

        res.json({ status: 'success', data: response.data.data });
    } catch (error) {
        console.error(error.response?.data || error.message);
        res.status(500).json({ status: 'error', message: 'Payment failed' });
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

// Handle Pay on Delivery (Pre-Authorize)
app.post('/api/pay-on-delivery', async (req, res) => {
    const { cart, total, email, authorizationCode } = req.body;

    try {
        if (!authorizationCode) {
            return res.status(400).json({ status: 'error', message: 'No authorization code provided for Pay on Delivery' });
        }

        const totalInKobo = Math.round(parseFloat(total) * 100);
        const reference = generateUniqueReference('POD');
        const subtotal = cart.reduce((sum, item) => sum + item.price * (item.cartQuantity || 1), 0);
        const shipping = 5 * 10; // 5km at R10/km
        const subtotalInKobo = Math.round(subtotal * 100);
        const shippingInKobo = Math.round(shipping * 100);

        console.log('Attempting to pre-authorize with split for amount:', totalInKobo, 'with authorization:', authorizationCode);
        const preAuthResponse = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            {
                email,
                amount: totalInKobo,
                currency: 'ZAR',
                authorization_code: authorizationCode, // Use existing authorization code
                reference,
                metadata: { type: 'pre_authorization_for_pod', cart, total },
                split: {
                    type: 'flat',
                    subaccounts: [
                        {
                            subaccount: 'ACCT_vdz831vfm2ouz9l',
                            share: Math.round(subtotal * 0.875 * 100), // 87.5% of subtotal
                            transaction_charge: Math.round(subtotal * 0.125 * 100), // 12.5% fee
                            bearer: 'subaccount', // Subaccount bears Paystack fees
                        },
                        {
                            subaccount: 'ACCT_wvknbrcabu1x2dt',
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
        console.log('Pre-Authorization Response:', preAuthResponse.data);

        if (!preAuthResponse.data.status) {
            throw new Error(preAuthResponse.data.message || 'Failed to initialize pre-authorization with split');
        }

        // Note: This creates an authorization URL, but since we're using an authorization_code,
        // it should pre-authorize without requiring user interaction. Store the reference.
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
        console.error('Pay on Delivery Error Details:', {
            message: error.message,
            stack: error.stack,
            response: error.response?.data || null,
        });
        res.status(500).json({ status: 'error', message: error.message || 'Error processing pay on delivery' });
    }
});

// Confirm Delivery with Transfer Step
app.post('/api/confirm-delivery', async (req, res) => {
    const { orderId, email, authorizationCode, reference } = req.body;

    try {
        const order = pendingOrders.find(o => o.id === orderId && o.email === email && o.status === 'Pending');
        if (!order) {
            return res.status(404).json({ status: 'error', message: 'Order not found or not pending' });
        }

        console.log('Order details for POD confirmation: ', order);

        const verifyResponse = await axios.get(
            `https://api.paystack.co/transaction/verify/${reference}`,
            { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
        );
        console.log('Paystack Verify Response (Full):', JSON.stringify(verifyResponse.data, null, 2));

        const totalInKobo = Math.round(order.total * 100);
        const chargeResponse = await axios.post(
            'https://api.paystack.co/transaction/charge_authorization',
            {
                email,
                amount: totalInKobo,
                currency: 'ZAR',
                authorization_code: authorizationCode,
                reference: generateUniqueReference('POD_CAPTURE'),
                metadata: { type: 'capture_for_pod', orderId },
            },
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        console.log('Charge Response for POD:', chargeResponse.data);

        if (!chargeResponse.data.status || chargeResponse.data.data.status !== 'success') {
            throw new Error(chargeResponse.data.message || 'Failed to charge pre-authorized payment');
        }

        // Split should have been applied from the initial authorization
        order.status = 'Delivered';
        pendingOrders = pendingOrders.filter(o => o.id !== orderId);

        res.json({ status: 'success', message: 'Delivery confirmed, payment processed with split applied' });
    } catch (error) {
        console.error('Error confirming delivery for POD:', error.response?.data || error.message);
        res.status(500).json({ status: 'error', message: error.message || 'Failed to confirm delivery and process payment' });
    }
});

// New endpoint to save authorization code
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

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});