import { useState, useEffect } from 'react'
import { Star, Trash2, MessageSquare, User, Clock, Package, Search, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/lib/api'
import { toast } from 'sonner'

export default function AdminReviews() {
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [deleting, setDeleting] = useState(null)
    const token = localStorage.getItem('adminToken')

    useEffect(() => {
        fetchReviews()
    }, [])

    const fetchReviews = async () => {
        setLoading(true)
        try {
            const res = await api.get('/admin/reviews', {
                headers: { Authorization: `Bearer ${token}` }
            })
            setReviews(res.data)
        } catch (error) {
            toast.error('Failed to fetch reviews')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this review?')) return
        setDeleting(id)
        try {
            await api.delete(`/admin/reviews/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            toast.success('Review deleted')
            setReviews(prev => prev.filter(r => r._id !== id))
        } catch (error) {
            toast.error('Failed to delete review')
        } finally {
            setDeleting(null)
        }
    }

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        })
    }

    const filtered = searchQuery
        ? reviews.filter(r =>
            r.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.userId?.fullname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.userId?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.comment?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : reviews

    // Group stats
    const avgRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0

    const ratingDist = [5, 4, 3, 2, 1].map(star => ({
        star,
        count: reviews.filter(r => r.rating === star).length,
        pct: reviews.length > 0 ? (reviews.filter(r => r.rating === star).length / reviews.length * 100).toFixed(0) : 0
    }))

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-2xl font-bold text-foreground">Reviews</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">User feedback, ratings, and testimonials</p>
                </motion.div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-border text-foreground shadow-xs">
                        Total: {reviews.length} reviews
                    </span>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-card rounded-2xl border border-border p-6 shadow-xs hover:shadow-sm transition-all"
                >
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Total Reviews</p>
                    <p className="text-4xl font-extrabold text-foreground">{reviews.length}</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-card rounded-2xl border border-border p-6 shadow-xs hover:shadow-sm transition-all"
                >
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Average Rating</p>
                    <div className="flex items-center gap-4">
                        <p className="text-4xl font-extrabold text-foreground">{avgRating}</p>
                        <div className="flex flex-col gap-1">
                            <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={18} className={i < Math.round(avgRating) ? 'text-amber-500 fill-amber-500' : 'text-muted fill-muted'} />
                                ))}
                            </div>
                            <span className="text-xs text-muted-foreground font-medium">Out of 5 stars</span>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-card rounded-2xl border border-border p-6 shadow-xs hover:shadow-sm transition-all"
                >
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Distribution</p>
                    <div className="space-y-2">
                        {ratingDist.map(d => (
                            <div key={d.star} className="flex items-center gap-3 text-xs">
                                <span className="text-muted-foreground w-3 font-bold">{d.star}</span>
                                <Star size={12} className="text-amber-500 fill-amber-500" />
                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden border border-border/50">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${d.pct}%` }}
                                        transition={{ duration: 1, delay: 0.5 }}
                                        className="h-full bg-primary rounded-full"
                                    />
                                </div>
                                <span className="text-muted-foreground w-6 text-right font-medium">{d.count}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Search */}
            <div className="relative max-w-md group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search reviews by user, product, or content..."
                    className="w-full pl-11 pr-4 py-2.5 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium shadow-xs"
                />
            </div>

            {/* Reviews List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-primary" size={32} />
                </div>
            ) : filtered.length > 0 ? (
                <div className="space-y-4">
                    <AnimatePresence>
                        {filtered.map((review, index) => (
                            <motion.div
                                key={review._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-card rounded-2xl border border-border p-5 sm:p-6 hover:shadow-xs hover:border-primary/40 transition-all group"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4 sm:gap-5 flex-1">
                                        {/* User Avatar */}
                                        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-base shrink-0 border border-primary/20">
                                            {review.userId?.fullname?.charAt(0)?.toUpperCase() || <User size={18} />}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 flex-wrap mb-1.5">
                                                <p className="font-bold text-foreground text-sm sm:text-base">{review.userId?.fullname || 'Unknown User'}</p>
                                                <span className="text-muted-foreground text-xs font-medium bg-muted px-2 py-0.5 rounded-md border border-border/60">{review.userId?.email}</span>
                                            </div>

                                            {/* Product + Rating */}
                                            <div className="flex items-center gap-3 sm:gap-4 mb-3 flex-wrap">
                                                <div className="flex items-center gap-2 text-xs bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/15">
                                                    <Package size={14} className="text-primary" />
                                                    <span className="text-primary font-bold">{review.productName}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {[...Array(5)].map((_, s) => (
                                                        <Star key={s} size={14} className={s < review.rating ? 'text-amber-500 fill-amber-500' : 'text-muted fill-muted'} />
                                                    ))}
                                                    <span className="text-xs text-muted-foreground ml-1 font-bold">{review.rating}.0</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium ml-auto">
                                                    <Clock size={12} />
                                                    {formatDate(review.createdAt)}
                                                </div>
                                            </div>

                                            {/* Comment */}
                                            <div className="relative">
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/30 rounded-full"></div>
                                                <p className="pl-3.5 text-foreground/80 text-sm leading-relaxed italic">
                                                    "{review.comment || 'No comment provided'}"
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Delete */}
                                    <button
                                        onClick={() => handleDelete(review._id)}
                                        disabled={deleting === review._id}
                                        className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 ml-4 border border-transparent hover:border-destructive/20"
                                        title="Delete review"
                                    >
                                        {deleting === review._id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="text-center py-20 bg-card rounded-2xl border border-border border-dashed">
                    <MessageSquare size={44} className="mx-auto text-muted-foreground/40 mb-3" />
                    <p className="text-muted-foreground font-medium text-base">{searchQuery ? 'No reviews matching your search' : 'No reviews yet'}</p>
                </div>
            )}
        </div>
    )
}
