import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
    ArrowRight, Search, Heart, Star, ShoppingCart,
    ShieldCheck, Globe, Target, Cpu, Layout
} from 'lucide-react'
import Navbar from '../components/Navbar'
import api from '@/lib/api'
import Footer from '../components/Footer'
import catArchitecture from '../assets/cat-architecture.png'

const ProductCard = ({ product, index }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        viewport={{ once: true }}
        className="skeuo-card group flex flex-col h-full bg-white relative overflow-hidden"
    >
        <Link to={`/product/${product.id || product._id}`} className="block relative aspect-square bg-muted/10 flex items-center justify-center overflow-hidden m-4 rounded-xl">
            {product.image ? (
                <img src={product.image} alt={product.name} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" onError={(e) => { e.target.src = catArchitecture }} />
            ) : (
                <img src={catArchitecture} alt="Placeholder" loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            )}

            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />

            <button
                onClick={(e) => e.preventDefault()}
                className="absolute top-4 right-4 w-10 h-10 skeuo-card bg-white/90 backdrop-blur-md flex items-center justify-center text-primary/20 hover:text-secondary transition-all z-10 border-none shadow-lg active:scale-90"
            >
                <Heart size={18} fill="currentColor" className="opacity-10 group-hover:opacity-100 transition-opacity" />
            </button>
        </Link>

        <div className="px-6 pb-6 flex flex-col flex-1">
            <div className="flex justify-between items-center mb-3">
                <span className="text-[length:var(--text-small)] font-black text-primary/30 uppercase tracking-[0.2em] font-mono">
                    {product.category || 'Asset'}
                </span>
                <span className="text-lg font-black text-secondary">
                    {(product.price && /^\D/.test(product.price)) ? product.price : `₹${product.price || 0}`}
                </span>
            </div>

            <Link to={`/product/${product.id || product._id}`}>
                <h4 className="mb-2 line-clamp-1 group-hover:text-primary transition-colors text-base">
                    {product.name}
                </h4>
            </Link>

            <div className="flex items-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} className={i < Math.floor(product.rating || 0) ? "fill-tertiary text-tertiary" : "text-muted"} />
                ))}
            </div>

            <div className="mt-auto">
                <Link to={`/product/${product.id || product._id}`} className="w-full skeuo-button skeuo-button-primary h-11 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 rounded-xl">
                    View 3D Model <ArrowRight size={14} />
                </Link>
            </div>
        </div>
    </motion.div>
)

