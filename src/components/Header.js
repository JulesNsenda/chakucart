import React, { useState, useContext } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ProductContext } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext'; // Import useAuth

const Header = () => {
    const [] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false); // State for mobile menu toggle
    const [isDropdownOpen, setIsDropdownOpen] = useState(false); // State for desktop dropdown toggle
    const navigate = useNavigate();
    const [] = useSearchParams();
    const { cart } = useContext(ProductContext);
    const { signOut, isAuthenticated } = useAuth(); // Use isAuthenticated for conditional rendering


    const handleSignOut = () => {
        signOut(); // Use signOut from AuthContext, which preserves user data
        navigate('/'); // Redirect to home after sign out
        setIsMenuOpen(false); // Close mobile menu on sign out
        setIsDropdownOpen(false); // Close desktop dropdown on sign out
    };

    const handleMenuItemClick = (path) => {
        navigate(path);
        setIsMenuOpen(false); // Close mobile menu after selection
        setIsDropdownOpen(false); // Close desktop dropdown after selection
    };

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen); // Toggle desktop dropdown
    };

    return (
        <header className="sticky top-0 z-50 bg-white shadow-md">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="text-2xl font-bold text-green-600" aria-label="Home">
                    FreshCart
                </Link>

                {/* Navigation and Mobile Menu Toggle */}
                <div className="flex items-center space-x-6">
                    {/* Hamburger Menu for Mobile */}
                    <button
                        className="md:hidden text-gray-700 hover:text-green-600 focus:outline-none p-2"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
                        </svg>
                    </button>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-6">
                        <Link to="/" className="text-gray-700 hover:text-green-600" aria-label="Home page">
                            Home
                        </Link>
                        <Link to="/cart" className="relative text-gray-700 hover:text-green-600" aria-label="Cart page">
                            Cart
                            {cart.length > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center" aria-label={`${cart.length} items in cart`}>
                                    {cart.length}
                                </span>
                            )}
                        </Link>
                        {/* Dropdown Menu for Signed-In Users (Desktop) */}
                        {isAuthenticated ? (
                            <>
                                <div className="relative">
                                    <button
                                        className="text-gray-700 hover:text-green-600 focus:outline-none"
                                        onClick={toggleDropdown}
                                        aria-label="User menu"
                                    >
                                        Account
                                    </button>
                                    {isDropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white shadow-md rounded-md">
                                            <Link to="/dashboard" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-green-600 rounded-md transition-all duration-300" onClick={() => handleMenuItemClick('/dashboard')}>
                                                Dashboard
                                            </Link>
                                            <Link to="/account-settings" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-green-600 rounded-md transition-all duration-300" onClick={() => handleMenuItemClick('/account-settings')}>
                                                Account Settings
                                            </Link>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={handleSignOut}
                                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                                    aria-label="Sign out"
                                >
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <Link to="/sign-in" className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors" aria-label="Sign in page">
                                Sign In
                            </Link>
                        )}
                    </nav>

                    {/* Mobile Navigation (Dropdown) */}
                    {isMenuOpen && (
                        <div className="absolute top-16 right-0 w-48 bg-white shadow-md rounded-md md:hidden">
                            <nav className="p-2 space-y-2">
                                <Link to="/" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-green-600 rounded-md" aria-label="Home page" onClick={() => setIsMenuOpen(false)}>
                                    Home
                                </Link>
                                <Link to="/about" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-green-600 rounded-md" aria-label="About us page" onClick={() => setIsMenuOpen(false)}>
                                    About
                                </Link>
                                <Link to="/contact" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-green-600 rounded-md" aria-label="Contact page" onClick={() => setIsMenuOpen(false)}>
                                    Contact
                                </Link>
                                <Link to="/cart" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-green-600 rounded-md" aria-label="Cart page" onClick={() => setIsMenuOpen(false)}>
                                    Cart
                                    {cart.length > 0 && (
                                        <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center" aria-label={`${cart.length} items in cart`}>
                                            {cart.length}
                                        </span>
                                    )}
                                </Link>
                                {isAuthenticated ? (
                                    <>
                                        <Link to="/dashboard" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-green-600 rounded-md" aria-label="Dashboard" onClick={() => handleMenuItemClick('/dashboard')}>
                                            Dashboard
                                        </Link>
                                        <Link to="/account-settings" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-green-600 rounded-md" aria-label="Account settings" onClick={() => handleMenuItemClick('/account-settings')}>
                                            Account Settings
                                        </Link>
                                        <button
                                            onClick={handleSignOut}
                                            className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-red-600"
                                            aria-label="Sign out"
                                        >
                                            Sign Out
                                        </button>
                                    </>
                                ) : (
                                    <Link to="/sign-in" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-green-600 rounded-md" aria-label="Sign in page" onClick={() => setIsMenuOpen(false)}>
                                        Sign In
                                    </Link>
                                )}
                            </nav>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;