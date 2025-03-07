import React, { useContext, useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ProductContext } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import axios from 'axios';
import CustomDialog from '../components/CustomDialog';

const Dashboard = () => {
    const { cart, setCartItems } = useContext(ProductContext);
    const { user, isAuthenticated, hasRequiredDetails, authorizationCode } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
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
                status: 'Pending Checkout',
                paymentMethod: 'Pay Now',
                createdAt: new Date().toISOString(),
                paystackReference: null,
                transactionId: null,
            }]);
        } else {
            setOngoingOrders([]);
        }
    }, [cart]);

    const fetchOrdersFromLocalStorage = () => {
        const orders = JSON.parse(localStorage.getItem('freshCartOrders') || '[]');
        const userOrders = orders.filter(order => order.email === user.email);
        setAllOrders(userOrders);
    };

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
    }, [user.email, authorizationCode, navigate, showToast, allOrders]);

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

    if (!isAuthenticated || !user) return null;

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

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="flex-1 p-2 sm:p-4">
                <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-4 sm:p-6">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Dashboard</h1>

                    {/* Search Bar for Orders */}
                    <div className="mb-4 sm:mb-6">
                        <input
                            type="text"
                            placeholder="Search by order number or item..."
                            className="w-full p-2 sm:p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 text-sm sm:text-base"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            aria-label="Search orders by order number or item"
                        />
                    </div>

                    {/* Tabs for Orders */}
                    {/* Tabs for Orders */}
                    <div className="mb-4 sm:mb-6">
                        <nav className="flex overflow-x-auto sm:flex-wrap border-b border-gray-200 gap-2 whitespace-nowrap">
                            {['ongoing', 'pending', 'completed', 'refunds'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-3 py-2 sm:px-4 sm:py-2 font-medium text-sm sm:text-base transition-all ${activeTab === tab ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600 hover:text-gray-800'
                                        }`}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)} Orders
                                </button>
                            ))}
                        </nav>
                    </div>


                    {/* Order Content (Tabbed) */}
                    {activeTab === 'ongoing' && (
                        <section className="mb-6 sm:mb-8">
                            <h2 className="sr-only">Ongoing Orders</h2>
                            {ongoingOrders.length > 0 ? (
                                <div className="space-y-4">
                                    {ongoingOrders.map((order) => (
                                        <div key={order.id} className="p-3 sm:p-4 bg-gray-100 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
                                            <p className="text-gray-700 font-medium text-sm sm:text-base">Order #{order.id}</p>
                                            <p className="text-gray-600 text-xs sm:text-sm">Items: {order.items.length}</p>
                                            <p className="text-gray-600 text-xs sm:text-sm">Subtotal: R{order.subtotal}</p>
                                            <p className="text-gray-600 text-xs sm:text-sm">Tax (15%): R{order.tax}</p>
                                            <p className="text-gray-600 text-xs sm:text-sm">Delivery Fee: R{order.shipping}</p>
                                            <p className="text-gray-600 text-xs sm:text-sm">
                                                Total: <span className="text-blue-600 font-bold">R{order.total}</span>
                                            </p>
                                            <p className="text-gray-600 text-xs sm:text-sm">Status: {order.status}</p>
                                            <p className="text-gray-600 text-xs sm:text-sm">Paystack Reference: {order.paystackReference || 'N/A'}</p>
                                            <p className="text-gray-600 text-xs sm:text-sm">Transaction ID: {order.transactionId || 'N/A'}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 font-medium text-sm sm:text-base">No ongoing orders at the moment.</p>
                            )}
                            {hasRequiredDetails && ongoingOrders.length > 0 && (
                                <button
                                    onClick={() => navigate('/payment')}
                                    className="mt-4 px-4 sm:px-6 py-2 sm:py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all duration-200 text-sm sm:text-base"
                                    aria-label="Proceed to payment"
                                >
                                    Proceed to Payment
                                </button>
                            )}
                        </section>
                    )}

                    {activeTab === 'pending' && (
                        <section className="mb-6 sm:mb-8">
                            <h2 className="sr-only">Pending Deliveries</h2>
                            {isLoading ? (
                                <p className="text-gray-600 text-sm sm:text-base">Loading pending orders...</p>
                            ) : pendingOrders.length === 0 ? (
                                <p className="text-gray-500 font-medium text-sm sm:text-base">No pending deliveries found.</p>
                            ) : (
                                <div className="space-y-4">
                                    {pendingOrders.map((order) => (
                                        <div key={order.id} className="p-3 sm:p-4 bg-gray-100 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
                                            <div className="grid grid-cols-1 gap-3 sm:gap-4">
                                                {/* Order Summary */}
                                                <div>
                                                    <p className="text-gray-700 font-medium text-sm sm:text-base">Order #{order.id}</p>
                                                    <p className="text-gray-600 text-xs sm:text-sm">Created At: {new Date(order.createdAt).toLocaleString()}</p>
                                                    <p className="text-gray-600 text-xs sm:text-sm">Payment Method: {order.paymentMethod}</p>
                                                    <p className="text-gray-600 text-xs sm:text-sm">Total: R{order.total}</p>
                                                    <p className="text-gray-600 text-xs sm:text-sm">Status: {order.status}</p>
                                                    <p className="text-gray-600 text-xs sm:text-sm">Paystack Reference: {order.paystackReference || 'N/A'}</p>
                                                    <p className="text-gray-600 text-xs sm:text-sm">Transaction ID: {order.transactionId || 'N/A'}</p>
                                                </div>

                                                {/* Order Items */}
                                                <div>
                                                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">Order Items</h3>
                                                    <div className="space-y-2">
                                                        {order.items.map((item) => (
                                                            <div key={item.id} className="flex justify-between items-center p-2 bg-white rounded-md shadow-sm hover:shadow-md transition-shadow duration-200">
                                                                <span className="text-gray-700 text-xs sm:text-sm">{item.name}</span>
                                                                <span className="text-gray-600 text-xs sm:text-sm">Qty: {item.cartQuantity || 1}</span>
                                                                <span className="text-gray-800 font-medium text-xs sm:text-sm">
                                                                    R{(item.price * (item.cartQuantity || 1)).toFixed(2)}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleDeliveryConfirmation(order.id, order.paystackReference, order.paymentMethod)}
                                                className={`mt-4 py-2 sm:py-2 px-4 sm:px-4 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all duration-200 text-sm sm:text-base ${isLoading ? 'bg-gray-400 cursor-not-allowed' : ''
                                                    }`}
                                                disabled={isLoading}
                                            >
                                                {isLoading ? 'Processing...' : 'Confirm Delivery'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}

                    {activeTab === 'completed' && (
                        <section className="mb-6 sm:mb-8">
                            <h2 className="sr-only">Completed Orders</h2>
                            {completedOrders.length === 0 ? (
                                <p className="text-gray-500 font-medium text-sm sm:text-base">No completed orders yet.</p>
                            ) : (
                                <>
                                    <div className="space-y-4">
                                        {completedOrders.slice(0, visibleCompletedOrders).map((order) => (
                                            <div key={order.id} className="p-3 sm:p-4 bg-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
                                                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                                                    {/* Order Summary */}
                                                    <div>
                                                        <p className="text-gray-700 font-medium text-sm sm:text-base">Order #{order.id}</p>
                                                        <p className="text-gray-600 text-xs sm:text-sm">Created At: {new Date(order.createdAt).toLocaleString()}</p>
                                                        <p className="text-gray-600 text-xs sm:text-sm">Payment Method: {order.paymentMethod}</p>
                                                        <p className="text-gray-600 text-xs sm:text-sm">Driver Cost: {order.shipping}</p>
                                                        <p className="text-gray-600 text-xs sm:text-sm">Total: R{order.total}</p>
                                                        <p className="text-gray-600 text-xs sm:text-sm">Status: {order.status}</p>
                                                        {order.refundReason && (
                                                            <p className="text-gray-600 text-xs sm:text-sm">Refund Reason: {order.refundReason}</p>
                                                        )}
                                                        {order.refundStatus && (
                                                            <p className="text-gray-600 text-xs sm:text-sm">Refund Status: {order.refundStatus}</p>
                                                        )}
                                                        <p className="text-gray-600 text-xs sm:text-sm">Transaction ID: {order.transactionId || 'N/A'}</p>
                                                    </div>

                                                    {/* Order Items */}
                                                    <div>
                                                        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">Order Items</h3>
                                                        <div className="space-y-2">
                                                            {order.items.map((item) => (
                                                                <div key={item.id} className="flex justify-between items-center p-2 bg-white rounded-md shadow-sm hover:shadow-md transition-shadow duration-200">
                                                                    <span className="text-gray-700 text-xs sm:text-sm">{item.name}</span>
                                                                    <span className="text-gray-600 text-xs sm:text-sm">Qty: {item.cartQuantity || 1}</span>
                                                                    <span className="text-gray-800 font-medium text-xs sm:text-sm">
                                                                        R{(item.price * (item.cartQuantity || 1)).toFixed(2)}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-4 flex flex-wrap gap-3 sm:gap-4">
                                                    <button
                                                        onClick={() => handleReplaceOrder(order)}
                                                        className="py-2 sm:py-2 px-4 sm:px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all duration-200 text-sm sm:text-base"
                                                    >
                                                        Replace Order
                                                    </button>
                                                    <button
                                                        onClick={() => openRefundDialog(order)}
                                                        className="py-2 sm:py-2 px-4 sm:px-4 bg-red-500 text-white rounded-md hover:bg-red-600 transition-all duration-200 text-sm sm:text-base"
                                                        disabled={order.status === 'Refunded'}
                                                    >
                                                        {order.status === 'Refunded' ? 'Refunded' : 'Request Refund'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {visibleCompletedOrders < completedOrders.length && (
                                        <button
                                            onClick={loadMoreCompletedOrders}
                                            className="mt-4 px-4 sm:px-6 py-2 sm:py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm sm:text-base"
                                        >
                                            Load More
                                        </button>
                                    )}
                                </>
                            )}
                        </section>
                    )}

                    {activeTab === 'refunds' && (
                        <section className="mb-6 sm:mb-8">
                            <h2 className="sr-only">Refunds</h2>
                            {refundedOrders.length === 0 ? (
                                <p className="text-gray-500 font-medium text-sm sm:text-base">No refunds yet.</p>
                            ) : (
                                <>
                                    <div className="space-y-4">
                                        {refundedOrders.slice(0, visibleRefundedOrders).map((order) => (
                                            <div key={order.id} className="p-3 sm:p-4 bg-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
                                                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                                                    {/* Refund Summary */}
                                                    <div>
                                                        <p className="text-gray-700 font-medium text-sm sm:text-base">Order #{order.id}</p>
                                                        <p className="text-gray-600 text-xs sm:text-sm">Created At: {new Date(order.createdAt).toLocaleString()}</p>
                                                        <p className="text-gray-600 text-xs sm:text-sm">Payment Method: {order.paymentMethod}</p>
                                                        <p className="text-gray-600 text-xs sm:text-sm">Total: R{order.total}</p>
                                                        <p className="text-gray-600 text-xs sm:text-sm">Status: {order.status}</p>
                                                        {order.refundReason && (
                                                            <p className="text-gray-600 text-xs sm:text-sm">Refund Reason: {order.refundReason}</p>
                                                        )}
                                                        {order.refundStatus && (
                                                            <p className="text-gray-600 text-xs sm:text-sm">Refund Status: {order.refundStatus}</p>
                                                        )}
                                                        <p className="text-gray-600 text-xs sm:text-sm">Refunded At: {new Date(order.refundedAt).toLocaleString()}</p>
                                                        <p className="text-gray-600 text-xs sm:text-sm">Transaction ID: {order.transactionId || 'N/A'}</p>
                                                    </div>

                                                    {/* Order Items */}
                                                    <div>
                                                        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">Order Items</h3>
                                                        <div className="space-y-2">
                                                            {order.items.map((item) => (
                                                                <div key={item.id} className="flex justify-between items-center p-2 bg-white rounded-md shadow-sm hover:shadow-md transition-shadow duration-200">
                                                                    <span className="text-gray-700 text-xs sm:text-sm">{item.name}</span>
                                                                    <span className="text-gray-600 text-xs sm:text-sm">Qty: {item.cartQuantity || 1}</span>
                                                                    <span className="text-gray-800 font-medium text-xs sm:text-sm">
                                                                        R{(item.price * (item.cartQuantity || 1)).toFixed(2)}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {visibleRefundedOrders < refundedOrders.length && (
                                        <button
                                            onClick={loadMoreRefundedOrders}
                                            className="mt-4 px-4 sm:px-6 py-2 sm:py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm sm:text-base"
                                        >
                                            Load More
                                        </button>
                                    )}
                                </>
                            )}
                        </section>
                    )}

                    {/* Required Details Warning */}
                    {!hasRequiredDetails && (
                        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-yellow-100 rounded-lg shadow-md">
                            <p className="text-yellow-800 font-medium text-sm sm:text-base">
                                Please update your shipping address and payment details to proceed with checkout.{' '}
                                <Link to="/account-settings" className="text-green-600 font-medium hover:text-green-700 underline">
                                    Update Details
                                </Link>
                            </p>
                        </div>
                    )}

                    {/* Refund Confirmation Dialog */}
                    <CustomDialog
                        isOpen={showRefundDialog}
                        onConfirm={handleRefundRequest}
                        onCancel={closeRefundDialog}
                        message={
                            <div className="w-full max-w-md mx-auto">
                                <p className="text-gray-600 mb-4 text-sm sm:text-base">
                                    Are you sure you want to request a refund for Order #{selectedOrder?.id}?
                                </p>
                                <textarea
                                    value={refundReason}
                                    onChange={(e) => setRefundReason(e.target.value)}
                                    placeholder="Enter reason for refund (required)"
                                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
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