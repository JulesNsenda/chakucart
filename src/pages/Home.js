import React, { useContext, useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProductContext } from '../context/ProductContext';
import Header from '../components/Header';
import Hero from '../components/Hero';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';

const ProductSkeleton = () => (
  <div className="bg-white shadow-md rounded-lg overflow-hidden animate-pulse">
    <div className="h-32 sm:h-40 bg-gray-300"></div>
    <div className="p-3 sm:p-4">
      <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-gray-300 rounded w-1/3 mb-4"></div>
      <div className="h-10 bg-gray-300 rounded"></div>
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

  const categories = ['all', 'fruits', 'vegetables', 'dairy', 'meat', 'bread', 'beverages'];
  const stockStatuses = ['all', 'in-stock', 'out-of-stock'];
  const sortOptions = [
    { value: 'none', label: 'Sort By' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'name-asc', label: 'Name: A-Z' },
    { value: 'name-desc', label: 'Name: Z-A' },
  ];

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

  const indexOfLastItem = currentPage * itemsPerPageOptions;
  const indexOfFirstItem = indexOfLastItem - itemsPerPageOptions;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPageOptions);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1">
        <Hero onShopNow={handleShopNow} />
        <section className="container mx-auto px-2 sm:px-4 py-6">
          <div ref={productsRef}>
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center text-gray-800">Our Products</h2>

            <div className="mb-4 bg-white p-3 sm:p-4 rounded-lg shadow-lg">
              <form onSubmit={handleSearch} className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search groceries..."
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    value={searchTerm}
                    onChange={handleInputChange}
                    aria-label="Search groceries"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 sm:p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                  {searchSuggestions.length > 0 && (
                    <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 shadow-lg">
                      {searchSuggestions.map((suggestion, index) => (
                        <li
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="p-2 text-sm hover:bg-gray-100 cursor-pointer"
                        >
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </form>

              <div className="space-y-4">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>
                <select
                  value={stockStatus}
                  onChange={(e) => setStockStatus(e.target.value)}
                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                >
                  {stockStatuses.map(status => (
                    <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, index) => <ProductSkeleton key={index} />)
              ) : currentProducts.length > 0 ? (
                currentProducts.map(product => <ProductCard key={product.id} product={product} />)
              ) : (
                <p className="text-center text-gray-500 col-span-full">No products found.</p>
              )}
            </div>

            {!isLoading && currentProducts.length > 0 && (
              <div className="mt-6 flex flex-col items-center gap-4">
                <div className="flex justify-center space-x-2 flex-wrap">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => paginate(i + 1)}
                      className={`px-3 py-2 sm:px-4 sm:py-2 rounded-md text-sm sm:text-base ${currentPage === i + 1 ? 'bg-blue-500 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <select
                  value={itemsPerPageOptions}
                  onChange={(e) => setItemsPerPageOptions(parseInt(e.target.value))}
                  className="p-2 sm:p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                >
                  <option value={8}>8 Items</option>
                  <option value={12}>12 Items</option>
                  <option value={16}>16 Items</option>
                  <option value={20}>20 Items</option>
                </select>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Home;