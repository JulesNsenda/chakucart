import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const OrderConfirmation = () => {
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);

    const getLatestOrder = () => {
        const orders = JSON.parse(localStorage.getItem('freshCartOrders') || '[]');
        console.log('Orders in localStorage:', orders);
        return orders.length > 0 ? orders[orders.length - 1] : null;
    };

    useEffect(() => {
        const latestOrder = getLatestOrder();
        console.log('Latest order fetched:', latestOrder);
        setOrder(latestOrder);
        if (!latestOrder) {
            console.log('No order found, redirecting to dashboard');
            navigate('/dashboard');
        }
    }, [navigate]);

    if (!order) return null;

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="flex-1 p-4">
                <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-6">Order Confirmation</h1>
                    <div className="p-4 bg-green-100 rounded-lg">
                        <p className="text-green-800 font-semibold">
                            Thank you! Your order has been placed successfully.
                        </p>
                        <p className="text-gray-700 mt-2">Order ID: {order.id}</p>
                        <p className="text-gray-700">Payment Method: {order.paymentMethod}</p>
                        <p className="text-gray-700">Status: {order.status}</p>
                        <p className="text-gray-700">Total: R{order.total}</p>
                        <p className="text-gray-700 mt-2">
                            Track your order on the Dashboard and confirm delivery when it arrives.
                        </p>
                    </div>
                    <div className="mt-6">
                        <h2 className="text-lg font-semibold text-gray-700 mb-2">Order Details</h2>
                        {order.items.map((item) => (
                            <div key={item.id} className="flex justify-between py-2 border-b">
                                <span>{item.name} (x{item.cartQuantity || 1})</span>
                                <span>R{(item.price * (item.cartQuantity || 1)).toFixed(2)}</span>
                            </div>
                        ))}
                        <div className="flex justify-between py-2">
                            <span>Subtotal</span>
                            <span>R{order.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span>Tax (15%)</span>
                            <span>R{(parseFloat(order.total) - parseFloat(order.subtotal) - order.shipping).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span>Shipping</span>
                            <span>R{order.shipping.toFixed(2)}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="mt-6 px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all duration-300"
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