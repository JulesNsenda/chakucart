import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import ProductPreview from './pages/ProductPreview';
import Cart from './pages/Cart';
import SignIn from './pages/SignIn';
import Subscribe from './pages/Subscribe';
import Dashboard from './pages/Dashboard';
import AccountSettings from './pages/AccountSettings';
import Payment from './pages/Payment';
import OrderConfirmation from './pages/OrderConfirmation';
import { ProductProvider } from './context/ProductContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import OrderDetails from './pages/OrderDetails';


function App() {
  return (
    <ToastProvider>
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
              <Route path="/payment" element={<Payment />} />
              <Route path="/order-confirmation" element={<OrderConfirmation />} />
              <Route path="/order-details/:orderId" element={<OrderDetails />} />
            </Routes>
          </Router>
        </ProductProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;