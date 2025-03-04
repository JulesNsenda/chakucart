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
    const timestamp = Date.now().toString(36); // Convert timestamp to base-36 for shorter length
    const randomStr = Math.random().toString(36).substr(2, 5); // Generate a random string
    return `${prefix}_${timestamp}_${randomStr}`.toUpperCase();
};

app.post('/api/initialize-transaction', async (req, res) => {
    const { email, subtotal, shipping, cart } = req.body;
    const cartValueInKobo = Math.round(subtotal * 100); // subtotal includes tax
    const shippingInKobo = Math.round(shipping * 100);
    const totalInKobo = cartValueInKobo + shippingInKobo;

    try {
        // Single transaction with dynamic split
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

// Verify Paystack transaction (updated to handle both cart and shipping)
app.post('/api/verify-transaction', async (req, res) => {
    const { reference, cart, total, type } = req.body; // Added type to distinguish cart vs. shipping

    try {
        const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            },
        });

        if (response.data.data.status === 'success') {
            const order = {
                id: `ORD-${Date.now()}`,
                items: cart,
                total: total,
                status: 'Processing',
                paymentMethod: 'Paystack',
                reference,
            };
            res.json({ status: 'success', order });
        } else {
            res.status(400).json({ status: 'failed', message: 'Payment not successful' });
        }
    } catch (error) {
        console.error(error.response?.data || error.message);
        res.status(500).json({ status: 'error', message: 'Verification failed' });
    }
});

// Handle Pay on Delivery (unchanged)
app.post('/api/pay-on-delivery', async (req, res) => {
    const { cart, total, email } = req.body;

    // Check if user has a linked card and sufficient funds (example logic)
    try {
        const userData = await getUserPaymentDetails(email); // Implement this function to fetch user data
        if (!userData.linkedCard || userData.availableBalance < total) {
            return res.status(400).json({ status: 'error', message: 'Linked card or insufficient funds for Pay on Delivery' });
        }

        const order = {
            id: `ORD-${Date.now()}`,
            items: cart,
            total: total,
            status: 'Pending',
            paymentMethod: 'Pay on Delivery',
            email,
        };

        res.json({ status: 'success', order });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Error processing pay on delivery' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});