require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// Verify Paystack transaction
app.post('/api/verify-transaction', async (req, res) => {
    const { reference, cart, total } = req.body;

    try {
        const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            },
        });

        if (response.data.data.status === 'success') {
            // Simulate revenue splitting (87.5% to farmer, delivery fee to transporter)
            const farmerAmount = (total * 0.875 * 100).toFixed(0); // In kobo
            const transporterAmount = (5 * 10 * 100).toFixed(0); // 5km * R10/km in kobo

            // In production, use Paystack's split payment API here
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
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Verification failed' });
    }
});

// Handle Pay on Delivery
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

    // In production, save to database
    res.json({ status: 'success', order });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});