import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    Trash2, Plus, Minus, ArrowRight, ShoppingCart as CartIcon, 
    ArrowLeft, Loader2, ShieldCheck, Box, Cloud, FileText, CheckCircle2 
} from 'lucide-react'
import api from '@/lib/api'
import Navbar from '../components/Navbar'
import { toast } from 'sonner'
import Footer from '../components/Footer'
import { PageHeader, EmptyState } from '@/components/ui'
import { setCartCount } from '@/lib/cartStore'
import catArchitecture from '../assets/cat-architecture.png'

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08 }
    }
}

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.3 }
    }
}

export default function CartPage() {
    const [cart, setCart] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchCart = async () => {
        try {
            const res = await api.get('/cart')
            const items = res.data.items || []
            setCart(items)
            const count = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)
            setCartCount(count)
        } catch (err) {
            console.error(err)
            toast.error('Failed to load cart.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { 
        fetchCart() 
    }, [])

    const updateQuantity = async (productId, quantity) => {
        if (quantity < 1) return
        try {
            await api.put(`/cart/${productId}`, { quantity })
            fetchCart()
        } catch (err) {
            toast.error('Failed to update asset quantity.')
        }
    }

    const removeItem = async (productId) => {
        try {
            await api.delete(`/cart/${productId}`)
            fetchCart()
            toast.success('Asset removed from cart.')
        } catch (err) {
            toast.error('Failed to remove asset.')
        }
    }

    const total = cart.reduce((sum, item) => {
        const priceStr = item.product?.price?.toString().replace(/[^0-9.]/g, '') || '0'
        const price = parseFloat(priceStr) || 0
        return sum + price * (item.quantity || 1)
    }, 0)

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
    }

    return (
        <div className="min-h-screen bg-background flex flex-col selection:bg-primary/10 font-sans">
            <Navbar />
            
            <main id="main-content" className="page-container">
                <PageHeader
                    title="Shopping Cart"
                    subtitle="Review your selected 3D rolling stock models and proceed to secure commercial licensing."
                    backTo="/products"
                    backLabel="Continue Shopping"
                    badge={
                        <span className="badge-status badge-info">
                            {cart.length} Asset{cart.length !== 1 ? 's' : ''} in Staging
                        </span>
                    }
                />

                {loading ? (
                    <div className="text-center py-32" role="status" aria-label="Loading your cart">
                        <Loader2 className="animate-spin mx-auto text-primary mb-3" size={36} />
                        <p className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                            Retrieving Staged Models...
                        </p>
                    </div>
                ) : cart.length === 0 ? (
                    <EmptyState
                        icon={CartIcon}
                        title="Your Cart is Empty"
                        description="You haven't added any 3D models or engineering assets to your cart yet. Explore our high-precision catalog."
                        actionLabel="Browse 3D Catalog"
                        actionTo="/products"
                    />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                        {/* Items Column */}
                        <motion.div 
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="lg:col-span-2 space-y-4"
                        >
                            {cart.map((item) => (
                                <motion.div
                                    variants={itemVariants}
                                    layout
                                    key={item.productId}
                                    className="skeuo-card p-5 flex flex-col sm:flex-row items-center gap-5 bg-white border border-border/80 rounded-2xl shadow-2xs hover:shadow-md transition-all"
                                >
                                    {/* Thumbnail */}
                                    <div className="w-20 h-20 bg-[#130324] rounded-xl overflow-hidden shrink-0 border border-primary/10 flex items-center justify-center">
                                        <img 
                                            src={item.product?.image || catArchitecture} 
                                            alt={item.product?.name || 'Asset'} 
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.target.src = catArchitecture }}
                                        />
                                    </div>
                                    
                                    {/* Info */}
                                    <div className="flex-1 text-center sm:text-left min-w-0">
                                        <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                                            <span className="text-[10px] font-mono font-black text-secondary uppercase tracking-widest">
                                                {item.product?.category || '3D Asset'}
                                            </span>
                                            {item.product?.subcategory && (
                                                <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">
                                                    • {item.product.subcategory}
                                                </span>
                                            )}
                                        </div>

                                        <Link to={`/product/${item.productId}`}>
                                            <h4 className="text-sm sm:text-base font-bold text-foreground hover:text-primary transition-colors truncate">
                                                {item.product?.name || 'Railway Model'}
                                            </h4>
                                        </Link>

                                        <p className="text-primary font-mono font-black text-sm mt-0.5">
                                            {(item.product?.price && /^\D/.test(item.product.price)) ? item.product.price : `₹${item.product?.price || 0}`}
                                        </p>
                                    </div>

                                    {/* Quantity Controls */}
                                    <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-border/70">
                                        <button 
                                            onClick={() => updateQuantity(item.productId, item.quantity - 1)} 
                                            disabled={item.quantity <= 1}
                                            aria-label="Decrease quantity"
                                            className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-foreground/70 hover:text-foreground active:scale-90 transition-all border border-border/60 disabled:opacity-40"
                                        >
                                            <Minus size={13} />
                                        </button>
                                        <span className="text-xs font-bold text-foreground w-6 text-center font-mono">
                                            {item.quantity}
                                        </span>
                                        <button 
                                            onClick={() => updateQuantity(item.productId, item.quantity + 1)} 
                                            aria-label="Increase quantity"
                                            className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-foreground/70 hover:text-foreground active:scale-90 transition-all border border-border/60"
                                        >
                                            <Plus size={13} />
                                        </button>
                                    </div>

                                    {/* Delete Button */}
                                    <button 
                                        onClick={() => removeItem(item.productId)} 
                                        aria-label="Remove item"
                                        className="w-9 h-9 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 flex items-center justify-center active:scale-90 transition-all shrink-0"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* Order Summary Column */}
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="lg:col-span-1"
                        >
                            <div className="skeuo-card p-6 sm:p-7 bg-white sticky top-28 border border-border/80 shadow-md rounded-2xl space-y-6">
                                <h3 className="text-base font-bold text-foreground pb-3 border-b border-border/70">
                                    Licensing Summary
                                </h3>
                                
                                <div className="space-y-3.5 text-sm">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground">Assets Staged</span>
                                        <span className="font-bold text-foreground font-mono">{cart.length} Items</span>
                                    </div>

                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground">Delivery Method</span>
                                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                            Encrypted Cloud Delivery (Free)
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center text-xs pb-3 border-b border-border/60">
                                        <span className="text-muted-foreground">Rights Included</span>
                                        <span className="font-bold text-primary text-xs">Single-Seat Commercial</span>
                                    </div>

                                    <div className="pt-1 flex justify-between items-baseline">
                                        <span className="font-bold text-foreground text-sm">Total Due</span>
                                        <span className="text-2xl font-black text-secondary font-mono">
                                            {formatCurrency(total)}
                                        </span>
                                    </div>
                                </div>

                                <Link to="/checkout" className="block">
                                    <button className="w-full skeuo-button skeuo-button-primary h-12 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider rounded-xl shadow-md group">
                                        <span>Proceed to Checkout</span>
                                        <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </Link>

                                {/* Trust & Security Pointers */}
                                <div className="pt-2 border-t border-border/50 space-y-2">
                                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                        <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                                        <span>Instant digital download upon payment</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                        <ShieldCheck size={13} className="text-primary shrink-0" />
                                        <span>Verified 3D mesh files & PBR textures</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    )
}
