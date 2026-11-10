import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
    ArrowRight, Heart, Star, Sparkles, Percent, Tag,
    ChevronLeft, ChevronRight, Pause, Play, ShieldCheck,
    Globe, Cpu, Layout, Box, ArrowUpRight
} from 'lucide-react'
import Navbar from '../components/Navbar'
import api from '@/lib/api'
import Footer from '../components/Footer'
import catArchitecture from '../assets/cat-architecture.png'
import hero3d from '../assets/hero-3d.png'

const FALLBACK_BANNERS = [
    {
        _id: 'fallback-1',
        title: 'WAP-7 High-Speed Electric Locomotive 3D Asset',
        subtitle: 'Flagship 6000 HP digital asset with cab interior, modular pantographs & 4K PBR UDIM textures.',
        badge: 'Featured 3D Model',
        discount: 'Top Rated Asset',
        productId: 2,
        productName: 'WAP-7 High-Speed Electric Locomotive 3D Asset',
        image: hero3d,
        ctaText: 'View 3D Model',
        ctaLink: '/products',
        isActive: true
    },
    {
        _id: 'fallback-2',
        title: 'Vande Bharat Express Semi-High Speed Train Set',
        subtitle: 'Aerodynamic nose shell and modular passenger car set with commercial single-seat license.',
        badge: 'Exclusive Discount',
        discount: 'Save 25% Today',
        productId: 3,
        productName: 'Vande Bharat Express Semi-High Speed Train Set',
        image: '/1792314306858-650384.png',
        ctaText: 'Claim Discount',
        ctaLink: '/products',
        isActive: true
    },
    {
        _id: 'fallback-3',
        title: 'ICF Passenger Coach Measurement Rig (LHB Series)',
        subtitle: 'CAD-calibrated bogie and chassis measurement apparatus ready for simulation and VR.',
        badge: 'New Release',
        discount: 'Fresh Release',
        productId: 1,
        productName: 'ICF Passenger Coach Measurement Rig (LHB Series)',
        image: catArchitecture,
        ctaText: 'Explore Asset',
        ctaLink: '/products',
        isActive: true
    }
]

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
                <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    onError={(e) => { e.target.src = catArchitecture }}
                />
            ) : (
                <img
                    src={catArchitecture}
                    alt="Placeholder"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
            )}

            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />

            <button
                onClick={(e) => e.preventDefault()}
                aria-label="Save to Wishlist"
                className="absolute top-4 right-4 w-10 h-10 skeuo-card bg-white/90 backdrop-blur-md flex items-center justify-center text-primary/30 hover:text-secondary transition-all z-10 border-none shadow-lg active:scale-90"
            >
                <Heart size={18} fill="currentColor" className="opacity-20 group-hover:opacity-100 transition-opacity" />
            </button>
        </Link>

        <div className="px-6 pb-6 flex flex-col flex-1">
            <div className="flex justify-between items-center mb-3">
                <span className="text-[length:var(--text-small)] font-black text-primary/40 uppercase tracking-[0.2em] font-mono">
                    {product.category || 'Asset'}
                </span>
                <span className="text-lg font-black text-secondary font-mono">
                    {(product.price && /^\D/.test(product.price)) ? product.price : `₹${product.price || 0}`}
                </span>
            </div>

            <Link to={`/product/${product.id || product._id}`}>
                <h4 className="mb-2 line-clamp-1 group-hover:text-primary transition-colors text-base font-bold text-foreground">
                    {product.name}
                </h4>
            </Link>

            <div className="flex items-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        size={12}
                        className={i < Math.floor(product.rating || 5) ? "fill-tertiary text-tertiary" : "text-muted"}
                    />
                ))}
                <span className="text-[11px] font-mono font-bold text-muted-foreground ml-1.5">
                    ({product.rating || '5.0'})
                </span>
            </div>

            <div className="mt-auto">
                <Link
                    to={`/product/${product.id || product._id}`}
                    className="w-full skeuo-button skeuo-button-primary h-11 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 rounded-xl"
                >
                    View 3D Model <ArrowRight size={14} />
                </Link>
            </div>
        </div>
    </motion.div>
)

