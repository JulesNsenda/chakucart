import React, { useContext, useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProductContext } from '../context/ProductContext';
import { Search, Filter, ChevronDown, X } from 'lucide-react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';

const ProductSkeleton = () => (
  <div className="bg-white shadow-md rounded-xl overflow-hidden animate-pulse">
    <div className="h-40 bg-gray-300"></div>
    <div className="p-4">
      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
      <div className="h-6 bg-gray-300 rounded w-1/2 mb-2"></div>
      <div className="flex justify-between items-center">
        <div className="h-6 bg-gray-300 rounded w-1/3"></div>
        <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
      </div>
    </div>
  </div>
);

const Home = () => {
  const { allProducts, paginate, currentPage } = useContext(ProductContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState('none');
  const [category, setCategory] = useState('all');
  const [stockStatus, setStockStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const productsRef = useRef(null);
  const [itemsPerPageOptions, setItemsPerPageOptions] = useState(8);
  const [filtersOpen, setFiltersOpen] = useState(false);

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
    all: "🛒",
    fruits: "🍎",
    vegetables: "🥦",
    dairy: "🥛",
    meat: "🥩",
    bread: "🍞",
    beverages: "🥤"
  };

  const productNames = allProducts.map(p => p.name);

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
        .filter(name => name.toLowerCase().includes(value.toLowerCase()))
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

  const [filteredProducts, setFilteredProducts] = useState(allProducts.slice(0, 20));

  useEffect(() => {
    setIsLoading(true);
    let filtered = [...allProducts];
    const searchQuery = searchParams.get('q') || '';

    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (category !== 'all') filtered = filtered.filter(product => product.category === category);
    if (stockStatus === 'in-stock') filtered = filtered.filter(product => product.available && product.quantity > 0);
    else if (stockStatus === 'out-of-stock') filtered = filtered.filter(product => !product.available || product.quantity === 0);

    if (sortBy === 'price-asc') filtered.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') filtered.sort((a, b) => b.price - a.price);
    if (sortBy === 'name-asc') filtered.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'name-desc') filtered.sort((a, b) => b.name.localeCompare(a.name));

    setFilteredProducts(filtered.slice(0, 20));
    setTimeout(() => setIsLoading(false), 500);
  }, [allProducts, searchParams, sortBy, category, stockStatus]);

  const handleShopNow = () => {
    productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCategoryClick = (cat) => {
    setCategory(cat);
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
                className={`flex flex-col items-center justify-center min-w-16 h-16 rounded-lg shadow-md transition-all ${category === cat
                    ? 'bg-green-500 text-white'
                    : 'bg-white hover:bg-gray-50'
                  }`}
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

          {/* Search and Filters */}
          <div className={`bg-white rounded-lg shadow-lg p-4 mb-6 transition-all ${filtersOpen ? 'block' : 'hidden'}`}>
            <div className="relative mb-4">
              <form onSubmit={handleSearch}>
                <input
                  type="text"
                  placeholder="Search groceries..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={searchTerm}
                  onChange={handleInputChange}
                  aria-label="Search groceries"
                />
                <Search className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                  <Search className="w-4 h-4" />
                </button>
              </form>
              {searchSuggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 shadow-lg">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
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

              <div>
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

              <div>
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

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setSortBy('none');
                  setCategory('all');
                  setStockStatus('all');
                  setSearchTerm('');
                  setSearchParams({});
                }}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md mr-2 hover:bg-gray-300"
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

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {isLoading ? (
              Array.from({ length: itemsPerPageOptions }).map((_, index) => <ProductSkeleton key={index} />)
            ) : currentProducts.length > 0 ? (
              currentProducts.map(product => <ProductCard key={product.id} product={product} />)
            ) : (
              <p className="text-center text-gray-500 col-span-full py-8">No products found.</p>
            )}
          </div>

          {/* Pagination */}
          {!isLoading && currentProducts.length > 0 && (
            <div className="mt-6 flex flex-col items-center gap-4">
              <div className="flex justify-center flex-wrap gap-2">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => paginate(i + 1)}
                    className={`w-10 h-10 flex items-center justify-center rounded-full text-sm ${currentPage === i + 1
                        ? 'bg-green-500 text-white shadow'
                        : 'bg-white border hover:bg-gray-50'
                      }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <select
                value={itemsPerPageOptions}
                onChange={(e) => setItemsPerPageOptions(parseInt(e.target.value))}
                className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              >
                <option value={8}>8 Items Per Page</option>
                <option value={12}>12 Items Per Page</option>
                <option value={16}>16 Items Per Page</option>
                <option value={20}>20 Items Per Page</option>
              </select>
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
      `}</style>
    </div>
  );
};

export default Home;