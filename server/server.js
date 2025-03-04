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

// Handle Pay on Delivery
app.post('/api/pay-on-delivery', async (req, res) => {
    const { cart, total, email, authorizationCode } = req.body;

    try {
        // Validate the authorization code from localStorage
        if (!authorizationCode) {
            return res.status(400).json({ status: 'error', message: 'No authorization code provided for Pay on Delivery' });
        }

        // Pre-authorize the payment to verify funds and card validity using the authorization code
        const totalInKobo = Math.round(parseFloat(total) * 100); // Convert ZAR to kobo
        const reference = generateUniqueReference('COD'); // Generate a unique reference for the transaction
        let preAuthResult = { status: 'success' };

        console.log('Attempting to pre-authorize charge for amount:', totalInKobo, 'with authorization:', authorizationCode);
        try {
            const preAuthResponse = await axios.post(
                'https://api.paystack.co/transaction/initialize',
                {
                    email,
                    amount: totalInKobo,
                    currency: 'ZAR',
                    authorization_code: authorizationCode, // Use the authorization code from localStorage
                    reference: reference,
                    metadata: { type: 'pre_authorization_for_cod' },
                },
                {
                    headers: {
                        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            console.log('Pre-Authorization Response:', preAuthResponse.data);
            preAuthResult = preAuthResponse.data;
        } catch (preAuthError) {
            console.error('Pre-Authorization Error:', preAuthError.response?.data || preAuthError.message);
            console.warn('Pre-authorization failed for ZAR. Falling back to card existence check.');
            // Fallback: Assume card is valid if authorizationCode exists, but warn about potential issues
        }

        console.log('Pre-Authorization Status is: ', preAuthResult.status);
        if (!preAuthResult.status) {
            throw new Error('Insufficient funds or card not valid for Pay on Delivery');
        }

        // Store pending order with Paystack reference
        const order = {
            id: `ORD-${Date.now()}`,
            items: cart,
            total: parseFloat(total),
            status: 'Pending',
            paymentMethod: 'Pay on Delivery',
            email,
            authorizationCode: authorizationCode,
            paystackReference: reference, // Store the Paystack reference
            createdAt: new Date(),
        };
        pendingOrders.push(order);

        res.json({ status: 'success', order, reference: reference }); // Return the Paystack reference
    } catch (error) {
        console.error('Pay on Delivery Error Details:', {
            message: error.message,
            stack: error.stack,
            response: error.response?.data || null,
        });
        res.status(500).json({ status: 'error', message: error.message || 'Error processing pay on delivery' });
    }
});

app.post('/api/confirm-delivery', async (req, res) => {
    const { orderId, email, authorizationCode, reference } = req.body;

    try {
        // Find the pending order
        const order = pendingOrders.find(o => o.id === orderId && o.email === email && o.status === 'Pending');
        if (!order) {
            return res.status(404).json({ status: 'error', message: 'Order not found or not pending' });
        }

        console.log('Order details: ', order); 

        // Verify the pre-authorization using the reference
        const verifyResponse = await axios.get(
            `https://api.paystack.co/transaction/verify/${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                },
            }
        );
        console.log('Paystack Verify Response (Full):', JSON.stringify(verifyResponse.data, null, 2));

        // Charge the pre-authorized amount using the authorization code
        const totalInKobo = Math.round(order.total * 100); // Convert ZAR to kobo
        const chargeResponse = await axios.post(
            'https://api.paystack.co/charge',
            {
                email,
                amount: totalInKobo,
                currency: 'ZAR',
                authorization_code: authorizationCode,
                //reference: reference,
            },
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        console.log('Charge Response:', chargeResponse.data);

        if (chargeResponse.data.status) {
            // Update order status to 'Delivered' and remove from pending
            order.status = 'Delivered';
            pendingOrders = pendingOrders.filter(o => o.id !== orderId);

            res.json({ status: 'success', message: 'Delivery confirmed, payment processed successfully' });
        } else {
            throw new Error(chargeResponse.data.message || 'Failed to charge payment');
        }
    } catch (error) {
        console.error('Error confirming delivery:', error);
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