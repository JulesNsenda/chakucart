// src/pages/Subscribe.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Subscribe = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { signUp, isAuthenticated } = useAuth();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Please fill in all fields.');
            return;
        }

        // Simulate sign-up (store minimal user data in localStorage for demo)
        const userData = {
            email,
            password, // Insecure for demo; use secure hashing in production
            createdAt: new Date().toISOString(),
        };
        signUp(userData);
        navigate('/dashboard'); // Handle navigation in the component
    };

    if (isAuthenticated) {
        navigate('/dashboard'); // Redirect to dashboard if already authenticated
        return null;
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-12">
                <div className="max-w-md mx-auto bg-white shadow-md rounded-lg p-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">Sign Up</h1>
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
                            aria-label="Sign up"
                        >
                            Sign Up
                        </button>
                    </form>
                    <p className="mt-4 text-gray-600">
                        Already have an account?{' '}
                        <Link to="/sign-in" className="text-green-500 hover:text-green-600">
                            Sign In
                        </Link>
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Subscribe;