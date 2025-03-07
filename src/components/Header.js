import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ProductContext } from "../context/ProductContext";
import { useAuth } from "../context/AuthContext";
import { ShoppingCart, User, Menu, LogOut, Home, Info, Phone, Settings, Package } from "lucide-react";

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const navigate = useNavigate();
    const { cart } = useContext(ProductContext);
    const { signOut, isAuthenticated } = useAuth();

    const handleSignOut = () => {
        signOut();
        navigate("/");
        setIsMenuOpen(false);
        setIsDropdownOpen(false);
    };

    return (
        <header className="sticky top-0 z-50 bg-white shadow-md">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center space-x-2" aria-label="Home">
                    <img
                        src={window.innerWidth > 768 ? "/logo512.png" : "/logo192.png"}
                        alt="ChakuCart Logo"
                        className="h-8 w-8"
                    />
                    <span className="text-2xl font-bold text-green-600">ChakuCart</span>
                </Link>

                {/* Mobile Icons: Cart & Sign In/User Menu */}
                <div className="flex items-center md:hidden space-x-4">
                    {/* Cart */}
                    <Link to="/cart" className="relative text-gray-700 hover:text-green-600" aria-label="Cart">
                        <ShoppingCart className="w-6 h-6" />
                        {cart.length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                {cart.length}
                            </span>
                        )}
                    </Link>

                    {/* User Menu */}
                    {isAuthenticated ? (
                        <div className="relative">
                            <button
                                className="text-gray-700 hover:text-green-600"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                aria-label="User menu"
                            >
                                <User className="w-6 h-6" />
                            </button>
                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white shadow-md rounded-md">
                                    <Link to="/dashboard" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100">
                                        <Package className="w-5 h-5 mr-2" /> Dashboard
                                    </Link>
                                    <Link to="/account-settings" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100">
                                        <Settings className="w-5 h-5 mr-2" /> Account Settings
                                    </Link>
                                    <button onClick={handleSignOut} className="flex items-center w-full text-left px-4 py-3 text-red-600 hover:bg-gray-100">
                                        <LogOut className="w-5 h-5 mr-2" /> Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link to="/sign-in" className="text-gray-700 hover:text-green-600" aria-label="Sign In">
                            <User className="w-6 h-6" />
                        </Link>
                    )}

                    {/* Mobile Menu Button */}
                    <button className="text-gray-700 hover:text-green-600 focus:outline-none p-2" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
                        <Menu className="w-8 h-8" />
                    </button>
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center space-x-6">
                    <Link to="/" className="text-gray-700 hover:text-green-600 text-lg">Home</Link>
                    <Link to="/about" className="text-gray-700 hover:text-green-600 text-lg">About</Link>
                    <Link to="/contact" className="text-gray-700 hover:text-green-600 text-lg">Contact</Link>

                    {/* Cart */}
                    <Link to="/cart" className="relative text-gray-700 hover:text-green-600" aria-label="Cart">
                        <ShoppingCart className="w-6 h-6" />
                        {cart.length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                {cart.length}
                            </span>
                        )}
                    </Link>

                    {/* User Menu */}
                    {isAuthenticated ? (
                        <div className="relative">
                            <button
                                className="text-gray-700 hover:text-green-600"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                aria-label="User menu"
                            >
                                <User className="w-6 h-6" />
                            </button>
                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white shadow-md rounded-md">
                                    <Link to="/dashboard" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100">
                                        <Package className="w-5 h-5 mr-2" /> Dashboard
                                    </Link>
                                    <Link to="/account-settings" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100">
                                        <Settings className="w-5 h-5 mr-2" /> Account Settings
                                    </Link>
                                    <button onClick={handleSignOut} className="flex items-center w-full text-left px-4 py-3 text-red-600 hover:bg-gray-100">
                                        <LogOut className="w-5 h-5 mr-2" /> Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link to="/sign-in" className="text-gray-700 hover:text-green-600" aria-label="Sign In">
                            <User className="w-6 h-6" />
                        </Link>
                    )}
                </nav>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="absolute top-0 right-0 w-64 bg-white shadow-md rounded-md z-50 md:hidden">
                    <div className="flex items-center justify-between px-4 py-4 border-b">
                        <span className="text-2xl font-bold text-green-600">Menu</span>
                        <button className="text-gray-700 hover:text-green-600 focus:outline-none" onClick={() => setIsMenuOpen(false)} aria-label="Close menu">
                            ✕
                        </button>
                    </div>
                    <nav className="flex flex-col space-y-2 p-4">
                        <Link to="/" className="flex items-center text-gray-700 hover:text-green-600 py-2" onClick={() => setIsMenuOpen(false)}>
                            <Home className="w-5 h-5 mr-2" /> Home
                        </Link>
                        <Link to="/about" className="flex items-center text-gray-700 hover:text-green-600 py-2" onClick={() => setIsMenuOpen(false)}>
                            <Info className="w-5 h-5 mr-2" /> About
                        </Link>
                        <Link to="/contact" className="flex items-center text-gray-700 hover:text-green-600 py-2" onClick={() => setIsMenuOpen(false)}>
                            <Phone className="w-5 h-5 mr-2" /> Contact
                        </Link>
                    </nav>
                </div>
            )}
        </header>
    );
};

export default Header;
