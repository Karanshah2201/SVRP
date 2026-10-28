import { motion, AnimatePresence } from 'framer-motion'
import { Link, useParams } from 'react-router-dom'
import {
    ArrowLeft, Star, Check, ShieldCheck, Gauge, Box,
    Image as ImageIcon, Download, Loader2, Play, Music,
    MessageSquare, Send, User, Clock, ShoppingCart, Cloud
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
    const [_totalReviews, setTotalReviews] = useState(0)
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
            setReviews(res.data.reviews)
            setAverageRating(res.data.averageRating)
            setTotalReviews(res.data.totalReviews)
        } catch (error) {
            console.error("Failed to fetch reviews", error)
        }
    }

    const handleSubmitReview = async (e) => {
        e.preventDefault()
        if (userRating === 0) {
            toast.error('Please select a rating')
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
            toast.success('Review submitted!')
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
            toast.error('Please login to add items to cart')
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
                    <Loader2 className="animate-spin text-primary" size={32} />
                </div>
                <p className="text-primary mt-4 text-xs font-bold uppercase tracking-wider">Loading 3D Model...</p>
            </div>
        )
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <div className="skeuo-card bg-white p-10 text-center border border-border/60 rounded-2xl shadow-sm max-w-md">
                    <h2 className="text-2xl font-black text-primary mb-3">Product Not Found</h2>
                    <p className="text-muted-foreground text-sm mb-6">The requested 3D model could not be found or has been removed.</p>
                    <Link to="/products" className="skeuo-button skeuo-button-primary inline-flex text-xs uppercase tracking-wider">Back to Products</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background font-sans selection:bg-primary/20">
            <Navbar />

            <main id="main-content" className="page-container">
                <Link
                    to="/products"
                    className="page-back-link group focus-ring rounded-lg px-1 py-0.5"
                    aria-label="Back to Products"
                >
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
                    <span>Back to Products</span>
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
                    {/* Left Column: Media */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-8"
                    >
                        <div className="aspect-[4/3] skeuo-card bg-white overflow-hidden relative group p-3">
                            <div className="w-full h-full rounded-2xl overflow-hidden relative border border-primary/5">
                                {viewMode === '3d' && (product.mediaType === '3d' || product.modelUrl) ? (
                                    <Suspense fallback={
                                        <div className="w-full h-full min-h-[350px] bg-slate-100 flex flex-col items-center justify-center gap-3">
                                            <Loader2 className="animate-spin text-primary" size={28} />
                                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Loading 3D Canvas...</span>
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
                                    <img src={product.image} alt={product.name} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover" />
                                )}
                            </div>

                            {/* View Toggle */}
                            {(product.mediaType !== 'image' || product.modelUrl) && (
                                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 skeuo-card bg-white/90 backdrop-blur-md p-2 flex items-center gap-2 border-white">
                                    <button onClick={() => setViewMode('image')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'image' ? 'bg-primary text-white shadow-lg' : 'text-primary/40 hover:bg-primary/5'}`}>
                                        <ImageIcon size={14} /> Image
                                    </button>
                                    {(product.mediaType === '3d' || product.modelUrl) && (
                                        <button onClick={() => setViewMode('3d')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === '3d' ? 'bg-primary text-white shadow-lg' : 'text-primary/40 hover:bg-primary/5'}`}>
                                            <Box size={14} /> 3D View
                                        </button>
                                    )}
                                    {product.mediaType === 'video' && (
                                        <button onClick={() => setViewMode('video')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'video' ? 'bg-primary text-white shadow-lg' : 'text-primary/40 hover:bg-primary/5'}`}>
                                            <Play size={14} /> Video
                                        </button>
                                    )}
                                    {product.mediaType === 'audio' && (
                                        <button onClick={() => setViewMode('audio')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'audio' ? 'bg-primary text-white shadow-lg' : 'text-primary/40 hover:bg-primary/5'}`}>
                                            <Music size={14} /> Audio
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Specs Grid */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="skeuo-card bg-white p-6 border-none shadow-inner-flat">
                                <div className="w-10 h-10 skeuo-card bg-tertiary/10 flex items-center justify-center mb-4 text-primary">
                                    <ShieldCheck size={20} />
                                </div>
                                <h4 className="text-[10px] font-black text-primary uppercase tracking-widest">Industrial Grade</h4>
                                <p className="text-[11px] font-bold text-muted-foreground mt-1">Verified blueprints for professional production line usage.</p>
                            </div>
                            <div className="skeuo-card bg-white p-6 border-none shadow-inner-flat">
                                <div className="w-10 h-10 skeuo-card bg-secondary/10 flex items-center justify-center mb-4 text-secondary">
                                    <Gauge size={20} />
                                </div>
                                <h4 className="text-[10px] font-black text-primary uppercase tracking-widest">Optimized Mesh</h4>
                                <p className="text-[11px] font-bold text-muted-foreground mt-1">High-performance topology for real-time visualization.</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Column: Details */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col"
                    >
                        {/* Status Badges */}
                        <div className="flex items-center gap-3 mb-8">
                            <div className="skeuo-card bg-white px-3 py-1.5 flex items-center gap-2 shadow-none border-none">
                                <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={14} className={i < Math.round(averageRating || product.rating) ? 'text-secondary fill-secondary' : 'text-primary/10 fill-primary/10'} />
                                    ))}
                                </div>
                                <span className="text-primary font-black text-[10px] uppercase tracking-widest">{averageRating || product.rating} / 5.0</span>
                            </div>
                            {product.subcategory && (
                                <div className="skeuo-card bg-primary text-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest">
                                    {product.subcategory}
                                </div>
                            )}
                        </div>

                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-primary tracking-tight mb-4 leading-tight">
                            {product.name}
                        </h1>

                        <div className="flex items-baseline gap-4 mb-8 pb-8 border-b border-border/50">
                            <span className="text-4xl md:text-5xl font-black text-primary">{(product?.price && /^\D/.test(product.price)) ? product.price : `₹${product?.price || 0}`}</span>
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Commercial License Included</span>
                        </div>

                        <div className="skeuo-card bg-white p-6 sm:p-8 mb-8 border border-border/60 rounded-2xl shadow-xs">
                            <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Box size={15} /> Product Description
                            </h3>
                            <p className="text-sm font-medium text-foreground/80 leading-relaxed whitespace-pre-wrap">{product.description}</p>
                        </div>

                        {/* 3D Model Technical Specifications Grid */}
                        <div className="bg-slate-50/80 rounded-2xl p-6 border border-border/60 mb-8 space-y-4">
                            <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                                <Box size={15} /> 3D Asset Technical Specifications
                            </h3>
                            
                            {/* Format Badges */}
                            <div className="space-y-1.5">
                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Included Formats:</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {(product.fileFormats || ['.blend', '.fbx', '.obj', '.stl', '.glb', '.zip']).map((fmt) => (
                                        <span key={fmt} className="px-2.5 py-1 rounded-lg bg-white border border-border/70 text-xs font-mono font-bold text-foreground shadow-2xs">
                                            {fmt}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border/40">
                                <div className="p-2.5 rounded-xl bg-white border border-border/40">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">File Size</span>
                                    <span className="text-sm font-black text-primary font-mono">{product.fileSize || '68 MB'}</span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-white border border-border/40">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Polygons</span>
                                    <span className="text-sm font-black text-foreground font-mono">{(product.polygonCount || 78500).toLocaleString()}</span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-white border border-border/40">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Download Limit</span>
                                    <span className="text-sm font-black text-primary font-mono">{product.downloadLimit || 2} Downloads</span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-white border border-border/40">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Access Period</span>
                                    <span className="text-sm font-black text-emerald-700 font-mono">{product.licenseDurationDays || 30} Days</span>
                                </div>
                            </div>
                        </div>

                        {/* License Terms & Anti-Copy Notice */}
                        <div className="mb-6 p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                                    <ShieldCheck size={16} /> Commercial 3D License Terms
                                </span>
                                <Link to="/terms" className="text-primary font-bold underline text-[11px]">
                                    Full Terms
                                </Link>
                            </div>
                            <p className="text-muted-foreground leading-relaxed">
                                Includes single-seat commercial rights for compiled games, renders, and simulations. Redistribution or public re-upload of source meshes is strictly prohibited. Access is limited to <strong>{product.downloadLimit || 2} successful downloads</strong> within <strong>{product.licenseDurationDays || 30} days</strong> of purchase.
                            </p>
                            <p className="text-[11px] text-muted-foreground font-medium pt-1 border-t border-primary/10">
                                <strong>Technical Notice:</strong> Revoking cloud access cannot delete files already saved on your local device. Please backup your downloads within the active 30-day window.
                            </p>
                        </div>

                        <div className="flex gap-4 mt-auto">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                disabled={isAdding}
                                onClick={handleAddToCart}
                                className={`flex-1 skeuo-button h-14 flex items-center justify-center gap-3 text-sm font-bold tracking-wider uppercase rounded-xl transition-all shadow-md ${
                                    justAdded 
                                        ? 'bg-emerald-600 text-white shadow-emerald-600/30 ring-2 ring-emerald-400' 
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
                                            <Check size={20} className="stroke-[3]" />
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
                                            <Loader2 size={20} className="animate-spin" />
                                            <span>Adding to Cart...</span>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="default"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex items-center gap-2.5"
                                        >
                                            <ShoppingCart size={20} />
                                            <span>Add to Cart</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.button>
                            <button 
                                onClick={() => toast.info('Digital 3D Model: Cloud download link is emailed automatically upon payment verification.')}
                                className="px-6 skeuo-card bg-white h-14 text-primary flex items-center justify-center hover:text-secondary transition-colors border border-border/60 shadow-xs rounded-xl"
                                title="Digital Delivery info"
                            >
                                <Download size={20} />
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* === Reviews Section === */}
                <section className="mt-28">
                    <div className="flex items-center justify-between mb-12 px-4 border-l-4 border-secondary">
                        <div>
                            <h2 className="text-3xl font-black text-primary tracking-tight">Customer Reviews</h2>
                            <p className="text-xs font-semibold text-muted-foreground mt-1">Verified feedback from clients & 3D creators</p>
                        </div>
                        {token && (
                            <button
                                onClick={() => setShowReviewForm(!showReviewForm)}
                                className="skeuo-button bg-white text-xs uppercase font-bold tracking-wider px-6 py-2.5 border border-border/60 shadow-xs"
                            >
                                Write a Review
                            </button>
                        )}
                    </div>

                    {/* Review Form */}
                    <AnimatePresence>
                        {showReviewForm && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className="mb-12"
                            >
                                <form onSubmit={handleSubmitReview} className="skeuo-card bg-white p-8 sm:p-10 max-w-2xl border border-border/70 rounded-2xl shadow-sm">
                                    <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-6">Your Rating</h3>
                                    
                                    <div className="flex items-center gap-3 mb-8">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setUserRating(star)}
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                className="w-11 h-11 rounded-xl bg-slate-50 border border-border/60 flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                                            >
                                                <Star
                                                    size={22}
                                                    className={`${star <= (hoverRating || userRating) ? 'text-secondary fill-secondary' : 'text-primary/10 fill-primary/10'}`}
                                                />
                                            </button>
                                        ))}
                                    </div>

                                    <div className="space-y-2 mb-6">
                                        <label className="text-xs font-bold text-primary uppercase tracking-wider block">Your Comments</label>
                                        <textarea
                                            value={reviewComment}
                                            onChange={(e) => setReviewComment(e.target.value)}
                                            placeholder="Write your review about this 3D model..."
                                            rows={4}
                                            className="w-full skeuo-input p-4 text-sm font-medium resize-none border border-border/70 rounded-xl"
                                        />
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <button
                                            type="submit"
                                            disabled={submittingReview}
                                            className="skeuo-button skeuo-button-primary px-8 h-12 flex items-center gap-2.5 text-xs tracking-wider uppercase rounded-xl"
                                        >
                                            {submittingReview ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                                            Submit Review
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowReviewForm(false)}
                                            className="px-6 text-xs font-bold text-muted-foreground uppercase tracking-wider"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Reviews List */}
                    {reviews.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {reviews.map((review, i) => (
                                <motion.div
                                    key={review._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="skeuo-card bg-white p-6 border border-border/60 rounded-2xl shadow-xs"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-sm">
                                                {review.userId?.fullname?.charAt(0)?.toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-foreground">{review.userId?.fullname || 'Customer'}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <div className="flex">
                                                        {[...Array(5)].map((_, s) => (
                                                            <Star key={s} size={12} className={s < review.rating ? 'text-secondary fill-secondary' : 'text-primary/10 fill-primary/10'} />
                                                        ))}
                                                    </div>
                                                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">{formatDate(review.createdAt)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {review.comment && (
                                        <div className="p-3.5 rounded-xl bg-slate-50 border border-border/40">
                                            <p className="text-xs font-medium text-foreground/80 italic leading-relaxed">"{review.comment}"</p>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="skeuo-card bg-white p-16 sm:p-20 text-center border border-border/60 rounded-2xl shadow-xs">
                            <MessageSquare size={40} className="mx-auto text-primary/20 mb-4" />
                            <h3 className="text-xl font-bold text-primary mb-1">No Reviews Yet</h3>
                            <p className="text-muted-foreground text-sm font-medium">Be the first to share your review on this 3D model.</p>
                        </div>
                    )}
                </section>
            </main>
            <Footer />
        </div>
    )
}
