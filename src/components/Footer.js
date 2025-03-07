import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ProductContext } from '../context/ProductContext';

const Footer = () => {
    const { cart } = useContext(ProductContext);

    return (
        <footer className="bg-gray-800 text-white py-8">
            <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Brand */}
                <div>
                    <h3 className="text-xl font-bold mb-4">ChakuCart</h3>
                    <p className="text-gray-400">
                        Connecting you to fresh groceries from local markets.
                    </p>
                </div>

                {/* Links */}
                <div>
                    <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
                    <ul className="space-y-2">
                        <li><Link to="/" className="text-gray-400 hover:text-white">Home</Link></li>
                        <li><Link to="/about" className="text-gray-400 hover:text-white">About Us</Link></li>
                        <li><Link to="/contact" className="text-gray-400 hover:text-white">Contact</Link></li>
                        <li><Link to="/cart" className="relative text-gray-400 hover:text-white">
                            Cart
                            {cart.length > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                    {cart.length}
                                </span>
                            )}
                        </Link></li>
                    </ul>
                </div>

                {/* Contact */}
                <div>
                    <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
                    <p className="text-gray-400">Email: support@freshcart.co.za</p>
                    <p className="text-gray-400">Phone: +27 123 456 789</p>
                    <p className="text-gray-400">Address: 123 Fresh Street, Cape Town, South Africa</p>
                </div>
            </div>
            <div className="text-center text-gray-500 mt-6">
                © 2025 ChakuCart. All rights reserved.
            </div>
        </footer>
    );
};

export default Footer;