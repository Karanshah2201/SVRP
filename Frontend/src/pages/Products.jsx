import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams, Link } from 'react-router-dom'
import { Search, ShoppingBag, Star, Package, ArrowRight, Tag, Sparkles } from 'lucide-react'
import Navbar from '../components/Navbar'
import { useState, useEffect } from 'react'
import api from '@/lib/api'
import Footer from '../components/Footer'

export default function ProductsPage() {
    const [searchParams] = useSearchParams()
    const categoryFilter = searchParams.get('category')
    const subcategoryFilter = searchParams.get('subcategory')
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true)
            try {
                const params = {}
                if (categoryFilter) params.category = categoryFilter
                if (subcategoryFilter) params.subcategory = subcategoryFilter
                const response = await api.get('/products', { params })
                setProducts(response.data)
            } catch (error) {
                console.error("Failed to fetch products", error)
            } finally {
                setLoading(false)
            }
        }
        fetchProducts()
    }, [categoryFilter, subcategoryFilter])

    const getTitle = () => {
        if (subcategoryFilter) return subcategoryFilter
        if (categoryFilter) return categoryFilter
        return '3D Rail Models & Assets'
    }

    const filtered = searchQuery
        ? products.filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.description?.toLowerCase().includes(searchQuery.toLowerCase()))
        : products

    return (
        <div className="min-h-screen bg-background font-sans selection:bg-primary/20 flex flex-col">
            <Navbar />

            <main className="pt-36 pb-24 px-6 max-w-7xl mx-auto flex-grow w-full">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                    <div className="max-w-2xl">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-2.5 mb-3"
                        >
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <ShoppingBag size={16} />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">3D Railway Models & Assets</span>
                        </motion.div>
                        <h1 className="text-3xl md:text-5xl font-black text-primary tracking-tight">
                            {getTitle()}
                        </h1>
                    </div>

                    <div className="w-full md:w-80">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors" size={18} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search 3D models..."
                                className="w-full skeuo-input pl-11 h-12 text-sm font-medium placeholder:text-muted-foreground/50 border border-border/70 rounded-xl"
                            />
                        </div>
                    </div>
                </div>

                {/* Filters/Breadcrumbs */}
                {(categoryFilter || subcategoryFilter) && (
                    <div className="flex items-center gap-3 mb-10 overflow-x-auto pb-2 no-scrollbar">
                        <Link to="/products" className="bg-white border border-border/70 px-4 py-2 text-xs font-bold uppercase tracking-wider text-foreground hover:text-primary transition-colors rounded-xl shadow-2xs shrink-0">
                            All Products
                        </Link>
                        {categoryFilter && (
                            <Link to={`/products?category=${categoryFilter}`} className="bg-primary text-white px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl shadow-2xs shrink-0">
                                {categoryFilter}
                            </Link>
                        )}
                        {subcategoryFilter && (
                            <div className="bg-secondary text-white px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl shadow-2xs shrink-0">
                                {subcategoryFilter}
                            </div>
                        )}
                        <span className="text-muted-foreground text-xs font-semibold ml-auto">
                            Showing {filtered.length} products
                        </span>
                    </div>
                )}

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="skeuo-card bg-white h-[420px] animate-pulse rounded-2xl border border-border/50 overflow-hidden shadow-xs">
                                <div className="h-2/3 bg-slate-100" />
                            </div>
                        ))}
                    </div>
                ) : filtered.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filtered.map((product, index) => (
                            <ProductCard key={product.id} product={product} index={index} />
                        ))}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="skeuo-card bg-white p-16 sm:p-20 text-center border border-border/60 rounded-2xl shadow-sm"
                    >
                        <div className="w-20 h-20 skeuo-card bg-primary/5 flex items-center justify-center mx-auto mb-6 text-primary/30 rounded-2xl border border-primary/10">
                            <Package size={36} />
                        </div>
                        <h2 className="text-2xl font-black text-primary mb-2">No Products Found</h2>
                        <p className="text-muted-foreground text-sm mb-8 font-medium">Clear your search parameters or check back later for new 3D assets.</p>
                        <button
                            onClick={() => setSearchQuery('')}
                            className="skeuo-button skeuo-button-primary px-8 py-3.5 mx-auto text-xs uppercase tracking-wider"
                        >
                            Clear Search
                        </button>
                    </motion.div>
                )}
            </main>

            <Footer />
        </div>
    )
}

function ProductCard({ product, index }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (index % 6) * 0.1 }}
        >
            <Link to={`/product/${product.id}`} className="group block h-full">
                <div className="skeuo-card bg-white border border-border/70 rounded-2xl h-full flex flex-col group-hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden">
                    {/* Media Area */}
                    <div className="relative aspect-[4/3] bg-slate-50 overflow-hidden m-2 rounded-xl border border-border/40">
                        {product.image ? (
                            <img
                                src={product.image}
                                alt={product.name}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted/20">
                                <Sparkles size={40} className="text-primary/15" />
                            </div>
                        )}
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary rounded-md border border-border/40 shadow-xs">
                            {product.category}
                        </div>
                    </div>

                    <div className="p-5 flex-grow flex flex-col">
                        <div className="flex justify-between items-start gap-3 mb-3">
                            <div>
                                <h3 className="text-base font-bold text-foreground leading-snug mb-1 group-hover:text-primary transition-colors">{product.name}</h3>
                                <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            size={12}
                                            className={i < Math.round(product.rating || 0) ? 'text-secondary fill-secondary' : 'text-primary/10 fill-primary/10'}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-sm font-black whitespace-nowrap">
                                {(product?.price && /^\D/.test(product.price)) ? product.price : `₹${product?.price || 0}`}
                            </div>
                        </div>

                        <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2 mb-5 flex-grow">
                            {product.description}
                        </p>

                        <div className="skeuo-button skeuo-button-primary w-full py-3 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider mt-auto rounded-xl">
                            View 3D Model
                            <ArrowRight size={14} />
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    )
}


