import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ProductContext } from '../context/ProductContext';

const Footer = () => {
    const { cart } = useContext(ProductContext);

    return (
        <footer className="bg-gray-800 text-white py-4">
            <div className="container mx-auto px-2 sm:px-4 grid grid-cols-1 gap-4 sm:gap-6">
                <div>
                    <h3 className="text-base sm:text-lg font-bold mb-2">ChakuCart</h3>
                    <p className="text-gray-400 text-xs sm:text-sm">
                        Connecting you to fresh groceries from local markets.
                    </p>
                </div>

                <div>
                    <h4 className="text-sm sm:text-base font-semibold mb-2">Quick Links</h4>
                    <ul className="space-y-2 text-xs sm:text-sm">
                        <li><Link to="/" className="text-gray-400 hover:text-white">Home</Link></li>
                        <li><Link to="/about" className="text-gray-400 hover:text-white">About Us</Link></li>
                        <li><Link to="/contact" className="text-gray-400 hover:text-white">Contact</Link></li>
                        <li>
                            <Link to="/cart" className="relative text-gray-400 hover:text-white">
                                Cart
                                {cart.length > 0 && (
                                    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                                        {cart.length}
                                    </span>
                                )}
                            </Link>
                        </li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-sm sm:text-base font-semibold mb-2">Contact Us</h4>
                    <p className="text-gray-400 text-xs sm:text-sm">Email: support@freshcart.co.za</p>
                    <p className="text-gray-400 text-xs sm:text-sm">Phone: +27 123 456 789</p>
                    <p className="text-gray-400 text-xs sm:text-sm">Address: 123 Fresh Street, Cape Town, South Africa</p>
                </div>
            </div>
            <div className="text-center text-gray-500 mt-4 text-xs sm:text-sm">
                © 2025 ChakuCart. All rights reserved.
            </div>
        </footer>
    );
};

export default Footer;