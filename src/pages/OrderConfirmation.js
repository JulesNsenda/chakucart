import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const OrderConfirmation = () => {
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);

    const getLatestOrder = () => {
        const orders = JSON.parse(localStorage.getItem('freshCartOrders') || '[]');
        return orders.length > 0 ? orders[orders.length - 1] : null;
    };

    useEffect(() => {
        const latestOrder = getLatestOrder();
        setOrder(latestOrder);
        if (!latestOrder) {
            navigate('/dashboard');
        }
    }, [navigate]);

    if (!order) return null;

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="flex-1 p-2 sm:p-4">
                <div className="max-w-sm sm:max-w-2xl mx-auto bg-white shadow-md rounded-lg p-4 sm:p-6">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Order Confirmation</h1>
                    <div className="p-2 sm:p-4 bg-green-100 rounded-lg">
                        <p className="text-green-800 font-semibold text-sm sm:text-base">
                            Thank you! Your order has been placed successfully.
                        </p>
                        <p className="text-gray-700 text-sm sm:text-base mt-1">Order ID: {order.id}</p>
                        <p className="text-gray-700 text-sm sm:text-base">Payment Method: {order.paymentMethod}</p>
                        <p className="text-gray-700 text-sm sm:text-base">Status: {order.status}</p>
                        <p className="text-gray-700 text-sm sm:text-base">Total: R{order.total}</p>
                        <p className="text-gray-700 text-sm sm:text-base mt-1">
                            Track your order on the Dashboard and confirm delivery when it arrives.
                        </p>
                    </div>
                    <div className="mt-4 sm:mt-6">
                        <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-2">Order Details</h2>
                        {order.items.map((item) => (
                            <div key={item.id} className="flex justify-between py-1 sm:py-2 border-b">
                                <span className="text-sm sm:text-base">{item.name} (x{item.cartQuantity || 1})</span>
                                <span className="text-sm sm:text-base">R{(item.price * (item.cartQuantity || 1)).toFixed(2)}</span>
                            </div>
                        ))}
                        <div className="flex justify-between py-1 sm:py-2">
                            <span className="text-sm sm:text-base">Subtotal</span>
                            <span className="text-sm sm:text-base">R{order.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-1 sm:py-2">
                            <span className="text-sm sm:text-base">Tax (15%)</span>
                            <span className="text-sm sm:text-base">R{(parseFloat(order.total) - parseFloat(order.subtotal) - order.shipping).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-1 sm:py-2">
                            <span className="text-sm sm:text-base">Shipping</span>
                            <span className="text-sm sm:text-base">R{order.shipping.toFixed(2)}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="mt-4 px-4 sm:px-6 py-2 sm:py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all duration-300 text-sm sm:text-base"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default OrderConfirmation;