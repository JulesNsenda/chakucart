import React, { useContext, useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProductContext } from '../context/ProductContext';
import { Search, Filter, ChevronDown, X, ShoppingCart } from 'lucide-react';
import { imageMap } from '../data/products';
import Header from '../components/Header';
import Hero from '../components/Hero';
import Footer from '../components/Footer';
import { useToast } from '../context/ToastContext';
import useCustomNavigate from '../hooks/useCustomNavigate';

// Updated Product Card component with preview functionality
const ProductCard = ({ product }) => {
  const { addToCart } = useContext(ProductContext);
  const { showToast } = useToast();
  const navigate = useCustomNavigate();

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(product);
    if (window.innerWidth >= 768) {
      showToast(`${product.name} added to cart!`);
    }
  };

  const handlePreview = () => {
    navigate(`/product/${product.id}`);
  };

  return (
    <div
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1 cursor-pointer"
      onClick={handlePreview}
    >
      <div className="h-40 overflow-hidden">
        <img
          src={product.image || imageMap[product.name] || '/api/placeholder/300/200'}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>
      <div className="p-4">
        <div className="text-xs text-green-600 font-semibold mb-1 uppercase">{product.category}</div>
        <h3 className="font-bold text-gray-800 mb-1 truncate">{product.name}</h3>
        <p className="text-xs text-gray-500 mb-2">{product.market}</p>
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
        <div className="flex justify-between items-center">
          <span className="text-gray-900 font-bold">
            R{product.price.toFixed(2)}
            <span className="text-xs text-gray-500 font-normal">/{product.unit || 'each'}</span>
          </span>
          <button
            className={`p-1.5 rounded-full ${product.available && product.quantity > 0
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            aria-label="Add to cart"
            onClick={handleAddToCart}
            disabled={!product.available || product.quantity === 0}
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const ProductSkeleton = () => (
  <div className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
    <div className="h-40 bg-gray-300"></div>
    <div className="p-4">
      <div className="h-4 bg-gray-300 rounded w-1/4 mb-1"></div>
      <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
      <div className="flex justify-between items-center">
        <div className="h-6 bg-gray-300 rounded w-1/3"></div>
        <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
      </div>
    </div>
  </div>
);

// Helper function to normalize text
const normalizeText = (text) => {
  let normalized = text.toLowerCase().trim();
  if (normalized.endsWith('s')) normalized = normalized.slice(0, -1);
  if (normalized.endsWith('es')) normalized = normalized.slice(0, -2);
  return normalized;
};

const Home = () => {
  const { allProducts, paginate, currentPage, selectedMarket, marketDistance, selectMarket } = useContext(ProductContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState('none');
  const [category, setCategory] = useState('all');
  const [stockStatus, setStockStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const productsRef = useRef(null);
  const [itemsPerPageOptions, setItemsPerPageOptions] = useState(8);

  const marketsWithDistance = [
    { name: 'Cape Town Farmer’s Market', distance: 5 },
    { name: 'Stellenbosch Fresh Market', distance: 10 },
    { name: 'Shoprite Cape Town', distance: 3 },
    { name: 'Woolworths Durbanville', distance: 7 }
  ];

  const categories = ['all', 'fruits', 'vegetables', 'dairy', 'meat', 'bread', 'beverages'];
  const stockStatuses = ['all', 'in-stock', 'out-of-stock'];
  const sortOptions = [
    { value: 'none', label: 'Sort By' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'name-asc', label: 'Name: A-Z' },
    { value: 'name-desc', label: 'Name: Z-A' },
  ];

  const categoryIcons = {
    all: "🛒", fruits: "🍎", vegetables: "🥦", dairy: "🥛",
    meat: "🥩", bread: "🍞", beverages: "🥤"
  };

  const productNames = useMemo(() => allProducts.map(p => p.name), [allProducts]);

  const handleSearch = (e) => {
    e.preventDefault();
    setIsLoading(true);
    if (searchTerm.trim()) setSearchParams({ q: searchTerm.trim() });
    else setSearchParams({});
    setTimeout(() => setIsLoading(false), 500);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value) {
      const suggestions = productNames
        .filter(name => normalizeText(name).includes(normalizeText(value)))
        .slice(0, 5);
      setSearchSuggestions(suggestions);
    } else {
      setSearchSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion);
    setSearchSuggestions([]);
    setSearchParams({ q: suggestion });
  };

  const [filteredProducts, setFilteredProducts] = useState(allProducts);

  useEffect(() => {
    setIsLoading(true);
    let filtered = [...allProducts]; // Start with all products from context

    const searchQuery = searchParams.get('q') || '';
    if (searchQuery) {
      const normalizedQuery = normalizeText(searchQuery);
      filtered = filtered.filter(product =>
        normalizeText(product.name).includes(normalizedQuery) ||
        normalizeText(product.description).includes(normalizedQuery)
      );
    }

    if (category !== 'all') filtered = filtered.filter(product => product.category === category);
    if (stockStatus === 'in-stock') filtered = filtered.filter(product => product.available && product.quantity > 0);
    else if (stockStatus === 'out-of-stock') filtered = filtered.filter(product => !product.available || product.quantity === 0);

    if (selectedMarket) {
      filtered = filtered.filter(product => product.market === selectedMarket);
    }

    if (sortBy === 'price-asc') filtered.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') filtered.sort((a, b) => b.price - b.price);
    if (sortBy === 'name-asc') filtered.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'name-desc') filtered.sort((a, b) => b.name.localeCompare(b.name));

    setFilteredProducts(filtered);
    setTimeout(() => setIsLoading(false), 500);
  }, [allProducts, searchParams, sortBy, category, stockStatus, selectedMarket]);

  useEffect(() => {
    setSearchTerm(searchParams.get('q') || '');
  }, [searchParams]);

  const handleShopNow = () => {
    productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCategoryClick = (cat) => {
    setCategory(cat);
    paginate(1);
  };

  const handlePaginate = (pageNumber) => {
    paginate(pageNumber);
    window.scrollTo(0, 0);
  };

  const indexOfLastItem = currentPage * itemsPerPageOptions;
  const indexOfFirstItem = indexOfLastItem - itemsPerPageOptions;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPageOptions);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1">
        <div className="bg-gradient-to-r from-green-500 to-teal-600 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute transform -rotate-12 -left-10 -top-10 w-40 h-40 rounded-full bg-white"></div>
            <div className="absolute right-0 bottom-0 w-64 h-64 rounded-full bg-white"></div>
            <div className="absolute right-1/4 top-1/3 w-24 h-24 rounded-full bg-white"></div>
          </div>
          <Hero onShopNow={handleShopNow} />
        </div>

        {/* Category Tabs */}
        <div className="container mx-auto px-4 py-6">
          <div className="flex overflow-x-auto space-x-4 pb-2 -mx-4 px-4 hide-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className={`flex flex-col items-center justify-center min-w-16 h-16 rounded-lg shadow-md transition-all ${category === cat ? 'bg-green-500 text-white' : 'bg-white hover:bg-gray-50'}`}
              >
                <span className="text-xl">{categoryIcons[cat]}</span>
                <span className="text-xs font-medium capitalize">{cat}</span>
              </button>
            ))}
          </div>
        </div>

        <section className="container mx-auto px-4 py-6" ref={productsRef}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold mb-0 text-gray-800">Our Products</h2>
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="flex items-center bg-white px-4 py-2 rounded-full border shadow-sm hover:shadow"
            >
              <Filter className="w-4 h-4 mr-2" />
              <span>Filters</span>
              <ChevronDown className="w-4 h-4 ml-2" />
            </button>
          </div>

          {/* Search Bar and Market Selector on Same Line */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4">
            {/* Search Bar */}
            <div className="relative flex-1">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search for groceries..."
                  className="w-full pl-10 pr-12 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={searchTerm}
                  onChange={handleInputChange}
                  aria-label="Search groceries"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 bg-green-500 text-white rounded-full hover:bg-green-600"
                >
                  <Search className="w-4 h-4" />
                </button>
              </form>
              {searchSuggestions.length > 0 && (
                <ul className="absolute z-10 w-full max-w-md bg-white border border-gray-300 rounded-md mt-1 shadow-lg">
                  {searchSuggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-0"
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Market Selector */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1 md:mb-0 md:sr-only">
                Select Nearby Market
              </label>
              <select
                value={selectedMarket || ''}
                onChange={(e) => {
                  const selected = marketsWithDistance.find(m => m.name === e.target.value);
                  selectMarket(selected?.name || null, selected?.distance || 5);
                }}
                className="w-full md:w-64 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Markets</option>
                {marketsWithDistance.map(m => (
                  <option key={m.name} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {selectedMarket && (
            <p className="text-sm text-gray-600 mb-6">
              Showing products from {selectedMarket} ({marketDistance} km away)
            </p>
          )}

          {/* Filter Panel */}
          {filtersOpen && (
            <div className="bg-white rounded-lg shadow-lg p-4 mb-6 relative">
              <button
                onClick={() => setFiltersOpen(false)}
                className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex flex-wrap items-end gap-4">
                {/* Sort By */}
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {sortOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                {/* Category */}
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                    ))}
                  </select>
                </div>
                {/* Stock Status */}
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
                  <select
                    value={stockStatus}
                    onChange={(e) => setStockStatus(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {stockStatuses.map(status => (
                      <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setSortBy('none');
                    setCategory('all');
                    setStockStatus('all');
                    selectMarket(null, 5);
                    setSearchTerm('');
                    setSearchParams({});
                  }}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  Reset
                </button>
                <button
                  onClick={() => setFiltersOpen(false)}
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}

          {/* Products Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {isLoading ? (
              Array.from({ length: itemsPerPageOptions }).map((_, index) => <ProductSkeleton key={index} />)
            ) : currentProducts.length > 0 ? (
              currentProducts.map(product => <ProductCard key={product.id} product={product} />)
            ) : (
              <p className="text-center text-gray-500 col-span-full py-8">No products found.</p>
            )}
          </div>

          {/* Pagination and Items Per Page */}
          {!isLoading && currentProducts.length > 0 && (
            <div className="mt-8 flex flex-col items-center gap-4">
              <div className="flex justify-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => handlePaginate(i + 1)}
                    className={`w-10 h-10 flex items-center justify-center rounded-full ${currentPage === i + 1 ? 'bg-white border shadow font-medium' : 'hover:bg-gray-100'}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <select
                value={itemsPerPageOptions}
                onChange={(e) => {
                  setItemsPerPageOptions(parseInt(e.target.value));
                  handlePaginate(1);
                }}
                className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
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
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Payment Methods Supported</h3>
              <div className="flex justify-center gap-6">
                <a
                  href="https://paystack.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-5 py-3 bg-gray-100 rounded-md text-gray-700 hover:bg-gray-200 transition-colors duration-200"
                  aria-label="Visit Paystack website"
                >
                  <img
                    src="/paystack.svg"
                    alt="Paystack Logo"
                    className="w-32 h-10"
                    onError={(e) => { e.target.src = '/paystack.png'; }}
                  />
                </a>
              </div>
            </div>
          )}
        </section>
      </main>
      <Footer />
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default Home;