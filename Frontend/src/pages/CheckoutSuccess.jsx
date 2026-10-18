import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle, Loader2, ShoppingBag, Download, ArrowRight, Sparkles } from 'lucide-react'
import api from '@/lib/api'
import Navbar from '../components/Navbar'
import { motion } from 'framer-motion'
import SmoothScroll from '../components/animations/SmoothScroll'
import Footer from '../components/Footer'

export default function CheckoutSuccess() {
    const [searchParams] = useSearchParams()
    const sessionId = searchParams.get('session_id')
    const [verifying, setVerifying] = useState(true)
    const [paymentStatus, setPaymentStatus] = useState(null)
    const [email, setEmail] = useState('')

    useEffect(() => {
        const verifyPayment = async () => {
            if (!sessionId) {
                setVerifying(false)
                return
            }

            try {
                const res = await api.get(`/checkout-session/${sessionId}`)
                setPaymentStatus(res.data.status)
                setEmail(res.data.customerEmail || '')
            } catch (err) {
                console.error('Payment verification error:', err)
                setPaymentStatus('error')
            } finally {
                setVerifying(false)
            }
        }

        verifyPayment()
    }, [sessionId])

    return (
        <SmoothScroll>
            <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary flex flex-col">
                <Navbar />
                <div className="pt-36 pb-20 px-6 max-w-2xl mx-auto text-center flex-grow w-full">
                    {verifying ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center gap-4"
                        >
                            <Loader2 className="animate-spin text-primary" size={40} />
                            <p className="text-muted-foreground font-medium text-lg">Verifying your payment...</p>
                        </motion.div>
                    ) : paymentStatus === 'paid' ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            {/* Success Icon */}
                            <div className="relative inline-block mb-8">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                                    className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20"
                                >
                                    <CheckCircle size={48} className="text-white" />
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="absolute -top-2 -right-2 w-8 h-8 bg-secondary rounded-full flex items-center justify-center shadow-lg"
                                >
                                    <Sparkles size={16} className="text-white" />
                                </motion.div>
                            </div>

                            <h1 className="text-3xl md:text-4xl font-black text-primary tracking-tight uppercase mb-3">Order Placed Successfully!</h1>
                            <p className="text-muted-foreground text-base mb-2">
                                Your order has been placed and digital 3D model links are being processed.
                            </p>
                            {email && (
                                <p className="text-muted-foreground font-mono text-xs mb-8">
                                    Order confirmation sent to <span className="font-bold text-primary">{email}</span>
                                </p>
                            )}

                            <div className="skeuo-card bg-white p-6 sm:p-8 mb-8 text-left border border-border/50 shadow-md rounded-2xl">
                                <h3 className="font-bold text-primary uppercase text-xs tracking-wider mb-4">Order Status</h3>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <CheckCircle size={14} className="text-emerald-600" />
                                        </div>
                                        <p className="text-sm text-foreground/80 font-medium">Payment received and transaction reference recorded</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <CheckCircle size={14} className="text-emerald-600" />
                                        </div>
                                        <p className="text-sm text-foreground/80 font-medium">3D model files & cloud links prepared for download</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Download size={14} className="text-primary" />
                                        </div>
                                        <p className="text-sm text-foreground/80 font-medium">Access your files anytime in <Link to="/orders" className="text-primary underline font-bold">My Orders</Link></p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-4">
                                <Link
                                    to="/products"
                                    className="skeuo-button skeuo-button-outline px-6 h-12 text-xs"
                                >
                                    Browse Products
                                </Link>
                                <Link
                                    to="/orders"
                                    className="skeuo-button skeuo-button-primary px-8 h-12 text-xs flex items-center gap-2"
                                >
                                    <ShoppingBag size={16} />
                                    View Orders
                                </Link>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <div className="w-20 h-20 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <Loader2 size={36} className="text-secondary animate-spin" />
                            </div>
                            <h1 className="text-2xl md:text-3xl font-black text-primary tracking-tight uppercase mb-3">Order Under Verification</h1>
                            <p className="text-muted-foreground text-sm mb-3">
                                Your transaction reference has been logged and is awaiting admin approval.
                            </p>
                            <p className="text-xs text-primary font-bold bg-primary/5 p-3 rounded-xl border border-primary/10 mb-6">
                                ☁️ Once payment is verified, the Google Drive / OneDrive 3D model download links will be automatically emailed to your address and unlocked in your account.
                            </p>
                            <Link
                                to="/orders"
                                className="skeuo-button skeuo-button-primary px-8 h-12 text-xs inline-flex items-center gap-2"
                            >
                                Go to Orders <ArrowRight size={16} />
                            </Link>
                        </motion.div>
                    )}
                </div>

                <Footer />
            </div>
        </SmoothScroll>
    )
}
