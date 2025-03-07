const axios = require('axios');

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

const getUserPaymentDetails = async (email, total) => {
    try {
        console.log('Fetching Paystack customer for email:', email);

        // Step 1: Find the Paystack customer based on email
        let customerResponse = await axios.get(
            `https://api.paystack.co/customer?email=${encodeURIComponent(email)}`,
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        console.log('Customer Response:', customerResponse.data);

        let customer = customerResponse.data.data[0]; // Get the first matching customer
        if (!customer) {
            console.log('No customer found, creating new customer for:', email);
            const createCustomerResponse = await axios.post(
                'https://api.paystack.co/customer',
                {
                    email,
                },
                {
                    headers: {
                        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            console.log('Created Customer Response:', createCustomerResponse.data);
            customer = createCustomerResponse.data.data;
        }

        const paystackCustomerId = customer.customer_code;

        // Step 2: Check for linked cards (authorizations)
        console.log('Fetching authorizations for customer:', paystackCustomerId);
        const authorizationsResponse = await axios.get(
            `https://api.paystack.co/customer/${paystackCustomerId}/authorizations`,
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                },
            }
        );
        console.log('Authorizations Response:', authorizationsResponse.data);

        const authorizations = authorizationsResponse.data.data;
        if (!authorizations || authorizations.length === 0) {
            throw new Error('No linked payment card found for this user');
        }

        const authorization = authorizations[0]; // Use the first saved card

        // Step 3: Optionally pre-authorize the total amount to verify funds
        const totalInKobo = Math.round(parseFloat(total) * 100); // Convert ZAR to kobo
        let preAuthResult = { status: 'success' }; // Default to success if pre-auth fails for ZAR

        console.log('Attempting to pre-authorize charge for amount:', totalInKobo, 'with authorization:', authorization.authorization_code);
        try {
            const preAuthResponse = await axios.post(
                `https://api.paystack.co/charge`,
                {
                    email,
                    amount: totalInKobo,
                    currency: 'ZAR',
                    authorization_code: authorization.authorization_code, // Use the saved card’s authorization code
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
            preAuthResult = preAuthResponse.data.data;
        } catch (preAuthError) {
            console.error('Pre-Authorization Error:', preAuthError.response?.data || preAuthError.message);
            console.warn('Pre-authorization not supported or failed for ZAR. Falling back to card existence check.');
            // Fallback: Assume card is valid if it exists, but warn about potential issues
        }

        if (preAuthResult.status !== 'success') {
            throw new Error('Insufficient funds or card not valid for Pay on Delivery');
        }

        return {
            linkedCard: true,
            availableBalance: null, // Paystack doesn’t provide balance; rely on pre-auth or assume valid
            cardDetails: {
                authorization_code: authorization.authorization_code, // Store the authorization code for POD
                last4: authorization.last4,
                expiry: `${authorization.exp_month}/${authorization.exp_year}`,
                brand: authorization.brand,
            },
            paystackCustomerId: paystackCustomerId,
        };
    } catch (error) {
        console.error('Paystack Error in getUserPaymentDetails:', {
            message: error.message,
            response: error.response?.data || null,
            status: error.response?.status || null,
            stack: error.stack,
        });
        throw new Error(`Error fetching payment details from Paystack: ${error.response?.data?.message || error.message}`);
    }
};

module.exports = getUserPaymentDetails;