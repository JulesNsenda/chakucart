import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductContext } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useToast } from '../context/ToastContext';
import axios from 'axios';

const Payment = () => {
    const { cart, clearCart } = useContext(ProductContext);
    const { user, updateUserDetails, isAuthenticated, isCardLinked, authorizationCode } = useAuth();
    const navigate = useNavigate();
    const [paymentMethod, setPaymentMethod] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/sign-in');
        } else if (cart.length === 0) {
            navigate('/cart');
        }
    }, [isAuthenticated, cart, navigate]);

    const subtotal = cart.reduce((sum, item) => sum + item.price * (item.cartQuantity || 1), 0);
    const tax = subtotal * 0.15; // 15% tax
    const shipping = 5 * 10; // 5km at R10/km
    const total = subtotal + tax + shipping;
    const totalInKobo = Math.round(total * 100);

    const handlePaystackPayment = async () => {
        setIsLoading(true);
        try {
            const response = await axios.post('http://localhost:5000/api/initialize-transaction', {
                email: user.email,
                subtotal: subtotal + tax, // Cart value (products + tax)
                shipping: shipping,
                cart,
            });

            const { reference } = response.data.data;
            const handler = window.PaystackPop.setup({
                key: process.env.PAYSTACK_SECRET_KEY || 'pk_test_91c1e6a74f8f8c435434ac584943fc6696c69a7c',
                email: user.email,
                amount: totalInKobo,
                currency: 'ZAR',
                ref: reference,
                callback: (response) => verifyPayment(response.reference),
                onClose: () => setIsLoading(false),
            });
            handler.openIframe();
        } catch (error) {
            showToast('Payment initialization failed', 'error');
            setIsLoading(false);
        }
    };

    const verifyPayment = async (reference) => {
        try {
            const response = await axios.post('http://localhost:5000/api/verify-transaction', {
                reference,
                cart,
                total: total.toFixed(2),
            });
            if (response.data.status === 'success') {
                clearCart();
                navigate('/order-confirmation', { state: { order: response.data.order } });
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
            if (!isCardLinked) {
                showToast('To use Pay on Delivery, you need to link or verify your card. Redirecting to account settings...', {
                    onClose: () => navigate('/account-settings'),
                }, 'warning');
                setIsLoading(false);
                return;
            }

            if (!authorizationCode) {
                showToast('No authorization code found. Please link your card first.', {
                    onClose: () => navigate('/account-settings'),
                }, 'warning');

                throw new Error('No authorization code found. Please link your card first.');
            }

            const response = await axios.post('http://localhost:5000/api/pay-on-delivery', {
                cart,
                total: total.toFixed(2),
                email: user.email,
                authorizationCode,
            });
            if (response.data.status === 'success') {
                clearCart();
                const codReference = response.data.reference; // Use the Paystack reference from the response
                updateUserDetails({ codReference });
                navigate('/order-tracking', { state: { orderId: response.data.reference } });
                showToast(`Pay on Delivery order placed for R${total.toFixed(2)}. Track your delivery to confirm receipt.`, 'success');
            } else {
                showToast('Payment failed', 'error');
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

    if (!isAuthenticated || cart.length === 0) return null;

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="flex-1 p-4">
                <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-6">Payment</h1>
                    <div className="mb-6 p-4 bg-gray-100 rounded-lg">
                        <h2 className="text-lg font-semibold text-gray-700 mb-2">Order Summary</h2>
                        <div className="flex justify-between mb-2">
                            <p className="text-gray-600">Subtotal</p>
                            <p className="text-gray-800">R{subtotal.toFixed(2)}</p>
                        </div>
                        <div className="flex justify-between mb-2">
                            <p className="text-gray-600">Tax (15%)</p>
                            <p className="text-gray-800">R{tax.toFixed(2)}</p>
                        </div>
                        <div className="flex justify-between mb-2">
                            <p className="text-gray-600">Shipping (R10/km, 5km) <span className="text-sm text-gray-500">(Paid to Rider)</span></p>
                            <p className="text-gray-800">R{shipping.toFixed(2)}</p>
                        </div>
                        <div className="flex justify-between mt-2 border-t pt-2">
                            <p className="text-xl font-bold text-gray-800">Total</p>
                            <p className="text-xl font-bold text-blue-600">R{total.toFixed(2)}</p>
                        </div>
                    </div>
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-gray-700 mb-2">Select Payment Method</h2>
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
                                Pay Now (Paystack)
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
                                Pay on Delivery
                            </label>
                        </div>
                    </div>
                    <button
                        onClick={handlePayment}
                        disabled={isLoading}
                        className={`w-full py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all duration-300 ${isLoading ? 'bg-gray-400 cursor-not-allowed' : ''}`}
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