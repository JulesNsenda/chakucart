import React, { useContext, useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ProductContext } from '../context/ProductContext';
import { imageMap } from '../data/products';
import Header from '../components/Header';
import Hero from '../components/Hero';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';

// Loading skeleton component
const ProductSkeleton = () => (
  <div className="bg-white shadow-md rounded-lg overflow-hidden animate-pulse">
    <div className="h-40 bg-gray-300"></div>
    <div className="p-4">
      <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-gray-300 rounded w-1/3 mb-4"></div>
      <div className="h-10 bg-gray-300 rounded"></div>
    </div>
  </div>
);

// Helper function to normalize text for plural/singular matching
const normalizeText = (text) => {
  let normalized = text.toLowerCase().trim();
  if (normalized.endsWith('s')) normalized = normalized.slice(0, -1); // Remove 's'
  if (normalized.endsWith('es')) normalized = normalized.slice(0, -2); // Remove 'es'
  return normalized;
};

const Home = () => {
  const { allProducts, paginate, currentPage, itemsPerPage, cart, addToCart } = useContext(ProductContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState('none');
  const [category, setCategory] = useState('all');
  const [stockStatus, setStockStatus] = useState('all'); // New state for stock status
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const navigate = useNavigate();
  const productsRef = useRef(null);
  const [itemsPerPageOptions, setItemsPerPageOptions] = useState(8);
  const searchInputRef = useRef(null);

  // Categories for filtering
  const categories = ['all', 'fruits', 'vegetables', 'dairy', 'meat', 'bread', 'beverages'];
  const stockStatuses = ['all', 'in-stock', 'out-of-stock'];

  // Memoize product names for autocomplete
  const productNames = useMemo(() => allProducts.map(p => p.name), [allProducts]);

  // Handle search with loading state
  const handleSearch = (e) => {
    e.preventDefault();
    setIsLoading(true);
    if (searchTerm.trim()) {
      setSearchParams({ q: searchTerm.trim() });
    } else {
      setSearchParams({});
    }
    setTimeout(() => setIsLoading(false), 500); // Simulate network delay
  };

  // Handle autocomplete suggestions
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value) {
      const suggestions = productNames
        .filter(name => normalizeText(name).includes(normalizeText(value)))
        .slice(0, 5); // Show top 5 suggestions
      setSearchSuggestions(suggestions);
    } else {
      setSearchSuggestions([]);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion);
    setSearchSuggestions([]);
    setSearchParams({ q: suggestion });
  };

  // Handle search, sort, filter, and stock status (ensure exactly 20 unique products)
  const [filteredProducts, setFilteredProducts] = useState(() => {
    const uniqueProducts = Array.from(new Map(allProducts.map(p => [p.id, p])).values());
    if (uniqueProducts.length !== 20) {
      return generateExactlyTwentyUniqueProductsFromExisting(allProducts, imageMap);
    }
    return uniqueProducts;
  });

  useEffect(() => {
    setIsLoading(true);
    const searchQuery = searchParams.get('q') || '';
    let filtered = [...allProducts];

    // Ensure uniqueness in filtered array
    filtered = Array.from(new Map(filtered.map(p => [p.id, p])).values());

    // Apply search (case-insensitive, handling plural/singular)
    if (searchQuery) {
      const normalizedQuery = normalizeText(searchQuery);
      filtered = filtered.filter((product) => {
        const normalizedName = normalizeText(product.name);
        const normalizedDescription = normalizeText(product.description);
        return (
          normalizedName.includes(normalizedQuery) ||
          normalizedDescription.includes(normalizedQuery)
        );
      });
    }

    // Apply category filter
    if (category !== 'all') {
      filtered = filtered.filter((product) => product.category === category);
    }

    // Apply stock status filter
    if (stockStatus === 'in-stock') {
      filtered = filtered.filter(product => product.available && product.quantity > 0);
    } else if (stockStatus === 'out-of-stock') {
      filtered = filtered.filter(product => !product.available || product.quantity === 0);
    }

    // Apply sorting
    if (sortBy === 'price-asc') filtered.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') filtered.sort((a, b) => b.price - a.price);
    if (sortBy === 'name-asc') filtered.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'name-desc') filtered.sort((a, b) => b.name.localeCompare(a.name));

    // Ensure final filtered list has no duplicates and limit to 20 if more
    const finalProducts = Array.from(new Map(filtered.map(p => [p.id, p])).values());
    setFilteredProducts(finalProducts.slice(0, 20)); // Limit to exactly 20 unique products
    setTimeout(() => setIsLoading(false), 500); // Simulate network delay
  }, [allProducts, searchParams, sortBy, category, stockStatus]);

  // Sync searchTerm with searchParams on mount or param changes
  useEffect(() => {
    const searchQuery = searchParams.get('q') || '';
    setSearchTerm(searchQuery);
  }, [searchParams]);

  // Handle "Shop Now" button click to scroll to products
  const handleShopNow = () => {
    productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    const newItemsPerPage = parseInt(e.target.value);
    setItemsPerPageOptions(newItemsPerPage);
    paginate(1); // Reset to first page when changing items per page
  };

  // Pagination controls for filtered products
  const indexOfLastItem = currentPage * itemsPerPageOptions;
  const indexOfFirstItem = indexOfLastItem - itemsPerPageOptions;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPageOptions);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1">
        <Hero onShopNow={handleShopNow} />
        <section className="container mx-auto px-4 py-12">
          {/* Search, Sort, Filter, and Stock Status Section */}
          <div className="mb-8 bg-white p-6 rounded-lg shadow-lg">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search Bar with Autocomplete */}
              <form onSubmit={handleSearch} className="w-full md:w-1/2 relative">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="Search groceries..."
                    className="w-full p-3 pl-4 pr-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-400"
                    value={searchTerm}
                    onChange={handleInputChange}
                    ref={searchInputRef}
                    aria-label="Search groceries"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-green-500 text-white rounded-r-md hover:bg-green-600 transition-colors ml-2"
                  >
                    {isLoading ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      'Search'
                    )}
                  </button>
                </div>
                {searchSuggestions.length > 0 && (
                  <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 shadow-lg">
                    {searchSuggestions.map((suggestion, index) => (
                      <li
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                      >
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                )}
              </form>

              {/* Sort, Filter, and Stock Status Dropdowns */}
              <div className="flex flex-col md:flex-row gap-4 w-full md:w-1/2">
                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full md:w-auto p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                  aria-label="Sort products"
                >
                  <option value="none">Sort By</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name-asc">Name: A-Z</option>
                  <option value="name-desc">Name: Z-A</option>
                </select>

                {/* Filter by Category */}
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full md:w-auto p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                  aria-label="Filter by category"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>

                {/* Filter by Stock Status */}
                <select
                  value={stockStatus}
                  onChange={(e) => setStockStatus(e.target.value)}
                  className="w-full md:w-auto p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                  aria-label="Filter by stock status"
                >
                  {stockStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div ref={productsRef}>
            <h2 className="text-3xl font-bold mb-8 text-center text-gray-800">Our Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, index) => (
                  <ProductSkeleton key={index} />
                ))
              ) : currentProducts.length > 0 ? (
                currentProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <p className="text-center text-gray-500">No products found.</p>
              )}
            </div>
            {/* Pagination and Items Per Page */}
            {!isLoading && currentProducts.length > 0 && (
              <div className="mt-12 flex flex-col md:flex-row justify-center items-center gap-6">
                {/* Pagination */}
                <div className="flex justify-center space-x-2">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => paginate(i + 1)}
                      className={`px-4 py-2 rounded-md font-medium ${currentPage === i + 1
                          ? 'bg-green-500 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                        } transition-colors`}
                      aria-label={`Page ${i + 1}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                {/* Items Per Page Dropdown */}
                <select
                  value={itemsPerPageOptions}
                  onChange={handleItemsPerPageChange}
                  className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                  aria-label="Items per page"
                >
                  <option value={8}>8 Items</option>
                  <option value={12}>12 Items</option>
                  <option value={16}>16 Items</option>
                  <option value={20}>20 Items</option>
                </select>
              </div>
            )}

            {/* Payment Methods */}
            {!isLoading && (
              <div className="mt-12 text-center">
                <h3 className="text-xl font-semibold text-gray-800 mb-4" role="heading">Payment Methods Supported</h3>
                <div className="flex justify-center gap-6" role="list">
                  <span className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-md text-gray-700" role="listitem">
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18"></path>
                    </svg>
                    Paystack
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

// Helper function to generate exactly 20 unique products from existing list (fallback)
function generateExactlyTwentyUniqueProductsFromExisting(existingProducts, imageMap) {
  const seen = new Set();
  const uniqueProducts = [];
  const groceryNames = [
    'Apples', 'Bananas', 'Carrots', 'Potatoes', 'Tomatoes', 'Onions', 'Broccoli', 'Spinach',
    'Milk', 'Eggs', 'Bread', 'Rice', 'Pasta', 'Chicken Breast', 'Beef Mince', 'Fish Fillet',
    'Butter', 'Cheese', 'Yogurt', 'Orange Juice'
  ];

  // Use existing products first, ensuring uniqueness
  existingProducts.forEach(product => {
    if (!seen.has(product.name) && uniqueProducts.length < 20) {
      uniqueProducts.push(product);
      seen.add(product.name);
    }
  });

  // Fill remaining slots with new unique products using passed imageMap
  while (uniqueProducts.length < 20) {
    const name = groceryNames.find(n => !seen.has(n));
    if (name) {
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
        category: determineCategory(name),
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

// Function to determine product category
function determineCategory(name) {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('apples') || lowerName.includes('bananas') || lowerName.includes('tomatoes')) return 'fruits';
  if (lowerName.includes('carrots') || lowerName.includes('potatoes') || lowerName.includes('onions') || lowerName.includes('broccoli') || lowerName.includes('spinach')) return 'vegetables';
  if (lowerName.includes('milk') || lowerName.includes('eggs') || lowerName.includes('butter') || lowerName.includes('cheese') || lowerName.includes('yogurt')) return 'dairy';
  if (lowerName.includes('chicken') || lowerName.includes('beef') || lowerName.includes('fish')) return 'meat';
  if (lowerName.includes('bread')) return 'bread';
  if (lowerName.includes('juice')) return 'beverages';
  return 'all'; // Default category
}

export default Home;