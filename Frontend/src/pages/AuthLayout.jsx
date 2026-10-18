import { Outlet, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AuthLayout() {
    return (
        <div className="relative min-h-screen w-full bg-background flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden selection:bg-primary/10">

            {/* Subtle Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-25">
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/15 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-secondary/15 rounded-full blur-3xl" />
            </div>

            {/* Top Navigation */}
            <nav className="fixed top-5 left-5 sm:top-6 sm:left-6 z-50">
                <Link to="/">
                    <motion.div 
                        whileHover={{ x: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="skeuo-card bg-white px-4 py-2 flex items-center gap-2 cursor-pointer shadow-sm text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                    >
                        <ArrowLeft size={15} />
                        <span>Back to Home</span>
                    </motion.div>
                </Link>
            </nav>

            <motion.main
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full max-w-[440px] relative z-10 py-6 my-auto"
            >
                {/* Brand Header */}
                <header className="flex flex-col items-center mb-5">
                    <Link to="/" className="flex flex-col items-center group">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="skeuo-card p-3 bg-white shadow-md mb-2.5 border-border/80"
                        >
                            <img src="/svrp.png" alt="SVRP" className="h-10 w-auto" />
                        </motion.div>
                        <span className="text-xs font-black tracking-[0.2em] text-primary/80 uppercase font-mono">
                            SHREE VISWAKARMA
                        </span>
                    </Link>
                </header>

                {/* Content Container */}
                <section className="skeuo-card bg-white border border-border/70 p-6 sm:p-8 relative overflow-hidden shadow-lg">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                    <Outlet />
                </section>

                {/* Footer Security Badge */}
                <footer className="mt-5 text-center">
                    <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-white/80 rounded-full border border-border/60 shadow-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider font-mono">
                            SSL Encrypted & Protected
                        </span>
                    </div>
                </footer>
            </motion.main>
        </div>
    )
}
