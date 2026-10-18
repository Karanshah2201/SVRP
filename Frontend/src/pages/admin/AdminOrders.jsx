import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Clock, Loader2, Package, Hash, Mail, Phone, Search, Filter, Cloud, ExternalLink, Send, Edit2, X, Check } from 'lucide-react'
import api from '@/lib/api'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

export default function AdminOrders() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(null)
    const [resending, setResending] = useState(null)
    const [editingLink, setEditingLink] = useState(null) // { orderId, itemIndex, currentUrl, productName }
    const [newDriveUrl, setNewDriveUrl] = useState('')
    const [savingLink, setSavingLink] = useState(false)
    const [filter, setFilter] = useState('all')
    const [search, setSearch] = useState('')
    const token = localStorage.getItem('adminToken')

    useEffect(() => {
        fetchOrders()
    }, [])

    const fetchOrders = async () => {
        try {
            const res = await api.get('/admin/orders', {
                headers: { Authorization: `Bearer ${token}` }
            })
            setOrders(res.data)
        } catch (err) {
            toast.error('Failed to load orders')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateOrder = async (orderId, status, adminNote = '') => {
        setUpdating(orderId)
        try {
            const res = await api.put(`/admin/orders/${orderId}`, { status, adminNote }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            toast.success(res.data?.message || `Order ${status.toLowerCase()} successfully`)
            fetchOrders()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update order')
        } finally {
            setUpdating(null)
        }
    }

    const handleResendEmail = async (orderId) => {
        setResending(orderId)
        try {
            const res = await api.post(`/admin/orders/${orderId}/resend-email`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            })
            toast.success(res.data?.message || 'Access links email resent successfully!')
            fetchOrders()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to resend email')
        } finally {
            setResending(null)
        }
    }

    const handleSaveDriveUrl = async (e) => {
        e.preventDefault()
        if (!editingLink) return
        setSavingLink(true)
        try {
            await api.put(`/admin/orders/${editingLink.orderId}/items/${editingLink.itemIndex}/drive-url`, {
                driveUrl: newDriveUrl.trim()
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            toast.success('Drive link updated for this item!')
            setEditingLink(null)
            fetchOrders()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update Drive link')
        } finally {
            setSavingLink(false)
        }
    }

    const getStatusConfig = (status) => {
        switch (status) {
            case 'Approved':
                return { color: 'text-[#10B981]', bg: 'bg-[#10B981]/10', border: 'border-[#10B981]/20', icon: CheckCircle }
            case 'Rejected':
                return { color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', icon: XCircle }
            default:
                return { color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10', border: 'border-[#F59E0B]/20', icon: Clock }
        }
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount)
    }

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        })
    }

    const filteredOrders = orders.filter(order => {
        const matchesFilter = filter === 'all' || order.status === filter
        const matchesSearch = !search ||
            order.transactionId?.toLowerCase().includes(search.toLowerCase()) ||
            order.email?.toLowerCase().includes(search.toLowerCase()) ||
            order.mobile?.includes(search) ||
            order._id.toLowerCase().includes(search.toLowerCase())
        return matchesFilter && matchesSearch
    })

    const pendingCount = orders.filter(o => o.status === 'Pending').length

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-2xl font-bold text-foreground">Orders</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {pendingCount > 0 ? (
                            <span className="text-amber-600 font-semibold">{pendingCount} orders pending payment verification</span>
                        ) : (
                            'Verify payments and manage customer 3D model deliveries'
                        )}
                    </p>
                </motion.div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-border text-foreground shadow-xs">
                        Total: {orders.length} orders
                    </span>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="relative flex-1 min-w-[250px] max-w-md group">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by UTR, email, or mobile..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-border text-xs font-medium text-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground shadow-xs"
                    />
                </div>
                <div className="flex items-center gap-1.5">
                    {['all', 'Pending', 'Approved', 'Rejected'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${filter === f
                                ? 'bg-primary text-white border-primary shadow-xs'
                                : 'bg-white text-muted-foreground border-border hover:bg-muted/60'
                                }`}
                        >
                            {f === 'all' ? 'All' : f}
                            {f === 'Pending' && pendingCount > 0 && (
                                <span className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${filter === f ? 'bg-white/20 text-white' : 'bg-amber-500/10 text-amber-600'}`}>{pendingCount}</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-border border-dashed">
                    <Package size={44} className="text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium text-sm">No orders found.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredOrders.map((order, index) => {
                        const statusConfig = getStatusConfig(order.status)
                        const StatusIcon = statusConfig.icon

                        return (
                            <motion.div
                                key={order._id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.02 }}
                                className={`bg-white rounded-2xl border shadow-xs overflow-hidden transition-all hover:shadow-sm ${order.status === 'Pending' ? 'border-amber-400/40 ring-1 ring-amber-400/10' : 'border-border/80'
                                    }`}
                            >
                                {/* Order Header */}
                                <div className="px-5 py-3.5 border-b border-border/60 flex flex-wrap items-center justify-between gap-3 bg-muted/25">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-mono font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">#{order._id.slice(-8).toUpperCase()}</span>
                                        <div className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${statusConfig.bg} ${statusConfig.color} border ${statusConfig.border}`}>
                                            <StatusIcon size={12} strokeWidth={2.5} />
                                            {order.status}
                                        </div>
                                    </div>
                                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                        <Clock size={12} />
                                        {formatDate(order.createdAt)}
                                    </span>
                                </div>

                                {/* Order Body */}
                                <div className="px-5 py-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
                                        {/* Customer Info */}
                                        <div className="space-y-2.5">
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                                <Mail size={12} /> Customer Details
                                            </p>
                                            <div className="space-y-2 text-sm bg-muted/30 p-4 rounded-xl border border-border">
                                                <div className="flex items-center gap-3 text-foreground font-medium">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
                                                        {order.email.charAt(0)}
                                                    </div>
                                                    {order.email}
                                                </div>
                                                <div className="pl-11 space-y-1">
                                                    <p className="flex items-center gap-2 text-muted-foreground text-xs">
                                                        <Phone size={12} /> {order.mobile}
                                                    </p>
                                                    {order.transactionId && (
                                                        <p className="flex items-center gap-2 text-muted-foreground text-xs">
                                                            <Hash size={12} /> {order.paymentMethod === 'stripe' ? 'Transaction ID' : 'Transaction ID'}: <span className="font-mono font-bold text-primary bg-primary/5 border border-primary/15 px-1.5 py-0.5 rounded">{order.transactionId}</span>
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Items */}
                                        <div className="space-y-3">
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                                <Package size={12} /> Order Items ({order.items.length})
                                            </p>
                                            <div className="space-y-3">
                                                {order.items.map((item, i) => (
                                                    <div key={i} className="p-3.5 bg-card border border-border rounded-xl hover:border-primary/40 transition-all shadow-xs">
                                                        <div className="flex items-center justify-between text-sm">
                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                <div className="w-9 h-9 rounded-lg bg-muted border border-border flex-shrink-0 flex items-center justify-center overflow-hidden">
                                                                    {item.image ? (
                                                                        <img src={item.image} alt="" className="w-full h-full object-cover rounded-lg" />
                                                                    ) : (
                                                                        <Package size={14} className="text-muted-foreground/40" />
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <span className="text-foreground font-bold block truncate max-w-[220px]">{item.name}</span>
                                                                    <span className="text-muted-foreground text-xs font-medium">Quantity: {item.quantity}</span>
                                                                </div>
                                                            </div>
                                                            <span className="font-bold text-primary ml-4 text-sm">{(item.price && /^\D/.test(item.price)) ? item.price : `₹${item.price || 0}`}</span>
                                                        </div>

                                                        {/* Attached Drive / Cloud Link section */}
                                                        <div className="mt-2.5 pt-2 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs">
                                                            <div className="flex items-center gap-1.5 overflow-hidden max-w-[75%]">
                                                                <Cloud size={13} className={item.driveUrl ? "text-primary shrink-0" : "text-muted-foreground shrink-0"} />
                                                                <span className="font-semibold text-muted-foreground shrink-0">Cloud Link:</span>
                                                                {item.driveUrl ? (
                                                                    <a 
                                                                        href={item.driveUrl} 
                                                                        target="_blank" 
                                                                        rel="noreferrer" 
                                                                        className="text-primary hover:underline font-mono font-medium truncate inline-flex items-center gap-1"
                                                                        title={item.driveUrl}
                                                                    >
                                                                        <span className="truncate max-w-[200px]">{item.driveUrl}</span>
                                                                        <ExternalLink size={10} className="shrink-0" />
                                                                    </a>
                                                                ) : (
                                                                    <span className="text-amber-600 font-medium italic">No cloud link attached</span>
                                                                )}
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setEditingLink({ orderId: order._id, itemIndex: i, currentUrl: item.driveUrl || '', productName: item.name })
                                                                    setNewDriveUrl(item.driveUrl || '')
                                                                }}
                                                                className="text-[11px] font-bold text-primary hover:bg-primary/10 bg-primary/5 border border-primary/20 px-2 py-0.5 rounded-md transition-colors inline-flex items-center gap-1"
                                                            >
                                                                <Edit2 size={10} /> {item.driveUrl ? 'Edit Link' : 'Attach Link'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer with actions */}
                                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border">
                                        <div className="flex items-center gap-2 bg-muted/40 px-4 py-2 rounded-xl border border-border">
                                            <span className="text-xs font-medium text-muted-foreground">Total Amount:</span>
                                            <span className="text-base sm:text-lg font-bold text-foreground">{formatCurrency(order.totalAmount)}</span>
                                        </div>

                                        {order.status === 'Pending' && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleUpdateOrder(order._id, 'Rejected', 'Payment not received')}
                                                    disabled={updating === order._id}
                                                    className="flex items-center gap-1.5 px-4 py-2 bg-destructive/10 text-destructive font-semibold rounded-xl text-xs hover:bg-destructive/20 transition-colors disabled:opacity-50 border border-destructive/20"
                                                >
                                                    <XCircle size={14} />
                                                    Reject
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateOrder(order._id, 'Approved')}
                                                    disabled={updating === order._id}
                                                    className="flex items-center gap-1.5 px-5 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-xs hover:bg-primary/90 transition-all disabled:opacity-50 shadow-xs"
                                                    title="Verify payment and email Google Drive/OneDrive links to customer"
                                                >
                                                    {updating === order._id ? (
                                                        <Loader2 size={14} className="animate-spin" />
                                                    ) : (
                                                        <CheckCircle size={14} />
                                                    )}
                                                    Verify & Send Links
                                                </button>
                                            </div>
                                        )}

                                        {order.status === 'Approved' && (
                                            <div className="flex flex-wrap items-center gap-2">
                                                {order.emailSent ? (
                                                    <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                                                        <CheckCircle size={14} /> Links Emailed to Customer
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-amber-600 font-semibold flex items-center gap-1.5 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                                                        <Clock size={14} /> {order.emailStatus || 'Email Pending'}
                                                    </span>
                                                )}

                                                <button
                                                    onClick={() => handleResendEmail(order._id)}
                                                    disabled={resending === order._id}
                                                    className="text-xs font-semibold text-primary hover:bg-primary/10 bg-primary/5 border border-primary/20 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50"
                                                    title="Resend 3D model download links email to customer"
                                                >
                                                    {resending === order._id ? (
                                                        <Loader2 size={13} className="animate-spin" />
                                                    ) : (
                                                        <Send size={13} />
                                                    )}
                                                    Resend Email
                                                </button>
                                            </div>
                                        )}

                                        {order.status === 'Rejected' && order.adminNote && (
                                            <span className="text-xs text-destructive font-medium italic bg-destructive/10 px-3 py-1.5 rounded-lg border border-destructive/20">
                                                Note: {order.adminNote}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            )}

            {/* Modal to Edit/Attach Cloud Link for specific order item */}
            <AnimatePresence>
                {editingLink && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4"
                        onClick={() => setEditingLink(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 12 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white border border-border rounded-2xl p-6 w-full max-w-md shadow-xl"
                        >
                            <div className="flex items-center justify-between mb-4 border-b border-border/80 pb-3">
                                <div>
                                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                        <Cloud size={16} className="text-primary" /> Attach Cloud Download Link
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">{editingLink.productName}</p>
                                </div>
                                <button onClick={() => setEditingLink(null)} className="text-muted-foreground hover:text-foreground p-1 transition-colors"><X size={16} /></button>
                            </div>

                            <form onSubmit={handleSaveDriveUrl} className="space-y-3.5">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-foreground">Google Drive / OneDrive Link</label>
                                    <input
                                        type="url"
                                        value={newDriveUrl}
                                        onChange={(e) => setNewDriveUrl(e.target.value)}
                                        placeholder="https://drive.google.com/drive/folders/... or https://1drv.ms/..."
                                        className="w-full h-10 px-3 bg-white border border-border rounded-xl text-foreground text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        required
                                    />
                                    <p className="text-[10px] text-muted-foreground">
                                        Enter the link where the customer can download the 3D model files.
                                    </p>
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                                    <button
                                        type="button"
                                        onClick={() => setEditingLink(null)}
                                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={savingLink}
                                        className="px-4 py-1.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 shadow-xs"
                                    >
                                        {savingLink ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                                        Save Link
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
