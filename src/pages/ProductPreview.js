import React, { useContext, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ProductContext } from '../context/ProductContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useToast } from '../context/ToastContext';
import useCustomNavigate from '../hooks/useCustomNavigate';

// Loading skeleton component
const ProductSkeleton = () => (
    <div className="bg-white shadow-md rounded-lg overflow-hidden animate-pulse">
        <div className="h-96 bg-gray-200"></div>
        <div className="p-6">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
        </div>
    </div>
);

const ProductPreview = () => {
    const { id } = useParams();
    const { allProducts, addToCart, reviews, addReview, getAverageRating } = useContext(ProductContext);
    const navigate = useCustomNavigate();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showToast } = useToast();

    const product = allProducts.find((p) => p.id === parseInt(id));

    if (!product) {
        return (
            <div className="flex flex-col min-h-screen bg-gray-50">
                <Header />
                <main className="flex-1 container mx-auto px-4 py-12">
                    <p className="text-center text-gray-500">Product not found.</p>
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
        <span key={index} className={`text-lg ${index < Math.floor(averageRating) ? 'text-yellow-400' : 'text-gray-300'}`}>
            ★
        </span>
    ));

    const questions = ['Is this product organic?', 'What’s the shelf life?', 'Can I get this in bulk?'];
    const isTopPick = true;
    const productReviews = reviews[product.id] || [];

    const relatedProducts = allProducts
        .filter((p) => p.category === category && p.id !== product.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

    const handleAddToCart = () => {
        if (product.available && product.quantity > 0) {
            addToCart(product);
            // Show toast only on desktop (width >= 768px)
            if (window.innerWidth >= 768) {
                showToast(`${product.name} added to cart!`);
            }
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

    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-6">
                {isSubmitting ? (
                    <ProductSkeleton />
                ) : (
                    <>
                        {/* Breadcrumb */}
                        <nav className="mb-6 text-sm text-gray-600">
                            <ol className="flex items-center space-x-2">
                                <li>
                                    <button onClick={() => navigate('/')} className="hover:text-green-600">Home</button>
                                </li>
                                <li>/</li>
                                <li className="capitalize">{category}</li>
                                <li>/</li>
                                <li className="text-gray-900">{product.name}</li>
                            </ol>
                        </nav>

                        {/* Main Product Section */}
                        <div className="bg-white rounded-lg shadow-md p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Product Image */}
                            <div className="flex justify-center items-center">
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full max-w-md h-auto object-contain rounded-lg"
                                    loading="lazy"
                                />
                            </div>

                            {/* Product Details */}
                            <div className="space-y-4">
                                <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
                                <div className="flex items-center space-x-2">
                                    {stars}
                                    <span className="text-sm text-gray-600">({productReviews.length} reviews)</span>
                                </div>
                                <p className="text-gray-600">{product.description}</p>
                                <div className="text-3xl font-bold text-green-600">
                                    R{product.price.toFixed(2)}
                                    <span className="text-sm text-gray-500 font-normal"> /{product.unit}</span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Availability: {product.quantity > 0 && product.available ? (
                                        <span className="text-green-600">In Stock ({product.quantity} available)</span>
                                    ) : (
                                        <span className="text-red-600">Out of Stock</span>
                                    )}
                                </p>

                                {isTopPick && (
                                    <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                        Top Pick in {category.charAt(0).toUpperCase() + category.slice(1)}
                                    </span>
                                )}

                                <button
                                    onClick={handleAddToCart}
                                    className={`w-full py-3 mt-4 text-white rounded-md font-semibold transition-colors ${product.available && product.quantity > 0
                                        ? 'bg-green-600 hover:bg-green-700'
                                        : 'bg-gray-400 cursor-not-allowed'
                                        }`}
                                    disabled={!product.available || product.quantity === 0}
                                >
                                    {product.available && product.quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                                </button>

                                {!product.available || product.quantity === 0 ? (
                                    <button
                                        className="w-full py-3 mt-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                                        disabled
                                    >
                                        Notify Me When Available
                                    </button>
                                ) : null}

                                {/* Questions */}
                                <div className="mt-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Common Questions</h3>
                                    <ul className="mt-2 space-y-1 text-gray-600 text-sm">
                                        {questions.map((q, index) => (
                                            <li key={index}>{q}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Reviews Section */}
                        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Customer Reviews</h2>

                            {/* Add Review Form */}
                            <div className="border-t pt-4 mt-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Write a Review</h3>
                                <form onSubmit={handleSubmitReview} className="space-y-4">
                                    <div>
                                        <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                                        <select
                                            id="rating"
                                            value={rating}
                                            onChange={(e) => setRating(parseInt(e.target.value))}
                                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                        >
                                            <option value="0">Select Rating</option>
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <option key={star} value={star}>{star} Star{star > 1 ? 's' : ''}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">Your Review</label>
                                        <textarea
                                            id="comment"
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 h-24 resize-none"
                                            placeholder="Write your review here..."
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Submit Review'}
                                    </button>
                                </form>
                            </div>

                            {/* Existing Reviews */}
                            {productReviews.length > 0 ? (
                                <div className="mt-6 space-y-4">
                                    {productReviews.map((review, index) => (
                                        <div key={index} className="border-b pb-4 last:border-0">
                                            <div className="flex items-center space-x-2 mb-2">
                                                {Array.from({ length: 5 }, (_, i) => (
                                                    <span key={i} className={`text-lg ${i < Math.floor(review.rating) ? 'text-yellow-400' : 'text-gray-300'}`}>
                                                        ★
                                                    </span>
                                                ))}
                                                <span className="text-sm text-gray-500">{new Date(review.date).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-gray-700">{review.comment}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-600 mt-4">No reviews yet. Be the first to review this product!</p>
                            )}
                        </div>

                        {/* Related Products */}
                        <div className="mt-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Related Products</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {relatedProducts.length > 0 ? (
                                    relatedProducts.map((relatedProduct) => (
                                        <div
                                            key={relatedProduct.id}
                                            className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition cursor-pointer"
                                            onClick={() => navigate(`/product/${relatedProduct.id}`)}
                                        >
                                            <img
                                                src={relatedProduct.image}
                                                alt={relatedProduct.name}
                                                className="w-full h-40 object-cover rounded-t-lg mb-2"
                                                loading="lazy"
                                            />
                                            <h4 className="text-lg font-semibold text-gray-900">{relatedProduct.name}</h4>
                                            <p className="text-green-600 font-bold">
                                                R{relatedProduct.price.toFixed(2)} /{relatedProduct.unit}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-600">No related products found.</p>
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