export default function Landing() {
    const [topProducts, setTopProducts] = useState([])

    useEffect(() => {
        const fetchTopProducts = async () => {
            try {
                const res = await api.get('/products', { params: { limit: 4, sort: 'rating' } })
                setTopProducts(Array.isArray(res.data) ? res.data : [])
            } catch (error) {
                console.error('Failed to fetch top products:', error)
            }
        }

        fetchTopProducts()
    }, [])

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/10">
            <Navbar />

            {/* Hero Section */}
            <section className="pt-56 pb-32 px-6 max-w-7xl mx-auto relative overflow-hidden">
                <div className="flex flex-col lg:flex-row items-center gap-20 relative z-10">

                    {/* Left Content */}
                    <div className="flex-1 text-center lg:text-left">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2.5 px-4 py-1.5 skeuo-card bg-white/90 border border-border/50 rounded-full mb-8 shadow-xs"
                        >
                            <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                            <span className="text-xs font-bold text-primary/70 uppercase tracking-wider">Premium 3D Railway Modeling & Assets</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="hero-h1 mb-8 text-shadow-premium leading-tight"
                        >
                            Shri Viswakarma <br />
                            <span className="rail-gradient uppercase block mt-1">Rail Production</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-lg mb-12 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed opacity-60"
                        >
                            Millimeter-perfect industrial assets and 3D architectural blueprints for modern rail infrastructure deployment globally.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex flex-col sm:flex-row items-center lg:justify-start justify-center gap-4"
                        >
                            <Link to="/products">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="skeuo-button skeuo-button-primary px-8 h-12 text-xs font-bold uppercase tracking-wider rounded-xl shadow-md"
                                >
                                    Browse 3D Models
                                </motion.button>
                            </Link>
                            <Link to="/register">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="skeuo-button skeuo-button-outline px-8 h-12 text-xs font-bold uppercase tracking-wider rounded-xl bg-white/80"
                                >
                                    Create Account
                                </motion.button>
                            </Link>
                        </motion.div>
                    </div>

                    {/* Right Visual */}
                    <div className="flex-1 w-full max-w-xl relative">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, ease: "circOut" }}
                            className="skeuo-card p-4 bg-white/80 border-white relative z-10"
                        >
                            <div className="aspect-[4/3] rounded-lg overflow-hidden relative shadow-inner-flat">
                                <img
                                    src={catArchitecture}
                                    alt="Rail Engineering"
                                    className="w-full h-full object-cover grayscale opacity-80"
                                />
                                <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent" />
                            </div>
                        </motion.div>

                        {/* Decorative background circle */}
                        <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
                        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-secondary/5 rounded-full blur-3xl -z-10" />
                    </div>
                </div>
            </section>

            {/* Top Products Grid */}
            <section className="py-24 px-6 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black text-primary tracking-tight mb-1">Featured 3D Models</h2>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">High-Precision Railway Infrastructure</p>
                    </div>
                    <Link to="/products" className="skeuo-button skeuo-button-outline h-11 px-6 flex items-center gap-2 text-xs font-bold uppercase tracking-wider rounded-xl">
                        View All Products <ArrowRight size={15} />
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {topProducts.length > 0 ? topProducts.map((product, i) => (
                        <ProductCard key={product.id || product._id} product={product} index={i} />
                    )) : (
                        [1, 2, 3, 4].map(idx => (
                            <div key={idx} className="skeuo-card h-80 bg-white/40 animate-pulse m-0" />
                        ))
                    )}
                </div>
            </section>

            {/* Core Features - Bento Style */}
            <section className="py-32 bg-muted/30 border-y border-border/10">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { icon: Cpu, title: 'Precision Rendering', desc: 'Millimeter-perfect accuracy for architectural integration.', color: 'text-primary' },
                            { icon: Globe, title: 'CDN Distribution', desc: 'Instant deployment of localized asset bundles globally.', color: 'text-secondary' },
                            { icon: ShieldCheck, title: 'Compliance Safety', desc: 'Rigorous quality protocols for all industrial models.', color: 'text-accent' }
                        ].map((feat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                viewport={{ once: true }}
                                className="skeuo-card p-10 bg-white hover:shadow-2xl transition-all duration-700"
                            >
                                <div className={`w-14 h-14 skeuo-card flex items-center justify-center mb-8 bg-white shadow-xl ${feat.color}`}>
                                    <feat.icon size={24} />
                                </div>
                                <h3 className="mb-4 text-xl">{feat.title}</h3>
                                <p className="text-base opacity-50 font-medium leading-relaxed">{feat.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-40 px-6 max-w-5xl mx-auto text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="skeuo-card bg-primary p-16 md:p-24 relative overflow-hidden text-white border-none shadow-2xl"
                >
                    <div className="relative z-10">
                        <div className="w-16 h-16 skeuo-card bg-white/10 flex items-center justify-center mx-auto mb-8 border-white/10 rounded-2xl">
                            <Layout size={32} className="text-white" />
                        </div>
                        <h2 className="text-2xl md:text-4xl font-black text-white mb-4 tracking-tight">Ready to Build Your Rail Projects?</h2>
                        <p className="text-white/80 mb-10 max-w-2xl mx-auto text-base leading-relaxed">
                            Sign up today to explore, purchase, and immediately download commercial 3D rail infrastructure models and assets.
                        </p>
                        <Link to="/register">
                            <button className="skeuo-button skeuo-button-secondary px-10 h-13 text-xs font-bold uppercase tracking-wider shadow-xl rounded-xl">
                                Create Free Account
                            </button>
                        </Link>
                    </div>

                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full -ml-32 -mb-32 blur-3xl pointer-events-none" />
                </motion.div>
            </section>

            <Footer />
        </div>
    )
}