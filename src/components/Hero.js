import React from 'react';

const Hero = ({ onShopNow }) => {
    return (
        <section className="bg-green-100 py-16">
            <div className="container mx-auto px-4 text-center">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
                    Fresh Groceries, Delivered Fast
                </h1>
                <p className="text-lg text-gray-600 mb-6">
                    Shop from local markets and supermarkets with ease.
                </p>
                <button onClick={onShopNow} className="px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 text-lg transition-colors">
                    Shop Now
                </button>
            </div>
        </section>
    );
};

export default Hero;