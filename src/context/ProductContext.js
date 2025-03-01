import React, { createContext, useState, useEffect } from 'react';
import { imageMap } from '../data/products';

export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
    const [products, setProducts] = useState(() => {
        // Load products from localStorage if available, otherwise generate exactly 20 unique products
        const savedProducts = localStorage.getItem('freshCartProducts');
        if (savedProducts) {
            const parsedProducts = JSON.parse(savedProducts);
            // Ensure exactly 20 unique products by ID
            const uniqueProducts = Array.from(new Map(parsedProducts.map(p => [p.id, p])).values());
            if (uniqueProducts.length === 20) {
                return uniqueProducts;
            }
            console.warn('Invalid or duplicate products in localStorage, regenerating...');
            const newProducts = generateExactlyTwentyUniqueProducts();
            localStorage.setItem('freshCartProducts', JSON.stringify(newProducts));
            return newProducts;
        }
        // Generate exactly 20 unique products if no saved data exists
        return generateExactlyTwentyUniqueProducts();
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [cart, setCart] = useState(() => {
        // Load cart from localStorage if available, otherwise use empty array
        const savedCart = localStorage.getItem('freshCartCart');
        return savedCart ? JSON.parse(savedCart) : [];
    });
    const itemsPerPage = 8; // Ensure 8 items per page (default, overridden by dropdown)

    // Save products and cart to localStorage when they change (persist across refreshes)
    useEffect(() => {
        // Ensure exactly 20 unique products are saved
        const uniqueProducts = Array.from(new Map(products.map(p => [p.id, p])).values());
        if (uniqueProducts.length !== 20) {
            console.error('Products list should have exactly 20 unique items, regenerating...');
            const newProducts = generateExactlyTwentyUniqueProducts();
            setProducts(newProducts);
            localStorage.setItem('freshCartProducts', JSON.stringify(newProducts));
        } else {
            localStorage.setItem('freshCartProducts', JSON.stringify(uniqueProducts));
        }
    }, [products]);

    useEffect(() => {
        localStorage.setItem('freshCartCart', JSON.stringify(cart));
    }, [cart]);

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentProducts = products.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Cart methods (updated to handle quantities)
    const addToCart = (product) => {
        if (product.available && product.quantity > 0) {
            setCart(prevCart => {
                const existingItem = prevCart.find(item => item.id === product.id);
                if (existingItem) {
                    return prevCart.map(item =>
                        item.id === product.id
                            ? { ...item, cartQuantity: Math.min(item.cartQuantity + 1, product.quantity) }
                            : item
                    );
                }
                return [...prevCart, { ...product, cartQuantity: 1 }];
            });
        }
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.id !== productId));
    };

    const updateCartQuantity = (productId, quantity) => {
        const product = products.find(p => p.id === productId);
        if (!product || quantity < 1) return removeFromCart(productId);
        setCart(cart.map(item =>
            item.id === productId
                ? { ...item, cartQuantity: Math.min(quantity, product.quantity) }
                : item
        ));
    };

    const clearCart = () => {
        setCart([]);
        localStorage.removeItem('freshCartCart'); // Clear localStorage as well
    };

    // Helper function to generate exactly 20 unique products (no duplicates by name or ID)
    function generateExactlyTwentyUniqueProducts() {
        const seen = new Set();
        const uniqueProducts = [];
        const groceryNames = [
            'Apples', 'Bananas', 'Carrots', 'Potatoes', 'Tomatoes', 'Onions', 'Broccoli', 'Spinach',
            'Milk', 'Eggs', 'Bread', 'Rice', 'Pasta', 'Chicken Breast', 'Beef Mince', 'Fish Fillet',
            'Butter', 'Cheese', 'Yogurt', 'Orange Juice'
        ];
        const units = ['kg', 'bunch', 'each', 'liter', 'dozen', 'loaf', 'pack'];

        // Ensure exactly 20 unique products by iterating until we have 20
        while (uniqueProducts.length < 20 && seen.size < groceryNames.length) {
            const name = groceryNames[Math.floor(Math.random() * groceryNames.length)];
            if (!seen.has(name)) {
                seen.add(name);
                const product = {
                    id: uniqueProducts.length + 1, // Ensure unique IDs
                    name,
                    description: `Fresh ${name} from local markets`,
                    price: Number((Math.random() * 20 + 1).toFixed(2)),
                    unit: getUnitForCategory(name),
                    quantity: Math.floor(Math.random() * 10) + 1,
                    available: Math.random() > 0.1,
                    image: imageMap[name],
                };
                uniqueProducts.push(product);
            }
        }

        // This should never happen with 20 grocery names, but as a safeguard
        if (uniqueProducts.length < 20) {
            console.error('Failed to generate 20 unique products, adding fallback unique products...');
            while (uniqueProducts.length < 20) {
                const baseName = groceryNames[Math.floor(Math.random() * groceryNames.length)];
                const variation = uniqueProducts.length + 1;
                const name = `Extra ${baseName} ${variation}`;
                if (!seen.has(name)) {
                    seen.add(name);
                    const product = {
                        id: uniqueProducts.length + 1,
                        name,
                        description: `Fresh ${name} from local markets`,
                        price: Number((Math.random() * 20 + 1).toFixed(2)),
                        unit: units[Math.floor(Math.random() * units.length)],
                        quantity: Math.floor(Math.random() * 10) + 1,
                        available: Math.random() > 0.1,
                        image: imageMap[baseName] || imageMap[groceryNames[0]], // Fallback to first image if needed
                    };
                    uniqueProducts.push(product);
                }
            }
        }

        return uniqueProducts;
    }

    // Function for specific units based on category
    function getUnitForCategory(name) {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('milk') || lowerName.includes('juice')) return 'liter';
        if (lowerName.includes('fruit') || lowerName.includes('apples') || lowerName.includes('bananas') || lowerName.includes('tomatoes')) return 'kg';
        if (lowerName.includes('bread')) return 'loaf';
        if (lowerName.includes('eggs')) return 'dozen';
        return 'each'; // Default for others
    }

    return (
        <ProductContext.Provider value={{
            products: currentProducts,
            allProducts: products,
            cart,
            addToCart,
            removeFromCart,
            updateCartQuantity,
            clearCart,
            paginate,
            currentPage,
            itemsPerPage,
            imageMap, // Add to context value
        }}>
            {children}
        </ProductContext.Provider>
    );
}