import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-gray-800 text-white py-8">
            <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Brand */}
                <div>
                    <h3 className="text-xl font-bold mb-4">FreshCart</h3>
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
                © 2025 FreshCart. All rights reserved.
            </div>
        </footer>
    );
};

export default Footer;