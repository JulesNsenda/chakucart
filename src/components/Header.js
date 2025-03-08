import React, { useState, useContext, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ProductContext } from "../context/ProductContext";
import { useAuth } from "../context/AuthContext";
import { ShoppingCart, User, Menu, X, LogOut, Home, Info, Phone, Settings, Package } from "lucide-react";

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [cartAnimation, setCartAnimation] = useState(false); // State for cart animation
    const menuRef = useRef(null);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const { cart } = useContext(ProductContext);
    const { signOut, isAuthenticated } = useAuth();

    // Trigger animation when cart length changes
    useEffect(() => {
        if (cart.length > 0) {
            setCartAnimation(true);
            const timer = setTimeout(() => setCartAnimation(false), 1000); // Animation lasts 1 second
            return () => clearTimeout(timer);
        }
    }, [cart.length]);

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSignOut = () => {
        signOut();
        navigate("/");
        setIsMenuOpen(false);
        setIsDropdownOpen(false);
    };

    return (
        <header className="sticky top-0 z-50 bg-white shadow-md">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center space-x-2" aria-label="Home">
                    <img
                        src={window.innerWidth > 768 ? "/logo512.png" : "/logo192.png"}
                        alt="ChakuCart Logo"
                        className="h-8 w-8"
                    />
                    <span className="text-xl font-bold text-green-600">ChakuCart</span>
                </Link>

                {/* Mobile Icons: Cart & Sign In/User Menu */}
                <div className="flex items-center md:hidden space-x-4">
                    {/* Cart */}
                    <Link to="/cart" className="relative text-gray-700 hover:text-green-600" aria-label="Cart">
                        <div className={`relative ${cartAnimation ? "animate-pulse" : ""}`}>
                            <ShoppingCart className="w-6 h-6" />
                            {cartAnimation && (
                                <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <span
                                            key={i}
                                            className="absolute w-1.5 h-1.5 bg-green-500 rounded-full animate-burst"
                                            style={{
                                                transform: `rotate(${i * 60}deg) translate(12px)`,
                                                animationDelay: `${i * 0.05}s`,
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                        {cart.length > 0 && (
                            <span
                                className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center transition-transform duration-300 ease-in-out transform scale-100"
                                style={cartAnimation ? { transform: "scale(1.2)" } : {}}
                            >
                                {cart.length}
                            </span>
                        )}
                    </Link>

                    {/* User Menu */}
                    {isAuthenticated ? (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                className="text-gray-700 hover:text-green-600"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                aria-label="User menu"
                            >
                                <User className="w-6 h-6" />
                            </button>
                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md overflow-hidden">
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
                    <button
                        className="text-gray-700 hover:text-green-600 focus:outline-none"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center space-x-6">
                    <Link to="/" className="text-gray-700 hover:text-green-600 text-lg">Home</Link>
                    <Link to="/about" className="text-gray-700 hover:text-green-600 text-lg">About</Link>
                    <Link to="/contact" className="text-gray-700 hover:text-green-600 text-lg">Contact</Link>

                    {/* Cart */}
                    <Link to="/cart" className="relative text-gray-700 hover:text-green-600" aria-label="Cart">
                        <div className={`relative ${cartAnimation ? "animate-pulse" : ""}`}>
                            <ShoppingCart className="w-6 h-6" />
                            {cartAnimation && (
                                <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <span
                                            key={i}
                                            className="absolute w-1.5 h-1.5 bg-green-500 rounded-full animate-burst"
                                            style={{
                                                transform: `rotate(${i * 60}deg) translate(12px)`,
                                                animationDelay: `${i * 0.05}s`,
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                        {cart.length > 0 && (
                            <span
                                className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center transition-transform duration-300 ease-in-out transform scale-100"
                                style={cartAnimation ? { transform: "scale(1.2)" } : {}}
                            >
                                {cart.length}
                            </span>
                        )}
                    </Link>

                    {/* User Menu */}
                    {isAuthenticated ? (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                className="text-gray-700 hover:text-green-600"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                aria-label="User menu"
                            >
                                <User className="w-6 h-6" />
                            </button>
                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md overflow-hidden">
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
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden" onClick={() => setIsMenuOpen(false)}>
                    <div
                        ref={menuRef}
                        className="absolute top-0 left-0 h-full w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center space-x-2">
                                <img src="/logo192.png" alt="ChakuCart Logo" className="h-8 w-8" />
                                <span className="text-xl font-bold text-green-600">ChakuCart</span>
                            </div>
                            <button
                                className="text-gray-500 hover:text-green-600 focus:outline-none"
                                onClick={() => setIsMenuOpen(false)}
                                aria-label="Close menu"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {isAuthenticated && (
                            <div className="px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-green-100 rounded-full p-2">
                                        <User className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium">My Account</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <nav className="flex flex-col p-6 space-y-4">
                            <Link
                                to="/"
                                className="flex items-center text-gray-700 hover:text-green-600 py-2"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <Home className="w-5 h-5 mr-3" />
                                <span className="text-lg">Home</span>
                            </Link>
                            <Link
                                to="/about"
                                className="flex items-center text-gray-700 hover:text-green-600 py-2"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <Info className="w-5 h-5 mr-3" />
                                <span className="text-lg">About</span>
                            </Link>
                            <Link
                                to="/contact"
                                className="flex items-center text-gray-700 hover:text-green-600 py-2"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <Phone className="w-5 h-5 mr-3" />
                                <span className="text-lg">Contact</span>
                            </Link>

                            {isAuthenticated ? (
                                <>
                                    <div className="border-t border-gray-200 my-2"></div>
                                    <Link
                                        to="/dashboard"
                                        className="flex items-center text-gray-700 hover:text-green-600 py-2"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <Package className="w-5 h-5 mr-3" />
                                        <span className="text-lg">Dashboard</span>
                                    </Link>
                                    <Link
                                        to="/account-settings"
                                        className="flex items-center text-gray-700 hover:text-green-600 py-2"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <Settings className="w-5 h-5 mr-3" />
                                        <span className="text-lg">Account Settings</span>
                                    </Link>
                                    <div className="border-t border-gray-200 my-2"></div>
                                    <button
                                        onClick={handleSignOut}
                                        className="flex items-center w-full text-left py-2 text-red-600 hover:text-red-700"
                                    >
                                        <LogOut className="w-5 h-5 mr-3" />
                                        <span className="text-lg">Sign Out</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="border-t border-gray-200 my-2"></div>
                                    <Link
                                        to="/sign-in"
                                        className="flex items-center text-gray-700 hover:text-green-600 py-2 font-medium"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <User className="w-5 h-5 mr-3" />
                                        <span className="text-lg">Sign In</span>
                                    </Link>
                                </>
                            )}
                        </nav>
                    </div>
                </div>
            )}

            {/* Custom CSS for animations */}
            <style jsx>{`
                .animate-pulse {
                    animation: pulse 0.5s ease-in-out;
                }
                .animate-burst {
                    animation: burst 0.6s ease-out forwards;
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                @keyframes burst {
                    0% { opacity: 1; transform: scale(1) translate(12px); }
                    100% { opacity: 0; transform: scale(1.5) translate(20px); }
                }
            `}</style>
        </header>
    );
};

export default Header;