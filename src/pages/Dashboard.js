import React, { useContext, useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ProductContext } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import axios from 'axios';
import CustomDialog from '../components/CustomDialog';
import useCustomNavigate from '../hooks/useCustomNavigate';

const Dashboard = () => {
    const { cart, setCartItems, marketDistance } = useContext(ProductContext);
    const { user, isAuthenticated, hasRequiredDetails, authorizationCode } = useAuth();
    const { showToast } = useToast();
    const navigate = useCustomNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [ongoingOrders, setOngoingOrders] = useState([]);
    const [allOrders, setAllOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('ongoing');
    const [visibleCompletedOrders, setVisibleCompletedOrders] = useState(2);
    const [visibleRefundedOrders, setVisibleRefundedOrders] = useState(2);
    const [searchTerm, setSearchTerm] = useState('');
    const [showRefundDialog, setShowRefundDialog] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [refundReason, setRefundReason] = useState('');
    const API_BASE_URL = process.env.NODE_ENV === 'production'
        ? '/api'
        : 'http://localhost:5000/api';

    const calculateTax = (subtotal) => {
        return (parseFloat(subtotal) * 0.15).toFixed(2);
    };

    useEffect(() => {
        const tabFromUrl = searchParams.get('tab');
        if (tabFromUrl && ['ongoing', 'pending', 'completed', 'refunds'].includes(tabFromUrl)) {
            setActiveTab(tabFromUrl);
        }
    }, [searchParams]);

    useEffect(() => {
        if (cart.length > 0) {
            const subtotal = cart.reduce((sum, item) => sum + item.price * (item.cartQuantity || 1), 0).toFixed(2);
            const tax = calculateTax(subtotal);
            const shipping = (marketDistance * 10).toFixed(2);
            const total = (parseFloat(subtotal) + parseFloat(tax) + parseFloat(shipping)).toFixed(2);

            setOngoingOrders([{
                id: `ORD-${Date.now()}`,
                items: cart,
                subtotal,
                tax,
                shipping,
                total,
                status: 'Pending Checkout',
                paymentMethod: 'Pay Now',
                createdAt: new Date().toISOString(),
                paystackReference: null,
                transactionId: null,
            }]);
        } else {
            setOngoingOrders([]);
        }
    }, [cart, marketDistance]);

    const fetchOrdersFromLocalStorage = useCallback(() => {
        if (!user) return;
        const orders = JSON.parse(localStorage.getItem('freshCartOrders') || '[]');
        const userOrders = orders.filter(order => order.email === user.email);

        setAllOrders(prevOrders => {
            return JSON.stringify(prevOrders) !== JSON.stringify(userOrders) ? userOrders : prevOrders;
        });
    }, [user]);

    const handleDeliveryConfirmation = useCallback(async (orderId, reference, paymentMethod) => {
        setIsLoading(true);
        if (paymentMethod === 'Pay on Delivery') {
            if (!authorizationCode) {
                showToast('No authorization code found. Please link your card.', 'warning', {
                    onClose: () => navigate('/account-settings'),
                });
                return;
            }
            const chargeResponse = await axios.post(
                `${API_BASE_URL}/confirm-delivery`,
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
        setIsLoading(false);
        navigate('/dashboard?tab=completed');
    }, [user, authorizationCode, navigate, showToast, allOrders]);

    const handleReplaceOrder = (order) => {
        const newOrder = {
            ...order,
            id: `ORD-${Date.now()}`,
            status: 'Pending Checkout',
            createdAt: new Date().toISOString(),
            paystackReference: null,
            transactionId: null,
        };
        const updatedOrders = [...allOrders, newOrder];
        localStorage.setItem('freshCartOrders', JSON.stringify(updatedOrders));
        setAllOrders(updatedOrders);
        setCartItems(order.items.map(item => ({ ...item, cartQuantity: item.cartQuantity || 1 })));
        showToast('Order replaced successfully! Proceed to payment.', 'success');
    };

    const handleRefundRequest = async () => {
        if (!refundReason.trim()) {
            showToast('Please provide a reason for the refund.', 'error');
            return;
        }

        setIsLoading(true);
        const order = selectedOrder;

        if (order.paymentMethod === 'Pay Now' && order.transactionId) {
            const amount = Math.round(parseFloat(order.total) * 100);
            const refundResponse = await axios.post(
                `${API_BASE_URL}/request-refund`,
                {
                    transactionId: order.transactionId,
                    amount: amount,
                    reason: refundReason,
                }
            );
            showToast('Request for Refund queued.', 'info');
        } else if (order.paymentMethod === 'Pay on Delivery') {
            const podRefundResponse = await axios.post(
                `${API_BASE_URL}/request-pod-refund`,
                {
                    orderId: order.id,
                    email: user.email,
                    reason: refundReason,
                }
            );
            if (podRefundResponse.data.status !== 'success') {
                throw new Error(podRefundResponse.data.message || 'Failed to process Pay on Delivery refund.');
            }
            showToast('Refund for Pay on Delivery orders requires manual processing. Admin notified.', 'info');
        }

        const updatedOrders = allOrders.map(o =>
            o.id === order.id
                ? {
                    ...o,
                    status: 'Refunded',
                    refundReason: refundReason,
                    refundedAt: new Date().toISOString(),
                    refundStatus: order.paymentMethod === 'Pay Now' ? 'Processed' : 'Pending Manual Review',
                }
                : o
        );
        localStorage.setItem('freshCartOrders', JSON.stringify(updatedOrders));
        setAllOrders(updatedOrders);
        setActiveTab('refunds');
        showToast('Refund requested successfully!', 'success');
        setShowRefundDialog(false);
        setSelectedOrder(null);
        setRefundReason('');
        setIsLoading(false);
    };

    const openRefundDialog = (order) => {
        setSelectedOrder(order);
        setShowRefundDialog(true);
    };

    const closeRefundDialog = () => {
        setShowRefundDialog(false);
        setSelectedOrder(null);
        setRefundReason('');
    };

    useEffect(() => {
        if (!isAuthenticated || !user) {
            navigate('/sign-in');
            return;
        }
        fetchOrdersFromLocalStorage();
    }, [isAuthenticated, user, navigate, fetchOrdersFromLocalStorage]);

    const normalizeText = (text) => text.toLowerCase().trim();
    const filteredOrders = allOrders.filter(order => {
        if (!searchTerm.trim()) return true;
        const normalizedSearch = normalizeText(searchTerm);
        if (normalizeText(order.id).includes(normalizedSearch)) return true;
        return order.items.some(item => normalizeText(item.name).includes(normalizedSearch));
    });

    const pendingOrders = filteredOrders.filter(order => order.status === 'Pending' || order.status === 'Confirmed');
    const completedOrders = filteredOrders
        .filter(order => order.status === 'Delivered')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const refundedOrders = filteredOrders
        .filter(order => order.status === 'Refunded')
        .sort((a, b) => new Date(b.refundedAt) - new Date(a.refundedAt));

    const loadMoreCompletedOrders = () => {
        setVisibleCompletedOrders(prev => prev + 2);
    };

    const loadMoreRefundedOrders = () => {
        setVisibleRefundedOrders(prev => prev + 2);
    };

    const formatCurrency = (amount) => {
        return parseFloat(amount).toFixed(2);
    };

    const renderOrderCard = (order, isCompleted = false, isRefunded = false) => {
        return (
            <div key={order.id} className="p-3 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 bg-white border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                    <div>
                        <p className="text-gray-700 font-medium text-sm">Order #{order.id}</p>
                        <p className="text-gray-600 text-xs">
                            {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === 'Pending' || order.status === 'Confirmed' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                                order.status === 'Refunded' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                            {order.status}
                        </span>
                        <p className="text-gray-800 font-bold text-sm mt-1">R{formatCurrency(order.total)}</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                    <button
                        onClick={() => navigate(`/order-details/${order.id}`)}
                        className="py-1 px-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-all duration-200 text-xs font-medium"
                    >
                        View Details
                    </button>

                    {order.status === 'Pending Checkout' && hasRequiredDetails && (
                        <button
                            onClick={() => navigate('/payment', {
                                state: {
                                    subtotal: parseFloat(order.subtotal),
                                    tax: parseFloat(order.tax),
                                    shipping: parseFloat(order.shipping),
                                    total: parseFloat(order.total),
                                    itemCount: order.items.reduce((sum, item) => sum + (item.cartQuantity || 1), 0)
                                }
                            })}
                            className="py-1 px-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all duration-200 text-xs font-medium"
                        >
                            Proceed to Payment
                        </button>
                    )}

                    {(order.status === 'Pending' || order.status === 'Confirmed') && (
                        <button
                            onClick={() => handleDeliveryConfirmation(order.id, order.paystackReference, order.paymentMethod)}
                            className={`py-1 px-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all duration-200 text-xs font-medium ${isLoading ? 'bg-gray-400 cursor-not-allowed' : ''}`}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Processing...' : 'Confirm Delivery'}
                        </button>
                    )}

                    {isCompleted && (
                        <>
                            <button
                                onClick={() => handleReplaceOrder(order)}
                                className="py-1 px-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all duration-200 text-xs font-medium"
                            >
                                Reorder
                            </button>
                            <button
                                onClick={() => openRefundDialog(order)}
                                className="py-1 px-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-all duration-200 text-xs font-medium"
                                disabled={order.status === 'Refunded'}
                            >
                                {order.status === 'Refunded' ? 'Refunded' : 'Request Refund'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="flex-1 p-3">
                <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-4">
                    <h1 className="text-xl font-bold text-gray-800 mb-4">Dashboard</h1>

                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Search by order number or item..."
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            aria-label="Search orders by order number or item"
                        />
                    </div>

                    <div className="mb-4 sticky top-0 bg-white z-10">
                        <div className="overflow-x-auto -mx-4 px-4">
                            <nav className="flex whitespace-nowrap border-b border-gray-200 gap-1">
                                {['ongoing', 'pending', 'completed', 'refunds'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-3 py-2 font-medium text-sm transition-all ${activeTab === tab
                                            ? 'border-b-2 border-blue-500 text-blue-600'
                                            : 'text-gray-600 hover:text-gray-800'
                                            }`}
                                    >
                                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {activeTab === 'ongoing' && (
                        <section className="mb-6">
                            <h2 className="sr-only">Ongoing Orders</h2>
                            {ongoingOrders.length > 0 ? (
                                <div className="space-y-4">
                                    {ongoingOrders.map((order) => renderOrderCard(order))}
                                </div>
                            ) : (
                                <p className="text-gray-500 font-medium text-sm py-4 text-center">No ongoing orders at the moment.</p>
                            )}
                        </section>
                    )}

                    {activeTab === 'pending' && (
                        <section className="mb-6">
                            <h2 className="sr-only">Pending Deliveries</h2>
                            {isLoading ? (
                                <p className="text-gray-600 text-sm text-center py-4">Loading pending orders...</p>
                            ) : pendingOrders.length === 0 ? (
                                <p className="text-gray-500 font-medium text-sm text-center py-4">No pending deliveries found.</p>
                            ) : (
                                <div className="space-y-4">
                                    {pendingOrders.map((order) => renderOrderCard(order))}
                                </div>
                            )}
                        </section>
                    )}

                    {activeTab === 'completed' && (
                        <section className="mb-6">
                            <h2 className="sr-only">Completed Orders</h2>
                            {completedOrders.length === 0 ? (
                                <p className="text-gray-500 font-medium text-sm text-center py-4">No completed orders yet.</p>
                            ) : (
                                <>
                                    <div className="space-y-4">
                                        {completedOrders.slice(0, visibleCompletedOrders).map((order) =>
                                            renderOrderCard(order, true)
                                        )}
                                    </div>
                                    {visibleCompletedOrders < completedOrders.length && (
                                        <button
                                            onClick={loadMoreCompletedOrders}
                                            className="mt-4 px-4 py-2 w-full bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm"
                                        >
                                            Load More
                                        </button>
                                    )}
                                </>
                            )}
                        </section>
                    )}

                    {activeTab === 'refunds' && (
                        <section className="mb-6">
                            <h2 className="sr-only">Refunds</h2>
                            {refundedOrders.length === 0 ? (
                                <p className="text-gray-500 font-medium text-sm text-center py-4">No refunds yet.</p>
                            ) : (
                                <>
                                    <div className="space-y-4">
                                        {refundedOrders.slice(0, visibleRefundedOrders).map((order) =>
                                            renderOrderCard(order, false, true)
                                        )}
                                    </div>
                                    {visibleRefundedOrders < refundedOrders.length && (
                                        <button
                                            onClick={loadMoreRefundedOrders}
                                            className="mt-4 px-4 py-2 w-full bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm"
                                        >
                                            Load More
                                        </button>
                                    )}
                                </>
                            )}
                        </section>
                    )}

                    {!hasRequiredDetails && (
                        <div className="mt-4 p-3 bg-yellow-100 rounded-lg shadow-md">
                            <p className="text-yellow-800 font-medium text-sm">
                                Please update your shipping address and payment details to proceed with checkout.{' '}
                                <Link to="/account-settings" className="text-green-600 font-medium hover:text-green-700 underline">
                                    Update Details
                                </Link>
                            </p>
                        </div>
                    )}

                    <CustomDialog
                        isOpen={showRefundDialog}
                        onConfirm={handleRefundRequest}
                        onCancel={closeRefundDialog}
                        message={
                            <div className="w-full mx-auto">
                                <p className="text-gray-600 mb-4 text-sm">
                                    Are you sure you want to request a refund for Order #{selectedOrder?.id}?
                                </p>
                                <textarea
                                    value={refundReason}
                                    onChange={(e) => setRefundReason(e.target.value)}
                                    placeholder="Enter reason for refund (required)"
                                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    rows="3"
                                    required
                                />
                            </div>
                        }
                    />
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Dashboard;