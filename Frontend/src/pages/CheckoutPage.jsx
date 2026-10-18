import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ShieldCheck, Mail, Phone, Loader2, Sparkles } from 'lucide-react'
import api from '@/lib/api'
import Navbar from '../components/Navbar'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import SmoothScroll from '../components/animations/SmoothScroll'
import Footer from '../components/Footer'

export default function CheckoutPage() {
    const navigate = useNavigate()
    const [cart, setCart] = useState([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [step, setStep] = useState(1) // 1: Contact, 2: Review & Pay
    const [contactInfo, setContactInfo] = useState({
        email: '',
        mobile: ''
    })
    const [transactionId, setTransactionId] = useState('')

    useEffect(() => {
        const fetchCart = async () => {
            try {
                const res = await api.get('/cart')
                const items = res.data.items || []
                if (items.length === 0) {
                    navigate('/cart')
                    return
                }
                setCart(items)
            } catch (err) {
                console.error(err)
                toast.error('Failed to load cart')
                navigate('/cart')
            } finally {
                setLoading(false)
            }
        }
        fetchCart()
    }, [navigate])

    const total = cart.reduce((sum, item) => {
        let p = 0
        if (item.product && item.product.price) {
            p = parseFloat(String(item.product.price).replace(/[^0-9.-]+/g, '')) || 0
        }
        return sum + p * item.quantity
    }, 0)

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount)
    }

    const handleContactSubmit = (e) => {
        e.preventDefault()
        if (!contactInfo.email) {
            toast.error('Please enter your email address')
            return
        }
        setStep(2)
    }

    const handleOrderSubmit = async () => {
        if (!transactionId || transactionId.trim() === '') {
            toast.error('Please enter the transaction ID after payment')
            return
        }

        setProcessing(true)
        try {
            const res = await api.post('/create-order', {
                items: cart.map(item => ({
                    productId: item.productId,
                    name: item.product.name,
                    price: item.product.price,
                    quantity: item.quantity,
                    image: item.product.image
                })),
                email: contactInfo.email,
                mobile: contactInfo.mobile,
                transactionId: transactionId
            })

            if (res.data.orderId) {
                navigate(`/checkout/success`)
            } else {
                toast.error('Failed to submit order')
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Order submission failed')
        } finally {
            setProcessing(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-primary" size={32} />
                    <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">Loading checkout...</p>
                </div>
            </div>
        )
    }

    return (
        <SmoothScroll>
            <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary flex flex-col">
                <Navbar />
                <div className="pt-36 pb-20 px-6 max-w-7xl mx-auto flex-grow w-full">
                    <Link 
                        to="/cart" 
                        className="inline-flex items-center gap-2 text-primary/60 hover:text-primary mb-8 transition-colors text-xs font-mono font-bold uppercase tracking-widest group"
                    >
                        <div className="w-8 h-8 skeuo-card bg-white flex items-center justify-center group-hover:-translate-x-1 transition-transform border border-border/50 shadow-sm">
                            <ArrowLeft size={16} />
                        </div>
                        Back to Cart
                    </Link>

                    <h1 className="text-3xl md:text-4xl font-black text-primary tracking-tight mb-2">Checkout</h1>
                    <p className="text-muted-foreground text-sm font-medium mb-8">Enter your contact details and pay via UPI to receive your 3D model links.</p>

                    {/* Step indicator */}
                    <div className="flex items-center gap-3 mb-10">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider ${step >= 1 ? 'bg-primary text-white shadow-md' : 'bg-muted text-muted-foreground'}`}>
                            <span className="w-5 h-5 rounded-md bg-white/20 text-white flex items-center justify-center text-xs">1</span>
                            Contact Info
                        </div>
                        <div className="w-8 h-px bg-border" />
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider ${step >= 2 ? 'bg-primary text-white shadow-md' : 'bg-muted text-muted-foreground'}`}>
                            <span className={`w-5 h-5 rounded-md flex items-center justify-center text-xs ${step >= 2 ? 'bg-white/20 text-white' : 'bg-muted-foreground/20 text-muted-foreground'}`}>2</span>
                            UPI Payment
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        {/* Left Column */}
                        <div className="lg:col-span-2 space-y-8">

                            {/* STEP 1: Contact Information */}
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="skeuo-card bg-white p-8 sm:p-10 border border-border/50 shadow-xl relative overflow-hidden"
                                >
                                    <h2 className="text-xl font-black text-primary uppercase tracking-tight mb-2">Contact Information</h2>
                                    <p className="text-muted-foreground text-sm mb-6">Download links and access access will be emailed directly to this address.</p>
                                    
                                    <form onSubmit={handleContactSubmit} className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-primary/80 block">
                                                <Mail size={14} className="inline mr-1.5 mb-0.5" />
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                required
                                                value={contactInfo.email}
                                                onChange={e => setContactInfo({ ...contactInfo, email: e.target.value })}
                                                className="w-full px-4 h-12 skeuo-input text-sm font-medium text-foreground"
                                                placeholder="yourname@gmail.com"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-mono font-black uppercase tracking-[0.15em] text-primary/80 block">
                                                <Phone size={14} className="inline mr-1.5 mb-0.5" />
                                                Mobile Number <span className="opacity-60 lowercase font-normal">(optional)</span>
                                            </label>
                                            <input
                                                type="tel"
                                                value={contactInfo.mobile}
                                                onChange={e => setContactInfo({ ...contactInfo, mobile: e.target.value })}
                                                className="w-full px-4 h-12 skeuo-input text-sm font-medium text-foreground"
                                                placeholder="+91 000 000 0000"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            className="skeuo-button skeuo-button-primary w-full h-12 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg"
                                        >
                                            Continue to Payment <ArrowRight size={16} />
                                        </button>
                                    </form>
                                </motion.div>
                            )}

                            {/* STEP 2: Review & Pay */}
                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-6"
                                >
                                    <div className="skeuo-card bg-white p-8 sm:p-10 border border-border/50 shadow-xl relative overflow-hidden">
                                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/40">
                                            <h2 className="text-xl font-black text-primary uppercase tracking-tight">Review & Pay via UPI</h2>
                                            <button
                                                onClick={() => setStep(1)}
                                                className="text-xs font-bold uppercase tracking-wider bg-muted/60 px-3 py-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors flex items-center gap-1.5"
                                            >
                                                <ArrowLeft size={12} /> Edit Details
                                            </button>
                                        </div>

                                        {/* Cart Items Review */}
                                        <div className="space-y-3 mb-8">
                                            <p className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider">Order Items ({cart.length})</p>
                                            {cart.map(item => (
                                                <div key={item.productId} className="flex items-center gap-3 p-3 bg-slate-50/70 rounded-xl border border-border/40">
                                                    <div className="w-12 h-12 rounded-lg bg-white overflow-hidden flex-shrink-0 border border-border/40">
                                                        {item.product?.image && (
                                                            <img src={item.product.image} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none' }} />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-foreground truncate">{item.product?.name}</p>
                                                        <p className="text-xs text-muted-foreground font-mono">Qty: {item.quantity}</p>
                                                    </div>
                                                    <span className="text-sm font-black text-primary font-mono">
                                                        {(item.product?.price && /^\D/.test(item.product.price)) ? item.product.price : `₹${item.product?.price || 0}`}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Total */}
                                        <div className="bg-slate-50/80 rounded-2xl p-5 border border-border/50 mb-8">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-mono font-bold uppercase tracking-wider text-muted-foreground">Order Total</span>
                                                <span className="text-3xl font-black text-primary font-mono">{formatCurrency(total)}</span>
                                            </div>
                                        </div>

                                        {/* Manual Payment Info */}
                                        <div className="bg-white rounded-2xl p-6 border border-border/50 mb-6 text-center">
                                            <p className="font-bold text-foreground text-sm mb-4">Scan QR code using any UPI App (GPay, PhonePe, Paytm):</p>
                                            <img src="/For persnoal.png" alt="Payment QR Code" className="w-48 h-48 mx-auto mb-4 border border-border/60 rounded-xl shadow-sm object-cover" />

                                            <div className="mt-6 space-y-4 text-left">
                                                <div>
                                                    <label className="text-xs font-bold uppercase tracking-wider text-primary/80 block mb-2">
                                                        Transaction ID / UTR Number
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={transactionId}
                                                        onChange={(e) => setTransactionId(e.target.value)}
                                                        placeholder="Enter 12-digit UTR or Transaction ID here"
                                                        className="w-full px-4 h-12 skeuo-input text-sm font-medium text-foreground"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Pay Button */}
                                        <button
                                            onClick={handleOrderSubmit}
                                            disabled={processing}
                                            className="skeuo-button skeuo-button-primary w-full h-12 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {processing ? (
                                                <>
                                                    <Loader2 className="animate-spin" size={18} />
                                                    Submitting Order...
                                                </>
                                            ) : (
                                                <>
                                                    Submit Order for {formatCurrency(total)}
                                                </>
                                            )}
                                        </button>

                                        <p className="text-center text-xs text-muted-foreground mt-4 font-medium">
                                            Google Drive / OneDrive 3D model download links will be emailed directly once payment is verified.
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Right Column: Order Summary */}
                        <div className="lg:col-span-1">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="skeuo-card bg-white p-6 sm:p-8 border border-border/50 shadow-md sticky top-32"
                            >
                                <h3 className="text-lg font-black text-primary uppercase tracking-tight mb-6 pb-4 border-b border-border/40">Order Summary</h3>
                                <div className="space-y-4 mb-6">
                                    {cart.map(item => (
                                        <div key={item.productId} className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-slate-50 overflow-hidden flex-shrink-0 border border-border/40">
                                                {item.product?.image && (
                                                    <img src={item.product.image} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none' }} />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-foreground truncate">{item.product?.name}</p>
                                                <p className="text-xs text-muted-foreground font-mono">Qty: {item.quantity}</p>
                                            </div>
                                            <span className="text-sm font-bold text-primary font-mono flex-shrink-0">
                                                {(item.product?.price && /^\D/.test(item.product.price)) ? item.product.price : `₹${item.product?.price || 0}`}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-border/40 pt-4 mb-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground font-mono text-xs uppercase tracking-wider">Total</span>
                                        <span className="text-2xl font-black text-primary font-mono">{formatCurrency(total)}</span>
                                    </div>
                                </div>

                                {step === 2 && contactInfo.email && (
                                    <div className="border-t border-border/40 pt-4 space-y-2 text-xs font-mono text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Mail size={13} className="text-primary" />
                                            <span>{contactInfo.email}</span>
                                        </div>
                                        {contactInfo.mobile && (
                                            <div className="flex items-center gap-2">
                                                <Phone size={13} className="text-primary" />
                                                <span>{contactInfo.mobile}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </div>
                </div>

                <Footer />
            </div>
        </SmoothScroll>
    )
}
