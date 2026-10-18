import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, Download, Clock, CheckCircle, XCircle, Loader2, ArrowLeft, ShoppingBag, Mail, Hash, RefreshCw, Cloud, ExternalLink } from 'lucide-react'
import api from '@/lib/api'
import Navbar from '../components/Navbar'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import Footer from '../components/Footer'

export default function OrdersPage() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [downloading, setDownloading] = useState(null)
    const [refreshing, setRefreshing] = useState(false)

    useEffect(() => {
        fetchOrders()
    }, [])

    const fetchOrders = async (showToast = false) => {
        try {
            if (showToast) setRefreshing(true)
            const res = await api.get('/orders')
            setOrders(res.data)
            if (showToast) toast.success('Orders refreshed')
        } catch (err) {
            toast.error('Failed to load orders')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const handleDownload = async (orderId) => {
        setDownloading(orderId)
        try {
            const res = await api.get(`/orders/${orderId}/downloads`, { responseType: 'blob' })
            const blob = new Blob([res.data], { type: 'application/zip' })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `Order_${orderId.slice(-8).toUpperCase()}.zip`)
            document.body.appendChild(link)
            link.click()
            link.parentNode.removeChild(link)
            window.URL.revokeObjectURL(url)
            toast.success('Download started!')
        } catch (err) {
            let errorMsg = 'Failed to get download'
            if (err.response && err.response.data && err.response.data instanceof Blob) {
                try {
                    const text = await err.response.data.text();
                    const json = JSON.parse(text);
                    if (json.message) errorMsg = json.message;
                } catch (e) { }
            } else if (err.response?.data?.message) {
                errorMsg = err.response.data.message
            }
            toast.error(errorMsg)
        } finally {
            setDownloading(null)
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

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 skeuo-card flex items-center justify-center bg-white border border-border/60 shadow-sm">
                        <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                    <p className="text-primary font-bold tracking-wider text-xs uppercase">Loading Orders...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background font-sans selection:bg-primary/20 flex flex-col">
            <Navbar />
            <div className="pt-36 pb-24 px-6 max-w-5xl mx-auto flex-grow w-full">
                <Link to="/products" className="inline-flex items-center gap-2 text-primary/60 hover:text-primary mb-8 transition-colors text-xs font-bold uppercase tracking-wider group">
                    <div className="w-8 h-8 skeuo-card bg-white flex items-center justify-center group-hover:-translate-x-1 transition-transform border border-border/50 shadow-sm">
                        <ArrowLeft size={16} />
                    </div>
                    Back to Products
                </Link>

                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-primary tracking-tight mb-2">My Orders</h1>
                        <p className="text-muted-foreground text-sm font-medium">View and download your purchased 3D railway models and files</p>
                    </div>
                    <button
                        onClick={() => fetchOrders(true)}
                        disabled={refreshing}
                        className="skeuo-button bg-white flex items-center gap-2.5 text-xs border border-border/60 shadow-sm"
                    >
                        <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
                        Refresh Orders
                    </button>
                </div>

                {orders.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="skeuo-card bg-white p-16 sm:p-20 text-center border border-border/60 shadow-sm rounded-2xl"
                    >
                        <div className="w-20 h-20 skeuo-card bg-primary/5 flex items-center justify-center mx-auto mb-6 text-primary/40 border border-primary/10 rounded-2xl">
                            <ShoppingBag size={36} />
                        </div>
                        <h2 className="text-2xl font-black text-primary mb-2">No Orders Yet</h2>
                        <p className="text-muted-foreground text-sm mb-8 font-medium">You haven't placed any orders yet. Browse our 3D railway models to get started.</p>
                        <Link
                            to="/products"
                            className="skeuo-button skeuo-button-primary px-8 py-3.5 mx-auto text-xs uppercase tracking-wider inline-flex items-center"
                        >
                            Browse Products
                        </Link>
                    </motion.div>
                ) : (
                    <div className="space-y-12">
                        {orders.map((order, index) => (
                            <motion.div
                                key={order._id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="skeuo-card bg-white border border-border/70 rounded-2xl overflow-hidden shadow-sm mb-8"
                            >
                                {/* Order Header */}
                                <div className="px-6 sm:px-8 py-5 border-b border-border/60 flex flex-wrap items-center justify-between gap-4 bg-slate-50/70">
                                    <div className="flex items-center gap-4">
                                        <div className="px-3 py-1 bg-primary text-white text-[10px] font-bold uppercase tracking-wider rounded-md">
                                            Order #{order._id.slice(-8).toUpperCase()}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                                            <Clock size={13} />
                                            {formatDate(order.createdAt)}
                                        </div>
                                    </div>
                                    <span className="text-2xl font-black text-primary">{formatCurrency(order.totalAmount)}</span>
                                </div>

                                {/* ========= PAYMENT STATUS TRACKER ========= */}
                                <div className="px-6 sm:px-8 py-8 bg-white border-b border-border/40">
                                    <div className="max-w-2xl mx-auto flex items-center justify-between gap-0 relative">
                                        {/* Connector Background Line */}
                                        <div className="absolute top-5 inset-x-8 h-1 bg-muted rounded-full -z-0" />
                                        
                                        {/* Step 1: Placed */}
                                        <div className="flex flex-col items-center gap-2 relative z-10">
                                            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm">
                                                <CheckCircle size={20} />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[11px] font-bold text-primary uppercase tracking-wider">Order Placed</p>
                                                <p className="text-[10px] text-muted-foreground">Submitted</p>
                                            </div>
                                        </div>

                                        {/* Step 2: Verification */}
                                        <div className="flex flex-col items-center gap-2 relative z-10">
                                            {order.status === 'Pending' ? (
                                                <div className="w-10 h-10 rounded-xl bg-secondary text-white flex items-center justify-center shadow-sm animate-pulse">
                                                    <Clock size={20} />
                                                </div>
                                            ) : order.status === 'Approved' ? (
                                                <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm">
                                                    <CheckCircle size={20} />
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 rounded-xl bg-destructive text-white flex items-center justify-center shadow-sm">
                                                    <XCircle size={20} />
                                                </div>
                                            )}
                                            <div className="text-center">
                                                <p className={`text-[11px] font-bold uppercase tracking-wider ${order.status === 'Pending' ? 'text-secondary' : order.status === 'Approved' ? 'text-primary' : 'text-destructive'}`}>
                                                    {order.status === 'Pending' ? 'Verifying...' : order.status === 'Approved' ? 'Verified' : 'Rejected'}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground">Admin Review</p>
                                            </div>
                                        </div>

                                        {/* Step 3: Deployment */}
                                        <div className="flex flex-col items-center gap-2 relative z-10">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${order.status === 'Approved' ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                                                <Package size={20} />
                                            </div>
                                            <div className="text-center">
                                                <p className={`text-[11px] font-bold uppercase tracking-wider ${order.status === 'Approved' ? 'text-emerald-700' : 'text-muted-foreground'}`}>Ready for Download</p>
                                                <p className="text-[10px] text-muted-foreground">3D Model Files</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="px-6 sm:px-8 py-6 space-y-3 bg-white">
                                    {order.items.map((item, i) => (
                                        <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50/80 border border-border/50">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-xl bg-white p-1 overflow-hidden shrink-0 border border-border/40 shadow-xs">
                                                    {item.image ? (
                                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-muted/20 rounded-lg">
                                                            <Package size={24} className="text-primary/20" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="text-base font-bold text-foreground leading-snug">{item.name}</h4>
                                                    <p className="text-xs text-muted-foreground font-medium mt-0.5">3D Model Asset • Qty: {item.quantity}</p>
                                                    <div className="text-sm font-bold text-primary sm:hidden mt-1">{(item.price && /^\D/.test(item.price)) ? item.price : `₹${item.price || 0}`}</div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 self-end sm:self-center">
                                                <div className="text-base font-bold text-primary hidden sm:block">{(item.price && /^\D/.test(item.price)) ? item.price : `₹${item.price || 0}`}</div>

                                                {order.status === 'Approved' ? (
                                                    item.driveUrl ? (
                                                        <div className="flex flex-col items-end gap-1">
                                                            <a
                                                                href={item.driveUrl}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="skeuo-button skeuo-button-primary px-4 py-2 flex items-center gap-2 text-xs font-bold rounded-xl shadow-xs"
                                                                title="Open 3D Model files in Google Drive / OneDrive"
                                                            >
                                                                <Cloud size={15} />
                                                                Download 3D Files
                                                                <ExternalLink size={12} />
                                                            </a>
                                                            <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[200px]" title={item.driveUrl}>
                                                                {item.driveUrl}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 text-xs font-medium flex items-center gap-1.5">
                                                            <Clock size={13} />
                                                            Cloud link being attached by admin
                                                        </div>
                                                    )
                                                ) : null}
                                            </div>
                                        </div>
                                    ))}

                                    {order.status === 'Approved' && (
                                        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-xs font-medium flex items-center gap-2.5 mt-4">
                                            <CheckCircle size={18} className="text-emerald-600 shrink-0" />
                                            <span>
                                                Payment verified! Click <strong>"Download 3D Files"</strong> above to access your model on Google Drive / OneDrive. (Also dispatched to <strong>{order.email}</strong>).
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Order Footer */}
                                <div className="px-6 sm:px-8 py-4 bg-slate-50/70 border-t border-border/60 flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        {order.transactionId && (
                                            <div className="flex items-center gap-2 text-xs font-mono font-medium text-muted-foreground">
                                                <Hash size={13} className="text-primary" />
                                                <span>TX: <strong className="text-foreground">{order.transactionId}</strong></span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Mail size={13} className="text-primary" />
                                            <span>{order.email}</span>
                                        </div>
                                    </div>

                                    {order.status === 'Approved' && (
                                        <button
                                            onClick={() => handleDownload(order._id)}
                                            disabled={downloading === order._id}
                                            className="skeuo-button bg-white px-5 py-2.5 flex items-center gap-2 text-xs font-bold border border-border/60 shadow-xs"
                                            title="Download all media bundle as ZIP"
                                        >
                                            {downloading === order._id ? (
                                                <Loader2 size={15} className="animate-spin" />
                                            ) : (
                                                <Download size={15} />
                                            )}
                                            Download ZIP Package
                                        </button>
                                    )}

                                    {order.status === 'Pending' && (
                                        <div className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 text-xs font-bold flex items-center gap-2">
                                            <Clock size={15} className="animate-pulse" />
                                            Verification Pending
                                        </div>
                                    )}

                                    {order.status === 'Rejected' && (
                                        <div className="px-4 py-2 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold flex items-center gap-2">
                                            <XCircle size={15} />
                                            Verification Failed
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
            <Footer />
        </div>
    )
}
