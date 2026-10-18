import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Trash2, Plus, Minus, ArrowRight, ShoppingCart as CartIcon, ArrowLeft, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import Navbar from '../components/Navbar'
import { toast } from 'sonner'

import Footer from '../components/Footer'

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
}

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: { type: "spring", damping: 20, stiffness: 100 }
    }
}

export default function CartPage() {
    const [cart, setCart] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchCart = async () => {
        try {
            const res = await api.get('/cart')
            setCart(res.data.items || [])
        } catch (err) {
            console.error(err)
            toast.error('Failed to load access queue.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchCart() }, [])

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
            toast.success('Asset removed from staging.')
        } catch (err) {
            toast.error('Failed to remove asset.')
        }
    }

    const total = cart.reduce((sum, item) => {
        const priceStr = item.product.price?.toString().replace(/[^0-9.]/g, '') || '0'
        const price = parseFloat(priceStr) || 0
        return sum + price * item.quantity
    }, 0)

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount)
    }

    return (
        <div className="min-h-screen bg-background flex flex-col selection:bg-primary/10">
            <Navbar />
            
            <main className="pt-48 pb-32 px-6 max-w-7xl mx-auto flex-grow w-full">
                
                <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-12"
                >
                    <Link to="/products">
                        <motion.button 
                            whileHover={{ x: -4 }}
                            className="skeuo-button skeuo-button-outline h-11 px-5 flex items-center gap-2.5 text-xs font-semibold"
                        >
                            <ArrowLeft size={16} />
                            <span>Continue Shopping</span>
                        </motion.button>
                    </Link>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-4 mb-10 pb-4 border-b border-border"
                >
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">Shopping Cart</h1>
                    <div className="px-3 py-1 rounded-xl bg-primary text-white text-xs font-semibold">
                        {cart.length} item{cart.length !== 1 ? 's' : ''}
                    </div>
                </motion.div>

                {loading ? (
                    <div className="text-center py-32">
                        <Loader2 className="animate-spin mx-auto text-primary mb-4" size={40} />
                        <p className="text-sm font-semibold text-muted-foreground">Loading your cart...</p>
                    </div>
                ) : cart.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="skeuo-card p-16 sm:p-24 text-center bg-white"
                    >
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 text-muted-foreground">
                            <CartIcon size={28} />
                        </div>
                        <h2 className="text-xl font-bold text-foreground mb-2">Your Cart is Empty</h2>
                        <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">You haven't added any 3D models or engineering assets to your cart yet.</p>
                        <Link to="/products">
                            <button className="skeuo-button skeuo-button-primary px-8"> Browse Catalog </button>
                        </Link>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
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
                                    className="skeuo-card p-5 flex flex-col md:flex-row items-center gap-6 bg-white"
                                >
                                    <div className="w-20 h-20 bg-muted/30 rounded-xl overflow-hidden shrink-0 border border-border/80">
                                        <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                                    </div>
                                    
                                    <div className="flex-1 text-center md:text-left min-w-0">
                                        <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-1">{item.product.category}</p>
                                        <h4 className="text-sm sm:text-base font-bold text-foreground truncate">{item.product.name}</h4>
                                        <p className="text-primary font-bold text-sm mt-0.5">{(item.product?.price && /^\D/.test(item.product.price)) ? item.product.price : `₹${item.product?.price || 0}`}</p>
                                    </div>

                                    <div className="flex items-center gap-3 bg-muted/40 p-1.5 rounded-xl border border-border">
                                        <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-foreground/70 hover:text-foreground active:scale-90 transition-all border border-border/60">
                                            <Minus size={13} />
                                        </button>
                                        <span className="text-xs font-bold text-foreground w-6 text-center font-mono">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-foreground/70 hover:text-foreground active:scale-90 transition-all border border-border/60">
                                            <Plus size={13} />
                                        </button>
                                    </div>

                                    <button onClick={() => removeItem(item.productId)} className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 flex items-center justify-center active:scale-90 transition-all">
                                        <Trash2 size={16} />
                                    </button>
                                </motion.div>
                            ))}
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="lg:col-span-1"
                        >
                            <div className="skeuo-card p-6 sm:p-8 bg-white sticky top-32 border-border shadow-md">
                                <h3 className="text-lg font-bold text-foreground mb-6 pb-3 border-b border-border">Order Summary</h3>
                                
                                <div className="space-y-4 mb-8">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span className="font-bold text-foreground">{formatCurrency(total)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm border-b border-border pb-3">
                                        <span className="text-muted-foreground">Delivery</span>
                                        <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">Digital Cloud (Free)</span>
                                    </div>
                                    <div className="pt-2 flex justify-between items-center">
                                        <span className="font-bold text-foreground text-base">Total</span>
                                        <span className="text-2xl font-black text-primary">{formatCurrency(total)}</span>
                                    </div>
                                </div>

                                <Link to="/checkout">
                                    <button className="w-full skeuo-button skeuo-button-primary h-12 flex items-center justify-center gap-3 group text-sm font-semibold">
                                        Proceed to Checkout <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    )
}
