// src/pages/AccountSettings.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';

const AccountSettings = () => {
    const { user, updateUserDetails, isAuthenticated } = useAuth();
    const [address, setAddress] = useState(user?.address || '');
    const [cardNumber, setCardNumber] = useState(user?.cardNumber || '');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!address || !cardNumber) {
            setError('Please fill in all fields.');
            return;
        }

        // Simulate updating user details (store in localStorage for demo)
        updateUserDetails({
            address,
            cardNumber, // Simplified; in production, use Paystack for secure card handling
        });
        navigate('/dashboard'); // Redirect back to dashboard after updating
    };

    if (!isAuthenticated) {
        navigate('/sign-in'); // Redirect to sign-in if not authenticated
        return null;
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="flex-1 p-4">
                <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-6">Account Settings</h1>
                    {error && <p className="text-red-500 mb-4">{error}</p>}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="address" className="block text-gray-700 mb-1">Shipping Address</label>
                            <input
                                type="text"
                                id="address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="e.g., 123 Main St, Cape Town"
                                aria-label="Shipping address"
                            />
                        </div>
                        <div>
                            <label htmlFor="cardNumber" className="block text-gray-700 mb-1">Card Number</label>
                            <input
                                type="text"
                                id="cardNumber"
                                value={cardNumber}
                                onChange={(e) => setCardNumber(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="e.g., 4111 1111 1111 1111"
                                aria-label="Card number"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all duration-300 shadow-md hover:shadow-lg"
                            aria-label="Update details"
                        >
                            Update Details
                        </button>
                    </form>
                    <p className="mt-4 text-gray-600 font-medium">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="text-green-600 hover:text-green-700"
                            aria-label="Back to dashboard"
                        >
                            Back to Dashboard
                        </button>
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default AccountSettings;