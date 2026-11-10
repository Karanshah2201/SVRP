import { motion, AnimatePresence } from 'framer-motion'
import { Link, useParams } from 'react-router-dom'
import {
    ArrowLeft, Star, Check, ShieldCheck, Gauge, Box,
    Image as ImageIcon, Download, Loader2, Play, Music,
    MessageSquare, Send, User, Clock, ShoppingCart, Cloud,
    HardDrive, Layers, FileCheck, ExternalLink, Sparkles, CheckCircle2
} from 'lucide-react'
import { useState, useEffect, lazy, Suspense } from 'react'
import Navbar from '../components/Navbar'
import api from '@/lib/api'
import { getToken } from '@/lib/authStore'
import { notifyCartItemAdded } from '@/lib/cartStore'
import { toast } from 'sonner'
import Footer from '../components/Footer'

const ModelViewer = lazy(() => import('../components/ModelViewer'))

export default function ProductDetailsPage() {
    const { id } = useParams()
    const [viewMode, setViewMode] = useState('image')
    const [product, setProduct] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isAdding, setIsAdding] = useState(false)
    const [justAdded, setJustAdded] = useState(false)

    // Review state
    const [reviews, setReviews] = useState([])
    const [averageRating, setAverageRating] = useState(0)
    const [totalReviews, setTotalReviews] = useState(0)
    const [userRating, setUserRating] = useState(0)
    const [hoverRating, setHoverRating] = useState(0)
    const [reviewComment, setReviewComment] = useState('')
    const [submittingReview, setSubmittingReview] = useState(false)
    const [showReviewForm, setShowReviewForm] = useState(false)

    const token = getToken()

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true)
            try {
                const response = await api.get(`/products/${id}`)
                setProduct(response.data)
                if (response.data.mediaType && response.data.mediaType !== 'image') {
                    setViewMode(response.data.mediaType)
                } else if (response.data.modelUrl) {
                    setViewMode('3d')
                }
            } catch (error) {
                console.error("Failed to fetch product", error)
            } finally {
                setLoading(false)
            }
        }
        fetchProduct()
        fetchReviews()
    }, [id])

    const fetchReviews = async () => {
        try {
            const res = await api.get(`/products/${id}/reviews`)
            setReviews(res.data.reviews || [])
            setAverageRating(res.data.averageRating || 0)
            setTotalReviews(res.data.totalReviews || 0)
        } catch (error) {
            console.error("Failed to fetch reviews", error)
        }
    }

    const handleSubmitReview = async (e) => {
        e.preventDefault()
        if (userRating === 0) {
            toast.error('Please select a star rating')
            return
        }
        setSubmittingReview(true)
        try {
            await api.post(`/products/${id}/reviews`, {
                rating: userRating,
                comment: reviewComment
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            toast.success('Your review has been published!')
            setUserRating(0)
            setReviewComment('')
            setShowReviewForm(false)
            fetchReviews()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit review')
        } finally {
            setSubmittingReview(false)
        }
    }

    const handleAddToCart = async () => {
        if (!token) {
            toast.error('Please sign in to add assets to your cart')
            return
        }
        setIsAdding(true)
        try {
            await api.post('/cart', { productId: product.id, quantity: 1 }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            notifyCartItemAdded(product.name)
            setJustAdded(true)
            toast.success(`"${product.name}" added to cart!`)
            setTimeout(() => setJustAdded(false), 2400)
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add to cart')
        } finally {
            setIsAdding(false)
        }
    }

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        })
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center">
                <div className="w-16 h-16 skeuo-card bg-white flex items-center justify-center border border-border/60 shadow-sm rounded-2xl">
                    <Loader2 className="animate-spin text-primary" size={30} />
                </div>
                <p className="text-primary mt-4 text-xs font-mono font-bold uppercase tracking-widest">
                    Initializing 3D Asset Environment...
                </p>
            </div>
        )
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <div className="skeuo-card bg-white p-10 text-center border border-border/60 rounded-2xl shadow-sm max-w-md">
                    <Box size={40} className="mx-auto text-primary/30 mb-3" />
                    <h2 className="text-2xl font-black text-primary mb-2">Model Not Found</h2>
                    <p className="text-muted-foreground text-xs leading-relaxed mb-6">
                        The requested 3D model could not be found or has been temporarily decommissioned.
                    </p>
                    <Link to="/products" className="skeuo-button skeuo-button-primary inline-flex text-xs uppercase tracking-wider px-6 h-11 rounded-xl">
                        Back to 3D Catalog
                    </Link>
                </div>
            </div>
        )
    }

    const formattedPrice = (product?.price && /^\D/.test(product.price))
        ? product.price
        : `₹${product?.price || 0}`

    return (
        <div className="min-h-screen bg-background font-sans selection:bg-primary/20">
            <Navbar />

            <main id="main-content" className="page-container">
                {/* Breadcrumb / Back Link */}
                <Link
                    to="/products"
                    className="page-back-link group focus-ring rounded-lg px-1 py-0.5"
                    aria-label="Back to Products"
                >
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
                    <span>Back to 3D Catalog</span>
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
                    {/* Left Column: Interactive 3D Canvas & Media Viewer */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4 }}
                        className="space-y-6"
                    >
                        {/* Main Media Container */}
                        <div className="aspect-[4/3] skeuo-card bg-[#130324] overflow-hidden relative group p-3 rounded-2xl border border-primary/10 shadow-xl">
                            <div className="w-full h-full rounded-xl overflow-hidden relative bg-black/40 flex items-center justify-center">
                                {viewMode === '3d' && (product.mediaType === '3d' || product.modelUrl) ? (
                                    <Suspense fallback={
                                        <div className="w-full h-full min-h-[350px] bg-[#130324] flex flex-col items-center justify-center gap-3 text-white">
                                            <Loader2 className="animate-spin text-secondary" size={32} />
                                            <span className="text-xs font-mono font-bold tracking-widest uppercase text-white/70">
                                                Mounting Interactive WebGL Canvas...
                                            </span>
                                        </div>
                                    }>
                                        <ModelViewer modelUrl={product.mediaUrl || product.modelUrl} />
                                    </Suspense>
                                ) : viewMode === 'video' && product.mediaType === 'video' ? (
                                    <video src={product.mediaUrl} controls className="w-full h-full object-cover" />
                                ) : viewMode === 'audio' && product.mediaType === 'audio' ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-primary/95 text-white relative">
                                        <img src={product.image} alt="cover" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover opacity-20 blur-md" />
                                        <div className="relative z-10 p-10 skeuo-card bg-white/10 backdrop-blur-md border-white/20">
                                            <audio src={product.mediaUrl} controls className="w-full min-w-[300px]" />
                                        </div>
                                    </div>
                                ) : (
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        loading="eager"
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>

                            {/* View Mode Switching Controls Bar */}
                            {(product.mediaType !== 'image' || product.modelUrl) && (
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 skeuo-card bg-white/95 backdrop-blur-xl p-1.5 flex items-center gap-1.5 border border-white/80 shadow-2xl rounded-xl z-20">
                                    <button
                                        onClick={() => setViewMode('image')}
                                        className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                                            viewMode === 'image'
                                                ? 'bg-primary text-white shadow-xs'
                                                : 'text-foreground/70 hover:bg-muted/60'
                                        }`}
                                    >
                                        <ImageIcon size={14} /> Image
                                    </button>

                                    {(product.mediaType === '3d' || product.modelUrl) && (
                                        <button
                                            onClick={() => setViewMode('3d')}
                                            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                                                viewMode === '3d'
                                                    ? 'bg-secondary text-white shadow-xs'
                                                    : 'text-foreground/70 hover:bg-muted/60'
                                            }`}
                                        >
                                            <Box size={14} /> 3D Orbit View
                                        </button>
                                    )}

                                    {product.mediaType === 'video' && (
                                        <button
                                            onClick={() => setViewMode('video')}
                                            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                                                viewMode === 'video'
                                                    ? 'bg-primary text-white shadow-xs'
                                                    : 'text-foreground/70 hover:bg-muted/60'
                                            }`}
                                        >
                                            <Play size={14} /> Video
                                        </button>
                                    )}

                                    {product.mediaType === 'audio' && (
                                        <button
                                            onClick={() => setViewMode('audio')}
                                            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                                                viewMode === 'audio'
                                                    ? 'bg-primary text-white shadow-xs'
                                                    : 'text-foreground/70 hover:bg-muted/60'
                                            }`}
                                        >
                                            <Music size={14} /> Audio
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Visual Quality Specs Card */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="skeuo-card bg-white p-5 border border-border/70 rounded-2xl">
                                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mb-3 text-primary">
                                    <ShieldCheck size={18} />
                                </div>
                                <h4 className="text-xs font-mono font-bold text-primary uppercase tracking-wider">Industrial Grade</h4>
                                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                                    CAD-calibrated 1:1 scale rolling stock geometry verified for railway engineering.
                                </p>
                            </div>

                            <div className="skeuo-card bg-white p-5 border border-border/70 rounded-2xl">
                                <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center mb-3 text-secondary">
                                    <Gauge size={18} />
                                </div>
                                <h4 className="text-xs font-mono font-bold text-secondary uppercase tracking-wider">Clean Quad Topology</h4>
                                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                                    Zero non-manifold faces, game-engine optimized LODs ready for UE5 & Unity.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Column: Commercial Details & Actions */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15, duration: 0.4 }}
                        className="flex flex-col"
                    >
                        {/* Rating & Category Header Pill */}
                        <div className="flex flex-wrap items-center gap-2.5 mb-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-border/70 rounded-full shadow-2xs">
                                <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            size={13}
                                            className={i < Math.round(averageRating || product.rating || 5) ? 'text-tertiary fill-tertiary' : 'text-primary/15 fill-primary/15'}
                                        />
                                    ))}
                                </div>
                                <span className="text-primary font-mono font-bold text-[11px] uppercase tracking-wider">
                                    {averageRating || product.rating || '5.0'} / 5.0
                                </span>
                            </div>

                            <span className="px-3 py-1 rounded-full bg-primary text-white text-[10px] font-mono font-black uppercase tracking-wider">
                                {product.category || 'Asset'}
                            </span>

                            {product.subcategory && (
                                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono font-bold uppercase tracking-wider border border-slate-200">
                                    {product.subcategory}
                                </span>
                            )}
                        </div>

                        {/* Product Title */}
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-primary tracking-tight mb-4 leading-tight">
                            {product.name}
                        </h1>

                        {/* Price & Commercial License Ribbon */}
                        <div className="flex flex-wrap items-baseline gap-3 mb-6 pb-6 border-b border-border/60">
                            <span className="text-3xl sm:text-4xl font-black text-secondary font-mono">
                                {formattedPrice}
                            </span>
                            <span className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider">
                                Commercial Single-Seat License
                            </span>
                        </div>

                        {/* Description */}
                        <div className="skeuo-card bg-white p-5 sm:p-6 mb-6 border border-border/70 rounded-2xl shadow-2xs">
                            <h3 className="text-xs font-mono font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <FileCheck size={14} className="text-secondary" /> Model Overview
                            </h3>
                            <p className="text-xs sm:text-sm font-medium text-foreground/80 leading-relaxed whitespace-pre-wrap">
                                {product.description || 'High-precision industrial rail 3D model with calibrated dimensions and PBR materials.'}
                            </p>
                        </div>

                        {/* 3D Asset Technical Specifications Grid */}
                        <div className="bg-slate-50/90 rounded-2xl p-5 border border-border/70 mb-6 space-y-4">
                            <h3 className="text-xs font-mono font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                                <Box size={14} className="text-primary" /> Technical Specifications
                            </h3>

                            {/* Included Formats */}
                            <div className="space-y-1.5">
                                <span className="text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider block">
                                    Archive Includes:
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {(product.fileFormats || ['.blend', '.fbx', '.obj', '.stl', '.glb', '.zip']).map((fmt) => (
                                        <span key={fmt} className="px-2.5 py-1 rounded-lg bg-white border border-border/70 text-xs font-mono font-bold text-foreground shadow-2xs">
                                            {fmt}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* 4-Column Technical Metrics */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-border/40">
                                <div className="p-2.5 rounded-xl bg-white border border-border/40">
                                    <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider block">
                                        Archive Size
                                    </span>
                                    <span className="text-sm font-black text-primary font-mono">
                                        {product.fileSize || '68 MB'}
                                    </span>
                                </div>

                                <div className="p-2.5 rounded-xl bg-white border border-border/40">
                                    <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider block">
                                        Polygons
                                    </span>
                                    <span className="text-sm font-black text-foreground font-mono">
                                        {(product.polygonCount || 78500).toLocaleString()}
                                    </span>
                                </div>

                                <div className="p-2.5 rounded-xl bg-white border border-border/40">
                                    <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider block">
                                        Download Limit
                                    </span>
                                    <span className="text-sm font-black text-primary font-mono">
                                        {product.downloadLimit || 2} Downloads
                                    </span>
                                </div>

                                <div className="p-2.5 rounded-xl bg-white border border-border/40">
                                    <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider block">
                                        License Window
                                    </span>
                                    <span className="text-sm font-black text-emerald-700 font-mono">
                                        {product.licenseDurationDays || 30} Days
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* License Terms & Anti-Copy Notice */}
                        <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-1.5 text-xs">
                            <div className="flex items-center justify-between">
                                <span className="font-mono font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                                    <ShieldCheck size={14} className="text-secondary" /> Commercial EULA Rights
                                </span>
                                <Link to="/terms" className="text-primary font-bold underline text-[11px]">
                                    License Agreement
                                </Link>
                            </div>
                            <p className="text-muted-foreground text-xs leading-relaxed">
                                Authorizes single-seat commercial rendering, game engine compilation (UE5, Unity), and simulation pipelines. Access is restricted to <strong>{product.downloadLimit || 2} cloud downloads</strong> within <strong>{product.licenseDurationDays || 30} days</strong> of purchase.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 mt-auto">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                disabled={isAdding}
                                onClick={handleAddToCart}
                                className={`flex-1 skeuo-button h-13 flex items-center justify-center gap-2.5 text-xs font-bold tracking-wider uppercase rounded-xl transition-all shadow-md ${
                                    justAdded 
                                        ? 'bg-emerald-600 text-white shadow-emerald-600/30' 
                                        : 'skeuo-button-primary'
                                }`}
                            >
                                <AnimatePresence mode="wait">
                                    {justAdded ? (
                                        <motion.div
                                            key="added"
                                            initial={{ scale: 0.5, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.5, opacity: 0 }}
                                            className="flex items-center gap-2"
                                        >
                                            <Check size={18} className="stroke-[3]" />
                                            <span>Added to Cart!</span>
                                        </motion.div>
                                    ) : isAdding ? (
                                        <motion.div
                                            key="adding"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex items-center gap-2"
                                        >
                                            <Loader2 size={18} className="animate-spin" />
                                            <span>Adding to Cart...</span>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="default"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex items-center gap-2"
                                        >
                                            <ShoppingCart size={18} />
                                            <span>Add to Cart</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.button>

                            <button 
                                onClick={() => toast.info('Digital Asset: Cloud download link is dispatched automatically to your registered email upon checkout.')}
                                className="px-5 skeuo-card bg-white h-13 text-primary flex items-center justify-center hover:text-secondary transition-colors border border-border/70 shadow-2xs rounded-xl"
                                title="Delivery Information"
                            >
                                <Download size={18} />
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* === Reviews & Verified Feedback Section === */}
                <section className="mt-24 pt-12 border-t border-border/70">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
                        <div>
                            <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-widest font-bold mb-1">
                                <Sparkles size={14} className="text-secondary" />
                                <span>Verified Feedback</span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-black text-primary tracking-tight">
                                Customer Reviews ({totalReviews || reviews.length})
                            </h2>
                        </div>

                        {token && (
                            <button
                                onClick={() => setShowReviewForm(!showReviewForm)}
                                className="skeuo-button skeuo-button-outline text-xs uppercase font-bold tracking-wider px-5 h-10 border border-border/70 shadow-2xs rounded-xl shrink-0"
                            >
                                {showReviewForm ? 'Cancel Review' : 'Write a Review'}
                            </button>
                        )}
                    </div>

                    {/* Review Submission Form */}
                    <AnimatePresence>
                        {showReviewForm && (
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 15 }}
                                className="mb-10"
                            >
                                <form onSubmit={handleSubmitReview} className="skeuo-card bg-white p-6 sm:p-8 max-w-2xl border border-border/70 rounded-2xl shadow-sm">
                                    <h3 className="text-xs font-mono font-bold text-primary uppercase tracking-wider mb-4">
                                        Select Your Star Rating *
                                    </h3>
                                    
                                    <div className="flex items-center gap-2.5 mb-6">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setUserRating(star)}
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                className="w-10 h-10 rounded-xl bg-slate-50 border border-border/60 flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                                            >
                                                <Star
                                                    size={20}
                                                    className={`${star <= (hoverRating || userRating) ? 'text-secondary fill-secondary' : 'text-primary/10 fill-primary/10'}`}
                                                />
                                            </button>
                                        ))}
                                        <span className="text-xs font-mono font-bold text-muted-foreground ml-2">
                                            {userRating ? `${userRating} / 5 Stars` : 'Click to rate'}
                                        </span>
                                    </div>

                                    <div className="space-y-1.5 mb-6">
                                        <label className="text-xs font-mono font-bold text-foreground uppercase tracking-wider block">
                                            Feedback Comments
                                        </label>
                                        <textarea
                                            value={reviewComment}
                                            onChange={(e) => setReviewComment(e.target.value)}
                                            placeholder="Share your experience regarding mesh quality, texturing, scale accuracy, or rendering..."
                                            rows={3}
                                            className="w-full bg-white border border-border p-3.5 text-sm font-medium rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground/50 resize-none"
                                        />
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            type="submit"
                                            disabled={submittingReview}
                                            className="skeuo-button skeuo-button-primary px-6 h-11 flex items-center gap-2 text-xs tracking-wider uppercase rounded-xl"
                                        >
                                            {submittingReview ? <Loader2 className="animate-spin" size={15} /> : <Send size={15} />}
                                            Submit Review
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowReviewForm(false)}
                                            className="px-4 text-xs font-bold text-muted-foreground hover:text-foreground uppercase tracking-wider"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Reviews Cards Grid */}
                    {reviews.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {reviews.map((review, i) => (
                                <motion.div
                                    key={review._id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.08 }}
                                    className="skeuo-card bg-white p-6 border border-border/70 rounded-2xl shadow-2xs flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-xs uppercase font-mono shadow-2xs">
                                                    {review.userId?.fullname?.charAt(0)?.toUpperCase() || 'C'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-foreground">
                                                        {review.userId?.fullname || 'Verified Client'}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <div className="flex">
                                                            {[...Array(5)].map((_, s) => (
                                                                <Star
                                                                    key={s}
                                                                    size={12}
                                                                    className={s < review.rating ? 'text-secondary fill-secondary' : 'text-primary/10 fill-primary/10'}
                                                                />
                                                            ))}
                                                        </div>
                                                        <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">
                                                            {formatDate(review.createdAt)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                                <CheckCircle2 size={11} /> Verified
                                            </span>
                                        </div>

                                        {review.comment && (
                                            <p className="text-xs font-medium text-foreground/80 leading-relaxed bg-slate-50 p-3 rounded-xl border border-border/40 mt-3">
                                                "{review.comment}"
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="skeuo-card bg-white p-12 text-center border border-border/60 rounded-2xl shadow-2xs max-w-xl mx-auto">
                            <MessageSquare size={36} className="mx-auto text-primary/25 mb-3" />
                            <h3 className="text-lg font-bold text-primary mb-1">No Reviews Yet</h3>
                            <p className="text-muted-foreground text-xs leading-relaxed max-w-sm mx-auto">
                                Be the first verified engineer or 3D creator to review this rolling stock model.
                            </p>
                        </div>
                    )}
                </section>
            </main>
            <Footer />
        </div>
    )
}
