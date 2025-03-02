import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import ProductPreview from './pages/ProductPreview';
import Cart from './pages/Cart';
import SignIn from './pages/SignIn';
import Subscribe from './pages/Subscribe';
import Dashboard from './pages/Dashboard'; // Import Dashboard
import AccountSettings from './pages/AccountSettings'; // Import AccountSettings
import { ProductProvider } from './context/ProductContext';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <ProductProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/product/:id" element={<ProductPreview />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/subscribe" element={<Subscribe />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/account-settings" element={<AccountSettings />} />
          </Routes>
        </Router>
      </ProductProvider>
    </AuthProvider>
  );
}

export default App;