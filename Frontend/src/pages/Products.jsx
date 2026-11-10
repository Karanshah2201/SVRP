import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams, Link } from 'react-router-dom'
import { 
    Search, ShoppingBag, Star, Package, ArrowRight, Tag, Sparkles, 
    X, SlidersHorizontal, Layers, Check, Box, ChevronDown, Filter
} from 'lucide-react'
import Navbar from '../components/Navbar'
import { useState, useEffect, useMemo } from 'react'
import api from '@/lib/api'
import Footer from '../components/Footer'
import { EmptyState } from '@/components/ui'
import catArchitecture from '../assets/cat-architecture.png'

const SORT_OPTIONS = [
    { label: 'Featured & Popular', value: 'featured' },
    { label: 'Top Rated (5.0 ★)', value: 'rating' },
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
    { label: 'Polygon Count (Light to Heavy)', value: 'polys_asc' }
]

export default function ProductsPage() {
    const [searchParams, setSearchParams] = useSearchParams()
    const categoryFilter = searchParams.get('category') || ''
    const subcategoryFilter = searchParams.get('subcategory') || ''

    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedSort, setSelectedSort] = useState('featured')
    const [selectedFormat, setSelectedFormat] = useState('all')

    // Fetch products & categories
    useEffect(() => {
        const fetchCatalog = async () => {
            setLoading(true)
            try {
                const params = {}
                if (categoryFilter) params.category = categoryFilter
                if (subcategoryFilter) params.subcategory = subcategoryFilter

                const [prodRes, catRes] = await Promise.allSettled([
                    api.get('/products', { params }),
                    api.get('/categories')
                ])

                if (prodRes.status === 'fulfilled') {
                    setProducts(Array.isArray(prodRes.value.data) ? prodRes.value.data : [])
                }
                if (catRes.status === 'fulfilled') {
                    setCategories(Array.isArray(catRes.value.data) ? catRes.value.data : [])
                }
            } catch (error) {
                console.error('Failed to fetch catalog:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchCatalog()
    }, [categoryFilter, subcategoryFilter])

    const handleCategoryClick = (catName) => {
        if (!catName) {
            setSearchParams({})
        } else {
            setSearchParams({ category: catName })
        }
    }

    const handleClearAllFilters = () => {
        setSearchQuery('')
        setSelectedFormat('all')
        setSelectedSort('featured')
        setSearchParams({})
    }

    // Extract available file formats from products
    const availableFormats = useMemo(() => {
        const set = new Set()
        products.forEach(p => {
            if (Array.isArray(p.fileFormats)) {
                p.fileFormats.forEach(fmt => set.add(fmt.toUpperCase().replace('.', '')))
            }
        })
        return Array.from(set).sort()
    }, [products])

    // Filter and Sort Products
    const processedProducts = useMemo(() => {
        let result = [...products]

        // 1. Search Query Filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim()
            result = result.filter(p =>
                p.name?.toLowerCase().includes(query) ||
                p.description?.toLowerCase().includes(query) ||
                p.category?.toLowerCase().includes(query) ||
                p.subcategory?.toLowerCase().includes(query)
            )
        }

        // 2. Format Filter
        if (selectedFormat !== 'all') {
            result = result.filter(p => {
                if (!Array.isArray(p.fileFormats)) return false
                return p.fileFormats.some(fmt =>
                    fmt.toUpperCase().includes(selectedFormat.toUpperCase())
                )
            })
        }

        // 3. Sorting
        result.sort((a, b) => {
            const priceA = parseFloat(String(a.price || 0).replace(/[^0-9.-]+/g, '')) || 0
            const priceB = parseFloat(String(b.price || 0).replace(/[^0-9.-]+/g, '')) || 0

            switch (selectedSort) {
                case 'rating':
                    return (b.rating || 0) - (a.rating || 0)
                case 'price_asc':
                    return priceA - priceB
                case 'price_desc':
                    return priceB - priceA
                case 'polys_asc':
                    return (a.polygonCount || 0) - (b.polygonCount || 0)
                case 'featured':
                default:
                    return (b.rating || 0) - (a.rating || 0)
            }
        })

        return result
    }, [products, searchQuery, selectedFormat, selectedSort])

    const getPageTitle = () => {
        if (subcategoryFilter) return `${categoryFilter} • ${subcategoryFilter}`
        if (categoryFilter) return categoryFilter
        return '3D Railway Assets & Digital Models'
    }

    return (
        <div className="min-h-screen bg-background font-sans selection:bg-primary/20 flex flex-col">
            <Navbar />

            <main id="main-content" className="page-container">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-8 border-b border-border/60">
                    <div className="max-w-2xl">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-mono font-bold uppercase tracking-wider mb-3"
                        >
                            <Box size={14} className="text-secondary" />
                            <span>Digital Asset Marketplace</span>
                        </motion.div>

                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-primary tracking-tight leading-tight">
                            {getPageTitle()}
                        </h1>

                        <p className="text-muted-foreground text-xs sm:text-sm font-medium mt-2 leading-relaxed">
                            Certified CAD-compliant locomotives, rolling stock bogies, passenger coaches, and track infrastructure for Unreal Engine, Unity, and architectural rendering.
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div className="w-full md:w-80 shrink-0">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/50 group-focus-within:text-primary transition-colors" size={18} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by model, series, format..."
                                className="w-full skeuo-input pl-11 pr-10 h-12 text-sm font-medium placeholder:text-muted-foreground/50 border border-border/80 rounded-xl shadow-2xs"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                                    title="Clear search"
                                >
                                    <X size={15} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Filter and Category Navigation Bar */}
                <div className="space-y-4 mb-8">
                    {/* Category Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                        <button
                            onClick={() => handleCategoryClick('')}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider font-mono transition-all shrink-0 shadow-2xs ${
                                !categoryFilter
                                    ? 'bg-primary text-white shadow-primary/20 shadow-md'
                                    : 'bg-white text-foreground/70 hover:text-primary border border-border/70 hover:border-primary/40'
                            }`}
                        >
                            All Categories
                        </button>

                        {categories.map((cat) => {
                            const isSelected = categoryFilter.toLowerCase() === cat.name.toLowerCase()
                            return (
                                <button
                                    key={cat._id || cat.name}
                                    onClick={() => handleCategoryClick(cat.name)}
                                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider font-mono transition-all shrink-0 shadow-2xs flex items-center gap-1.5 ${
                                        isSelected
                                            ? 'bg-primary text-white shadow-primary/20 shadow-md'
                                            : 'bg-white text-foreground/70 hover:text-primary border border-border/70 hover:border-primary/40'
                                    }`}
                                >
                                    <span>{cat.name}</span>
                                    {cat.subcategories?.length > 0 && (
                                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                                            isSelected ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                                        }`}>
                                            {cat.subcategories.length}
                                        </span>
                                    )}
                                </button>
                            )
                        })}
                    </div>

                    {/* Secondary Filters: Subcategories, Format & Sort Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-border/40">
                        {/* Format Badges */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground shrink-0">
                                Format:
                            </span>
                            <button
                                onClick={() => setSelectedFormat('all')}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-colors ${
                                    selectedFormat === 'all'
                                        ? 'bg-secondary text-white'
                                        : 'bg-white text-muted-foreground hover:text-foreground border border-border/70'
                                }`}
                            >
                                All
                            </button>
                            {['FBX', 'BLEND', 'OBJ', 'GLB'].map((fmt) => (
                                <button
                                    key={fmt}
                                    onClick={() => setSelectedFormat(selectedFormat === fmt ? 'all' : fmt)}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-colors ${
                                        selectedFormat === fmt
                                            ? 'bg-secondary text-white'
                                            : 'bg-white text-muted-foreground hover:text-foreground border border-border/70'
                                    }`}
                                >
                                    .{fmt}
                                </button>
                            ))}
                        </div>

                        {/* Sort Dropdown & Counter */}
                        <div className="flex items-center gap-4 ml-auto">
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground hidden sm:inline">
                                    Sort:
                                </span>
                                <div className="relative">
                                    <select
                                        value={selectedSort}
                                        onChange={(e) => setSelectedSort(e.target.value)}
                                        className="skeuo-input h-9 text-xs font-bold pl-3 pr-8 rounded-lg cursor-pointer bg-white border border-border/70 text-foreground"
                                    >
                                        {SORT_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>

                            <span className="text-xs font-mono font-bold text-muted-foreground select-none">
                                {processedProducts.length} model{processedProducts.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Product Grid Content */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="skeuo-card bg-white h-[440px] animate-pulse rounded-2xl border border-border/50 overflow-hidden shadow-xs">
                                <div className="h-3/5 bg-slate-100" />
                                <div className="p-5 space-y-3">
                                    <div className="h-4 bg-slate-100 rounded w-2/3" />
                                    <div className="h-3 bg-slate-100 rounded w-full" />
                                    <div className="h-8 bg-slate-100 rounded-xl mt-4" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : processedProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {processedProducts.map((product, index) => (
                            <ProductCard key={product.id || product._id} product={product} index={index} />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        icon={Package}
                        title="No 3D Models Match Your Criteria"
                        description="Try resetting your search query, selecting 'All Categories', or clearing your format filter."
                        actionLabel="Clear Filters"
                        onAction={handleClearAllFilters}
                    />
                )}
            </main>

            <Footer />
        </div>
    )
}

function ProductCard({ product, index }) {
    const formattedPrice = (product?.price && /^\D/.test(product.price))
        ? product.price
        : `₹${product?.price || 0}`

    const formats = product.fileFormats && product.fileFormats.length > 0
        ? product.fileFormats.slice(0, 3)
        : ['.blend', '.fbx', '.obj']

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (index % 6) * 0.08, duration: 0.4 }}
            className="h-full"
        >
            <Link to={`/product/${product.id || product._id}`} className="group block h-full select-none">
                <div className="skeuo-card bg-white border border-border/80 rounded-2xl h-full flex flex-col group-hover:-translate-y-1.5 transition-all duration-300 shadow-sm hover:shadow-xl hover:border-primary/30 overflow-hidden">
                    {/* Media Thumbnail Area */}
                    <div className="relative aspect-[4/3] bg-[#130324] overflow-hidden m-2 rounded-xl border border-primary/5 flex items-center justify-center">
                        {product.image ? (
                            <img
                                src={product.image}
                                alt={product.name}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover opacity-90 group-hover:scale-105 group-hover:opacity-100 transition-all duration-500"
                                onError={(e) => { e.target.src = catArchitecture }}
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-white/30 gap-2">
                                <Box size={36} />
                                <span className="text-[10px] font-mono uppercase tracking-wider">3D Mesh Preview</span>
                            </div>
                        )}

                        {/* Subtle lighting vignette */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#130324]/70 via-transparent to-transparent opacity-80" />

                        {/* Category Tag (Top Right) */}
                        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 text-[10px] font-mono font-black uppercase tracking-wider text-primary rounded-lg border border-white/60 shadow-xs">
                            {product.category || 'Asset'}
                        </div>

                        {/* Floating Format Badges (Bottom Left) */}
                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 z-10">
                            {formats.map((fmt) => (
                                <span
                                    key={fmt}
                                    className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-mono font-bold text-white border border-white/10"
                                >
                                    {fmt}
                                </span>
                            ))}
                        </div>

                        {/* Download limits info (Bottom Right) */}
                        <div className="absolute bottom-3 right-3 z-10">
                            <span className="px-2 py-0.5 rounded-md bg-primary/80 backdrop-blur-md text-[10px] font-mono font-bold text-white shadow-xs">
                                {product.downloadLimit || 2} Downloads
                            </span>
                        </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 flex-grow flex flex-col">
                        <div className="flex justify-between items-start gap-3 mb-2">
                            <div className="min-w-0">
                                <span className="text-[11px] font-mono font-bold text-primary/50 uppercase tracking-widest block mb-0.5">
                                    {product.subcategory || 'Standard Series'}
                                </span>
                                <h3 className="text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-1" title={product.name}>
                                    {product.name}
                                </h3>
                            </div>
                            <div className="text-right shrink-0">
                                <span className="text-lg font-black text-secondary font-mono block">
                                    {formattedPrice}
                                </span>
                            </div>
                        </div>

                        {/* Rating & Polygons Spec Row */}
                        <div className="flex items-center justify-between gap-2 mb-3 pt-1 border-t border-border/40">
                            <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        size={12}
                                        className={i < Math.round(product.rating || 5) ? 'text-tertiary fill-tertiary' : 'text-primary/10 fill-primary/10'}
                                    />
                                ))}
                                <span className="text-[11px] font-mono font-bold text-muted-foreground ml-1">
                                    {product.rating || '5.0'}
                                </span>
                            </div>

                            <div className="flex items-center gap-1 text-[11px] font-mono font-semibold text-muted-foreground">
                                <Layers size={12} className="text-primary/40" />
                                <span>{(product.polygonCount || 45000).toLocaleString()} polys</span>
                            </div>
                        </div>

                        <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2 mb-5 flex-grow">
                            {product.description || 'High-precision industrial rail CAD asset ready for digital simulation and real-time visualization.'}
                        </p>

                        {/* Action CTA Button */}
                        <div className="skeuo-button skeuo-button-primary w-full h-11 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider mt-auto rounded-xl shadow-xs group-hover:shadow-primary/25 group-hover:shadow-md transition-all">
                            <span>View 3D Model</span>
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    )
}
