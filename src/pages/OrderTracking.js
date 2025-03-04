// src/pages/OrderTracking.js
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import axios from 'axios';
import { useToast } from '../context/ToastContext';

const OrderTracking = () => {
    const { user, isAuthenticated, authorizationCode, codReference } = useAuth(); // Ensure codReference is included
    const [pendingOrders, setPendingOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { showToast } = useToast();

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/sign-in');
        } else {
            fetchPendingOrders();
        }
    }, [isAuthenticated, navigate]);

    const fetchPendingOrders = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get(`http://localhost:5000/api/pending-orders?email=${user.email}`);
            setPendingOrders(response.data.orders || []);
        } catch (error) {
            showToast('Failed to load pending orders.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Use useCallback to memoize handleDeliveryConfirmation
    const handleDeliveryConfirmation = useCallback(async (orderId) => {
        if (!authorizationCode) {
            showToast('No authorization code found. Please link your card first.', 'warning');
            navigate('/account-settings');
            return;
        }

        if (!codReference) {
            showToast('No POD reference found. Please place the order again.', 'warning');
            return;
        }

        console.log('POD Reference (for card tap/swipe): ', codReference);

        try {
            setIsLoading(true);
            // Simulate card tap/swipe on delivery by charging via the server
            const chargeResponse = await axios.post(
                'http://localhost:5000/api/confirm-delivery',
                {
                    orderId,
                    email: user.email,
                    authorizationCode,
                    reference: codReference,
                }
            );

            if (chargeResponse.data.status === 'success') {
                showToast('Delivery confirmed, payment processed successfully via card tap/swipe!', 'success');
                fetchPendingOrders(); // Refresh orders after confirmation
            } else {
                throw new Error(chargeResponse.data.message || 'Failed to confirm delivery via card tap/swipe.');
            }
        } catch (error) {
            showToast('Failed to confirm delivery via card tap/swipe: ' + (error.message || 'Unknown error'), 'error');
        } finally {
            setIsLoading(false);
        }
    }, [user.email, authorizationCode, codReference, navigate, pendingOrders]);

    if (!isAuthenticated) return null;

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="flex-1 p-4">
                <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-6">Order Tracking</h1>
                    {error && <p className="text-red-500 mb-4">{error}</p>}
                    {isLoading ? (
                        <p className="text-gray-600">Loading orders...</p>
                    ) : pendingOrders.length === 0 ? (
                        <p className="text-gray-600">No pending deliveries found.</p>
                    ) : (
                        <div className="space-y-4">
                            {pendingOrders.map((order) => (
                                <div key={order.id} className="p-4 bg-gray-100 rounded-lg">
                                    <p>Order ID: {order.id}</p>
                                    <p>Total: R{order.total.toFixed(2)}</p>
                                    <p>Status: {order.status}</p>
                                    <p>Created At: {new Date(order.createdAt).toLocaleString()}</p>
                                    <p>Paystack Reference: {order.paystackReference}</p> {/* Debug: Show Paystack reference */}
                                    <button
                                        onClick={() => handleDeliveryConfirmation(order.id)}
                                        className="mt-2 py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all duration-300"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Processing...' : 'Confirm Card Tap/Swipe on Delivery'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
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

export default OrderTracking;