import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ProductContext } from '../context/ProductContext';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Cart = () => {
    const { cart, removeFromCart, updateCartQuantity, clearCart, savedForLater, saveForLater, removeFromSaved, moveToCart } = useContext(ProductContext);
    const navigate = useNavigate();
    const [location, setLocation] = useState({ latitude: -33.9249, longitude: 18.4241 }); // Default: Cape Town, South Africa (warehouse location)
    const [distance, setDistance] = useState(0); // Distance in kilometers
    const [clientLocation, setClientLocation] = useState(null); // Client's location, initially null

    // Mock function to calculate distance between two points (Haversine formula)
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

    // Use geolocation or manual input (simplified with mock data, run once on mount)
    useEffect(() => {
        // Simulate getting client location (replace with real geolocation or form input)
        const getClientLocation = () => {
            // Mock client location (e.g., 5 km away from warehouse for testing)
            const mockClientLat = -33.9249 + 0.045; // ~5 km north (approximate)
            const mockClientLon = 18.4241;
            setClientLocation({ latitude: mockClientLat, longitude: mockClientLon });
        };

        getClientLocation();

        // Cleanup to prevent memory leaks
        return () => setClientLocation(null);
    }, []); // Empty dependency array to run only on mount

    // Calculate distance when clientLocation is set (run only when clientLocation changes)
    useEffect(() => {
        if (clientLocation) {
            const dist = calculateDistance(
                location.latitude, location.longitude,
                clientLocation.latitude, clientLocation.longitude
            );
            setDistance(Math.round(dist)); // Round to nearest kilometer
        }
    }, [clientLocation, location]); // Only re-run when clientLocation or location changes

    if (cart.length === 0) {
        return (
            <div className="flex flex-col min-h-screen bg-gray-50">
                <Header />
                <main className="flex-1 container mx-auto px-4 py-12">
                    <p className="text-center text-gray-500 text-lg font-medium">Your cart is empty.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="mt-4 mx-auto block px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-300"
                        aria-label="Continue shopping"
                    >
                        Continue Shopping
                    </button>
                </main>
                <Footer />
            </div>
        );
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.price * (item.cartQuantity || 1)), 0).toFixed(2);
    const tax = (parseFloat(subtotal) * 0.15).toFixed(2); // 15% tax
    const shipping = (distance * 10).toFixed(2); // R10 per kilometer
    const total = (parseFloat(subtotal) + parseFloat(tax) + parseFloat(shipping)).toFixed(2);
    const itemCount = cart.reduce((sum, item) => sum + (item.cartQuantity || 1), 0);

    const handleRemove = (productId) => {
        if (window.confirm('Are you sure you want to remove this item from your cart?')) {
            removeFromCart(productId);
        }
    };

    const handleClear = () => {
        if (window.confirm('Are you sure you want to clear your cart?')) {
            clearCart();
        }
    };

    const handleQuantityChange = (productId, e) => {
        const newQuantity = parseInt(e.target.value) || 1;
        if (isNaN(newQuantity) || newQuantity < 1) {
            e.target.value = 1;
            updateCartQuantity(productId, 1);
            return;
        }
        const product = cart.find(item => item.id === productId);
        if (newQuantity > product.quantity) {
            updateCartQuantity(productId, product.quantity);
            e.target.value = product.quantity;
            return;
        }
        updateCartQuantity(productId, newQuantity);
    };

    const handleSaveForLater = (productId) => {
        saveForLater(productId);
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-12">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Your Cart</h1>
                <div className="bg-white shadow-md rounded-lg p-6">
                    {cart.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center justify-between border-b border-gray-200 py-6 transition-all duration-300 hover:bg-gray-50"
                            role="listitem"
                        >
                            <div className="flex items-center gap-4">
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-16 h-16 object-cover rounded-md"
                                    loading="lazy"
                                />
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-800">{item.name}</h2>
                                    <p className="text-gray-600">R{item.price.toFixed(2)} / {item.unit}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <input
                                    type="number"
                                    min="1"
                                    value={item.cartQuantity || 1}
                                    onChange={(e) => handleQuantityChange(item.id, e)}
                                    className="w-16 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-center"
                                    onBlur={(e) => {
                                        if (parseInt(e.target.value) < 1) {
                                            e.target.value = 1;
                                            updateCartQuantity(item.id, 1);
                                        }
                                    }}
                                    aria-label={`Quantity for ${item.name}`}
                                />
                                <button
                                    onClick={() => handleRemove(item.id)}
                                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-300"
                                    aria-label={`Remove ${item.name} from cart`}
                                >
                                    Remove
                                </button>
                                <button
                                    onClick={() => handleSaveForLater(item.id)}
                                    className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors duration-300"
                                    aria-label={`Save ${item.name} for later`}
                                >
                                    Save for Later
                                </button>
                            </div>
                        </div>
                    ))}
                    {savedForLater.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Saved for Later</h3>
                            <div className="space-y-4">
                                {savedForLater.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between border-b border-gray-200 py-4"
                                        role="listitem"
                                    >
                                        <div className="flex items-center gap-4">
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-12 h-12 object-cover rounded-md"
                                                loading="lazy"
                                            />
                                            <div>
                                                <h4 className="text-md font-semibold text-gray-800">{item.name}</h4>
                                                <p className="text-gray-600">R{item.price.toFixed(2)} / {item.unit}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => moveToCart(item.id)}
                                                className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-300"
                                                aria-label={`Move ${item.name} back to cart`}
                                            >
                                                Move to Cart
                                            </button>
                                            <button
                                                onClick={() => removeFromSaved(item.id)}
                                                className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-300"
                                                aria-label={`Remove ${item.name} from saved`}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="mt-8 p-4 bg-gray-100 rounded-md shadow-inner">
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-lg font-medium text-gray-700">Cart Summary</p>
                            <p className="text-lg font-medium text-gray-700">{itemCount} item(s)</p>
                        </div>
                        <div className="flex justify-between mb-2">
                            <p className="text-gray-600">Subtotal</p>
                            <p className="text-gray-800 font-semibold">R{subtotal}</p>
                        </div>
                        <div className="flex justify-between mb-2">
                            <p className="text-gray-600">Tax (15%)</p>
                            <p className="text-gray-800 font-semibold">R{tax}</p>
                        </div>
                        <div className="flex justify-between mb-2">
                            <p className="text-gray-600">Shipping (R10/km, {distance} km)</p>
                            <p className="text-gray-800 font-semibold">R{shipping}</p>
                        </div>
                        <div className="flex justify-between mt-4 border-t border-gray-300 pt-2">
                            <p className="text-xl font-bold text-gray-800">Total</p>
                            <p className="text-xl font-bold text-blue-600">R{total}</p>
                        </div>
                    </div>
                    <div className="mt-6 flex flex-col md:flex-row gap-4 justify-end">
                        <button
                            onClick={handleClear}
                            className="px-6 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors duration-300"
                            aria-label="Clear cart"
                        >
                            Clear Cart
                        </button>
                        <button
                            disabled
                            className="px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-300 opacity-50 cursor-not-allowed"
                            title="Paystack integration coming soon"
                            aria-label="Checkout (coming soon)"
                        >
                            Checkout
                        </button>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Cart;