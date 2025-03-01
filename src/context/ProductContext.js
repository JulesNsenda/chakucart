import React, { createContext, useState, useEffect } from 'react';
import generateRandomProducts, { imageMap } from '../data/products';

export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8; // Ensure 8 items per page

    useEffect(() => {
        // Generate unique products on mount, reset on browser restart
        const uniqueProducts = generateUniqueRandomProducts(20);
        setProducts(uniqueProducts);
    }, []);

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentProducts = products.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <ProductContext.Provider value={{ products: currentProducts, allProducts: products, paginate, currentPage, itemsPerPage }}>
            {children}
        </ProductContext.Provider>
    );
};

// Helper function to ensure no duplicates
function generateUniqueRandomProducts(count) {
    const seen = new Set();
    const uniqueProducts = [];
    const groceryNames = [
        'Apples', 'Bananas', 'Carrots', 'Potatoes', 'Tomatoes', 'Onions', 'Broccoli', 'Spinach',
        'Milk', 'Eggs', 'Bread', 'Rice', 'Pasta', 'Chicken Breast', 'Beef Mince', 'Fish Fillet',
        'Butter', 'Cheese', 'Yogurt', 'Orange Juice'
    ];
    const units = ['kg', 'bunch', 'each', 'liter', 'dozen', 'loaf', 'pack'];

    while (uniqueProducts.length < count && seen.size < groceryNames.length) {
        const name = groceryNames[Math.floor(Math.random() * groceryNames.length)];
        if (!seen.has(name)) {
            seen.add(name);
            const product = {
                id: uniqueProducts.length + 1,
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