import React, { createContext, useState, useEffect } from 'react';
import generateRandomProducts, { imageMap } from '../data/products';

export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
    const [products, setProducts] = useState(() => {
        // Check if this is a new browser session
        const sessionFlag = sessionStorage.getItem('freshCartSession');
        const savedProducts = localStorage.getItem('freshCartProducts');

        if (!sessionFlag) {
            // New session (browser restart): Generate new products
            const newProducts = generateRandomProducts(20);
            localStorage.setItem('freshCartProducts', JSON.stringify(newProducts));
            sessionStorage.setItem('freshCartSession', 'active');
            return newProducts;
        }

        // Existing session: Load from localStorage or generate if none exist
        return savedProducts ? JSON.parse(savedProducts) : generateRandomProducts(20);
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('freshCartCart');
        return savedCart ? JSON.parse(savedCart) : [];
    });
    const [promotedIds, setPromotedIds] = useState(() => {
        const savedPromotedIds = localStorage.getItem('freshCartPromotedIds');
        if (savedPromotedIds && products.length > 0) {
            return JSON.parse(savedPromotedIds);
        }
        return products.length > 0
            ? products.sort(() => 0.5 - Math.random()).slice(0, 2).map(product => product.id)
            : [];
    });
    const itemsPerPage = 8;

    // Save products to localStorage when they change
    useEffect(() => {
        localStorage.setItem('freshCartProducts', JSON.stringify(products));
    }, [products]);

    // Save cart to localStorage when it changes
    useEffect(() => {
        localStorage.setItem('freshCartCart', JSON.stringify(cart));
    }, [cart]);

    // Save promoted IDs to localStorage when they change
    useEffect(() => {
        localStorage.setItem('freshCartPromotedIds', JSON.stringify(promotedIds));
    }, [promotedIds]);

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentProducts = products.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Cart methods
    const addToCart = (product) => {
        if (product.available) {
            const isPromoted = promotedIds.includes(product.id);
            const cartItem = isPromoted ? { ...product, price: Number((product.price * 0.85).toFixed(2)) } : product;
            setCart([...cart, cartItem]);
        }
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.id !== productId));
    };

    const updateCartQuantity = (productId, quantity) => {
        if (quantity < 1) return removeFromCart(productId);
        setCart(cart.map(item =>
            item.id === productId ? { ...item, quantity: quantity } : item
        ));
    };

    const clearCart = () => {
        setCart([]);
        localStorage.removeItem('freshCartCart');
    };

    return (
        <ProductContext.Provider value={{
            products: currentProducts,
            allProducts: products,
            cart,
            addToCart,
            removeFromCart,
            updateCartQuantity,
            clearCart,
            promotedIds,
            paginate,
            currentPage,
            itemsPerPage
        }}>
            {children}
        </ProductContext.Provider>
    );
};