import React from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import useCustomNavigate from '../hooks/useCustomNavigate';

const OrderDetails = () => {
    const { orderId } = useParams();
    const navigate = useCustomNavigate();
    const orders = JSON.parse(localStorage.getItem('freshCartOrders') || '[]');
    const order = orders.find(o => o.id === orderId);

    if (!order) return <p>Order not found.</p>;

    const calculateTax = (subtotal) => (parseFloat(subtotal) * 0.15).toFixed(2);
    const formatCurrency = (amount) => parseFloat(amount).toFixed(2);
    const dynamicTax = calculateTax(order.subtotal);

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="flex-1 p-3">
                <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-4">
                    <h1 className="text-xl font-bold text-gray-800 mb-4">Order #{order.id}</h1>
                    <p className="text-gray-600 text-sm mb-4">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                    <p className="text-gray-600 text-sm mb-4">Status: {order.status}</p>

                    <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                        <p className="text-gray-600">Payment:</p>
                        <p className="text-gray-800">{order.paymentMethod}</p>
                        <p className="text-gray-600">Subtotal:</p>
                        <p className="text-gray-800">R{formatCurrency(order.subtotal)}</p>
                        <p className="text-gray-600">Tax (15%):</p>
                        <p className="text-gray-800">R{dynamicTax}</p>
                        <p className="text-gray-600">Delivery:</p>
                        <p className="text-gray-800">R{formatCurrency(order.shipping)}</p>
                        <p className="text-gray-600">Total:</p>
                        <p className="text-gray-800 font-bold">R{formatCurrency(order.total)}</p>
                        {order.refundReason && (
                            <>
                                <p className="text-gray-600">Refund Reason:</p>
                                <p className="text-gray-800">{order.refundReason}</p>
                            </>
                        )}
                        {order.refundStatus && (
                            <>
                                <p className="text-gray-600">Refund Status:</p>
                                <p className="text-gray-800">{order.refundStatus}</p>
                            </>
                        )}
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-gray-800 mb-2">Order Items</h3>
                        <div className="space-y-2">
                            {order.items.map((item) => (
                                <div key={item.id} className="flex flex-col p-2 bg-gray-50 rounded-md text-xs">
                                    <div className="font-medium text-gray-700 mb-1">{item.name}</div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <span className="text-gray-600">Unit Price:</span>
                                            <span className="text-gray-800 ml-1">R{formatCurrency(item.price)}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Qty:</span>
                                            <span className="text-gray-800 ml-1">{item.cartQuantity || 1}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Total:</span>
                                            <span className="text-gray-800 font-medium ml-1">
                                                R{formatCurrency(item.price * (item.cartQuantity || 1))}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/dashboard')}
                        className="mt-4 py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all duration-200 text-sm font-medium"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default OrderDetails;