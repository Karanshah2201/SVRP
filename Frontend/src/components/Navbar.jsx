import { motion } from 'framer-motion'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, LogOut, ChevronDown, Sparkles, User, ShoppingCart, ShoppingBag, Package } from 'lucide-react'
import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import api from '@/lib/api'
import { isAuthenticated, clearAuth, getUser } from '@/lib/authStore'

let cachedCategories = null;
let categoryPromise = null;

export default function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [hoveredLink, setHoveredLink] = useState(null)
    const [userMenuOpen, setUserMenuOpen] = useState(false)
    const [dbCategories, setDbCategories] = useState(() => cachedCategories || [])
    const location = useLocation()
    const navigate = useNavigate()
    const isLoggedIn = isAuthenticated()
    const currentUser = getUser()

    const isActive = (path) => location.pathname === path

    useEffect(() => {
        setUserMenuOpen(false)
        setMobileMenuOpen(false)
    }, [location.pathname])

    useEffect(() => {
        if (cachedCategories) {
            setDbCategories(cachedCategories)
            return
        }
        if (!categoryPromise) {
            categoryPromise = api.get('/categories')
                .then(res => {
                    cachedCategories = res.data
                    return res.data
                })
                .catch(err => {
                    console.error('Failed to fetch categories:', err)
                    categoryPromise = null
                    return []
                })
        }
        categoryPromise.then(data => {
            if (data) setDbCategories(data)
        })
    }, [])

    const handleLogout = async () => {
        try {
            await api.post('/logout')
        } catch (error) {
            // Ignore error
        } finally {
            clearAuth()
            navigate('/login')
        }
    }

    const categoryLinks = []
    dbCategories.forEach(cat => {
        categoryLinks.push({
            name: cat.name,
            path: `/products?category=${encodeURIComponent(cat.name)}`,
            isParent: true,
            subcategories: (cat.subcategories || []).map(sub => ({
                name: sub.name,
                path: `/products?category=${encodeURIComponent(cat.name)}&subcategory=${encodeURIComponent(sub.name)}`
            }))
        })
    })
    categoryLinks.push({ name: 'All Products', path: '/products' })

    const navLinks = [
        { name: 'Products', path: '/products' },
        ...(categoryLinks.length > 1 ? [{
            name: 'Categories',
            path: '/products',
            subcategories: categoryLinks
        }] : []),
        { name: 'About', path: '/about' },
        { name: 'Contact', path: '/contact' }
    ]

    return (
        <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "circOut" }}
            className="fixed w-full z-50 top-0 left-0 p-4 sm:p-5"
        >
            <div className="max-w-7xl mx-auto skeuo-card bg-white/70 backdrop-blur-xl px-6 sm:px-10 flex items-center justify-between h-20 border-white/80 shadow-2xl">
                
                {/* Logo Section */}
                <Link to="/" className="flex items-center gap-4 group">
                    <motion.div 
                        whileHover={{ rotate: 10, scale: 1.1 }}
                        className="skeuo-card p-2 bg-white border-2 border-primary/5"
                    >
                        <img src="/svrp.png" alt="SVRP" className="h-9 w-auto grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                    </motion.div>
                    <div className="flex flex-col">
                        <span className="text-primary font-[900] text-lg tracking-tighter uppercase leading-none">SVRP</span>
                        <span className="text-[length:var(--text-small)] font-mono font-black text-secondary tracking-[0.2em] leading-none mt-1 opacity-60">RAIL WORKS</span>
                    </div>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-10">
                    {navLinks.map((link) => (
                        <div
                            key={link.name}
                            className="relative h-20 flex items-center"
                            onMouseEnter={() => setHoveredLink(link.name)}
                            onMouseLeave={() => setHoveredLink(null)}
                        >
                            <Link
                                to={link.path}
                                className={`text-[length:var(--text-label)] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${isActive(link.path) ? 'text-secondary' : 'text-primary/70 hover:text-primary'}`}
                            >
                                {link.name}
                                {link.subcategories && <ChevronDown size={14} className={`transition-transform duration-500 ${hoveredLink === link.name ? 'rotate-180 text-secondary' : ''}`} />}
                            </Link>

                            {/* Refined Dropdown */}
                            <AnimatePresence>
                                {link.subcategories && hoveredLink === link.name && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                                        transition={{ duration: 0.3 }}
                                        className="absolute top-[85%] left-1/2 -translate-x-1/2 w-72 skeuo-card bg-white/95 backdrop-blur-3xl p-4 shadow-3xl border-white"
                                    >
                                        <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                            {link.subcategories.map((sub, i) => (
                                                <motion.div 
                                                    key={sub.path}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                >
                                                    <Link
                                                        to={sub.path}
                                                        className="px-4 py-3 rounded-lg hover:bg-muted/30 text-primary/60 hover:text-primary transition-all flex items-center justify-between group/item border border-transparent hover:border-white"
                                                    >
                                                        <span className="text-[length:var(--text-label)] font-black uppercase tracking-widest font-mono">{sub.name}</span>
                                                        {sub.name === 'All Assets' && <Sparkles size={12} className="text-secondary animate-pulse" />}
                                                    </Link>
                                                    
                                                    {sub.subcategories && sub.subcategories.length > 0 && (
                                                        <div className="ml-4 pl-4 border-l-2 border-primary/5 flex flex-col gap-1 mt-2 mb-3">
                                                            {sub.subcategories.map(child => (
                                                                <Link
                                                                    key={child.path}
                                                                    to={child.path}
                                                                    className="px-3 py-1.5 rounded-md text-[length:var(--text-small)] font-bold text-primary/30 hover:text-secondary transition-all uppercase tracking-widest font-mono"
                                                                >
                                                                    {child.name}
                                                                </Link>
                                                            ))}
                                                        </div>
                                                    )}
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>

                {/* Auth & Utility */}
                <div className="hidden md:flex items-center gap-4">
                    {!isLoggedIn ? (
                        <>
                            <Link to="/login" className="text-xs font-bold uppercase tracking-wider text-primary/70 hover:text-primary transition-colors">
                                Sign In
                            </Link>
                            <Link to="/register">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="skeuo-button skeuo-button-primary h-11 px-6 text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm"
                                >
                                    Get Started
                                </motion.button>
                            </Link>
                        </>
                    ) : (
                        <div className="flex items-center gap-3">
                            {/* Direct Orders Quick Link */}
                            <Link to="/orders" title="My Orders & 3D Downloads">
                                <motion.div
                                    whileHover={{ scale: 1.05, y: -1 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`h-11 px-3.5 rounded-xl bg-white border flex items-center gap-2 transition-all shadow-2xs ${isActive('/orders') ? 'border-primary text-primary bg-primary/5' : 'border-border/60 text-foreground/70 hover:text-primary hover:border-primary/40'}`}
                                >
                                    <ShoppingBag size={17} className="text-primary" />
                                    <span className="text-xs font-bold hidden lg:inline">Orders</span>
                                </motion.div>
                            </Link>

                            {/* Direct Cart Quick Link */}
                            <Link to="/cart" title="Shopping Cart">
                                <motion.div
                                    whileHover={{ scale: 1.05, y: -1 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`w-11 h-11 rounded-xl bg-white border flex items-center justify-center transition-all shadow-2xs ${isActive('/cart') ? 'border-primary text-primary bg-primary/5' : 'border-border/60 text-foreground/70 hover:text-primary hover:border-primary/40'}`}
                                >
                                    <ShoppingCart size={17} />
                                </motion.div>
                            </Link>

                            {/* Profile Dropdown Menu */}
                            <div className="relative">
                                <button
                                    onClick={() => setUserMenuOpen(prev => !prev)}
                                    className={`h-11 px-3 rounded-xl bg-white border flex items-center gap-2 transition-all shadow-2xs ${userMenuOpen || isActive('/profile') ? 'border-primary ring-2 ring-primary/10' : 'border-border/60 hover:border-primary/40'}`}
                                    title="Account Menu"
                                >
                                    <div className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-xs shadow-xs">
                                        {currentUser?.fullname?.charAt(0)?.toUpperCase() || <User size={14} />}
                                    </div>
                                    <span className="text-xs font-bold text-foreground max-w-[100px] truncate hidden xl:inline-block">
                                        {currentUser?.fullname?.split(' ')[0] || 'Profile'}
                                    </span>
                                    <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-200 ${userMenuOpen ? 'rotate-180 text-primary' : ''}`} />
                                </button>

                                {/* Dropdown Menu */}
                                <AnimatePresence>
                                    {userMenuOpen && (
                                        <>
                                            {/* Backdrop click dismiss */}
                                            <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />

                                            <motion.div
                                                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                                                transition={{ duration: 0.15 }}
                                                className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-border/70 p-2 z-50 overflow-hidden"
                                            >
                                                {/* Header */}
                                                <div className="px-3.5 py-3 border-b border-border/50 mb-1">
                                                    <p className="text-xs font-bold text-foreground truncate">{currentUser?.fullname || 'My Account'}</p>
                                                    <p className="text-[11px] text-muted-foreground truncate">{currentUser?.email || ''}</p>
                                                </div>

                                                {/* Links */}
                                                <div className="space-y-0.5">
                                                    <Link
                                                        to="/orders"
                                                        onClick={() => setUserMenuOpen(false)}
                                                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-foreground hover:bg-primary/5 hover:text-primary transition-colors"
                                                    >
                                                        <ShoppingBag size={16} className="text-primary" />
                                                        <div className="flex-1 flex items-center justify-between">
                                                            <span>My Orders</span>
                                                            <span className="text-[9px] bg-secondary/15 text-secondary px-1.5 py-0.5 rounded font-black uppercase">Downloads</span>
                                                        </div>
                                                    </Link>

                                                    <Link
                                                        to="/profile"
                                                        onClick={() => setUserMenuOpen(false)}
                                                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-foreground hover:bg-primary/5 hover:text-primary transition-colors"
                                                    >
                                                        <User size={16} className="text-primary" />
                                                        <span>My Profile</span>
                                                    </Link>

                                                    <Link
                                                        to="/cart"
                                                        onClick={() => setUserMenuOpen(false)}
                                                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-foreground hover:bg-primary/5 hover:text-primary transition-colors"
                                                    >
                                                        <ShoppingCart size={16} className="text-primary" />
                                                        <span>Shopping Cart</span>
                                                    </Link>
                                                </div>

                                                {/* Divider */}
                                                <div className="border-t border-border/50 my-1" />

                                                {/* Logout */}
                                                <button
                                                    onClick={() => {
                                                        setUserMenuOpen(false)
                                                        handleLogout()
                                                    }}
                                                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-destructive hover:bg-destructive/10 transition-colors"
                                                >
                                                    <LogOut size={15} />
                                                    <span>Sign Out</span>
                                                </button>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}
                </div>

                {/* Mobile Trigger */}
                <button
                    className="md:hidden w-12 h-12 skeuo-card bg-white flex items-center justify-center text-primary border-white"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="fixed inset-0 top-0 left-0 bg-white z-[60] md:hidden flex flex-col p-8 backdrop-blur-3xl"
                    >
                        <div className="flex items-center justify-between mb-16">
                            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4">
                                <div className="skeuo-card p-2 bg-white">
                                    <img src="/svrp.png" alt="SVRP" className="h-8 w-auto grayscale" />
                                </div>
                                <span className="font-black uppercase tracking-tighter text-xl">SVRP RAIL</span>
                            </Link>
                            <button 
                                onClick={() => setMobileMenuOpen(false)}
                                className="w-12 h-12 skeuo-card bg-white flex items-center justify-center text-primary border-none shadow-xl"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-8 overflow-y-auto pb-10">
                            {navLinks.map((link) => (
                                <div key={link.name} className="flex flex-col gap-6">
                                    <Link
                                        to={link.path}
                                        className={`text-4xl font-[900] uppercase tracking-tighter ${isActive(link.path) ? 'text-secondary' : 'text-primary/80'}`}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        {link.name}
                                    </Link>
                                    {link.subcategories && (
                                        <div className="grid grid-cols-2 gap-4 pl-6 border-l-4 border-primary/5">
                                            {link.subcategories.map(sub => (
                                                <Link
                                                    key={sub.name}
                                                    to={sub.path}
                                                    onClick={() => setMobileMenuOpen(false)}
                                                    className="text-primary/30 font-black uppercase tracking-widest py-2 font-mono text-[length:var(--text-label)]"
                                                >
                                                    {sub.name}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="mt-auto pt-8 border-t border-border/10 flex flex-col gap-4">
                            {!isLoggedIn ? (
                                <>
                                    <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="skeuo-button h-14 text-center text-primary font-bold uppercase tracking-wider border-border/50 rounded-xl flex items-center justify-center">Sign In</Link>
                                    <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="skeuo-button skeuo-button-primary h-14 text-center text-white font-bold uppercase tracking-wider rounded-xl flex items-center justify-center">Create Account</Link>
                                </>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    <Link
                                        to="/orders"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="skeuo-button skeuo-button-primary h-14 text-white font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-3"
                                    >
                                        <ShoppingBag size={18} />
                                        My Orders & Downloads
                                    </Link>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Link
                                            to="/profile"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="skeuo-button bg-slate-50 h-12 text-foreground font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 border border-border/60"
                                        >
                                            <User size={16} /> My Profile
                                        </Link>
                                        <Link
                                            to="/cart"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="skeuo-button bg-slate-50 h-12 text-foreground font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 border border-border/60"
                                        >
                                            <ShoppingCart size={16} /> Cart
                                        </Link>
                                    </div>
                                    <button
                                        onClick={() => {
                                            handleLogout()
                                            setMobileMenuOpen(false)
                                        }}
                                        className="skeuo-button h-12 text-destructive font-bold text-xs uppercase tracking-wider border border-destructive/20 rounded-xl flex items-center justify-center gap-2 hover:bg-destructive/5"
                                    >
                                        <LogOut size={16} /> Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav >
    )
}
