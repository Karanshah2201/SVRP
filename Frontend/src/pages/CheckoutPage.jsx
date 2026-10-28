import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
    ArrowLeft, ArrowRight, ShieldCheck, Mail, Phone, Loader2, 
    Sparkles, CreditCard, QrCode, CheckCircle2, Lock, AlertTriangle, FileText, ExternalLink
} from 'lucide-react'
import api from '@/lib/api'
import Navbar from '../components/Navbar'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import SmoothScroll from '../components/animations/SmoothScroll'
import Footer from '../components/Footer'

import { PageHeader } from '@/components/ui'

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
    const [paymentMethod, setPaymentMethod] = useState('razorpay') // 'razorpay' | 'test' | 'manual'
    const [transactionId, setTransactionId] = useState('')
    const [termsAccepted, setTermsAccepted] = useState(false)

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

        // Preload Razorpay Script
        if (!document.getElementById('razorpay-checkout-js')) {
            const script = document.createElement('script')
            script.id = 'razorpay-checkout-js'
            script.src = 'https://checkout.razorpay.com/v1/checkout.js'
            script.async = true
            document.body.appendChild(script)
        }
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
            toast.error('Please enter your email address for license dispatch')
            return
        }
        setStep(2)
    }

    // Razorpay Online Payment Flow
    const handleRazorpayPayment = async () => {
        if (!termsAccepted) {
            toast.error('Please accept the License Terms and Conditions before paying.')
            return
        }

        setProcessing(true)
        try {
            // 1. Create Order on Backend
            const res = await api.post('/payment/create-razorpay-order', {
                items: cart.map(item => ({
                    productId: item.productId,
                    name: item.product?.name,
                    quantity: item.quantity
                })),
                email: contactInfo.email,
                mobile: contactInfo.mobile,
                termsAccepted: true
            })

            const { orderId, razorpayOrderId, amount, currency, key, isSimulation } = res.data

            // Handle Simulated / Development Gateway Mode
            if (isSimulation || !window.Razorpay) {
                toast.info('Payment gateway running in Sandbox Mode. Verifying order...')
                const verifyRes = await api.post('/payment/verify-signature', {
                    orderId,
                    razorpay_order_id: razorpayOrderId,
                    razorpay_payment_id: `pay_sim_${Date.now()}`,
                    razorpay_signature: 'simulated_signature'
                })

                if (verifyRes.data.success) {
                    toast.success('Payment verified! 3D asset licenses activated.')
                    navigate('/checkout/success', { state: { orderId, email: contactInfo.email } })
                    return
                }
            }

            // 2. Launch Official Razorpay Modal
            const options = {
                key: key,
                amount: amount,
                currency: currency || 'INR',
                name: 'Shri Vishwakarma Rail Production',
                description: `3D Model Digital License Order #${String(orderId).slice(-6)}`,
                image: '/svrp.png',
                order_id: razorpayOrderId,
                prefill: {
                    email: contactInfo.email,
                    contact: contactInfo.mobile || ''
                },
                theme: {
                    color: '#4a148c'
                },
                handler: async function (response) {
                    try {
                        const verifyRes = await api.post('/payment/verify-signature', {
                            orderId,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        })

                        if (verifyRes.data.success) {
                            toast.success('Payment confirmed! Licenses generated.')
                            navigate('/checkout/success', { state: { orderId, email: contactInfo.email } })
                        } else {
                            toast.error('Payment verification failed.')
                        }
                    } catch (vErr) {
                        toast.error('Error verifying payment with server.')
                    }
                },
                modal: {
                    ondismiss: function () {
                        setProcessing(false)
                        toast.info('Payment window closed.')
                    }
                }
            }

            const rzpInstance = new window.Razorpay(options)
            rzpInstance.open()

        } catch (err) {
            console.error('Razorpay Error:', err)
            toast.error(err.response?.data?.message || 'Payment initiation failed')
            setProcessing(false)
        }
    }

    // Instant 1-Click Test Checkout (For Demo / Evaluation)
    const handleTestCheckout = async () => {
        if (!termsAccepted) {
            toast.error('Please accept the License Terms and Conditions before proceeding.')
            return
        }

        setProcessing(true)
        try {
            const res = await api.post('/payment/test-checkout', {
                items: cart.map(item => ({
                    productId: item.productId,
                    name: item.product?.name,
                    quantity: item.quantity
                })),
                email: contactInfo.email,
                mobile: contactInfo.mobile,
                termsAccepted: true
            })

            if (res.data.success) {
                toast.success('Test order completed! Licenses activated instantly.')
                navigate('/checkout/success', { state: { orderId: res.data.orderId, email: contactInfo.email } })
            } else {
                toast.error('Test checkout failed')
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Test checkout failed')
        } finally {
            setProcessing(false)
        }
    }

    // Manual UPI QR Payment Submission
    const handleManualOrderSubmit = async () => {
        if (!termsAccepted) {
            toast.error('Please accept the License Terms and Conditions before proceeding.')
            return
        }
        if (!transactionId || transactionId.trim() === '') {
            toast.error('Please enter the 12-digit UPI Transaction ID or UTR number')
            return
        }

        setProcessing(true)
        try {
            const res = await api.post('/create-order', {
                items: cart.map(item => ({
                    productId: item.productId,
                    name: item.product?.name,
                    price: item.product?.price,
                    quantity: item.quantity,
                    image: item.product?.image
                })),
                email: contactInfo.email,
                mobile: contactInfo.mobile,
                transactionId: transactionId.trim()
            })

            if (res.data.orderId) {
                toast.success('Order placed! Awaiting admin verification.')
                navigate('/checkout/success', { state: { orderId: res.data.orderId, email: contactInfo.email } })
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
                <main id="main-content" className="page-container">
                    <PageHeader
                        backTo="/cart"
                        backLabel="Back to Cart"
                        title="Checkout & License Activation"
                        subtitle="Enter your delivery email, review the 30-day license terms, and complete secure payment."
                    />

                    {/* Step indicator */}
                    <div className="flex items-center gap-3 mb-10">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider ${step >= 1 ? 'bg-primary text-white shadow-md' : 'bg-muted text-muted-foreground'}`}>
                            <span className="w-5 h-5 rounded-md bg-white/20 text-white flex items-center justify-center text-xs">1</span>
                            Licensee Contact
                        </div>
                        <div className="w-8 h-px bg-border" />
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider ${step >= 2 ? 'bg-primary text-white shadow-md' : 'bg-muted text-muted-foreground'}`}>
                            <span className={`w-5 h-5 rounded-md flex items-center justify-center text-xs ${step >= 2 ? 'bg-white/20 text-white' : 'bg-muted-foreground/20 text-muted-foreground'}`}>2</span>
                            Payment & Terms
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
                                    className="skeuo-card bg-white p-8 sm:p-10 border border-border/50 shadow-xl relative overflow-hidden rounded-2xl"
                                >
                                    <h2 className="text-xl font-black text-primary uppercase tracking-tight mb-2">Licensee Information</h2>
                                    <p className="text-muted-foreground text-sm mb-6">Cryptographic license keys and automatic download links will be issued to this email.</p>
                                    
                                    <form onSubmit={handleContactSubmit} className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-primary/80 block">
                                                <Mail size={14} className="inline mr-1.5 mb-0.5" />
                                                Email Address for License Access
                                            </label>
                                            <input
                                                type="email"
                                                required
                                                value={contactInfo.email}
                                                onChange={e => setContactInfo({ ...contactInfo, email: e.target.value })}
                                                className="w-full px-4 h-12 skeuo-input text-sm font-medium text-foreground rounded-xl"
                                                placeholder="yourname@gmail.com"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-mono font-black uppercase tracking-[0.15em] text-primary/80 block">
                                                <Phone size={14} className="inline mr-1.5 mb-0.5" />
                                                Mobile Number <span className="opacity-60 lowercase font-normal">(for payment SMS receipt)</span>
                                            </label>
                                            <input
                                                type="tel"
                                                value={contactInfo.mobile}
                                                onChange={e => setContactInfo({ ...contactInfo, mobile: e.target.value })}
                                                className="w-full px-4 h-12 skeuo-input text-sm font-medium text-foreground rounded-xl"
                                                placeholder="+91 98765 43210"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            className="skeuo-button skeuo-button-primary w-full h-12 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg rounded-xl"
                                        >
                                            Continue to Payment & Terms <ArrowRight size={16} />
                                        </button>
                                    </form>
                                </motion.div>
                            )}

                            {/* STEP 2: Review, Terms & Payment */}
                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-6"
                                >
                                    <div className="skeuo-card bg-white p-8 sm:p-10 border border-border/50 shadow-xl relative overflow-hidden rounded-2xl">
                                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/40">
                                            <h2 className="text-xl font-black text-primary uppercase tracking-tight">Payment & License Activation</h2>
                                            <button
                                                onClick={() => setStep(1)}
                                                className="text-xs font-bold uppercase tracking-wider bg-muted/60 px-3 py-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors flex items-center gap-1.5"
                                            >
                                                <ArrowLeft size={12} /> Edit Details
                                            </button>
                                        </div>

                                        {/* Cart Items Review */}
                                        <div className="space-y-3 mb-8">
                                            <p className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider">Licensed Products ({cart.length})</p>
                                            {cart.map(item => (
                                                <div key={item.productId} className="flex items-center gap-3 p-3 bg-slate-50/70 rounded-xl border border-border/40">
                                                    <div className="w-12 h-12 rounded-lg bg-white overflow-hidden flex-shrink-0 border border-border/40">
                                                        {item.product?.image && (
                                                            <img src={item.product.image} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none' }} />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-foreground truncate">{item.product?.name}</p>
                                                        <p className="text-xs text-muted-foreground font-mono">
                                                            Formats: {item.product?.fileFormats?.join(', ') || '.blend, .fbx, .obj, .glb'} • 2 Downloads / 30 Days
                                                        </p>
                                                    </div>
                                                    <span className="text-sm font-black text-primary font-mono">
                                                        {(item.product?.price && /^\D/.test(item.product.price)) ? item.product.price : `₹${item.product?.price || 0}`}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Mandatory License Terms Checkbox */}
                                        <div className="bg-amber-500/10 border-2 border-amber-500/25 rounded-2xl p-5 mb-8 space-y-3">
                                            <div className="flex items-start gap-3">
                                                <input
                                                    type="checkbox"
                                                    id="termsCheck"
                                                    checked={termsAccepted}
                                                    onChange={(e) => setTermsAccepted(e.target.checked)}
                                                    className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer shrink-0"
                                                />
                                                <label htmlFor="termsCheck" className="text-xs text-foreground/90 font-medium leading-relaxed cursor-pointer select-none">
                                                    <strong className="text-foreground font-bold">Mandatory License Terms Acknowledgment:</strong><br />
                                                    I agree to the <Link to="/terms" target="_blank" className="text-primary font-bold underline inline-flex items-center gap-0.5">30-Day License Agreement <ExternalLink size={10} /></Link> with a <strong className="text-foreground">2-download maximum limit</strong> per model. I explicitly acknowledge the <Link to="/disclaimer" target="_blank" className="text-primary font-bold underline inline-flex items-center gap-0.5">Copy Protection Disclaimer <ExternalLink size={10} /></Link> that revoking cloud access cannot delete files already downloaded to my device, and agree not to redistribute or re-upload the original 3D mesh files.
                                                </label>
                                            </div>
                                        </div>

                                        {/* Payment Method Selector */}
                                        <div className="space-y-4 mb-8">
                                            <label className="text-xs font-bold uppercase tracking-wider text-primary/80 block">
                                                Select Payment Method:
                                            </label>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setPaymentMethod('razorpay')}
                                                    className={`p-4 rounded-xl border text-left transition-all ${
                                                        paymentMethod === 'razorpay'
                                                            ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-xs'
                                                            : 'border-border/60 hover:border-border'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2 mb-1.5 font-bold text-xs text-foreground">
                                                        <CreditCard size={15} className="text-primary" /> Razorpay
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground">UPI, Cards, NetBanking with auto-approval</p>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => setPaymentMethod('test')}
                                                    className={`p-4 rounded-xl border text-left transition-all ${
                                                        paymentMethod === 'test'
                                                            ? 'border-emerald-600 bg-emerald-500/5 ring-1 ring-emerald-600 shadow-xs'
                                                            : 'border-border/60 hover:border-border'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2 mb-1.5 font-bold text-xs text-emerald-800">
                                                        <Sparkles size={15} className="text-emerald-600" /> Instant Test
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground">1-Click instant test checkout (Dev/Review mode)</p>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => setPaymentMethod('manual')}
                                                    className={`p-4 rounded-xl border text-left transition-all ${
                                                        paymentMethod === 'manual'
                                                            ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-xs'
                                                            : 'border-border/60 hover:border-border'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2 mb-1.5 font-bold text-xs text-foreground">
                                                        <QrCode size={15} className="text-primary" /> Manual UPI QR
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground">Direct QR scan with manual UTR submission</p>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Dynamic Payment Body */}
                                        {paymentMethod === 'razorpay' && (
                                            <div className="bg-slate-50/80 rounded-2xl p-6 border border-border/50 space-y-4 mb-6">
                                                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                                                    <Lock size={14} className="text-primary" /> 256-Bit Encrypted Razorpay Gateway
                                                </div>
                                                <p className="text-xs text-muted-foreground leading-relaxed">
                                                    Click below to launch the secure checkout dialog. Upon successful verification, your licenses will be issued automatically with zero waiting time.
                                                </p>
                                                <button
                                                    onClick={handleRazorpayPayment}
                                                    disabled={processing || !termsAccepted}
                                                    className="skeuo-button skeuo-button-primary w-full h-12 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl rounded-xl disabled:opacity-50"
                                                >
                                                    {processing ? (
                                                        <><Loader2 className="animate-spin" size={18} /> Processing Gateway...</>
                                                    ) : (
                                                        <>Pay {formatCurrency(total)} Online</>
                                                    )}
                                                </button>
                                            </div>
                                        )}

                                        {paymentMethod === 'test' && (
                                            <div className="bg-emerald-500/10 rounded-2xl p-6 border border-emerald-500/20 space-y-4 mb-6">
                                                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                                                    <Sparkles size={14} className="text-emerald-700" /> Instant Sandbox Evaluation Checkout
                                                </div>
                                                <p className="text-xs text-emerald-950/80 leading-relaxed">
                                                    This mode immediately fulfills your order and generates active 3D model licenses with 2-download limits so you can test the full pipeline without real payment card entry.
                                                </p>
                                                <button
                                                    onClick={handleTestCheckout}
                                                    disabled={processing || !termsAccepted}
                                                    className="skeuo-button bg-emerald-700 hover:bg-emerald-800 text-white w-full h-12 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl rounded-xl disabled:opacity-50"
                                                >
                                                    {processing ? (
                                                        <><Loader2 className="animate-spin" size={18} /> Generating Licenses...</>
                                                    ) : (
                                                        <>Complete Instant Test Order ({formatCurrency(total)})</>
                                                    )}
                                                </button>
                                            </div>
                                        )}

                                        {paymentMethod === 'manual' && (
                                            <div className="bg-white rounded-2xl p-6 border border-border/50 mb-6 text-center space-y-4">
                                                <p className="font-bold text-foreground text-xs">Scan QR code using Google Pay, PhonePe, or Paytm:</p>
                                                <img src="/For persnoal.png" alt="Payment QR" className="w-44 h-44 mx-auto border border-border/60 rounded-xl shadow-xs object-cover" />
                                                <div className="text-left space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-wider text-primary/80 block">
                                                        Transaction ID / 12-Digit UTR
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={transactionId}
                                                        onChange={(e) => setTransactionId(e.target.value)}
                                                        placeholder="Enter 12-digit UTR from receipt"
                                                        className="w-full px-4 h-11 skeuo-input text-xs font-medium text-foreground rounded-xl"
                                                    />
                                                </div>
                                                <button
                                                    onClick={handleManualOrderSubmit}
                                                    disabled={processing || !termsAccepted}
                                                    className="skeuo-button skeuo-button-primary w-full h-12 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl rounded-xl disabled:opacity-50"
                                                >
                                                    {processing ? (
                                                        <><Loader2 className="animate-spin" size={18} /> Submitting...</>
                                                    ) : (
                                                        <>Submit Manual Verification</>
                                                    )}
                                                </button>
                                            </div>
                                        )}

                                        <p className="text-center text-xs text-muted-foreground mt-4 font-medium">
                                            3D model ZIP packages and license certificates are instantly accessible on your <Link to="/orders" className="text-primary font-bold underline">Orders Dashboard</Link>.
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
                                className="skeuo-card bg-white p-6 sm:p-8 border border-border/50 shadow-md sticky top-32 rounded-2xl"
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

                                <div className="border-t border-border/40 pt-4 space-y-2 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1.5 text-foreground font-bold">
                                        <ShieldCheck size={14} className="text-emerald-600" /> Verified Delivery
                                    </div>
                                    <p className="text-[11px] leading-relaxed">
                                        Includes 30-day access window, 2 successful downloads, and official license certificate.
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </main>

                <Footer />
            </div>
        </SmoothScroll>
    )
}