export default function Landing() {
    const [banners, setBanners] = useState([])
    const [currentSlide, setCurrentSlide] = useState(0)
    const [isAutoPlaying, setIsAutoPlaying] = useState(true)
    const [topProducts, setTopProducts] = useState([])
    const [categories, setCategories] = useState([])
    const timerRef = useRef(null)

    // Fetch dynamic hero promotional banners from backend
    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const res = await api.get('/banners')
                if (Array.isArray(res.data) && res.data.length > 0) {
                    setBanners(res.data)
                } else {
                    setBanners(FALLBACK_BANNERS)
                }
            } catch (err) {
                setBanners(FALLBACK_BANNERS)
            }
        }
        fetchBanners()
    }, [])

    // Fetch top products & categories for sections
    useEffect(() => {
        const fetchCatalog = async () => {
            try {
                const [prodRes, catRes] = await Promise.all([
                    api.get('/products', { params: { limit: 4, sort: 'rating' } }),
                    api.get('/categories')
                ])
                setTopProducts(Array.isArray(prodRes.data) ? prodRes.data : [])
                setCategories(Array.isArray(catRes.data) ? catRes.data : [])
            } catch (error) {
                // non-blocking
            }
        }
        fetchCatalog()
    }, [])

    const activeBanners = banners.length > 0 ? banners : FALLBACK_BANNERS

    // Auto-advance hero slides
    useEffect(() => {
        if (!isAutoPlaying || activeBanners.length <= 1) return

        timerRef.current = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % activeBanners.length)
        }, 5500)

        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [isAutoPlaying, activeBanners.length])

    const handlePrev = () => {
        setCurrentSlide(prev => (prev - 1 + activeBanners.length) % activeBanners.length)
    }

    const handleNext = () => {
        setCurrentSlide(prev => (prev + 1) % activeBanners.length)
    }

    const activeSlide = activeBanners[currentSlide] || activeBanners[0]

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/10">
            <Navbar />

            {/* DYNAMIC ANIMATED HERO SLIDER (Connected to Admin) */}
            <section
                className="pt-32 sm:pt-36 pb-12 sm:pb-16 px-4 sm:px-6 max-w-7xl mx-auto relative overflow-hidden"
                onMouseEnter={() => setIsAutoPlaying(false)}
                onMouseLeave={() => setIsAutoPlaying(true)}
            >
                {/* Background Ambient Lighting using Brand Tokens */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-[100px] pointer-events-none -z-10" />

                <div className="relative z-10">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeSlide._id || currentSlide}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                            className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16"
                        >
                            {/* Slide Left: Editorial Content */}
                            <div className="flex-1 text-center lg:text-left">
                                {/* Badges Row */}
                                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 mb-6">
                                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 skeuo-card bg-white/95 border border-primary/10 rounded-full shadow-2xs">
                                        <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                                        <span className="text-xs font-bold text-primary uppercase tracking-wider font-mono">
                                            {activeSlide.badge || 'Featured 3D Model'}
                                        </span>
                                    </div>

                                    {activeSlide.discount && (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-secondary text-white shadow-2xs font-mono">
                                            <Percent size={12} /> {activeSlide.discount}
                                        </span>
                                    )}
                                </div>

                                {/* Headline Title */}
                                <h1 className="hero-h1 mb-6 text-shadow-premium leading-tight">
                                    {activeSlide.title}
                                </h1>

                                {/* Subtitle */}
                                <p className="text-base sm:text-lg mb-8 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed text-foreground/70">
                                    {activeSlide.subtitle || 'Millimeter-perfect industrial assets and 3D architectural blueprints for modern rail infrastructure deployment globally.'}
                                </p>

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row items-center lg:justify-start justify-center gap-4">
                                    <Link to={activeSlide.ctaLink || '/products'}>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="skeuo-button skeuo-button-primary px-8 h-12 text-xs font-bold uppercase tracking-wider rounded-xl shadow-md inline-flex items-center gap-2"
                                        >
                                            <span>{activeSlide.ctaText || 'View 3D Model'}</span>
                                            <ArrowRight size={15} />
                                        </motion.button>
                                    </Link>

                                    <Link to="/products">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="skeuo-button skeuo-button-outline px-7 h-12 text-xs font-bold uppercase tracking-wider rounded-xl bg-white/80"
                                        >
                                            Explore Catalog
                                        </motion.button>
                                    </Link>
                                </div>
                            </div>

                            {/* Slide Right: Visual 3D Showcase Card */}
                            <div className="flex-1 w-full max-w-lg lg:max-w-xl relative">
                                <motion.div
                                    initial={{ scale: 0.96, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.5, ease: 'easeOut' }}
                                    className="skeuo-card p-4 sm:p-5 bg-white/85 border-white relative z-10 shadow-xl overflow-hidden group"
                                >
                                    <div className="aspect-[4/3] rounded-xl overflow-hidden relative bg-[#130324] shadow-inner-flat flex items-center justify-center">
                                        <img
                                            src={activeSlide.image || catArchitecture}
                                            alt={activeSlide.title}
                                            loading="eager"
                                            className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
                                            onError={(e) => { e.target.src = catArchitecture }}
                                        />

                                        {/* Cinematic lighting gradient */}
                                        <div className="absolute inset-0 bg-gradient-to-tr from-[#130324]/80 via-transparent to-primary/10" />

                                        {/* Floating Spec Tag on Image */}
                                        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white z-10">
                                            <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                                                <Box size={14} className="text-secondary" />
                                                <span className="text-[11px] font-mono font-bold uppercase tracking-wider">
                                                    PBR 4K • FBX / BLEND
                                                </span>
                                            </div>

                                            <div className="bg-primary/90 text-white backdrop-blur-md px-3 py-1.5 rounded-lg font-mono font-black text-xs shadow-md">
                                                Commercial EULA
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Background decorative halos */}
                                <div className="absolute -top-6 -right-6 w-48 h-48 bg-primary/10 rounded-full blur-2xl -z-10" />
                                <div className="absolute -bottom-6 -left-6 w-48 h-48 bg-secondary/10 rounded-full blur-2xl -z-10" />
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Slider Navigation Controls & Indicators Bar */}
                    <div className="mt-10 sm:mt-12 flex items-center justify-between pt-6 border-t border-border/60">
                        {/* Slide Indicators */}
                        <div className="flex items-center gap-2">
                            {activeBanners.map((banner, index) => (
                                <button
                                    key={banner._id || index}
                                    onClick={() => setCurrentSlide(index)}
                                    aria-label={`Go to slide ${index + 1}`}
                                    className={`h-2.5 transition-all duration-300 rounded-full ${
                                        currentSlide === index
                                            ? 'w-8 bg-secondary shadow-xs'
                                            : 'w-2.5 bg-primary/20 hover:bg-primary/40'
                                    }`}
                                />
                            ))}

                            <span className="ml-3 text-xs font-mono font-bold text-muted-foreground select-none">
                                {String(currentSlide + 1).padStart(2, '0')} / {String(activeBanners.length).padStart(2, '0')}
                            </span>
                        </div>

                        {/* Interactive Controls */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsAutoPlaying(prev => !prev)}
                                aria-label={isAutoPlaying ? 'Pause Slideshow' : 'Play Slideshow'}
                                className="w-9 h-9 skeuo-card bg-white flex items-center justify-center text-primary/70 hover:text-primary transition-all border border-border/70 shadow-2xs"
                                title={isAutoPlaying ? 'Pause Auto-Play' : 'Resume Auto-Play'}
                            >
                                {isAutoPlaying ? <Pause size={14} /> : <Play size={14} />}
                            </button>

                            <button
                                onClick={handlePrev}
                                aria-label="Previous Slide"
                                className="w-9 h-9 skeuo-card bg-white flex items-center justify-center text-primary/70 hover:text-primary transition-all border border-border/70 shadow-2xs active:scale-95"
                            >
                                <ChevronLeft size={16} />
                            </button>

                            <button
                                onClick={handleNext}
                                aria-label="Next Slide"
                                className="w-9 h-9 skeuo-card bg-white flex items-center justify-center text-primary/70 hover:text-primary transition-all border border-border/70 shadow-2xs active:scale-95"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* CATEGORY EXPLORER STRIP */}
            {categories.length > 0 && (
                <section className="py-8 px-4 sm:px-6 max-w-7xl mx-auto border-t border-border/50">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-primary/60">
                            Explore Industrial Asset Categories
                        </span>
                        <Link
                            to="/products"
                            className="text-xs font-bold text-secondary hover:text-secondary/80 flex items-center gap-1 uppercase tracking-wider"
                        >
                            View All <ArrowUpRight size={13} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                        {categories.map((cat) => (
                            <Link
                                key={cat._id || cat.name}
                                to={`/products?category=${encodeURIComponent(cat.name)}`}
                                className="skeuo-card bg-white hover:bg-slate-50/80 p-3.5 border border-border/70 rounded-xl transition-all group flex items-center justify-between"
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                                        <Box size={14} />
                                    </div>
                                    <span className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                                        {cat.name}
                                    </span>
                                </div>
                                <span className="text-[10px] font-mono font-bold text-muted-foreground ml-2">
                                    {(cat.subcategories?.length || 0) > 0 ? `${cat.subcategories.length}` : '•'}
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* FEATURED 3D MODELS GRID */}
            <section className="py-16 sm:py-20 px-4 sm:px-6 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
                    <div>
                        <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-widest font-bold mb-1">
                            <Sparkles size={14} className="text-secondary" />
                            <span>Precision Rolling Stock</span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black text-primary tracking-tight">
                            Featured 3D Models
                        </h2>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">
                            CAD-calibrated industrial infrastructure & locomotives
                        </p>
                    </div>

                    <Link
                        to="/products"
                        className="skeuo-button skeuo-button-outline h-11 px-6 flex items-center gap-2 text-xs font-bold uppercase tracking-wider rounded-xl"
                    >
                        View All Assets <ArrowRight size={15} />
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {topProducts.length > 0 ? (
                        topProducts.map((product, i) => (
                            <ProductCard key={product.id || product._id} product={product} index={i} />
                        ))
                    ) : (
                        [1, 2, 3, 4].map(idx => (
                            <div key={idx} className="skeuo-card h-80 bg-white/40 animate-pulse m-0 rounded-2xl" />
                        ))
                    )}
                </div>
            </section>

            {/* BENTO CORE INDUSTRIAL CAPABILITIES */}
            <section className="py-20 sm:py-24 bg-muted/30 border-y border-border/10">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-14">
                        <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-primary/70 block mb-2">
                            Engineered To Scale
                        </span>
                        <h2 className="text-2xl md:text-4xl font-black text-primary tracking-tight">
                            Industrial Standards & Precision
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Cpu,
                                title: 'Precision Rendering',
                                desc: 'Millimeter-perfect accuracy and clean quad topology for architectural integration and Unreal Engine / Unity simulations.',
                                color: 'text-primary'
                            },
                            {
                                icon: Globe,
                                title: 'Global CDN Distribution',
                                desc: 'High-speed encrypted delivery of localized asset archives, textures, and CAD metadata worldwide.',
                                color: 'text-secondary'
                            },
                            {
                                icon: ShieldCheck,
                                title: 'Compliance Safety',
                                desc: 'Rigorous engineering quality protocols and verifiable commercial single-seat EULA licensing on every asset.',
                                color: 'text-accent'
                            }
                        ].map((feat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                viewport={{ once: true }}
                                className="skeuo-card p-10 bg-white hover:shadow-2xl transition-all duration-700 rounded-2xl"
                            >
                                <div className={`w-14 h-14 skeuo-card flex items-center justify-center mb-8 bg-white shadow-xl rounded-xl ${feat.color}`}>
                                    <feat.icon size={24} />
                                </div>
                                <h3 className="mb-3 text-xl font-bold text-foreground">{feat.title}</h3>
                                <p className="text-sm text-foreground/60 font-medium leading-relaxed">{feat.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}
