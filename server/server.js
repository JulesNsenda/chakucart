require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const SPLIT_CODE = 'SPL_KRMNwMf4HS'; // Split for cart value (main account 12.5%, farmer 87.5%)

// Function to generate a unique reference
const generateUniqueReference = (prefix) => {
    const timestamp = Date.now().toString(36); // Convert timestamp to base-36 for shorter length
    const randomStr = Math.random().toString(36).substr(2, 5); // Generate a random string
    return `${prefix}_${timestamp}_${randomStr}`.toUpperCase();
};

app.post('/api/initialize-transaction', async (req, res) => {
    const { email, subtotal, shipping, cart } = req.body;
    const totalInKobo = Math.round(subtotal * 100); // Subtotal in kobo (cart value for splitting)
    const shippingInKobo = Math.round(shipping * 100); // Shipping in kobo

    try {
        // Step 1: Initialize transaction for cart value (subtotal) with SPLIT_CODE
        const cartResponse = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            {
                email,
                amount: totalInKobo, // Only cart value (subtotal, excluding shipping)
                currency: 'ZAR',
                reference: generateUniqueReference('FRESH_CART'), // Unique reference for cart
                split_code: SPLIT_CODE,
                metadata: {
                    cart_items: cart.map(item => `${item.name} (x${item.cartQuantity})`).join(', '),
                    subtotal,
                    shipping,
                    type: 'cart_value',
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        // TODO: Send another call to make the payment of the shipment
        // Step 2: Initialize transaction for shipping (flat amount to transporter)
        const shippingResponse = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            {
                email,
                amount: shippingInKobo, // Shipping amount in kobo
                currency: 'ZAR',
                reference: generateUniqueReference('FRESH_SHIPPING'), // Unique reference for shipping
                metadata: {
                    cart_items: cart.map(item => `${item.name} (x${item.cartQuantity})`).join(', '),
                    subtotal,
                    shipping,
                    type: 'shipping',
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        res.json({
            status: 'success',
            data: {
                cartAuthorization: cartResponse.data.data,
                shippingAuthorization: shippingResponse.data.data,
            },
        });
    } catch (error) {
        console.error(error.response?.data || error.message);
        res.status(500).json({ status: 'error', message: 'Transaction initialization failed' });
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
app.post('/api/pay-on-delivery', (req, res) => {
    const { cart, total, email } = req.body;

    const order = {
        id: `ORD-${Date.now()}`,
        items: cart,
        total: total,
        status: 'Pending',
        paymentMethod: 'Pay on Delivery',
        email,
    };

    res.json({ status: 'success', order });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});