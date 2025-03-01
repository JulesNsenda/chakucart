import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Contact = () => {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-12">
                <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
                <p className="text-gray-700 mb-4">
                    Have questions or need assistance? Reach out to us, and we’ll get back to you as soon as possible.
                </p>
                <div className="max-w-md mx-auto">
                    <form className="space-y-4">
                        <input
                            type="text"
                            placeholder="Your Name"
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <input
                            type="email"
                            placeholder="Your Email"
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <textarea
                            placeholder="Your Message"
                            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 h-32"
                        />
                        <button
                            type="submit"
                            className="w-full py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                        >
                            Send Message
                        </button>
                    </form>
                    <div className="mt-6 text-gray-700">
                        <p>Email: support@freshcart.co.za</p>
                        <p>Phone: +27 123 456 789</p>
                        <p>Address: 123 Fresh Street, Cape Town, South Africa</p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Contact;