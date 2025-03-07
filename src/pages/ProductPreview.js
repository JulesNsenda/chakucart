import React, { useContext, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProductContext } from '../context/ProductContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useToast } from '../context/ToastContext';

// Loading skeleton component
const ProductSkeleton = () => (
    <div className="bg-white shadow-md rounded-lg overflow-hidden animate-pulse h-[300px] sm:h-[500px]">
        <div className="h-40 sm:h-60 bg-gray-300"></div>
        <div className="p-2 sm:p-4">
            <div className="h-5 sm:h-6 bg-gray-300 rounded w-3/4 mb-1 sm:mb-2"></div>
            <div className="h-4 sm:h-5 bg-gray-300 rounded w-1/2 mb-1 sm:mb-2"></div>
            <div className="h-4 sm:h-5 bg-gray-300 rounded w-1/3 mb-2 sm:mb-4"></div>
            <div className="h-8 sm:h-10 bg-gray-300 rounded"></div>
        </div>
    </div>
);

const ProductPreview = () => {
    const { id } = useParams();
    const { allProducts, addToCart, reviews, addReview, getAverageRating } = useContext(ProductContext);
    const navigate = useNavigate();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const product = allProducts.find((p) => p.id === parseInt(id));
    const { showToast } = useToast();

    if (!product) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 container mx-auto px-2 sm:px-4 py-6 sm:py-12">
                    <p className="text-center text-gray-500 text-sm sm:text-base">Product not found.</p>
                </main>
                <Footer />
            </div>
        );
    }

    const getCategory = (name) => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('apples') || lowerName.includes('bananas') || lowerName.includes('tomatoes')) return 'fruits';
        if (lowerName.includes('carrots') || lowerName.includes('potatoes') || lowerName.includes('onions') || lowerName.includes('broccoli') || lowerName.includes('spinach')) return 'vegetables';
        if (lowerName.includes('milk') || lowerName.includes('eggs') || lowerName.includes('butter') || lowerName.includes('cheese') || lowerName.includes('yogurt')) return 'dairy';
        if (lowerName.includes('chicken') || lowerName.includes('beef') || lowerName.includes('fish')) return 'meat';
        if (lowerName.includes('bread')) return 'bread';
        if (lowerName.includes('juice')) return 'beverages';
        return 'all';
    };

    const category = getCategory(product.name);

    const averageRating = parseFloat(getAverageRating(product.id)) || 4.5;
    const stars = Array.from({ length: 5 }, (_, index) => (
        <span key={index} className={`text-yellow-400 ${index < Math.floor(averageRating) ? 'fill-current' : 'text-gray-300'}`}>
            ★
        </span>
    ));

    const questions = ['Is this product organic?', 'What’s the shelf life?', 'Can I get this in bulk?'];
    const isTopPick = true;

    const relatedProducts = allProducts
        .filter((p) => p.category === category && p.id !== product.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

    const handleAddToCart = () => {
        if (product.available && product.quantity > 0) {
            addToCart(product);
            showToast(`${product.name} added to cart!`);
        }
    };

    const handleSubmitReview = (e) => {
        e.preventDefault();
        if (!rating || !comment.trim()) {
            alert('Please provide a rating and comment before submitting.');
            return;
        }
        setIsSubmitting(true);
        addReview(product.id, rating, comment);
        setRating(0);
        setComment('');
        setTimeout(() => setIsSubmitting(false), 500);
    };

    const productReviews = reviews[product.id] || [];

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="flex-1 container mx-auto px-2 sm:px-4 py-6 sm:py-12">
                {isSubmitting ? (
                    <ProductSkeleton />
                ) : (
                    <>
                        <button
                            onClick={() => navigate('/')}
                            className="mb-2 px-3 sm:px-4 py-2 sm:py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm sm:text-base"
                            aria-label="Back to Home"
                        >
                            ← Back to Home
                        </button>

                        <div className="grid grid-cols-1 gap-4 sm:gap-8">
                            {/* Product Image */}
                            <div className="flex justify-center">
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full max-w-xs sm:max-w-lg h-auto object-contain rounded-lg shadow-lg"
                                    loading="lazy"
                                />
                            </div>

                            {/* Product Details */}
                            <div className="flex flex-col">
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 sm:mb-4">{product.name}</h1>
                                <p className="text-gray-600 text-sm sm:text-base mb-2 sm:mb-4">{product.description}</p>
                                <div className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4">
                                    <span className="text-blue-600">R{product.price.toFixed(2)} / {product.unit}</span>
                                </div>
                                <p className="text-gray-700 text-sm sm:text-base mb-2 sm:mb-4">
                                    Quantity Available: {product.quantity}
                                </p>

                                {!product.available || product.quantity === 0 ? (
                                    <button
                                        className="mt-2 w-full py-2 sm:py-3 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors cursor-not-allowed text-sm sm:text-base"
                                        disabled
                                        aria-label="Notify when available"
                                    >
                                        Notify Me When Available
                                    </button>
                                ) : null}

                                <div className="mb-2 sm:mb-4">
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1 sm:mb-2">Reviews</h3>
                                    <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                                        {stars}
                                        <span className="text-gray-600 text-xs sm:text-sm">({averageRating || '0.0'}/5) - {productReviews.length} review(s)</span>
                                    </div>
                                </div>

                                <div className="mb-2 sm:mb-4">
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1 sm:mb-2">Add Your Review</h3>
                                    <form onSubmit={handleSubmitReview} className="space-y-2 sm:space-y-4">
                                        <div>
                                            <label htmlFor="rating" className="block text-gray-700 text-sm sm:text-base mb-1">Rating (1-5):</label>
                                            <select
                                                id="rating"
                                                value={rating}
                                                onChange={(e) => setRating(parseInt(e.target.value))}
                                                className="w-full p-2 sm:p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                                                aria-label="Select rating"
                                            >
                                                <option value="0">Select Rating</option>
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <option key={star} value={star}>{star} Star{star > 1 ? 's' : ''}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="comment" className="block text-gray-700 text-sm sm:text-base mb-1">Comment:</label>
                                            <textarea
                                                id="comment"
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                                className="w-full p-2 sm:p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 h-20 sm:h-24 resize-none text-sm sm:text-base"
                                                placeholder="Write your review here..."
                                                aria-label="Write a review"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className="px-4 sm:px-6 py-2 sm:py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:bg-gray-400 text-sm sm:text-base"
                                            disabled={isSubmitting}
                                            aria-label="Submit review"
                                        >
                                            {isSubmitting ? 'Submitting...' : 'Submit Review'}
                                        </button>
                                    </form>
                                </div>

                                {productReviews.length > 0 && (
                                    <div className="mt-2 sm:mt-4">
                                        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1 sm:mb-2">Customer Reviews</h3>
                                        <div className="space-y-2 sm:space-y-4">
                                            {productReviews.map((review, index) => (
                                                <div key={index} className="bg-gray-100 p-2 sm:p-4 rounded-md shadow-sm">
                                                    <div className="flex items-center gap-1 sm:gap-2 mb-1">
                                                        {Array.from({ length: 5 }, (_, i) => (
                                                            <span key={i} className={`text-yellow-400 ${i < Math.floor(review.rating) ? 'fill-current' : 'text-gray-300'}`}>
                                                                ★
                                                            </span>
                                                        ))}
                                                        <span className="text-gray-600 text-xs sm:text-sm">{new Date(review.date).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-gray-800 text-sm sm:text-base">{review.comment}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="mb-2 sm:mb-4">
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1 sm:mb-2">Questions</h3>
                                    <ul className="list-disc list-inside text-gray-600 text-sm sm:text-base">
                                        {questions.map((q, index) => (
                                            <li key={index}>{q}</li>
                                        ))}
                                    </ul>
                                </div>

                                {isTopPick && (
                                    <p className="text-green-600 font-semibold text-sm sm:text-base mb-2 sm:mb-4">
                                        Top Pick in {category.charAt(0).toUpperCase() + category.slice(1)} Category
                                    </p>
                                )}

                                <button
                                    onClick={handleAddToCart}
                                    className={`mt-2 w-full py-2 sm:py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors ${!product.available || product.quantity === 0 ? 'bg-gray-400 cursor-not-allowed' : ''} text-sm sm:text-base`}
                                    disabled={!product.available || product.quantity === 0}
                                    aria-label="Add to cart"
                                >
                                    {product.available && product.quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                                </button>
                            </div>
                        </div>

                        <div className="mt-6 sm:mt-12">
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Related Products</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-6">
                                {relatedProducts.length > 0 ? (
                                    relatedProducts.map((relatedProduct) => (
                                        <div
                                            key={relatedProduct.id}
                                            className="bg-white shadow-md rounded-lg p-2 sm:p-4 hover:shadow-lg transition cursor-pointer"
                                            onClick={() => navigate(`/product/${relatedProduct.id}`)}
                                            role="button"
                                            aria-label={`View ${relatedProduct.name}`}
                                        >
                                            <img
                                                src={relatedProduct.image}
                                                alt={relatedProduct.name}
                                                className="w-full h-20 sm:h-32 object-cover rounded-t-lg"
                                                loading="lazy"
                                            />
                                            <h4 className="text-base sm:text-lg font-semibold mt-1 sm:mt-2">{relatedProduct.name}</h4>
                                            <p className="text-blue-600 font-bold text-sm sm:text-base">
                                                R{relatedProduct.price.toFixed(2)} / {relatedProduct.unit}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-gray-500 text-sm sm:text-base">No related products found.</p>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default ProductPreview;