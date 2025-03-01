import React, { useState, useContext } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ProductContext } from '../context/ProductContext';

const Header = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { cart } = useContext(ProductContext);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            setSearchParams({ q: searchTerm.trim() }); // Update URL with search query
            navigate('/'); // Navigate to homepage to trigger re-render
        } else {
            setSearchParams({}); // Clear search if empty
            navigate('/'); // Navigate to reset to full list
        }
    };

    return (
        <header className="sticky top-0 z-50 bg-white shadow-md">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="text-2xl font-bold text-green-600">
                    FreshCart
                </Link>

                {/* Navigation */}
                <nav className="flex items-center space-x-6">
                    <Link to="/" className="text-gray-700 hover:text-green-600">
                        Home
                    </Link>
                    <Link to="/about" className="text-gray-700 hover:text-green-600">
                        About
                    </Link>
                    <Link to="/contact" className="text-gray-700 hover:text-green-600">
                        Contact
                    </Link>
                    <Link to="/cart" className="relative text-gray-700 hover:text-green-600">
                        Cart
                        {cart.length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                {cart.length}
                            </span>
                        )}
                    </Link>
                    <Link to="/auth" className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">
                        Sign In
                    </Link>
                </nav>
            </div>
        </header>
    );
};

export default Header;