// src/pages/Dashboard.js
import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ProductContext } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Dashboard = () => {
    const { cart, savedForLater } = useContext(ProductContext);
    const { user, isAuthenticated, hasRequiredDetails } = useAuth();
    const navigate = useNavigate();
    const [ongoingOrders, setOngoingOrders] = useState([]); // Simulated ongoing orders (updated in real-time)

    // Update ongoing orders whenever the cart changes
    useEffect(() => {
        // Simulate fetching ongoing orders (replace with real API call in production)
        if (cart.length > 0) {
            const subtotal = cart.reduce((sum, item) => sum + (item.price * (item.cartQuantity || 1)), 0).toFixed(2);
            const tax = (parseFloat(subtotal) * 0.15).toFixed(2); // 15% tax
            const shipping = 50.00; // Fixed delivery fee of R50 (adjust as needed, or use dynamic distance-based fee like in Cart)
            const total = (parseFloat(subtotal) + parseFloat(tax) + parseFloat(shipping)).toFixed(2);

            setOngoingOrders([{
                id: 1,
                items: cart,
                subtotal: subtotal,
                tax: tax,
                shipping: shipping,
                total: total,
                status: 'Pending'
            }]);
        } else {
            setOngoingOrders([]);
        }
    }, [cart]); // Re-run this effect whenever cart changes

    if (!isAuthenticated || !user) {
        navigate('/sign-in'); // Redirect to sign-in if not authenticated
        return null;
    }

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
                                    <div key={order.id} className="p-4 bg-gray-100 rounded-lg shadow-md transition-all duration-300 hover:shadow-lg">
                                        <p className="text-gray-700 font-medium">Order #{order.id}</p>
                                        <p className="text-gray-600">Items: {order.items.length}</p>
                                        <p className="text-gray-600">Subtotal: <span className="text-gray-800 font-medium">R{order.subtotal}</span></p>
                                        <p className="text-gray-600">Tax (15%): <span className="text-gray-800 font-medium">R{order.tax}</span></p>
                                        <p className="text-gray-600">Delivery Fee: <span className="text-gray-800 font-medium">R{order.shipping}</span></p>
                                        <p className="text-gray-600">Total: <span className="text-blue-600 font-bold">R{order.total}</span></p>
                                        <p className="text-gray-600">Status: {order.status}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 font-medium">No ongoing orders at the moment.</p>
                        )}
                    </section>
                    {/* Check for Required Details and Payment Option */}
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
                    {hasRequiredDetails && ongoingOrders.length > 0 && (
                        <button
                            onClick={() => navigate('/payment')}
                            className="mt-6 px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all duration-300 shadow-md hover:shadow-lg"
                            aria-label="Proceed to payment"
                        >
                            Proceed to Payment
                        </button>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Dashboard;