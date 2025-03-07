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

        const userData = {
            email,
            password,
            createdAt: new Date().toISOString(),
        };
        signUp(userData);
        navigate('/dashboard');
    };

    if (isAuthenticated) {
        navigate('/dashboard');
        return null;
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="flex-1 container mx-auto px-2 sm:px-4 py-6 sm:py-12">
                <div className="max-w-sm sm:max-w-md mx-auto bg-white shadow-md rounded-lg p-4 sm:p-6">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-4">Sign Up</h1>
                    {error && <p className="text-red-500 text-sm sm:text-base mb-2 sm:mb-4">{error}</p>}
                    <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-gray-700 text-sm sm:text-base mb-1">Email</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-2 sm:p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                                aria-label="Email address"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-gray-700 text-sm sm:text-base mb-1">Password</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-2 sm:p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                                aria-label="Password"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-2 sm:py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm sm:text-base"
                            aria-label="Sign up"
                        >
                            Sign Up
                        </button>
                    </form>
                    <p className="mt-2 sm:mt-4 text-gray-600 text-sm sm:text-base">
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