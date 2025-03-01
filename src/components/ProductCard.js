import React from 'react';

const ProductCard = ({ product }) => {
    return (
        <div className="bg-white shadow-md rounded-lg p-4 hover:shadow-lg transition">
            <img
                src={product.image}
                alt={product.name}
                className="w-full h-40 object-cover rounded-t-lg"
            />
            <div className="mt-2">
                <h2 className="text-lg font-semibold">{product.name}</h2>
                <p className="text-gray-600 text-sm">{product.description}</p>
                <p className="text-blue-600 font-bold mt-1">
                    R{product.price} / {product.unit}
                </p>
                <p className="text-sm text-gray-500">Qty Available: {product.quantity}</p>
                <button
                    className={`mt-2 w-full py-2 text-white rounded ${product.available
                            ? 'bg-green-500 hover:bg-green-600'
                            : 'bg-gray-400 cursor-not-allowed'
                        }`}
                    disabled={!product.available}
                >
                    {product.available ? 'Add to Cart' : 'Out of Stock'}
                </button>
            </div>
        </div>
    );
};

export default ProductCard;