import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

const Header = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

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
                    <Link to="/cart" className="text-gray-700 hover:text-green-600">
                        Cart (0)
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