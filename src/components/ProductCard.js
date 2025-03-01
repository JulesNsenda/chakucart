import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ProductContext } from '../context/ProductContext';

const ProductCard = ({ product }) => {
    const { cart, setCart } = useContext(ProductContext); // Access cart from context

    const addToCart = () => {
        if (product.available) {
            setCart([...cart, product]);
            alert(`${product.name} added to cart!`); // Simple feedback (could be a toast later)
        }
    };

    return (
        <div className="bg-white shadow-md rounded-lg overflow-hidden transition hover:shadow-lg">
            <div className="relative">
                {/* Image links to ProductPreview */}
                <Link to={`/product/${product.id}`}>
                    <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-40 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    />
                </Link>
                {/* Promotion Badge (top-right corner) */}
                {product.isPromoted && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-semibold py-1 px-2 rounded-full">
                        15% Promotion
                    </div>
                )}
            </div>
            <div className="p-4">
                <h2 className="text-lg font-semibold">{product.name}</h2>
                <p className="text-gray-600 text-sm line-clamp-1">{product.description}</p>
                <p className="text-blue-600 font-bold mt-2">
                    R{product.price.toFixed(2)} / {product.unit}
                </p>
                <div className="mt-4">
                    <button
                        onClick={addToCart}
                        className={`w-full py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors ${!product.available ? 'bg-gray-400 cursor-not-allowed' : ''
                            }`}
                        disabled={!product.available}
                    >
                        {product.available ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;