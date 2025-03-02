// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // Store user data (e.g., email, address, cards, isFirstTime, isAuthenticated)

    // Load user from localStorage on mount, ensuring isAuthenticated and isFirstTime are set correctly
    useEffect(() => {
        const savedUser = localStorage.getItem('freshCartUser');
        if (savedUser) {
            const parsedUser = JSON.parse(savedUser);
            // Restore user with isAuthenticated and isFirstTime preserved (default to false if not set)
            setUser({
                ...parsedUser,
                isAuthenticated: parsedUser.isAuthenticated ?? false,
                isFirstTime: parsedUser.isFirstTime ?? false,
            });
        }
    }, []);

    // Save user to localStorage when it changes, preserving all data
    useEffect(() => {
        if (user) {
            localStorage.setItem('freshCartUser', JSON.stringify(user));
        } else {
            // On sign-out, preserve user data but remove auth state
            const savedUserData = localStorage.getItem('freshCartUser');
            if (savedUserData) {
                const userData = JSON.parse(savedUserData);
                if (userData && !user) {
                    localStorage.setItem('freshCartUser', JSON.stringify({ ...userData, isAuthenticated: false }));
                }
            }
        }
    }, [user]);

    const signIn = (userData) => {
        setUser({ ...userData, isAuthenticated: true, isFirstTime: false }); // Mark as authenticated, not first-time
    };

    const signOut = () => {
        // Preserve user data in localStorage, just set isAuthenticated to false
        if (user) {
            setUser({ ...user, isAuthenticated: false });
        } else {
            setUser(null);
        }
    };

    const signUp = (userData) => {
        setUser({ ...userData, isAuthenticated: true, isFirstTime: false }); // Mark as authenticated, not first-time (tutorial removed)
    };

    const updateUserDetails = (updates) => {
        setUser(prev => prev ? { ...prev, ...updates, isAuthenticated: prev.isAuthenticated, isFirstTime: false } : prev); // Update details, preserve auth state, mark as not first-time
    };

    // Check if user is authenticated, first-time, and has required details
    const isAuthenticated = user?.isAuthenticated || false;
    const isFirstTime = user?.isFirstTime || false;
    const hasRequiredDetails = user?.address && user?.cardNumber; // Check if address and cardNumber exist

    return (
        <AuthContext.Provider value={{ user, signIn, signOut, signUp, updateUserDetails, isAuthenticated, isFirstTime, hasRequiredDetails }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);