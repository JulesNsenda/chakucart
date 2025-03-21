import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ProductContext } from '../context/ProductContext';
import { useToast } from '../context/ToastContext';

const ProductCard = ({ product }) => {
    const { addToCart } = useContext(ProductContext);
    const { showToast } = useToast();

    const handleAddToCart = () => {
        if (product.available && product.quantity > 0) {
            addToCart(product);
            showToast(`${product.name} added to cart!`);
        }
    };

    return (
        <div className="bg-white shadow-md rounded-lg overflow-hidden transition hover:shadow-lg">
            <div className="relative">
                <Link to={`/product/${product.id}`}>
                    <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-32 sm:h-40 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    />
                </Link>
            </div>
            <div className="p-3 sm:p-4">
                <h2 className="text-base sm:text-lg font-semibold line-clamp-1">{product.name}</h2>
                <p className="text-gray-600 text-xs sm:text-sm line-clamp-1">{product.description}</p>
                <p className="text-blue-600 font-bold mt-2 text-sm sm:text-base">
                    R{product.price.toFixed(2)} / {product.unit}
                </p>
                <div className="mt-3 sm:mt-4">
                    <button
                        onClick={handleAddToCart}
                        className={`w-full py-3 sm:py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm sm:text-base ${!product.available || product.quantity === 0 ? 'bg-gray-400 cursor-not-allowed' : ''
                            }`}
                        disabled={!product.available || product.quantity === 0}
                    >
                        {product.available && product.quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;