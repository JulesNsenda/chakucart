// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // Store user data (e.g., email, address, cards, isFirstTime, isAuthenticated, linkedCard, authorizationCode, codReference)

    // Load user from localStorage on mount, ensuring all fields are set correctly
    useEffect(() => {
        const savedUser = localStorage.getItem('freshCartUser');
        if (savedUser) {
            const parsedUser = JSON.parse(savedUser);
            // Restore user with all fields preserved (default to null/empty if not set)
            setUser({
                ...parsedUser,
                isAuthenticated: parsedUser.isAuthenticated ?? false,
                isFirstTime: parsedUser.isFirstTime ?? false,
                linkedCard: parsedUser.linkedCard ?? false, // Default to false if not set
                authorizationCode: parsedUser.authorizationCode || null, // Default to null if not set
                codReference: parsedUser.codReference || null, // Default to null if not set
            });
        } else {
            console.log('No user found in localStorage'); // Debug log
        }
    }, []);

    // Save user to localStorage when it changes, preserving all data
    useEffect(() => {
        if (user) {
            try {
                localStorage.setItem('freshCartUser', JSON.stringify(user));
            } catch (error) {
                console.error('Failed to save user to localStorage:', error);// Debug log
            }
        } else {
            // On sign-out, preserve user data but remove auth state
            const savedUserData = localStorage.getItem('freshCartUser');
            if (savedUserData) {
                const userData = JSON.parse(savedUserData);
                if (userData && !user) {
                    try {
                        localStorage.setItem('freshCartUser', JSON.stringify({ ...userData, isAuthenticated: false }));
                    } catch (error) {
                        console.error('Failed to preserve user data on sign-out:', error);// Debug log
                    }
                }
            } else {
                console.log('No user data to preserve on sign-out');// Debug log
            }
        }
    }, [user]);

    const signIn = (userData) => {
        setUser({ ...userData, isAuthenticated: true, isFirstTime: false, linkedCard: userData.linkedCard ?? false, authorizationCode: userData.authorizationCode || null, codReference: userData.codReference || null }); // Mark as authenticated, not first-time, preserve linkedCard, authorizationCode, and codReference
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
        setUser({ ...userData, isAuthenticated: true, isFirstTime: false, linkedCard: false, authorizationCode: null, codReference: null }); // Mark as authenticated, not first-time, default linkedCard to false, authorizationCode to null, codReference to null
    };

    const updateUserDetails = (updates) => {
        setUser(prev => prev ? {
            ...prev,
            ...updates,
            isAuthenticated: prev.isAuthenticated,
            isFirstTime: false,
            linkedCard: updates.linkedCard ?? prev.linkedCard, // Update linkedCard if provided, otherwise retain existing value
            authorizationCode: updates.authorizationCode ?? prev.authorizationCode, // Update authorizationCode if provided, otherwise retain existing value
            codReference: updates.codReference ?? prev.codReference, // Update codReference if provided, otherwise retain existing value
        } : prev); // Update details, preserve auth state, mark as not first-time, and manage linkedCard, authorizationCode, and codReference
    };

    // Check if user is authenticated, first-time, has required details, and card linkage
    const isAuthenticated = user?.isAuthenticated || false;
    const isFirstTime = user?.isFirstTime || false;
    const hasRequiredDetails = user?.address && user?.cardNumber; // Check if address and cardNumber exist
    const isCardLinked = user?.linkedCard || false; // New helper to check if card is linked
    const authorizationCode = user?.authorizationCode || null; // Expose authorizationCode for COD
    const codReference = user?.codReference || null; // Expose codReference for COD confirmation

    return (
        <AuthContext.Provider value={{
            user,
            signIn,
            signOut,
            signUp,
            updateUserDetails,
            isAuthenticated,
            isFirstTime,
            hasRequiredDetails,
            isCardLinked, // Expose isCardLinked for easy access in components
            authorizationCode, // Expose authorizationCode for COD
            codReference, // Expose codReference for COD confirmation
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);