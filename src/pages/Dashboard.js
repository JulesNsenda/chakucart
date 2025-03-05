import React, { useContext, useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ProductContext } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import axios from 'axios';

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
    const [searchTerm, setSearchTerm] = useState(''); // State for search input

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
        setCartItems(order.items.map(item => ({ ...item, cartQuantity: item.cartQuantity || 1 })));
        showToast('Order replaced successfully! Proceed to payment.', 'success');
    };

    if (!isAuthenticated || !user) return null;

    // Filter orders based on search term (order ID or item names)
    const normalizeText = (text) => text.toLowerCase().trim();
    const filteredOrders = allOrders.filter(order => {
        if (!searchTerm.trim()) return true; // Show all orders if search is empty
        const normalizedSearch = normalizeText(searchTerm);
        // Check order ID
        if (normalizeText(order.id).includes(normalizedSearch)) return true;
        // Check item names
        return order.items.some(item => normalizeText(item.name).includes(normalizedSearch));
    });

    const pendingOrders = filteredOrders.filter(order => order.status === 'Pending' || order.status === 'Confirmed');
    const completedOrders = filteredOrders.filter(order => order.status === 'Delivered');

    const loadMoreCompletedOrders = () => {
        setVisibleCompletedOrders(prev => prev + 2);
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="flex-1 p-4">
                <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

                    {/* Search Bar for Orders */}
                    <div className="mb-6">
                        <input
                            type="text"
                            placeholder="Search by order number or item..."
                            className="w-full p-3 pl-4 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            aria-label="Search orders by order number or item"
                        />
                    </div>

                    {/* Tabs for Orders */}
                    <div className="mb-6">
                        <nav className="flex border-b border-gray-200">
                            <button
                                onClick={() => setActiveTab('ongoing')}
                                className={`px-4 py-2 font-medium ${activeTab === 'ongoing' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                            >
                                Ongoing Orders
                            </button>
                            <button
                                onClick={() => setActiveTab('pending')}
                                className={`px-4 py-2 font-medium ${activeTab === 'pending' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                            >
                                Pending Deliveries
                            </button>
                            <button
                                onClick={() => setActiveTab('completed')}
                                className={`px-4 py-2 font-medium ${activeTab === 'completed' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                            >
                                Completed Orders
                            </button>
                        </nav>
                    </div>

                    {/* Order Content (Tabbed) */}
                    {activeTab === 'ongoing' && (
                        <section className="mb-8">
                            <h2 className="sr-only">Ongoing Orders</h2>
                            {ongoingOrders.length > 0 ? (
                                <div className="space-y-4">
                                    {ongoingOrders.map((order) => (
                                        <div key={order.id} className="p-4 bg-gray-100 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
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
                                    className="mt-4 px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all duration-200"
                                    aria-label="Proceed to payment"
                                >
                                    Proceed to Payment
                                </button>
                            )}
                        </section>
                    )}

                    {activeTab === 'pending' && (
                        <section className="mb-8">
                            <h2 className="sr-only">Pending Deliveries</h2>
                            {isLoading ? (
                                <p className="text-gray-600">Loading pending orders...</p>
                            ) : pendingOrders.length === 0 ? (
                                <p className="text-gray-500 font-medium">No pending deliveries found.</p>
                            ) : (
                                <div className="space-y-4">
                                    {pendingOrders.map((order) => (
                                        <div key={order.id} className="p-4 bg-gray-100 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Order Summary (Left Column) */}
                                                <div>
                                                    <p className="text-gray-700 font-medium">Order #{order.id}</p>
                                                    <p className="text-gray-600">Created At: {new Date(order.createdAt).toLocaleString()}</p>
                                                    <p className="text-gray-600">Payment Method: {order.paymentMethod}</p>
                                                    <p className="text-gray-600">Total: R{order.total}</p>
                                                    <p className="text-gray-600">Status: {order.status}</p>
                                                    <p className="text-gray-600">Paystack Reference: {order.paystackReference || 'N/A'}</p>
                                                </div>

                                                {/* Order Items (Right Column) */}
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Order Items</h3>
                                                    <div className="space-y-2">
                                                        {order.items.map((item) => (
                                                            <div key={item.id} className="flex justify-between items-center p-2 bg-white rounded-md shadow-sm hover:shadow-md transition-shadow duration-200">
                                                                <span className="text-gray-700">{item.name}</span>
                                                                <span className="text-gray-600">Qty: {item.cartQuantity || 1}</span>
                                                                <span className="text-gray-800 font-medium">R{(item.price * (item.cartQuantity || 1)).toFixed(2)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleDeliveryConfirmation(order.id, order.paystackReference, order.paymentMethod)}
                                                className={`mt-4 py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all duration-200 ${isLoading ? 'bg-gray-400 cursor-not-allowed' : ''}`}
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
                        <section className="mb-8">
                            <h2 className="sr-only">Completed Orders</h2>
                            {completedOrders.length === 0 ? (
                                <p className="text-gray-500 font-medium">No completed orders yet.</p>
                            ) : (
                                <>
                                    <div className="space-y-4">
                                        {completedOrders.slice(0, visibleCompletedOrders).map((order) => (
                                            <div key={order.id} className="p-4 bg-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {/* Order Summary (Left Column) */}
                                                    <div>
                                                        <p className="text-gray-700 font-medium">Order #{order.id}</p>
                                                        <p className="text-gray-600">Created At: {new Date(order.createdAt).toLocaleString()}</p>
                                                        <p className="text-gray-600">Payment Method: {order.paymentMethod}</p>
                                                        <p className="text-gray-600">Driver Cost: {order.shipping}</p>
                                                        <p className="text-gray-600">Total: R{order.total}</p>
                                                        <p className="text-gray-600">Status: {order.status}</p>
                                                    </div>

                                                    {/* Order Items (Right Column) */}
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Order Items</h3>
                                                        <div className="space-y-2">
                                                            {order.items.map((item) => (
                                                                <div key={item.id} className="flex justify-between items-center p-2 bg-white rounded-md shadow-sm hover:shadow-md transition-shadow duration-200">
                                                                    <span className="text-gray-700">{item.name}</span>
                                                                    <span className="text-gray-600">Qty: {item.cartQuantity || 1}</span>
                                                                    <span className="text-gray-800 font-medium">R{(item.price * (item.cartQuantity || 1)).toFixed(2)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleReplaceOrder(order)}
                                                    className="mt-4 py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all duration-200"
                                                >
                                                    Replace Order
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    {visibleCompletedOrders < completedOrders.length && (
                                        <button
                                            onClick={loadMoreCompletedOrders}
                                            className="mt-4 px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
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