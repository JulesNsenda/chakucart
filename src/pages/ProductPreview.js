import React, { useContext, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProductContext } from '../context/ProductContext';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Helper function to determine category based on product name
const getCategory = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('apples') || lowerName.includes('bananas') || lowerName.includes('tomatoes')) return 'fruits';
    if (lowerName.includes('carrots') || lowerName.includes('potatoes') || lowerName.includes('onions') || lowerName.includes('broccoli') || lowerName.includes('spinach')) return 'vegetables';
    if (lowerName.includes('milk') || lowerName.includes('eggs') || lowerName.includes('butter') || lowerName.includes('cheese') || lowerName.includes('yogurt')) return 'dairy';
    if (lowerName.includes('chicken') || lowerName.includes('beef') || lowerName.includes('fish')) return 'meat';
    if (lowerName.includes('bread')) return 'bread';
    if (lowerName.includes('juice')) return 'beverages';
    return 'all'; // Default category
};

const ProductPreview = () => {
    const { id } = useParams(); // Get product ID from URL
    const { allProducts, cart, addToCart, promotedIds } = useContext(ProductContext);
    const navigate = useNavigate();
    const product = allProducts.find(p => p.id === parseInt(id));

    // Determine if product is promoted
    const isPromoted = promotedIds.includes(product.id);
    const originalPrice = product.price;
    const discountedPrice = isPromoted ? Number((product.price * 0.85).toFixed(2)) : null;

    // Determine category for this product
    const category = getCategory(product.name);

    // Rating (simulated, 4.5 stars for this example)
    const rating = 4.5;
    const stars = Array.from({ length: 5 }, (_, index) => (
        <span key={index} className={`text-yellow-400 ${index < Math.floor(rating) ? 'fill-current' : 'text-gray-300'}`}>
            ★
        </span>
    ));

    // Sample questions (simulated)
    const questions = [
        'Is this product organic?',
        'What’s the shelf life?',
        'Can I get this in bulk?',
    ];

    // Top pick status (simulated, true for this example)
    const isTopPick = true;

    // Viewed-together items (randomly picked from allProducts, excluding current product)
    const viewedTogether = allProducts
        .filter(p => p.id !== parseInt(id))
        .sort(() => 0.5 - Math.random()) // Random sort
        .slice(0, 3); // Show 3 items

    if (!product) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 container mx-auto px-4 py-12">
                    <p className="text-center text-gray-500">Product not found.</p>
                </main>
                <Footer />
            </div>
        );
    }

    const handleAddToCart = () => {
        if (product.available) {
            addToCart(product);
            alert(`${product.name} added to cart!`); // Simple feedback (could be a toast later)
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-12">
                <button
                    onClick={() => navigate('/')}
                    className="mb-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                    ← Back to Home
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Product Image */}
                    <div className="flex justify-center">
                        <img
                            src={product.image}
                            alt={product.name}
                            className="w-full max-w-lg h-auto object-contain rounded-lg shadow-lg" // Professional look
                        />
                    </div>

                    {/* Product Details */}
                    <div className="flex flex-col">
                        <h1 className="text-3xl font-bold text-gray-800 mb-4">{product.name}</h1>
                        <p className="text-gray-600 mb-4">{product.description}</p>
                        <div className="text-2xl font-bold mb-4">
                            {isPromoted ? (
                                <>
                                    <span className="text-gray-500 line-through">R{originalPrice.toFixed(2)}</span>
                                    <span className="text-blue-600 ml-2">R{discountedPrice.toFixed(2)}</span> / {product.unit}
                                </>
                            ) : (
                                <span className="text-blue-600">R{originalPrice.toFixed(2)} / {product.unit}</span>
                            )}
                        </div>
                        <p className="text-gray-700 mb-4">
                            Quantity Available: {product.quantity}
                        </p>

                        {/* Reviews */}
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Reviews</h3>
                            <div className="flex items-center gap-2">
                                {stars}
                                <span className="text-gray-600">({Math.round(rating * 10) / 10}/5)</span>
                            </div>
                        </div>

                        {/* Questions */}
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Questions</h3>
                            <ul className="list-disc list-inside text-gray-600">
                                {questions.map((q, index) => (
                                    <li key={index}>{q}</li>
                                ))}
                            </ul>
                        </div>

                        {/* Promotion Notification (if promoted) */}
                        {isPromoted && (
                            <div className="mb-4 bg-red-100 text-red-800 p-2 rounded-md">
                                <p className="font-semibold">15% Promotion Applied!</p>
                            </div>
                        )}

                        {/* Top Pick (if not promoted) */}
                        {isTopPick && !isPromoted && (
                            <p className="text-green-600 font-semibold mb-4">
                                Top Pick in {category.charAt(0).toUpperCase() + category.slice(1)} Category
                            </p>
                        )}

                        {/* Add to Cart */}
                        <button
                            onClick={handleAddToCart}
                            className={`mt-4 w-full md:w-1/2 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors ${!product.available ? 'bg-gray-400 cursor-not-allowed' : ''}`}
                            disabled={!product.available}
                        >
                            {product.available ? 'Add to Cart' : 'Out of Stock'}
                        </button>
                    </div>
                </div>

                {/* Viewed Together */}
                <div className="mt-12">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6">Viewed Together</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {viewedTogether.map((relatedProduct) => (
                            <div
                                key={relatedProduct.id}
                                className="bg-white shadow-md rounded-lg p-4 hover:shadow-lg transition cursor-pointer"
                                onClick={() => navigate(`/product/${relatedProduct.id}`)}
                            >
                                <img
                                    src={relatedProduct.image}
                                    alt={relatedProduct.name}
                                    className="w-full h-32 object-cover rounded-t-lg"
                                />
                                <h4 className="text-lg font-semibold mt-2">{relatedProduct.name}</h4>
                                <p className="text-blue-600 font-bold">
                                    R{relatedProduct.price.toFixed(2)} / {relatedProduct.unit}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default ProductPreview;