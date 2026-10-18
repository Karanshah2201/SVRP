import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ScrollToTop from './components/ScrollToTop'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import AdminRoute from './components/AdminRoute'
import { Toaster } from 'sonner'
import './App.css'

// Lightweight fallback loader
const PageLoader = () => (
  <div className="min-h-screen bg-[#fdfdfe] flex flex-col items-center justify-center">
    <div className="w-10 h-10 rounded-full border-3 border-[#4a148c]/20 border-t-[#4a148c] animate-spin" />
    <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-widest mt-4 font-mono">Loading...</span>
  </div>
)

// Lazy Load Public Pages
const LandingPage = lazy(() => import('./pages/Landing'))
const AboutPage = lazy(() => import('./pages/About'))
const ContactPage = lazy(() => import('./pages/Contact'))

// Lazy Load Auth Pages
const AuthLayout = lazy(() => import('./pages/AuthLayout'))
const LoginPage = lazy(() => import('./pages/Login'))
const RegisterPage = lazy(() => import('./pages/Register'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPassword'))
const UpdatePasswordPage = lazy(() => import('./pages/UpdatePassword'))

// Lazy Load Core App Pages
const ProductsPage = lazy(() => import('./pages/Products'))
const ProductDetailsPage = lazy(() => import('./pages/ProductDetails'))
const ProfilePage = lazy(() => import('./pages/Profile'))
const CartPage = lazy(() => import('./pages/CartPage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const CheckoutSuccess = lazy(() => import('./pages/CheckoutSuccess'))
const CheckoutCancel = lazy(() => import('./pages/CheckoutCancel'))
const OrdersPage = lazy(() => import('./pages/OrdersPage'))

// Lazy Load Admin Pages (Keep Admin and heavy charting bundle isolated)
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'))
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'))
const AdminContacts = lazy(() => import('./pages/admin/AdminContacts'))
const AdminReviews = lazy(() => import('./pages/admin/AdminReviews'))
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'))

function App() {
  return (
    <>
      <Toaster position="top-center" richColors />
      <Router>
        <ScrollToTop />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Landing Page */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* Auth Flow - Only for guests */}
            <Route element={<PublicRoute />}>
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/update-password" element={<UpdatePasswordPage />} />
              </Route>
            </Route>

            {/* Core App - Protected */}
            <Route element={<ProtectedRoute />}>
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/product/:id" element={<ProductDetailsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/checkout/success" element={<CheckoutSuccess />} />
              <Route path="/checkout/cancel" element={<CheckoutCancel />} />
              <Route path="/orders" element={<OrdersPage />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/products" element={<AdminProducts />} />
                <Route path="/admin/categories" element={<AdminCategories />} />
                <Route path="/admin/contacts" element={<AdminContacts />} />
                <Route path="/admin/reviews" element={<AdminReviews />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
              </Route>
            </Route>

            {/* Catch all redirect */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </>
  )
}

export default App
