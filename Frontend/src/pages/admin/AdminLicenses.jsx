import { useEffect, useState } from 'react'
import { 
    Key, Search, Filter, ShieldAlert, CheckCircle2, XCircle, 
    Clock, RefreshCw, Loader2, RotateCcw, Calendar, AlertTriangle, 
    Mail, ExternalLink, HardDrive, Cloud, Play, ShieldCheck, Lock, Pencil
} from 'lucide-react'
import api from '@/lib/api'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

export default function AdminLicenses() {
    const [activeTab, setActiveTab] = useState('licenses') // 'licenses' | 'cloudGrants'
    const [licenses, setLicenses] = useState([])
    const [stats, setStats] = useState({ active: 0, expired: 0, revoked: 0, limitReached: 0, totalAll: 0 })
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [actionModal, setActionModal] = useState(null) // { type: 'revoke'|'reset'|'extend', license }
    const [revokeReason, setRevokeReason] = useState('')
    const [extendDays, setExtendDays] = useState(30)
    const [processing, setProcessing] = useState(false)

    // Cloud 48h Grants State
    const [cloudGrants, setCloudGrants] = useState([])
    const [cloudStats, setCloudStats] = useState({ total: 0, active: 0, expired: 0, revoked: 0, failed: 0 })
    const [cloudLoading, setCloudLoading] = useState(false)
    const [cloudStatusFilter, setCloudStatusFilter] = useState('all')
    const [runningScheduler, setRunningScheduler] = useState(false)

    const token = localStorage.getItem('adminToken')

    useEffect(() => {
        if (activeTab === 'licenses') {
            fetchLicenses()
        } else {
            fetchCloudGrants()
        }
    }, [activeTab, statusFilter, cloudStatusFilter])

    const fetchLicenses = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (statusFilter !== 'all') params.append('status', statusFilter)
            if (search.trim()) params.append('search', search.trim())

            const res = await api.get(`/admin/licenses?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            })

            setLicenses(res.data.licenses || [])
            if (res.data.stats) setStats(res.data.stats)
        } catch (err) {
            toast.error('Failed to load licenses')
        } finally {
            setLoading(false)
        }
    }

    const fetchCloudGrants = async () => {
        try {
            setCloudLoading(true)
            const params = new URLSearchParams()
            if (cloudStatusFilter !== 'all') params.append('status', cloudStatusFilter)
            if (search.trim()) params.append('search', search.trim())

            const res = await api.get(`/access/admin/grants?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            })

            setCloudGrants(res.data.grants || [])
            if (res.data.stats) setCloudStats(res.data.stats)
        } catch (err) {
            toast.error('Failed to load cloud access grants')
        } finally {
            setCloudLoading(false)
        }
    }

    const handleRevokeGrant = async (grantId) => {
        if (!window.confirm('Are you sure you want to revoke this customer’s cloud access now? This deletes only the specific customer sharing permission and never touches the original file.')) {
            return
        }
        setProcessing(true)
        try {
            const res = await api.post(`/access/admin/grants/${grantId}/revoke`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            })
            toast.success(res.data.message || 'Access revoked successfully')
            fetchCloudGrants()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to revoke access')
        } finally {
            setProcessing(false)
        }
    }

    const handleRetryGrant = async (grantId) => {
        setProcessing(true)
        try {
            const res = await api.post(`/access/admin/grants/${grantId}/retry`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            })
            toast.success(res.data.message || 'Revocation retry successful')
            fetchCloudGrants()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Revocation retry failed')
        } finally {
            setProcessing(false)
        }
    }

    const handleRunScheduler = async () => {
        setRunningScheduler(true)
        try {
            const res = await api.post('/access/admin/run-scheduler', {}, {
                headers: { Authorization: `Bearer ${token}` }
            })
            toast.success(`Scheduler sweep complete. Processed: ${res.data.processed}, Revoked: ${res.data.revoked}`)
            fetchCloudGrants()
        } catch (err) {
            toast.error('Scheduler sweep failed')
        } finally {
            setRunningScheduler(false)
        }
    }

    const handleSearchSubmit = (e) => {
        e.preventDefault()
        fetchLicenses()
    }

    const handleRevoke = async () => {
        if (!actionModal?.license) return
        setProcessing(true)
        try {
            const res = await api.post(`/admin/licenses/${actionModal.license.licenseKey}/revoke`, {
                reason: revokeReason || 'Administrative revocation'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            toast.success(res.data.message || 'License revoked successfully')
            setActionModal(null)
            setRevokeReason('')
            fetchLicenses()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to revoke license')
        } finally {
            setProcessing(false)
        }
    }

    const handleRestore = async (licenseKey) => {
        setProcessing(true)
        try {
            const res = await api.post(`/admin/licenses/${licenseKey}/restore`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            })
            toast.success(res.data.message || 'License restored to Active')
            fetchLicenses()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to restore license')
        } finally {
            setProcessing(false)
        }
    }

    const handleResetDownloads = async () => {
        if (!actionModal?.license) return
        setProcessing(true)
        try {
            const res = await api.put(`/admin/licenses/${actionModal.license.licenseKey}/reset-downloads`, {
                downloadCount: 0
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            toast.success(res.data.message || 'Download counter reset to 0')
            setActionModal(null)
            fetchLicenses()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reset downloads')
        } finally {
            setProcessing(false)
        }
    }

    const handleExtendExpiry = async () => {
        if (!actionModal?.license) return
        setProcessing(true)
        try {
            const res = await api.put(`/admin/licenses/${actionModal.license.licenseKey}/extend-expiry`, {
                days: extendDays
            }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            toast.success(res.data.message || 'Expiry date extended')
            setActionModal(null)
            fetchLicenses()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to extend expiry')
        } finally {
            setProcessing(false)
        }
    }

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Active':
                return { label: 'Active', bg: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20', icon: CheckCircle2 }
            case 'LimitReached':
                return { label: 'Limit Reached', bg: 'bg-amber-500/10 text-amber-700 border-amber-500/20', icon: AlertTriangle }
            case 'Expired':
                return { label: 'Expired', bg: 'bg-slate-500/10 text-slate-700 border-slate-500/20', icon: Clock }
            case 'Revoked':
                return { label: 'Revoked', bg: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle }
            default:
                return { label: status, bg: 'bg-muted text-muted-foreground border-border', icon: CheckCircle2 }
        }
    }

    const getCloudStatusBadge = (status) => {
        switch (status) {
            case 'active':
                return { label: 'Active (48h Access)', bg: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20', icon: ShieldCheck }
            case 'expired':
                return { label: 'Expired (Auto-Revoked)', bg: 'bg-slate-500/10 text-slate-700 border-slate-500/20', icon: Clock }
            case 'revoked':
                return { label: 'Revoked (Permission Deleted)', bg: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle }
            case 'failed':
                return { label: 'Revocation Failed', bg: 'bg-rose-500/20 text-rose-700 border-rose-500/30', icon: AlertTriangle }
            case 'revoking':
                return { label: 'Revoking...', bg: 'bg-amber-500/10 text-amber-700 border-amber-500/20', icon: Loader2 }
            default:
                return { label: status, bg: 'bg-muted text-muted-foreground border-border', icon: CheckCircle2 }
        }
    }

    return (
        <div className="space-y-6 font-sans">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                        3D Asset Access & Cloud Permissions
                    </h1>
                    <p className="text-muted-foreground text-xs font-medium mt-1">
                        Govern 48-hour Google Drive / OneDrive sharing revocations and limited-download asset licenses.
                    </p>
                </div>
                <div className="flex items-center gap-2 self-start">
                    {activeTab === 'cloudGrants' && (
                        <button
                            onClick={handleRunScheduler}
                            disabled={runningScheduler}
                            className="skeuo-button bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
                        >
                            {runningScheduler ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                            Run Scheduler Sweep
                        </button>
                    )}
                    <button
                        onClick={() => activeTab === 'licenses' ? fetchLicenses() : fetchCloudGrants()}
                        className="skeuo-button bg-card border border-border px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs"
                    >
                        <RefreshCw size={13} /> Refresh
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-border/80 gap-6">
                <button
                    onClick={() => setActiveTab('licenses')}
                    className={`pb-3 text-xs font-bold transition-all flex items-center gap-2 ${
                        activeTab === 'licenses'
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    <Key size={14} /> Download Licenses
                </button>
                <button
                    onClick={() => setActiveTab('cloudGrants')}
                    className={`pb-3 text-xs font-bold transition-all flex items-center gap-2 ${
                        activeTab === 'cloudGrants'
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    <Cloud size={14} /> 48-Hour Cloud Access Grants
                    {cloudStats.active > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-700 border border-emerald-500/30">
                            {cloudStats.active} Active
                        </span>
                    )}
                </button>
            </div>

            {activeTab === 'cloudGrants' ? (
                <>
                    {/* Metric Cards for Cloud Grants */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-xs">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Grants</span>
                            <p className="text-2xl font-black text-foreground mt-1">{cloudStats.total || 0}</p>
                        </div>
                        <div className="bg-card border border-emerald-500/20 rounded-2xl p-4 shadow-xs bg-emerald-500/5">
                            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Active (48h)</span>
                            <p className="text-2xl font-black text-emerald-800 mt-1">{cloudStats.active || 0}</p>
                        </div>
                        <div className="bg-card border border-slate-500/20 rounded-2xl p-4 shadow-xs bg-slate-500/5">
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Expired</span>
                            <p className="text-2xl font-black text-slate-700 mt-1">{cloudStats.expired || 0}</p>
                        </div>
                        <div className="bg-card border border-destructive/20 rounded-2xl p-4 shadow-xs bg-destructive/5">
                            <span className="text-[11px] font-bold text-destructive uppercase tracking-wider">Revoked</span>
                            <p className="text-2xl font-black text-destructive mt-1">{cloudStats.revoked || 0}</p>
                        </div>
                        <div className="bg-card border border-rose-500/20 rounded-2xl p-4 shadow-xs bg-rose-500/5 col-span-2 lg:col-span-1">
                            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Failed</span>
                            <p className="text-2xl font-black text-rose-700 mt-1">{cloudStats.failed || 0}</p>
                        </div>
                    </div>

                    {/* Filter Bar for Cloud Grants */}
                    <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                        <form onSubmit={handleSearchSubmit} className="relative flex-grow max-w-md">
                            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search by customer email, order ID, product..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-muted/50 border border-border/80 rounded-xl pl-10 pr-4 py-2 text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-primary"
                            />
                        </form>

                        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1 shrink-0">
                                <Filter size={12} /> Status:
                            </span>
                            {['all', 'active', 'expired', 'revoked', 'failed'].map((st) => (
                                <button
                                    key={st}
                                    onClick={() => setCloudStatusFilter(st)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 capitalize ${
                                        cloudStatusFilter === st
                                            ? 'bg-primary text-white shadow-xs'
                                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                    }`}
                                >
                                    {st}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Cloud Grants Table */}
                    <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xs">
                        {cloudLoading ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-3">
                                <Loader2 className="animate-spin text-primary" size={28} />
                                <span className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-widest">Loading cloud access grants...</span>
                            </div>
                        ) : cloudGrants.length === 0 ? (
                            <div className="py-16 text-center text-muted-foreground text-xs font-medium">
                                No cloud access records found matching the filter.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/40 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                            <th className="py-3.5 px-4">Order ID & Product</th>
                                            <th className="py-3.5 px-4">Customer Email</th>
                                            <th className="py-3.5 px-4">Storage Provider</th>
                                            <th className="py-3.5 px-4">Expiry & Remaining</th>
                                            <th className="py-3.5 px-4">Status</th>
                                            <th className="py-3.5 px-4 text-right">Non-Destructive Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/60 font-medium">
                                        {cloudGrants.map((grant) => {
                                            const badge = getCloudStatusBadge(grant.status)
                                            const StatusIcon = badge.icon
                                            const isExpired = new Date() > new Date(grant.expiresAt)
                                            const remainingMs = new Date(grant.expiresAt) - new Date()
                                            const remainingHours = Math.max(0, Math.floor(remainingMs / (1000 * 60 * 60)))

                                            return (
                                                <tr key={grant._id} className="hover:bg-muted/20 transition-colors">
                                                    <td className="py-3.5 px-4">
                                                        <div className="font-mono font-bold text-foreground">
                                                            {grant.orderId?.orderId || grant.orderId?._id || grant.orderId || 'Order'}
                                                        </div>
                                                        <div className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                                                            {grant.productId?.name || grant.productId || '3D Model'}
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <div className="flex items-center gap-1.5 text-foreground">
                                                            <Mail size={12} className="text-muted-foreground shrink-0" />
                                                            <span>{grant.customerEmail}</span>
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground font-mono">
                                                            Perm ID: {grant.permissionId ? `${grant.permissionId.substring(0, 14)}...` : 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                                            grant.storageProvider === 'google_drive'
                                                                ? 'bg-blue-500/10 text-blue-700 border-blue-500/20'
                                                                : 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20'
                                                        }`}>
                                                            <HardDrive size={10} />
                                                            {grant.storageProvider === 'google_drive' ? 'Google Drive' : 'OneDrive'}
                                                        </span>
                                                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate max-w-[130px]" title={grant.storageFileId}>
                                                            ID: {grant.storageFileId}
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <div className={isExpired ? 'text-destructive font-bold' : 'text-foreground font-bold'}>
                                                            {new Date(grant.expiresAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground">
                                                            {grant.status === 'active' ? (
                                                                <span className="text-emerald-700 font-bold">⏱️ {remainingHours}h remaining</span>
                                                            ) : grant.revokedAt ? (
                                                                `Revoked: ${new Date(grant.revokedAt).toLocaleDateString('en-IN')}`
                                                            ) : (
                                                                `Granted: ${new Date(grant.accessGrantedAt).toLocaleDateString('en-IN')}`
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                                                            <StatusIcon size={11} /> {badge.label}
                                                        </span>
                                                        {grant.lastRevocationError && (
                                                            <div className="text-[9px] text-rose-600 truncate max-w-[150px] mt-0.5" title={grant.lastRevocationError}>
                                                                Err: {grant.lastRevocationError}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {grant.status === 'active' && (
                                                                <button
                                                                    onClick={() => handleRevokeGrant(grant._id)}
                                                                    disabled={processing}
                                                                    className="px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 text-[11px] font-bold border border-destructive/20 transition-colors"
                                                                >
                                                                    Revoke Access
                                                                </button>
                                                            )}
                                                            {grant.status === 'failed' && (
                                                                <button
                                                                    onClick={() => handleRetryGrant(grant._id)}
                                                                    disabled={processing}
                                                                    className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 text-[11px] font-bold border border-amber-500/20 transition-colors"
                                                                >
                                                                    Retry Revocation
                                                                </button>
                                                            )}
                                                            {(grant.status === 'expired' || grant.status === 'revoked') && (
                                                                <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                                                                    <Lock size={11} /> Access Closed
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <>
                    {/* Metric Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-xs">
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Issued</span>
                            <p className="text-2xl font-black text-foreground mt-1">{stats.totalAll || 0}</p>
                        </div>
                        <div className="bg-card border border-emerald-500/20 rounded-2xl p-4 shadow-xs bg-emerald-500/5">
                            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Active</span>
                            <p className="text-2xl font-black text-emerald-800 mt-1">{stats.active || 0}</p>
                        </div>
                        <div className="bg-card border border-amber-500/20 rounded-2xl p-4 shadow-xs bg-amber-500/5">
                            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Limit Reached</span>
                            <p className="text-2xl font-black text-amber-800 mt-1">{stats.limitReached || 0}</p>
                        </div>
                        <div className="bg-card border border-slate-500/20 rounded-2xl p-4 shadow-xs bg-slate-500/5">
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Expired</span>
                            <p className="text-2xl font-black text-slate-700 mt-1">{stats.expired || 0}</p>
                        </div>
                        <div className="bg-card border border-destructive/20 rounded-2xl p-4 shadow-xs bg-destructive/5 col-span-2 lg:col-span-1">
                            <span className="text-[11px] font-bold text-destructive uppercase tracking-wider">Revoked</span>
                            <p className="text-2xl font-black text-destructive mt-1">{stats.revoked || 0}</p>
                        </div>
                    </div>

                    {/* Search & Filter Bar */}
                    <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                        <form onSubmit={handleSearchSubmit} className="relative flex-grow max-w-md">
                            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search by license key, customer email, product..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-muted/50 border border-border/80 rounded-xl pl-10 pr-4 py-2 text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-primary"
                            />
                        </form>

                        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1 shrink-0">
                                <Filter size={12} /> Status:
                            </span>
                            {['all', 'Active', 'LimitReached', 'Expired', 'Revoked'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                                        statusFilter === status
                                            ? 'bg-primary text-white shadow-xs'
                                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                    }`}
                                >
                                    {status === 'all' ? 'All' : status}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* License Table */}
                    <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xs">
                        {loading ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-3">
                                <Loader2 className="animate-spin text-primary" size={28} />
                                <span className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-widest">Loading licenses...</span>
                            </div>
                        ) : licenses.length === 0 ? (
                            <div className="py-16 text-center text-muted-foreground text-xs font-medium">
                                No licenses found matching the selected filters.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/40 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                            <th className="py-3.5 px-4">License Key & Product</th>
                                            <th className="py-3.5 px-4">Customer Email</th>
                                            <th className="py-3.5 px-4">Downloads Used</th>
                                            <th className="py-3.5 px-4">Expiry Date</th>
                                            <th className="py-3.5 px-4">Status</th>
                                            <th className="py-3.5 px-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/60 font-medium">
                                        {licenses.map((lic) => {
                                            const badge = getStatusBadge(lic.status)
                                            const StatusIcon = badge.icon
                                            const isExpired = new Date() > new Date(lic.expiryDate)

                                            return (
                                                <tr key={lic._id} className="hover:bg-muted/20 transition-colors">
                                                    <td className="py-3.5 px-4">
                                                        <div className="font-mono font-bold text-foreground">{lic.licenseKey}</div>
                                                        <div className="text-[11px] text-muted-foreground truncate max-w-[200px]">{lic.productName}</div>
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <div className="flex items-center gap-1.5 text-foreground">
                                                            <Mail size={12} className="text-muted-foreground shrink-0" />
                                                            <span>{lic.customerEmail}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <div className="font-bold">
                                                            <span className={lic.downloadCount >= lic.maxDownloads ? 'text-amber-600' : 'text-foreground'}>
                                                                {lic.downloadCount}
                                                            </span> / {lic.maxDownloads}
                                                        </div>
                                                        {lic.lastDownloadedAt && (
                                                            <div className="text-[10px] text-muted-foreground">
                                                                Last: {new Date(lic.lastDownloadedAt).toLocaleDateString('en-IN')}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <div className={isExpired ? 'text-destructive font-bold' : 'text-foreground'}>
                                                            {new Date(lic.expiryDate).toLocaleDateString('en-IN')}
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground">
                                                            Granted: {new Date(lic.startDate).toLocaleDateString('en-IN')}
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                                                            <StatusIcon size={11} /> {lic.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {lic.status === 'Revoked' ? (
                                                                <div className="flex items-center gap-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRestore(lic.licenseKey)}
                                                                        disabled={processing}
                                                                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 text-[11px] font-bold border border-emerald-500/20 transition-colors cursor-pointer"
                                                                    >
                                                                        Restore
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setRevokeReason(lic.revokedReason || '')
                                                                            setActionModal({ type: 'revoke', license: lic })
                                                                        }}
                                                                        title="Edit Revocation Reason"
                                                                        className="p-1.5 rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground text-[11px] font-bold border border-border/60 transition-colors cursor-pointer"
                                                                    >
                                                                        <Pencil size={11} />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setRevokeReason(lic.revokedReason || '')
                                                                        setActionModal({ type: 'revoke', license: lic })
                                                                    }}
                                                                    className="px-2.5 py-1 rounded-lg bg-red-600/10 text-red-600 hover:bg-red-600/20 text-[11px] font-bold border border-red-600/20 transition-colors cursor-pointer"
                                                                >
                                                                    Revoke
                                                                </button>
                                                            )}

                                                            <button
                                                                onClick={() => setActionModal({ type: 'reset', license: lic })}
                                                                title="Reset Download Count to 0"
                                                                className="px-2 py-1 rounded-lg bg-muted hover:bg-muted/80 text-[11px] font-bold text-foreground border border-border"
                                                            >
                                                                <RotateCcw size={12} />
                                                            </button>

                                                            <button
                                                                onClick={() => setActionModal({ type: 'extend', license: lic })}
                                                                title="Extend 30-Day Expiry Window"
                                                                className="px-2 py-1 rounded-lg bg-muted hover:bg-muted/80 text-[11px] font-bold text-foreground border border-border"
                                                            >
                                                                <Calendar size={12} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Modal Actions */}
            <AnimatePresence>
                {actionModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-card border border-border/80 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5"
                        >
                            <h3 className="text-base font-black text-foreground">
                                {actionModal.type === 'revoke' && 'Revoke License Access'}
                                {actionModal.type === 'reset' && 'Reset Download Counter'}
                                {actionModal.type === 'extend' && 'Extend License Duration'}
                            </h3>

                            <p className="text-xs text-muted-foreground leading-relaxed">
                                License Key: <strong className="text-foreground font-mono">{actionModal.license?.licenseKey}</strong><br />
                                Customer: <strong className="text-foreground">{actionModal.license?.customerEmail}</strong>
                            </p>

                            {actionModal.type === 'revoke' && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-foreground">Reason for Revocation:</label>
                                        <span className="text-[10px] text-muted-foreground">Press Ctrl+Enter to submit</span>
                                    </div>
                                    <textarea
                                        rows={3}
                                        value={revokeReason}
                                        onChange={(e) => setRevokeReason(e.target.value)}
                                        onKeyDown={(e) => {
                                            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                                                e.preventDefault();
                                                handleRevoke();
                                            }
                                        }}
                                        placeholder="e.g. Chargeback filed, unauthorized sharing detected, refund issued, limit reached..."
                                        className="w-full bg-muted/50 border border-border rounded-xl p-3 text-xs focus:ring-1 focus:ring-primary focus:outline-hidden"
                                    />
                                </div>
                            )}

                            {actionModal.type === 'reset' && (
                                <p className="text-xs text-muted-foreground">
                                    This will reset <strong className="text-foreground">downloadCount to 0</strong> and set status back to <strong className="text-emerald-700">Active</strong>, allowing the customer another full download allowance.
                                </p>
                            )}

                            {actionModal.type === 'extend' && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-foreground">Additional Days to Add:</label>
                                    <select
                                        value={extendDays}
                                        onChange={(e) => setExtendDays(parseInt(e.target.value))}
                                        className="w-full bg-muted/50 border border-border rounded-xl p-2.5 text-xs font-bold"
                                    >
                                        <option value={15}>+15 Days</option>
                                        <option value={30}>+30 Days (Standard Extension)</option>
                                        <option value={60}>+60 Days</option>
                                        <option value={90}>+90 Days</option>
                                    </select>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-3 border-t border-border/60">
                                <button
                                    type="button"
                                    onClick={() => setActionModal(null)}
                                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                {actionModal.type === 'revoke' && (
                                    <button
                                        type="button"
                                        onClick={handleRevoke}
                                        disabled={processing}
                                        className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                                    >
                                        {processing ? 'Revoking...' : 'Confirm Revoke'}
                                    </button>
                                )}
                                {actionModal.type === 'reset' && (
                                    <button
                                        type="button"
                                        onClick={handleResetDownloads}
                                        disabled={processing}
                                        className="px-5 py-2.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-white shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                                    >
                                        {processing ? 'Resetting...' : 'Confirm Reset'}
                                    </button>
                                )}
                                {actionModal.type === 'extend' && (
                                    <button
                                        type="button"
                                        onClick={handleExtendExpiry}
                                        disabled={processing}
                                        className="px-5 py-2.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-white shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                                    >
                                        {processing ? 'Extending...' : 'Apply Extension'}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
