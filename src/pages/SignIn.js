// src/pages/SignIn.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';

const SignIn = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { signIn, isAuthenticated } = useAuth();

    // Simulate sign-in (replace with real authentication logic, e.g., API call to Paystack or backend)
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Please enter email and password.');
            return;
        }

        // Check if user exists in localStorage (use preserved data)
        const savedUser = localStorage.getItem('freshCartUser');
        if (savedUser) {
            const parsedUser = JSON.parse(savedUser);
            if (parsedUser.email === email && parsedUser.password === password) { // Insecure for demo; use secure hashing in production
                signIn(parsedUser);
            } else {
                setError('Invalid email or password.');
            }
        } else {
            setError('No account found. Please sign up.');
        }
    };

    // Use useEffect to handle navigation after render
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-12">
                <div className="max-w-md mx-auto bg-white shadow-md rounded-lg p-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">Sign In</h1>
                    {error && <p className="text-red-500 mb-4">{error}</p>}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                aria-label="Email address"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-gray-700 mb-1">Password</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                aria-label="Password"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                            aria-label="Sign in"
                        >
                            Sign In
                        </button>
                    </form>
                    <p className="mt-4 text-gray-600">
                        Don’t have an account?{' '}
                        <Link to="/subscribe" className="text-green-500 hover:text-green-600">
                            Sign Up
                        </Link>
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default SignIn;