import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const About = () => {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 container mx-auto px-2 sm:px-4 py-6 sm:py-12">
                <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center sm:text-left">About ChakuCart</h1>
                <p className="text-gray-700 text-sm sm:text-base mb-3 sm:mb-4 text-center sm:text-left">
                    ChakuCart is your premier online grocery platform, connecting customers in South Africa with local farmer's markets and supermarkets. Our mission is to provide fresh, high-quality groceries delivered fast, while supporting local businesses and simplifying your shopping experience.
                </p>
                <p className="text-gray-700 text-sm sm:text-base text-center sm:text-left">
                    Founded in 2025, we’ve grown rapidly to serve communities with sustainable, convenient grocery solutions. Our platform leverages cutting-edge technology to ensure seamless payment processing, reliable delivery, and a user-friendly interface.
                </p>
            </main>
            <Footer />
        </div>
    );
};

export default About;