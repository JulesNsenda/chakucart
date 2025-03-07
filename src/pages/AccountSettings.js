// src/pages/AccountSettings.js
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { toast } from 'react-toastify'; // For in-app notifications
import axios from 'axios';

const AccountSettings = () => {
    const { user, updateUserDetails, isAuthenticated, isCardLinked } = useAuth(); // Added authorizationCode
    const [address, setAddress] = useState(user?.address || '');
    const [cardNumber, setCardNumber] = useState(user?.cardNumber || '');
    const [isLinking, setIsLinking] = useState(false); // State for linking process
    const [error, setError] = useState(''); // State for errors
    const navigate = useNavigate();
    const API_BASE_URL = process.env.NODE_ENV === 'production'
        ? '/api'
        : 'http://localhost:5000/api';

    // Use useCallback to memoize handleSubmit to prevent unnecessary re-renders
    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        if (!address) {
            setError('Please fill in the shipping address.');
            return;
        }

        // Prepare updated user data (save cardNumber always, linkedCard remains false until linked via Paystack)
        console.log('Preparing to update user with:', {
            address,
            cardNumber,
            linkedCard: isCardLinked, // Keep linkedCard as is (false until linked)
        });
        const updatedUser = {
            ...user,
            address,
            linkedCard: isCardLinked, // Don’t change linkedCard here; it’s updated only after Paystack linking
            cardNumber: cardNumber || '', // Save cardNumber if provided, empty string if not
        };

        // Update user details via AuthContext, persisting in localStorage
        updateUserDetails(updatedUser);
        console.log('Updated user sent to AuthContext:', updatedUser);

        // Use setTimeout to ensure navigation happens after render
        setTimeout(() => {
            navigate('/dashboard');
            toast.success('Account details updated successfully!');
        }, 0);
    }, [address, cardNumber, isCardLinked, user, updateUserDetails, navigate]);

    // Use useCallback to memoize handleLinkOrVerifyCard for Paystack linking
    const handleLinkOrVerifyCard = useCallback(async () => {
        if (!cardNumber) {
            setError('Please enter a card number before linking.');
            return;
        }

        setIsLinking(true);
        try {
            console.log('Linking card for email:', user.email, 'with amount:', 100);
            const response = await axios.post( `${API_BASE_URL}/initialize-authorization`, {
                email: user.email,
                amount: 100, // ZAR 1.00 in kobo
            });

            console.log('Initialize Authorization Response:', response.data);
            const { reference } = response.data.data;
            console.log('Paystack Public Key:', process.env.REACT_APP_PAYSTACK_PUBLIC_KEY); // Debug log
            const handler = window.PaystackPop.setup({
                key: process.env.REACT_APP_PAYSTACK_PUBLIC_KEY || 'pk_test_91c1e6a74f8f8c435434ac584943fc6696c69a7c',
                email: user.email,
                amount: 100, // ZAR 1.00 in kobo
                currency: 'ZAR', // Explicitly specify ZAR
                ref: reference,
                channels: ['card'], // Restrict to card payments only
                metadata: { save_card: true }, // Request to save the card for future use
                callback: (response) => {
                    // Synchronous callback
                    verifyAuthorization(response.reference)
                        .then(() => {
                            setTimeout(() => {
                                toast.success('Card linked and verified successfully!');
                                setIsLinking(false); // Ensure linking state is reset
                            }, 0);
                        })
                        .catch((error) => {
                            console.error('Error in callback:', error);
                            setTimeout(() => {
                                setError('Failed to verify authorization. Please try again.');
                                toast.error('Error verifying authorization: ' + error.message);
                                setIsLinking(false); // Reset on error
                            }, 0);
                        });
                },
                onClose: () => {
                    setTimeout(() => {
                        setIsLinking(false);
                        toast.info('Payment window closed. Please try again to link your card.');
                    }, 0); // Delay to avoid rendering conflicts
                },
            });
            console.log('PaystackPop handler setup:', handler);
            handler.openIframe(); // Explicitly call openIframe
        } catch (error) {
            console.error('Error linking card:', error);
            setTimeout(() => {
                setError('Failed to link or verify card. Please try again.');
                toast.error('Failed to link or verify card: ' + (error.response?.data?.message || error.message));
                setIsLinking(false);
            }, 0); // Delay to avoid rendering conflicts
        }
    }, [user.email, cardNumber, setIsLinking, setError, toast]); // Dependencies for useCallback

    // Use useCallback to memoize verifyAuthorization
    const verifyAuthorization = useCallback(async (reference) => {
        try {
            console.log('Verifying authorization with reference:', reference);
            const response = await axios.post( `${API_BASE_URL}/api/verify-transaction`, {
                reference,
                email: user.email,
            });
            console.log('Verify Transaction Response (Full):', JSON.stringify(response.data, null, 2)); // Detailed logging

            if (response.data.status === 'success') {
                const authorizationData = response.data.data.authorization;
                if (authorizationData && authorizationData.authorization_code) {
                    const authorizationCode = authorizationData.authorization_code;
                    console.log('Found authorization code:', authorizationCode);
                    await axios.post( `${API_BASE_URL}/save-authorization`, {
                        email: user.email,
                        authorizationCode,
                    });
                    // Update user data with linked card status and authorization code outside rendering
                    setTimeout(() => {
                        const updatedUser = {
                            ...user,
                            linkedCard: true,
                            cardNumber: '****' + authorizationCode.slice(-4), // Mask card number with last 4 digits
                            authorizationCode: authorizationCode, // Store the full authorization code
                        };
                        updateUserDetails(updatedUser);
                        console.log('Updated user after linking card (with authorization code):', updatedUser);
                        toast.success('Card linked and verified successfully!');
                        setIsLinking(false); // Ensure linking state is reset
                    }, 0);
                } else {
                    console.log('No authorization data found in response:', response.data.data);
                    throw new Error('No authorization code found in Paystack response.');
                }
            } else {
                throw new Error('Authorization verification failed.');
            }
        } catch (error) {
            console.error('Error verifying authorization:', error);
            setTimeout(() => {
                setError('Failed to verify authorization. Please try again.');
                toast.error('Error verifying authorization: ' + (error.message || 'Unknown error'));
                setIsLinking(false); // Reset linking state on error
            }, 0);
        }
    }, [user.email, updateUserDetails, setIsLinking, setError, toast]); // Dependencies for useCallback

    if (!isAuthenticated) {
        // Use setTimeout to delay navigation and avoid rendering conflicts
        setTimeout(() => navigate('/sign-in'), 0);
        return null;
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="flex-1 p-4">
                <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-6">Account Settings</h1>
                    {error && <p className="text-red-500 mb-4">{error}</p>}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="address" className="block text-gray-700 mb-1">Shipping Address</label>
                            <input
                                type="text"
                                id="address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="e.g., 123 Main St, Cape Town"
                                aria-label="Shipping address"
                            />
                        </div>
                        <div>
                            <label htmlFor="cardNumber" className="block text-gray-700 mb-1">Card Number (Optional)</label>
                            <input
                                type="text"
                                id="cardNumber"
                                value={cardNumber}
                                onChange={(e) => setCardNumber(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="e.g., 4111 1111 1111 1111"
                                aria-label="Card number"
                                disabled={isCardLinked} // Disable if already linked
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all duration-300 shadow-md hover:shadow-lg"
                            aria-label="Update details"
                            disabled={isLinking}
                        >
                            {isLinking ? 'Processing...' : 'Update Details'}
                        </button>
                        {!isCardLinked && (
                            <button
                                type="button"
                                onClick={handleLinkOrVerifyCard}
                                disabled={isLinking}
                                className={`w-full py-2 mt-4 ${isLinking ? 'bg-gray-400' : 'bg-blue-500'} text-white rounded-md hover:${isLinking ? '' : 'bg-blue-600'} transition-all duration-300 shadow-md hover:shadow-lg`}
                                aria-label="Link or verify account"
                            >
                                {isLinking ? 'Linking...' : 'Link or Verify Account'}
                            </button>
                        )}
                        <p className="mt-4 text-sm text-gray-500">
                            * You can update your card number here for record-keeping. Linking your card via Paystack is optional but required for Pay on Delivery. A small test charge of R1.00 will be applied and refunded immediately upon linking.
                        </p>
                    </form>
                    <p className="mt-4 text-gray-600 font-medium">
                        <button
                            onClick={() => {
                                setTimeout(() => navigate('/dashboard'), 0); // Delay navigation to avoid rendering conflicts
                            }}
                            className="text-green-600 hover:text-green-700"
                            aria-label="Back to dashboard"
                        >
                            Back to Dashboard
                        </button>
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default AccountSettings;