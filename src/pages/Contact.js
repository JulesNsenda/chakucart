import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Contact = () => {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 container mx-auto px-2 sm:px-4 py-6 sm:py-12">
                <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center sm:text-left">Contact Us</h1>
                <p className="text-gray-700 text-sm sm:text-base mb-3 sm:mb-4 text-center sm:text-left">
                    Have questions or need assistance? Reach out to us, and we’ll get back to you as soon as possible.
                </p>
                <div className="max-w-sm sm:max-w-md mx-auto">
                    <form className="space-y-3 sm:space-y-4">
                        <input
                            type="text"
                            placeholder="Your Name"
                            className="w-full p-2 sm:p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                            aria-label="Your Name"
                        />
                        <input
                            type="email"
                            placeholder="Your Email"
                            className="w-full p-2 sm:p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                            aria-label="Your Email"
                        />
                        <textarea
                            placeholder="Your Message"
                            className="w-full p-2 sm:p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 h-24 sm:h-32 text-sm sm:text-base"
                            aria-label="Your Message"
                        />
                        <button
                            type="submit"
                            className="w-full py-2 sm:py-3 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm sm:text-base"
                            aria-label="Send Message"
                        >
                            Send Message
                        </button>
                    </form>
                    <div className="mt-4 sm:mt-6 text-gray-700 text-sm sm:text-base text-center sm:text-left">
                        <p>Email: support@chakucart.co.za</p>
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