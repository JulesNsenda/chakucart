import React, { useContext, useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ProductContext } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import axios from 'axios';

const Dashboard = () => {
    const { cart, setCartItems } = useContext(ProductContext); // Updated to use setCartItems
    const { user, isAuthenticated, hasRequiredDetails, authorizationCode } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [ongoingOrders, setOngoingOrders] = useState([]);
    const [allOrders, setAllOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isAuthenticated || !user) {
            navigate('/sign-in');
            return;
        }
        fetchOrdersFromLocalStorage();
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        if (cart.length > 0) {
            const subtotal = cart.reduce((sum, item) => sum + item.price * (item.cartQuantity || 1), 0).toFixed(2);
            const tax = (parseFloat(subtotal) * 0.15).toFixed(2);
            const shipping = 50.00;
            const total = (parseFloat(subtotal) + parseFloat(tax) + shipping).toFixed(2);

            setOngoingOrders([{
                id: `ORD-${Date.now()}`,
                items: cart,
                subtotal,
                tax,
                shipping,
                total,
                status: 'Pending Checkout'
            }]);
        } else {
            setOngoingOrders([]);
        }
    }, [cart]);

    const fetchOrdersFromLocalStorage = () => {
        const orders = JSON.parse(localStorage.getItem('freshCartOrders') || '[]');
        const userOrders = orders.filter(order => order.email === user.email);
        console.log('Fetched orders for user:', userOrders);
        setAllOrders(userOrders);
    };

    const handleDeliveryConfirmation = useCallback(async (orderId, reference, paymentMethod) => {
        try {
            setIsLoading(true);
            if (paymentMethod === 'Pay on Delivery') {
                if (!authorizationCode) {
                    showToast('No authorization code found. Please link your card.', 'warning', {
                        onClose: () => navigate('/account-settings'),
                    });
                    return;
                }
                const chargeResponse = await axios.post(
                    'http://localhost:5000/api/confirm-delivery',
                    {
                        orderId,
                        email: user.email,
                        authorizationCode,
                        reference,
                    }
                );
                if (chargeResponse.data.status !== 'success') {
                    throw new Error(chargeResponse.data.message || 'Failed to confirm delivery.');
                }
            }
            const updatedOrders = allOrders.map(order =>
                order.id === orderId ? { ...order, status: 'Delivered' } : order
            );
            localStorage.setItem('freshCartOrders', JSON.stringify(updatedOrders));
            setAllOrders(updatedOrders);
            showToast('Delivery confirmed!', 'success');
        } catch (error) {
            showToast(`Failed to confirm delivery: ${error.message || 'Unknown error'}`, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [user.email, authorizationCode, navigate, showToast, allOrders]);

    const handleReplaceOrder = (order) => {
        const newOrder = {
            ...order,
            id: `ORD-${Date.now()}`,
            status: 'Pending Checkout',
            createdAt: new Date().toISOString(),
            paystackReference: null,
        };
        const updatedOrders = [...allOrders, newOrder];
        localStorage.setItem('freshCartOrders', JSON.stringify(updatedOrders));
        setAllOrders(updatedOrders);
        setCartItems(order.items.map(item => ({ ...item, cartQuantity: item.cartQuantity || 1 }))); // Recreate cart
        showToast('Order replaced successfully! Proceed to payment.', 'success');
    };

    if (!isAuthenticated || !user) return null;

    const pendingOrders = allOrders.filter(order => order.status === 'Pending' || order.status === 'Confirmed');
    const completedOrders = allOrders.filter(order => order.status === 'Delivered');

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="flex-1 p-4">
                <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

                    {/* Ongoing Orders */}
                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Ongoing Orders</h2>
                        {ongoingOrders.length > 0 ? (
                            <div className="space-y-4">
                                {ongoingOrders.map((order) => (
                                    <div key={order.id} className="p-4 bg-gray-100 rounded-lg shadow-md">
                                        <p className="text-gray-700 font-medium">Order #{order.id}</p>
                                        <p className="text-gray-600">Items: {order.items.length}</p>
                                        <p className="text-gray-600">Subtotal: R{order.subtotal}</p>
                                        <p className="text-gray-600">Tax (15%): R{order.tax}</p>
                                        <p className="text-gray-600">Delivery Fee: R{order.shipping}</p>
                                        <p className="text-gray-600">Total: <span className="text-blue-600 font-bold">R{order.total}</span></p>
                                        <p className="text-gray-600">Status: {order.status}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 font-medium">No ongoing orders at the moment.</p>
                        )}
                        {hasRequiredDetails && ongoingOrders.length > 0 && (
                            <button
                                onClick={() => navigate('/payment')}
                                className="mt-4 px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all duration-300"
                            >
                                Proceed to Payment
                            </button>
                        )}
                    </section>

                    {/* Pending Deliveries */}
                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Pending Deliveries</h2>
                        {isLoading ? (
                            <p className="text-gray-600">Loading pending orders...</p>
                        ) : pendingOrders.length === 0 ? (
                            <p className="text-gray-500 font-medium">No pending deliveries found.</p>
                        ) : (
                            <div className="space-y-4">
                                {pendingOrders.map((order) => (
                                    <div key={order.id} className="p-4 bg-gray-100 rounded-lg shadow-md">
                                        <p className="text-gray-700 font-medium">Order #{order.id}</p>
                                        <p className="text-gray-600">Total: R{order.total}</p>
                                        <p className="text-gray-600">Status: {order.status}</p>
                                        <p className="text-gray-600">Created At: {new Date(order.createdAt).toLocaleString()}</p>
                                        <p className="text-gray-600">Paystack Reference: {order.paystackReference || 'N/A'}</p>
                                        <button
                                            onClick={() => handleDeliveryConfirmation(order.id, order.paystackReference, order.paymentMethod)}
                                            className={`mt-2 py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all duration-300 ${isLoading ? 'bg-gray-400 cursor-not-allowed' : ''}`}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? 'Processing...' : 'Confirm Delivery'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Completed Orders */}
                    <section className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Completed Orders</h2>
                        {completedOrders.length === 0 ? (
                            <p className="text-gray-500 font-medium">No completed orders yet.</p>
                        ) : (
                            <div className="space-y-4">
                                {completedOrders.map((order) => (
                                    <div key={order.id} className="p-4 bg-gray-200 rounded-lg shadow-md">
                                        <p className="text-gray-700 font-medium">Order #{order.id}</p>
                                        <p className="text-gray-600">Total: R{order.total}</p>
                                        <p className="text-gray-600">Status: {order.status}</p>
                                        <p className="text-gray-600">Created At: {new Date(order.createdAt).toLocaleString()}</p>
                                        <button
                                            onClick={() => handleReplaceOrder(order)}
                                            className="mt-2 py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all duration-300"
                                        >
                                            Replace Order
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Required Details Warning */}
                    {!hasRequiredDetails && (
                        <div className="mt-6 p-4 bg-yellow-100 rounded-lg shadow-md">
                            <p className="text-yellow-800 font-medium">
                                Please update your shipping address and payment details to proceed with checkout.{' '}
                                <Link to="/account-settings" className="text-green-600 font-medium hover:text-green-700 underline">
                                    Update Details
                                </Link>
                            </p>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Dashboard;