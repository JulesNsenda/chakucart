import React, { useContext, useState } from "react";
import { ProductContext } from "../context/ProductContext";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Trash, ShoppingCart, ChevronDown, ChevronUp, Clock, ArrowRight, Plus, Minus } from "lucide-react";
import useCustomNavigate from '../hooks/useCustomNavigate';

const Cart = () => {
    const {
        cart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        savedForLater,
        saveForLater,
        removeFromSaved,
        moveToCart,
        marketDistance 
    } = useContext(ProductContext);
    const navigate = useCustomNavigate();
    const { isAuthenticated, hasRequiredDetails } = useAuth();

    // UI state
    const [showSummary, setShowSummary] = useState(false); // For mobile view toggle
    const [showSavedItems, setShowSavedItems] = useState(true);

    // Empty cart view
    if (cart.length === 0) {
        return (
            <div className="flex flex-col min-h-screen bg-gray-50">
                <Header />
                <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-10 mb-12">
                    <ShoppingCart className="w-16 h-16 text-gray-400 mb-6" />
                    <p className="text-gray-600 text-lg font-medium mb-6">Your cart is empty.</p>
                    <button
                        onClick={() => navigate("/")}
                        className="mt-4 px-6 py-3 w-full max-w-xs bg-green-500 text-white rounded-md hover:bg-green-600 transition-all duration-300"
                        aria-label="Continue shopping"
                    >
                        Continue Shopping
                    </button>

                    {/* Display saved items if there are any */}
                    {savedForLater.length > 0 && (
                        <div className="mt-12 w-full max-w-md">
                            <h2 className="text-lg font-medium text-gray-700 mb-4">Saved for Later ({savedForLater.length})</h2>
                            <div className="space-y-3">
                                {savedForLater.map(item => (
                                    <div key={item.id} className="bg-white p-3 rounded-lg shadow-sm flex items-center justify-between">
                                        <div className="flex items-center">
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-12 h-12 object-cover rounded-md mr-3"
                                            />
                                            <div>
                                                <h3 className="font-medium text-sm">{item.name}</h3>
                                                <p className="text-gray-600 text-xs">R{item.price.toFixed(2)}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => moveToCart(item.id)}
                                            className="text-green-600 hover:text-green-700"
                                            aria-label="Move to cart"
                                        >
                                            <ArrowRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </main>
                <Footer />
            </div>
        );
    }

    // Calculate cart totals
    const subtotal = cart.reduce((sum, item) => sum + item.price * (item.cartQuantity || 1), 0).toFixed(2);
    const tax = (parseFloat(subtotal) * 0.15).toFixed(2);
    const shipping = (marketDistance * 10).toFixed(2);
    const total = (parseFloat(subtotal) + parseFloat(tax) + parseFloat(shipping)).toFixed(2);
    const itemCount = cart.reduce((sum, item) => sum + (item.cartQuantity || 1), 0);

    // Handle checkout with auth check
    const handleCheckout = () => {
        if (!isAuthenticated) {
            navigate('/sign-in');
            return;
        }
        if (!hasRequiredDetails) {
            navigate('/dashboard');
            return;
        }
        navigate('/payment');
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="flex-1 p-4">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">Your Cart</h1>

                    {/* Mobile Order Summary Toggle */}
                    <div className="lg:hidden mb-4">
                        <button
                            onClick={() => setShowSummary(!showSummary)}
                            className="w-full p-3 bg-white shadow rounded-lg flex justify-between items-center"
                        >
                            <span className="font-medium text-gray-800">Order Summary: R{total}</span>
                            {showSummary ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>

                        {/* Mobile Summary Dropdown */}
                        {showSummary && (
                            <div className="mt-2 p-4 bg-white shadow rounded-lg">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <p className="text-gray-600">Items ({itemCount})</p>
                                        <p className="text-gray-800 font-semibold">R{subtotal}</p>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-gray-600">Tax (15%)</p>
                                        <p className="text-gray-800 font-semibold">R{tax}</p>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-gray-600">Shipping ({marketDistance} km)</p>
                                        <p className="text-gray-800 font-semibold">R{shipping}</p>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t">
                                        <p>Total</p>
                                        <p className="text-blue-600">R{total}</p>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <button
                                        onClick={handleCheckout}
                                        className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 font-medium"
                                    >
                                        Checkout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Desktop Layout - Two Column */}
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Cart Items Column */}
                        <div className="lg:w-2/3 bg-white shadow-md rounded-lg p-4">
                            {/* Cart Items */}
                            <div className="space-y-3">
                                {cart.map((item) => {
                                    const itemTotal = (item.price * (item.cartQuantity || 1)).toFixed(2);
                                    return (
                                        <div key={item.id} className="p-3 border rounded-lg">
                                            {/* Product Image and Details */}
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="w-16 h-16 object-cover rounded-md"
                                                    loading="lazy"
                                                />
                                                <div className="flex-1">
                                                    <h2 className="text-base font-semibold text-gray-800">{item.name}</h2>
                                                    <p className="text-gray-600 text-sm">R{item.price.toFixed(2)} / {item.unit}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-lg">R{itemTotal}</p>
                                                </div>
                                            </div>

                                            {/* Mobile-friendly controls */}
                                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                                                {/* Quantity Selector */}
                                                <div className="flex items-center border rounded-md">
                                                    <button
                                                        onClick={() => updateCartQuantity(item.id, Math.max(1, (item.cartQuantity || 1) - 1))}
                                                        className="p-2 text-gray-600 hover:bg-gray-100"
                                                        aria-label="Decrease quantity"
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </button>
                                                    <span className="px-4 py-1 text-center min-w-14">
                                                        {item.cartQuantity || 1}
                                                    </span>
                                                    <button
                                                        onClick={() => updateCartQuantity(item.id, (item.cartQuantity || 1) + 1)}
                                                        className="p-2 text-gray-600 hover:bg-gray-100"
                                                        aria-label="Increase quantity"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                {/* Action buttons - icons with accessible labels on mobile, text on desktop */}
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => saveForLater(item.id)}
                                                        className="p-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 md:px-3 md:py-2"
                                                        aria-label="Save for later"
                                                        title="Save for later"
                                                    >
                                                        <Clock className="w-5 h-5 md:w-4 md:h-4" />
                                                        <span className="hidden md:inline md:ml-1">Save for Later</span>
                                                    </button>
                                                    <button
                                                        onClick={() => removeFromCart(item.id)}
                                                        className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 md:px-3 md:py-2"
                                                        aria-label="Remove item"
                                                        title="Remove item"
                                                    >
                                                        <Trash className="w-5 h-5 md:w-4 md:h-4" />
                                                        <span className="hidden md:inline md:ml-1">Remove</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Saved For Later Items */}
                            {savedForLater.length > 0 && (
                                <div className="mt-6 border-t pt-4">
                                    <button
                                        className="flex items-center justify-between w-full text-gray-700 font-medium text-base mb-3"
                                        onClick={() => setShowSavedItems(!showSavedItems)}
                                    >
                                        Saved for Later ({savedForLater.length})
                                        {showSavedItems ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                    </button>

                                    {showSavedItems && (
                                        <div className="space-y-3">
                                            {savedForLater.map((item) => (
                                                <div key={item.id} className="p-3 border rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={item.image}
                                                            alt={item.name}
                                                            className="w-12 h-12 object-cover rounded-md"
                                                            loading="lazy"
                                                        />
                                                        <div className="flex-1">
                                                            <h2 className="text-sm font-medium text-gray-800">{item.name}</h2>
                                                            <p className="text-gray-600 text-xs">R{item.price.toFixed(2)}</p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => moveToCart(item.id)}
                                                                className="p-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                                                                aria-label="Move to cart"
                                                                title="Move to cart"
                                                            >
                                                                <ArrowRight className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => removeFromSaved(item.id)}
                                                                className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                                                                aria-label="Remove saved item"
                                                                title="Remove saved item"
                                                            >
                                                                <Trash className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Cart Summary Column - Desktop only */}
                        <div className="hidden lg:block lg:w-1/3">
                            <div className="bg-white shadow-md rounded-lg p-5 sticky top-4">
                                <h2 className="text-xl font-bold text-gray-800 mb-4">Cart Summary</h2>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <p className="text-gray-600">Items ({itemCount})</p>
                                        <p className="text-gray-800 font-semibold">R{subtotal}</p>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-gray-600">Tax (15%)</p>
                                        <p className="text-gray-800 font-semibold">R{tax}</p>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-gray-600">Shipping (R10/km, {marketDistance} km)</p>
                                        <p className="text-gray-800 font-semibold">R{shipping}</p>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold mt-4 border-t pt-4">
                                        <p>Total</p>
                                        <p className="text-blue-600">R{total}</p>
                                    </div>
                                </div>

                                <div className="mt-6 space-y-3">
                                    <button
                                        onClick={handleCheckout}
                                        className="w-full px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 font-medium"
                                    >
                                        Proceed to Checkout
                                    </button>
                                    <button
                                        onClick={() => clearCart()}
                                        className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium"
                                    >
                                        Clear Cart
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Checkout and Clear Buttons */}
                    <div className="lg:hidden bg-white shadow-md rounded-lg p-4 mt-4 sticky bottom-4">
                        <div className="space-y-2">
                            <button
                                onClick={handleCheckout}
                                className="w-full px-4 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 font-medium"
                            >
                                Checkout • R{total}
                            </button>
                            <button
                                onClick={() => clearCart()}
                                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium text-sm"
                            >
                                Clear Cart
                            </button>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Cart;