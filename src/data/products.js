// src/data/products.js
import apples from '../assets/images/apples.jpg';
import bananas from '../assets/images/bananas.jpg';
import carrots from '../assets/images/carrots.jpg';
import potatoes from '../assets/images/potatoes.jpg';
import tomatoes from '../assets/images/tomatoes.jpg';
import onions from '../assets/images/onions.jpg';
import broccoli from '../assets/images/broccoli.jpg';
import spinach from '../assets/images/spinach.jpg';
import milk from '../assets/images/milk.jpg';
import eggs from '../assets/images/eggs.jpg';
import bread from '../assets/images/bread.jpg';
import rice from '../assets/images/rice.jpg';
import pasta from '../assets/images/pasta.jpg';
import chickenBreast from '../assets/images/chicken_breast.jpg';
import beefMince from '../assets/images/beef_mince.jpg';
import fishFillet from '../assets/images/fish_fillet.jpg';
import butter from '../assets/images/butter.jpg';
import cheese from '../assets/images/cheese.jpg';
import yogurt from '../assets/images/yogurt.jpg';
import orangeJuice from '../assets/images/orange_juice.jpg';

const groceryNames = [
    'Apples', 'Bananas', 'Carrots', 'Potatoes', 'Tomatoes', 'Onions', 'Broccoli', 'Spinach',
    'Milk', 'Eggs', 'Bread', 'Rice', 'Pasta', 'Chicken Breast', 'Beef Mince', 'Fish Fillet',
    'Butter', 'Cheese', 'Yogurt', 'Orange Juice'
];


const imageMap = {
    'Apples': apples,
    'Bananas': bananas,
    'Carrots': carrots,
    'Potatoes': potatoes,
    'Tomatoes': tomatoes,
    'Onions': onions,
    'Broccoli': broccoli,
    'Spinach': spinach,
    'Milk': milk,
    'Eggs': eggs,
    'Bread': bread,
    'Rice': rice,
    'Pasta': pasta,
    'Chicken Breast': chickenBreast,
    'Beef Mince': beefMince,
    'Fish Fillet': fishFillet,
    'Butter': butter,
    'Cheese': cheese,
    'Yogurt': yogurt,
    'Orange Juice': orangeJuice,
};

const generateRandomProducts = (count = 20) => {
    const markets = [
        'Cape Town Farmer’s Market',
        'Stellenbosch Fresh Market',
        'Shoprite Cape Town',
        'Woolworths Durbanville'
    ];

    return Array.from({ length: count }, (_, index) => {
        const name = groceryNames[Math.floor(Math.random() * groceryNames.length)];
        return {
            id: index + 1,
            name,
            description: `Fresh ${name} from local markets`,
            price: Number((Math.random() * 20 + 1).toFixed(2)),
            unit: getUnitForCategory(name),
            quantity: Math.floor(Math.random() * 10) + 1,
            available: Math.random() > 0.1,
            image: imageMap[name],
            market: markets[Math.floor(Math.random() * markets.length)],
            category: determineCategory(name),
        };
    });
};

function determineCategory(name) {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('apples') || lowerName.includes('bananas') || lowerName.includes('tomatoes')) return 'fruits';
    if (lowerName.includes('carrots') || lowerName.includes('potatoes') || lowerName.includes('onions') || lowerName.includes('broccoli') || lowerName.includes('spinach')) return 'vegetables';
    if (lowerName.includes('milk') || lowerName.includes('eggs') || lowerName.includes('butter') || lowerName.includes('cheese') || lowerName.includes('yogurt')) return 'dairy';
    if (lowerName.includes('chicken') || lowerName.includes('beef') || lowerName.includes('fish')) return 'meat';
    if (lowerName.includes('bread')) return 'bread';
    if (lowerName.includes('juice')) return 'beverages';
    return 'all';
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

export default generateRandomProducts;
export { imageMap }; // Export imageMap for use in other files