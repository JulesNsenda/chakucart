import React, { useContext, useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ProductContext } from '../context/ProductContext';
import Header from '../components/Header';
import Hero from '../components/Hero';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';

// Helper function to normalize text for plural/singular matching
const normalizeText = (text) => {
  let normalized = text.toLowerCase().trim();
  // Remove common plural endings (simple heuristic for "s" or "es")
  if (normalized.endsWith('s')) {
    normalized = normalized.slice(0, -1); // Remove 's'
  }
  if (normalized.endsWith('es')) {
    normalized = normalized.slice(0, -2); // Remove 'es'
  }
  return normalized;
};

const Home = () => {
  const { allProducts, paginate, currentPage, itemsPerPage, cart, setCart } = useContext(ProductContext);
  const [searchParams, setSearchParams] = useSearchParams(); // Read and write search params
  const [sortBy, setSortBy] = useState('none');
  const [category, setCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || ''); // Sync with URL query
  const navigate = useNavigate();
  const productsRef = useRef(null); // Ref for the products section
  const [itemsPerPageOptions, setItemsPerPageOptions] = useState(8); // State for items per page dropdown (default 8)

  // Categories for filtering
  const categories = ['all', 'fruits', 'vegetables', 'dairy', 'meat', 'bread', 'beverages'];

  // Randomly pick 2 promoted items (15% off)
  const promotedIds = allProducts
    .sort(() => 0.5 - Math.random()) // Random sort
    .slice(0, 2) // Pick 2 items
    .map(product => product.id);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setSearchParams({ q: searchTerm.trim() }); // Update URL with search query
      // No need to navigate manually; useEffect will handle re-render
    } else {
      setSearchParams({}); // Clear search if empty
    }
  };

  // Handle search, sort, and filter
  const [filteredProducts, setFilteredProducts] = useState(allProducts);

  useEffect(() => {
    const searchQuery = searchParams.get('q') || '';
    let filtered = [...allProducts];

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
      filtered = filtered.filter((product) => {
        const lowerName = product.name.toLowerCase();
        if (category === 'fruits') return lowerName.includes('apples') || lowerName.includes('bananas') || lowerName.includes('tomatoes');
        if (category === 'vegetables') return lowerName.includes('carrots') || lowerName.includes('potatoes') || lowerName.includes('onions') || lowerName.includes('broccoli') || lowerName.includes('spinach');
        if (category === 'dairy') return lowerName.includes('milk') || lowerName.includes('eggs') || lowerName.includes('butter') || lowerName.includes('cheese') || lowerName.includes('yogurt');
        if (category === 'meat') return lowerName.includes('chicken') || lowerName.includes('beef') || lowerName.includes('fish');
        if (category === 'bread') return lowerName.includes('bread');
        if (category === 'beverages') return lowerName.includes('juice');
        return false;
      });
    }

    // Apply sorting
    if (sortBy === 'price-asc') filtered.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') filtered.sort((a, b) => b.price - a.price);
    if (sortBy === 'name-asc') filtered.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'name-desc') filtered.sort((a, b) => b.name.localeCompare(a.name));

    setFilteredProducts(filtered);
  }, [allProducts, searchParams, sortBy, category]);

  // Sync searchTerm with searchParams on mount or param changes
  useEffect(() => {
    const searchQuery = searchParams.get('q') || '';
    setSearchTerm(searchQuery); // Update searchTerm to match URL query
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
  const indexOfLastItem = currentPage * itemsPerPageOptions; // Use itemsPerPageOptions instead of itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPageOptions;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPageOptions);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1">
        <Hero onShopNow={handleShopNow} />
        <section className="container mx-auto px-4 py-12">
          {/* Search, Sort, and Filter Section */}
          <div className="mb-8 bg-white p-6 rounded-lg shadow-lg">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search Bar */}
              <form onSubmit={handleSearch} className="w-full md:w-1/2">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="Search groceries..."
                    className="w-full p-3 pl-4 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="p-2 bg-green-500 text-white rounded-r-md hover:bg-green-600 transition-colors"
                  >
                    Search
                  </button>
                </div>
              </form>

              {/* Sort and Filter Dropdowns */}
              <div className="flex flex-col md:flex-row gap-4 w-full md:w-1/2">
                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full md:w-auto p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
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
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div ref={productsRef}>
            <h2 className="text-3xl font-bold mb-8 text-center text-gray-800">Our Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {currentProducts.length > 0 ? (
                currentProducts.map((product) => (
                  <ProductCard key={product.id} product={{ ...product, isPromoted: promotedIds.includes(product.id) }} />
                ))
              ) : (
                <p className="text-center text-gray-500">No products found.</p>
              )}
            </div>
            {/* Pagination and Items Per Page */}
            {currentProducts.length > 0 && (
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
                >
                  <option value={8}>8 Items</option>
                  <option value={12}>12 Items</option>
                  <option value={16}>16 Items</option>
                  <option value={20}>20 Items</option>
                </select>
              </div>
            )}

            {/* Payment Methods */}
            <div className="mt-12 text-center">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Payment Methods Supported</h3>
              <div className="flex justify-center gap-6">
                <span className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-md text-gray-700">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18"></path>
                  </svg>
                  Paystack
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Home;