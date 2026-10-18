import { Link } from 'react-router-dom'
import { XCircle, ArrowLeft, ShoppingCart } from 'lucide-react'
import Navbar from '../components/Navbar'
import { motion } from 'framer-motion'
import SmoothScroll from '../components/animations/SmoothScroll'
import Footer from '../components/Footer'

export default function CheckoutCancel() {
    return (
        <SmoothScroll>
            <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary flex flex-col">
                <Navbar />
                <div className="pt-36 pb-20 px-6 max-w-2xl mx-auto text-center flex-grow w-full">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                            <XCircle size={40} className="text-red-500" />
                        </div>

                        <h1 className="text-3xl md:text-4xl font-black text-primary tracking-tight uppercase mb-3">Settlement Cancelled</h1>
                        <p className="text-muted-foreground text-base mb-2">
                            The transaction process was interrupted. No charges have been debited.
                        </p>
                        <p className="text-muted-foreground font-mono text-xs mb-8">
                            Your staging cart contents are preserved. You can re-attempt whenever ready.
                        </p>

                        <div className="skeuo-card bg-white p-6 sm:p-8 mb-8 text-left border border-border/50 shadow-md">
                            <h3 className="font-black text-primary uppercase text-sm tracking-wider font-mono mb-3">Diagnostic Information</h3>
                            <div className="space-y-2.5 text-sm text-foreground/80 font-medium">
                                <p>• The transaction portal was terminated prematurely</p>
                                <p>• Direct settlement transmission timed out</p>
                                <p>• Institutional authorization was aborted by user</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-center gap-4">
                            <Link
                                to="/products"
                                className="skeuo-button skeuo-button-outline px-6 h-12 text-xs flex items-center gap-2"
                            >
                                <ArrowLeft size={16} />
                                Asset Catalog
                            </Link>
                            <Link
                                to="/cart"
                                className="skeuo-button skeuo-button-primary px-8 h-12 text-xs flex items-center gap-2"
                            >
                                <ShoppingCart size={16} />
                                Return to Cart
                            </Link>
                        </div>
                    </motion.div>
                </div>

                <Footer />
            </div>
        </SmoothScroll>
    )
}
