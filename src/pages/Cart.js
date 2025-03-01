import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ProductContext } from '../context/ProductContext';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Cart = () => {
    const { cart, removeFromCart, updateCartQuantity, clearCart } = useContext(ProductContext);
    const navigate = useNavigate();

    if (cart.length === 0) {
        return (
            <div className="flex flex-col min-h-screen bg-gray-50">
                <Header />
                <main className="flex-1 container mx-auto px-4 py-12">
                    <p className="text-center text-gray-500">Your cart is empty.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="mt-4 px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors mx-auto block"
                    >
                        Continue Shopping
                    </button>
                </main>
                <Footer />
            </div>
        );
    }

    const total = cart.reduce((sum, item) => sum + (item.price * (item.cartQuantity || 1)), 0).toFixed(2);

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-12">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Your Cart</h1>
                <div className="bg-white shadow-md rounded-lg p-6">
                    {cart.map((item) => (
                        <div key={item.id} className="flex items-center justify-between border-b border-gray-200 py-4">
                            <div className="flex items-center gap-4">
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-16 h-16 object-cover rounded-md"
                                />
                                <div>
                                    <h2 className="text-lg font-semibold">{item.name}</h2>
                                    <p className="text-gray-600">R{item.price.toFixed(2)} / {item.unit}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <input
                                    type="number"
                                    min="1"
                                    value={item.cartQuantity || 1}
                                    onChange={(e) => updateCartQuantity(item.id, parseInt(e.target.value) || 1)}
                                    className="w-16 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                                <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}
                    <div className="mt-6 text-right">
                        <p className="text-xl font-bold text-gray-800">Total: R{total}</p>
                        <button
                            onClick={clearCart}
                            className="mt-4 px-6 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                        >
                            Clear Cart
                        </button>
                        <button
                            onClick={() => alert('Paystack checkout would go here – functionality to be implemented')}
                            className="mt-4 ml-4 px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                        >
                            Checkout with Paystack
                        </button>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Cart;