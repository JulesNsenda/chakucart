import React, { useContext, useState, useEffect } from "react";
import { ProductContext } from "../context/ProductContext";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CustomDialog from "../components/CustomDialog";
import { Trash, ShoppingCart, ChevronDown, ChevronUp, Clock, ArrowRight } from "lucide-react";
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
    } = useContext(ProductContext);
    const navigate = useCustomNavigate();
    const { isAuthenticated, hasRequiredDetails } = useAuth();

    // UI state
    const [showSummary, setShowSummary] = useState(true); // Always show on desktop
    const [showSavedItems, setShowSavedItems] = useState(true);

    // Dialog state
    const [showRemoveDialog, setShowRemoveDialog] = useState(false);
    const [showClearDialog, setShowClearDialog] = useState(false);
    const [itemToRemove, setItemToRemove] = useState(null);

    // Location state for shipping calculation
    const [location] = useState({ latitude: -33.9249, longitude: 18.4241 }); // Default: Cape Town
    const [distance, setDistance] = useState(5); // Default distance
    const [clientLocation, setClientLocation] = useState(null);

    // Calculate distance for shipping
    useEffect(() => {
        const getClientLocation = () => {
            // For simplicity, use mock data similar to original implementation
            const mockClientLat = -33.9249 + 0.045; // ~5 km north
            const mockClientLon = 18.4241;
            setClientLocation({ latitude: mockClientLat, longitude: mockClientLon });
        };

        getClientLocation();
        return () => setClientLocation(null);
    }, []);

    // Calculate distance when clientLocation changes
    useEffect(() => {
        if (clientLocation) {
            const dist = calculateDistance(
                location.latitude, location.longitude,
                clientLocation.latitude, clientLocation.longitude
            );
            setDistance(Math.round(dist)); // Round to nearest kilometer
        }
    }, [clientLocation, location]);

    // Calculate distance between two points (Haversine formula)
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in kilometers
    };

    // Empty cart view
    // In the empty cart view section of Cart.js
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
    const shipping = (distance * 10).toFixed(2); // R10 per kilometer, as in original
    const total = (parseFloat(subtotal) + parseFloat(tax) + parseFloat(shipping)).toFixed(2);
    const itemCount = cart.reduce((sum, item) => sum + (item.cartQuantity || 1), 0);

    // Handle remove item
    const handleRemove = (productId) => {
        setItemToRemove(productId);
        setShowRemoveDialog(true);
    };

    // Handle clear cart
    const handleClear = () => {
        setShowClearDialog(true);
    };

    // Confirm remove item
    const confirmRemove = () => {
        if (itemToRemove) {
            removeFromCart(itemToRemove);
            setShowRemoveDialog(false);
            setItemToRemove(null);
        }
    };

    // Confirm clear cart
    const confirmClear = () => {
        clearCart();
        setShowClearDialog(false);
    };

    // Cancel dialog action
    const cancelAction = () => {
        setShowRemoveDialog(false);
        setShowClearDialog(false);
        setItemToRemove(null);
    };

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
                    <h1 className="text-2xl font-bold text-gray-800 mb-6">Your Cart</h1>

                    {/* Desktop Layout - Two Column */}
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Cart Items Column */}
                        <div className="lg:w-2/3 bg-white shadow-md rounded-lg p-6">
                            {/* Cart Items */}
                            <div className="space-y-4">
                                {cart.map((item) => {
                                    const itemTotal = (item.price * (item.cartQuantity || 1)).toFixed(2);
                                    return (
                                        <div key={item.id} className="p-4 border rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            {/* Product Image and Details */}
                                            <div className="flex items-center gap-4 flex-grow">
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="w-16 h-16 object-cover rounded-md"
                                                    loading="lazy"
                                                />
                                                <div>
                                                    <h2 className="text-base font-semibold text-gray-800">{item.name}</h2>
                                                    <p className="text-gray-600 text-sm">R{item.price.toFixed(2)} / {item.unit}</p>
                                                </div>
                                            </div>

                                            {/* Quantity and Item Total */}
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.cartQuantity || 1}
                                                        onChange={(e) => updateCartQuantity(item.id, parseInt(e.target.value) || 1)}
                                                        className="w-16 p-2 border border-gray-300 rounded-md text-center"
                                                        aria-label={`Quantity for ${item.name}`}
                                                    />
                                                </div>
                                                <div className="text-right min-w-24">
                                                    <p className="text-sm text-gray-500">Total</p>
                                                    <p className="font-bold text-lg">R{itemTotal}</p>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleRemove(item.id)}
                                                    className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center gap-1"
                                                    aria-label={`Remove ${item.name} from cart`}
                                                >
                                                    <Trash className="w-4 h-4" /> Remove
                                                </button>
                                                <button
                                                    onClick={() => saveForLater(item.id)}
                                                    className="px-3 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 flex items-center gap-1"
                                                    aria-label={`Save ${item.name} for later`}
                                                >
                                                    <Clock className="w-4 h-4" /> Save for Later
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Saved For Later Items */}
                            {savedForLater.length > 0 && (
                                <div className="mt-8 border-t pt-6">
                                    <button
                                        className="flex items-center justify-between w-full text-gray-700 font-medium text-base mb-4"
                                        onClick={() => setShowSavedItems(!showSavedItems)}
                                    >
                                        Saved for Later ({savedForLater.length})
                                        {showSavedItems ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                    </button>

                                    {showSavedItems && (
                                        <div className="space-y-3">
                                            {savedForLater.map((item) => (
                                                <div key={item.id} className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between items-center">
                                                    <div className="flex items-center gap-4">
                                                        <img
                                                            src={item.image}
                                                            alt={item.name}
                                                            className="w-12 h-12 object-cover rounded-md"
                                                            loading="lazy"
                                                        />
                                                        <div>
                                                            <h2 className="text-sm font-medium text-gray-800">{item.name}</h2>
                                                            <p className="text-gray-600 text-xs">R{item.price.toFixed(2)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 mt-3 sm:mt-0">
                                                        <button
                                                            onClick={() => moveToCart(item.id)}
                                                            className="px-3 py-1 bg-green-500 text-white text-sm rounded-md hover:bg-green-600"
                                                        >
                                                            Move to Cart
                                                        </button>
                                                        <button
                                                            onClick={() => removeFromSaved(item.id)}
                                                            className="px-3 py-1 bg-red-500 text-white text-sm rounded-md hover:bg-red-600"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Cart Summary Column */}
                        <div className="lg:w-1/3">
                            <div className="bg-white shadow-md rounded-lg p-6 sticky top-4">
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
                                        <p className="text-gray-600">Shipping (R10/km, {distance} km)</p>
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
                                        onClick={handleClear}
                                        className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium"
                                    >
                                        Clear Cart
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Custom Dialogs */}
                <CustomDialog
                    isOpen={showRemoveDialog}
                    onConfirm={confirmRemove}
                    onCancel={cancelAction}
                    message="Are you sure you want to remove this item from your cart?"
                />

                <CustomDialog
                    isOpen={showClearDialog}
                    onConfirm={confirmClear}
                    onCancel={cancelAction}
                    message="Are you sure you want to clear your cart?"
                />
            </main>
            <Footer />
        </div>
    );
};

export default Cart;