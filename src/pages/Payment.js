import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ProductContext } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useToast } from '../context/ToastContext';
import axios from 'axios';

const Payment = () => {
    const { cart, clearCart, marketDistance } = useContext(ProductContext);
    const { user, updateUserDetails, isAuthenticated, isCardLinked, authorizationCode } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();
    const [paymentMethod, setPaymentMethod] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const API_BASE_URL = process.env.NODE_ENV === 'production'
        ? '/api'
        : 'http://localhost:5000/api';

    const { subtotal, tax, shipping, total, itemCount } = location.state || {};

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/sign-in');
        } else if (!subtotal) {
            navigate('/cart');
        }
    }, [isAuthenticated, subtotal, navigate]);

    const totalInKobo = Math.round(total * 100);

    const saveOrderToLocalStorage = (order) => {
        const existingOrders = JSON.parse(localStorage.getItem('freshCartOrders') || '[]');
        const updatedOrders = [...existingOrders, order];
        localStorage.setItem('freshCartOrders', JSON.stringify(updatedOrders));
    };

    const handlePaystackPayment = async () => {
        setIsLoading(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/initialize-transaction`, {
                email: user.email,
                subtotal: subtotal + tax,
                shipping,
                cart,
            });

            const { reference } = response.data.data;
            const handler = window.PaystackPop.setup({
                key: process.env.REACT_APP_PAYSTACK_PUBLIC_KEY,
                email: user.email,
                amount: totalInKobo,
                currency: 'ZAR',
                ref: reference,
                callback: (response) => verifyPayment(response.reference, 'Pay Now'),
                onClose: () => setIsLoading(false),
            });
            handler.openIframe();
        } catch (error) {
            showToast('Payment initialization failed', 'error');
            setIsLoading(false);
        }
    };

    const verifyPayment = async (reference, paymentMethod) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/verify-transaction`, {
                reference,
                email: user.email,
            });
            if (response.data.status === 'success') {
                const transactionId = response.data.data.transactionId || response.data.data.id || response.data.data.reference;
                const order = {
                    id: `ORD-${Date.now()}`,
                    items: [...cart],
                    total: total.toFixed(2),
                    status: 'Confirmed',
                    paymentMethod,
                    createdAt: new Date().toISOString(),
                    paystackReference: reference,
                    transactionId,
                    subtotal,
                    shipping,
                    email: user.email,
                };
                saveOrderToLocalStorage(order);
                clearCart();
                setTimeout(() => navigate('/order-confirmation'), 100);
                showToast(`Order placed successfully via ${paymentMethod}!`, 'success');
            } else {
                showToast('Payment verification failed.', 'error');
            }
        } catch (error) {
            showToast('Error verifying payment.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePayOnDelivery = async () => {
        setIsLoading(true);
        try {
            if (!isCardLinked || !authorizationCode) {
                showToast('Please link your card for Pay on Delivery.', 'warning', {
                    onClose: () => navigate('/account-settings'),
                });
                setIsLoading(false);
                return;
            }

            const response = await axios.post(`${API_BASE_URL}/pay-on-delivery`, {
                cart,
                total: total.toFixed(2),
                email: user.email,
                authorizationCode,
            });

            if (response.data.status === 'success') {
                const order = {
                    ...response.data.order,
                    paymentMethod: 'Pay on Delivery',
                    items: [...cart],
                    subtotal,
                    shipping,
                    email: user.email,
                };
                saveOrderToLocalStorage(order);
                clearCart();
                updateUserDetails({ codReference: response.data.reference });
                setTimeout(() => navigate('/order-confirmation'), 100);
                showToast(`Pay on Delivery order placed for R${total.toFixed(2)}.`, 'success');
            } else {
                throw new Error(response.data.message || 'Payment failed');
            }
        } catch (error) {
            showToast(error.message || 'Error processing pay on delivery.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePayment = () => {
        if (!paymentMethod) {
            showToast('Please select a payment method.', 'warning');
            return;
        }
        if (paymentMethod === 'paystack') {
            handlePaystackPayment();
        } else if (paymentMethod === 'cod') {
            handlePayOnDelivery();
        }
    };

    if (!isAuthenticated || !subtotal) return null;

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="flex-1 p-2 sm:p-4">
                <div className="max-w-sm sm:max-w-2xl mx-auto bg-white shadow-md rounded-lg p-4 sm:p-6">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Payment</h1>
                    <div className="mb-4 sm:mb-6 p-2 sm:p-4 bg-gray-100 rounded-lg">
                        <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-2">Order Summary</h2>
                        <div className="flex justify-between mb-1 sm:mb-2">
                            <p className="text-gray-600 text-sm sm:text-base">Subtotal</p>
                            <p className="text-gray-800 text-sm sm:text-base">R{subtotal.toFixed(2)}</p>
                        </div>
                        <div className="flex justify-between mb-1 sm:mb-2">
                            <p className="text-gray-600 text-sm sm:text-base">Tax (15%)</p>
                            <p className="text-gray-800 text-sm sm:text-base">R{tax.toFixed(2)}</p>
                        </div>
                        <div className="flex justify-between mb-1 sm:mb-2">
                            <p className="text-gray-600 text-sm sm:text-base">Shipping (R10/km, {marketDistance}km) <span className="text-xs sm:text-sm text-gray-500">(Paid to Rider)</span></p>
                            <p className="text-gray-800 text-sm sm:text-base">R{shipping.toFixed(2)}</p>
                        </div>
                        <div className="flex justify-between mt-1 sm:mt-2 border-t pt-1 sm:pt-2">
                            <p className="text-lg sm:text-xl font-bold text-gray-800">Total</p>
                            <p className="text-lg sm:text-xl font-bold text-blue-600">R{total.toFixed(2)}</p>
                        </div>
                    </div>
                    <div className="mb-4 sm:mb-6">
                        <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-2">Select Payment Method</h2>
                        <div className="space-y-2">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="payment"
                                    value="paystack"
                                    checked={paymentMethod === 'paystack'}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="mr-2"
                                />
                                <span className="text-sm sm:text-base">Pay Now (Paystack)</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="payment"
                                    value="cod"
                                    checked={paymentMethod === 'cod'}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="mr-2"
                                />
                                <span className="text-sm sm:text-base">Pay on Delivery</span>
                            </label>
                        </div>
                    </div>
                    <button
                        onClick={handlePayment}
                        disabled={isLoading}
                        className={`w-full py-2 sm:py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all duration-300 text-sm sm:text-base ${isLoading ? 'bg-gray-400 cursor-not-allowed' : ''}`}
                    >
                        {isLoading ? 'Processing...' : 'Confirm Payment'}
                    </button>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Payment;