import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { toast } from 'react-toastify';
import axios from 'axios';

const AccountSettings = () => {
    const { user, updateUserDetails, isAuthenticated, isCardLinked } = useAuth();
    const [address, setAddress] = useState(user?.address || '');
    const [cardNumber, setCardNumber] = useState(user?.cardNumber || '');
    const [isLinking, setIsLinking] = useState(false);
    const [detailsUpdated, setDetailsUpdated] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const API_BASE_URL = process.env.NODE_ENV === 'production'
        ? '/api'
        : 'http://localhost:5000/api';

    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        if (!address) {
            setError('Please fill in the shipping address.');
            return;
        }

        const updatedUser = {
            ...user,
            address,
            linkedCard: isCardLinked,
            cardNumber: cardNumber || '',
        };

        updateUserDetails(updatedUser);
        setDetailsUpdated(true);

        if (isCardLinked) {
            setTimeout(() => {
                navigate('/dashboard');
                toast.success('Account details updated successfully!');
            }, 0);
        } else {
            toast.success('Account details updated successfully! Please link your card before continuing.');
        }
    }, [address, cardNumber, isCardLinked, user, updateUserDetails, navigate]);

    const handleLinkOrVerifyCard = useCallback(async () => {
        if (!cardNumber) {
            setError('Please enter a card number before linking.');
            return;
        }

        setIsLinking(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/initialize-authorization`, {
                email: user.email,
                amount: 100,
            });

            const { reference } = response.data.data;
            const handler = window.PaystackPop.setup({
                key: process.env.REACT_APP_PAYSTACK_PUBLIC_KEY || 'pk_test_91c1e6a74f8f8c435434ac584943fc6696c69a7c',
                email: user.email,
                amount: 100,
                currency: 'ZAR',
                ref: reference,
                channels: ['card'],
                metadata: { save_card: true },
                callback: (response) => {
                    verifyAuthorization(response.reference).then(() => {
                        setTimeout(() => {
                            toast.success('Card linked and verified successfully!');
                            setIsLinking(false);
                            if (detailsUpdated) {
                                navigate('/dashboard');
                            }
                        }, 0);
                    }).catch((error) => {
                        setTimeout(() => {
                            setError('Failed to verify authorization. Please try again.');
                            toast.error('Error verifying authorization: ' + error.message);
                            setIsLinking(false);
                        }, 0);
                    });
                },
                onClose: () => {
                    setTimeout(() => {
                        setIsLinking(false);
                        toast.info('Payment window closed. Please try again to link your card.');
                    }, 0);
                },
            });
            handler.openIframe();
        } catch (error) {
            setTimeout(() => {
                setError('Failed to link or verify card. Please try again.');
                toast.error('Failed to link or verify card: ' + (error.response?.data?.message || error.message));
                setIsLinking(false);
            }, 0);
        }
    }, [user.email, cardNumber, setIsLinking, setError, toast, detailsUpdated, navigate]);

    const verifyAuthorization = useCallback(async (reference) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/verify-transaction`, {
                reference,
                email: user.email,
            });

            if (response.data.status === 'success') {
                const authorizationData = response.data.data.authorization;
                if (authorizationData && authorizationData.authorization_code) {
                    const authorizationCode = authorizationData.authorization_code;
                    await axios.post(`${API_BASE_URL}/save-authorization`, {
                        email: user.email,
                        authorizationCode,
                    });
                    setTimeout(() => {
                        const updatedUser = {
                            ...user,
                            linkedCard: true,
                            cardNumber: '****' + authorizationCode.slice(-4),
                            authorizationCode: authorizationCode,
                        };
                        updateUserDetails(updatedUser);
                        toast.success('Card linked and verified successfully!');
                        setIsLinking(false);

                        if (detailsUpdated) {
                            navigate('/dashboard');
                        }
                    }, 0);
                } else {
                    throw new Error('No authorization code found in Paystack response.');
                }
            } else {
                throw new Error('Authorization verification failed.');
            }
        } catch (error) {
            setTimeout(() => {
                setError('Failed to verify authorization. Please try again.');
                toast.error('Error verifying authorization: ' + (error.message || 'Unknown error'));
                setIsLinking(false);
            }, 0);
        }
    }, [user.email, updateUserDetails, setIsLinking, setError, toast, detailsUpdated, navigate]);

    if (!isAuthenticated) {
        setTimeout(() => navigate('/sign-in'), 0);
        return null;
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="flex-1 p-2 sm:p-4">
                <div className="max-w-2xl mx-auto bg-white shadow-md rounded-lg p-3 sm:p-6">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-6">Account Settings</h1>
                    {error && <p className="text-red-500 mb-2 sm:mb-4 text-sm sm:text-base">{error}</p>}
                    {detailsUpdated && !isCardLinked && (
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-4">
                            <p className="text-blue-700">Details updated! Please link your card to use Pay on Delivery.</p>
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                        <div>
                            <label htmlFor="address" className="block text-gray-700 mb-1 text-sm sm:text-base">Shipping Address</label>
                            <input
                                type="text"
                                id="address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="w-full p-2 sm:p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                                placeholder="e.g., 123 Main St, Cape Town"
                                aria-label="Shipping address"
                            />
                        </div>
                        <div>
                            <label htmlFor="cardNumber" className="block text-gray-700 mb-1 text-sm sm:text-base">Card Number (Optional)</label>
                            <input
                                type="text"
                                id="cardNumber"
                                value={cardNumber}
                                onChange={(e) => setCardNumber(e.target.value)}
                                className="w-full p-2 sm:p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                                placeholder="e.g., 4111 1111 1111 1111"
                                aria-label="Card number"
                                disabled={isCardLinked}
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-2 sm:py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all duration-300 shadow-md hover:shadow-lg text-sm sm:text-base"
                            aria-label="Update details"
                            disabled={isLinking}
                        >
                            {isLinking ? 'Processing...' : 'Update Details'}
                        </button>
                        {(!isCardLinked) && (
                            <button
                                type="button"
                                onClick={handleLinkOrVerifyCard}
                                disabled={isLinking}
                                className={`w-full py-2 sm:py-3 mt-2 sm:mt-4 ${isLinking ? 'bg-gray-400' : 'bg-blue-500'} text-white rounded-md hover:${isLinking ? '' : 'bg-blue-600'} transition-all duration-300 shadow-md hover:shadow-lg text-sm sm:text-base`}
                                aria-label="Link or verify account"
                            >
                                {isLinking ? 'Linking...' : 'Link or Verify Account'}
                            </button>
                        )}
                        <p className="mt-2 sm:mt-4 text-xs sm:text-sm text-gray-500">
                            * You can update your card number here for record-keeping. Linking your card via Paystack is optional but required for Pay on Delivery. A small test charge of R1.00 will be applied and refunded immediately upon linking.
                        </p>
                    </form>
                    <p className="mt-2 sm:mt-4 text-gray-600 font-medium text-sm sm:text-base">
                        <button
                            onClick={() => setTimeout(() => navigate('/dashboard'), 0)}
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