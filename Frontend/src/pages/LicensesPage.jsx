import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { 
    Shield, Key, Download, Clock, AlertTriangle, CheckCircle2, 
    XCircle, RefreshCw, Loader2, ArrowLeft, ExternalLink, 
    FileText, Copy, Check, Box, HelpCircle, HardDrive, Cloud, Lock
} from 'lucide-react'
import api from '@/lib/api'
import { getToken } from '@/lib/authStore'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { PageHeader, StatusBadge, EmptyState } from '@/components/ui'

export default function LicensesPage() {
    const [licenses, setLicenses] = useState([])
    const [cloudGrants, setCloudGrants] = useState([])
    const [loading, setLoading] = useState(true)
    const [downloadingKey, setDownloadingKey] = useState(null)
    const [selectedLicense, setSelectedLicense] = useState(null)
    const [copiedKey, setCopiedKey] = useState(null)
    const [refreshing, setRefreshing] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async (isManual = false) => {
        try {
            if (isManual) setRefreshing(true)
            const [licRes, grantRes] = await Promise.allSettled([
                api.get('/licenses'),
                api.get('/access/my-grants')
            ])

            if (licRes.status === 'fulfilled') {
                setLicenses(licRes.value.data || [])
            }
            if (grantRes.status === 'fulfilled') {
                setCloudGrants(grantRes.value.data?.grants || [])
            }
            if (isManual) toast.success('Access records refreshed')
        } catch (err) {
            toast.error('Failed to load your access licenses')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const fetchLicenses = (isManual) => fetchData(isManual)

    const copyToClipboard = (text, key) => {
        navigator.clipboard.writeText(text)
        setCopiedKey(key)
        toast.success('License Key copied to clipboard')
        setTimeout(() => setCopiedKey(null), 2500)
    }

    const handleDownload = async (license) => {
        if (license.status === 'LimitReached') {
            toast.error('Download limit reached (all permitted downloads completed). Contact support for assistance.')
            return
        }
        if (license.status === 'Expired') {
            toast.error('Access period expired. The 30-day download window has ended.')
            return
        }
        if (license.status === 'Revoked') {
            toast.error('This license has been revoked by administration.')
            return
        }

        setDownloadingKey(license.licenseKey)
        try {
            const token = getToken() || (typeof window !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('adminToken') : null)
            const downloadUrl = `/licenses/${license.licenseKey}/download${token ? `?token=${encodeURIComponent(token)}` : ''}`
            
            const headers = {}
            if (token) {
                headers.Authorization = `Bearer ${token}`
            }

            const res = await api.get(downloadUrl, { 
                responseType: 'blob',
                headers
            })

            const blob = new Blob([res.data], { type: 'application/zip' })
            const blobUrl = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = blobUrl
            const safeName = (license.productName || '3D_Model').replace(/[^a-zA-Z0-9_-]/g, '_')
            link.setAttribute('download', `${safeName}_Package.zip`)
            document.body.appendChild(link)
            link.click()
            link.parentNode.removeChild(link)
            window.URL.revokeObjectURL(blobUrl)

            toast.success('Download started! Download count will update upon stream completion.')
            // Refresh licenses after small delay to show updated download count
            setTimeout(() => fetchLicenses(false), 3000)
        } catch (err) {
            let errorMsg = 'Failed to initiate download'
            if (err.response?.data instanceof Blob) {
                try {
                    const text = await err.response.data.text()
                    const json = JSON.parse(text)
                    if (json.message) errorMsg = json.message
                } catch (e) { }
            } else if (err.response?.data?.message) {
                errorMsg = err.response.data.message
            }
            toast.error(errorMsg)
        } finally {
            setDownloadingKey(null)
        }
    }

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Active':
                return {
                    label: 'Active & Downloadable',
                    bg: 'bg-emerald-500/10 text-emerald-800 border-emerald-500/20',
                    icon: CheckCircle2
                }
            case 'LimitReached':
                return {
                    label: 'Download Limit Reached',
                    bg: 'bg-amber-500/10 text-amber-800 border-amber-500/20',
                    icon: AlertTriangle
                }
            case 'Expired':
                return {
                    label: 'Access Window Expired',
                    bg: 'bg-slate-500/10 text-slate-700 border-slate-500/20',
                    icon: Clock
                }
            case 'Revoked':
                return {
                    label: 'Access Revoked',
                    bg: 'bg-destructive/10 text-destructive border-destructive/20',
                    icon: XCircle
                }
            default:
                return {
                    label: status,
                    bg: 'bg-muted text-muted-foreground border-border',
                    icon: Shield
                }
        }
    }

    const formatDaysRemaining = (expiryDateStr) => {
        const diffMs = new Date(expiryDateStr) - new Date()
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
        if (diffDays <= 0) return 'Expired'
        if (diffDays === 1) return 'Expires tomorrow'
        return `${diffDays} days remaining`
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-primary" size={36} />
                    <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">Loading licenses...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary flex flex-col">
            <Navbar />
            <main id="main-content" className="page-container">
                <PageHeader
                    title="My 3D Model Licenses"
                    subtitle="Each purchase includes a server-enforced limited-access license authorizing downloads during the 30-day window."
                    backTo="/orders"
                    backLabel="Back to Orders"
                    badge="Digital Rights & Access Management"
                    actions={
                        <button
                            onClick={() => fetchLicenses(true)}
                            disabled={refreshing}
                            className="skeuo-button bg-card border border-border/80 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs shrink-0"
                        >
                            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                            Refresh Status
                        </button>
                    }
                />

                {/* Important Notice Banner */}
                <div className="mb-10 p-5 rounded-2xl bg-primary/5 border border-primary/20 flex items-start gap-4 text-xs leading-relaxed text-foreground/90">
                    <HardDrive size={20} className="text-primary shrink-0 mt-0.5" />
                    <div>
                        <strong className="text-foreground font-bold">Important Backup Notice:</strong> Technical access controls prevent unauthorized link sharing and enforce your 1-2 download quota. <strong>Revoking cloud access cannot delete files already saved on your local device.</strong> Please ensure you download and securely backup your purchased models to your local drive within the 30-day window.
                    </div>
                </div>

                {/* 48-Hour Cloud Access Grants Section */}
                {cloudGrants.length > 0 && (
                    <div className="mb-10 space-y-4">
                        <div className="flex items-center gap-2">
                            <Cloud className="text-primary" size={18} />
                            <h2 className="text-lg font-black text-foreground">
                                48-Hour Cloud Drive Access (Google Drive & OneDrive Files)
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {cloudGrants.map((grant) => {
                                const isActive = grant.status === 'active' && !grant.isExpired
                                return (
                                    <div key={grant._id} className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-4">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border mb-1.5 ${
                                                    grant.storageProvider === 'google_drive'
                                                        ? 'bg-blue-500/10 text-blue-700 border-blue-500/20'
                                                        : 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20'
                                                }`}>
                                                    <HardDrive size={10} />
                                                    {grant.storageProvider === 'google_drive' ? 'Google Drive Access' : 'OneDrive Access'}
                                                </span>
                                                <h3 className="font-black text-foreground text-sm">
                                                    {grant.productId?.name || '3D Model Asset'}
                                                </h3>
                                                <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                                                    Order #{grant.orderId?.orderId || grant.orderId || 'Order'}
                                                </p>
                                            </div>
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 ${
                                                isActive
                                                    ? 'bg-emerald-500/10 text-emerald-800 border-emerald-500/20'
                                                    : 'bg-slate-500/10 text-slate-700 border-slate-500/20'
                                            }`}>
                                                {isActive ? <CheckCircle2 size={11} /> : <Lock size={11} />}
                                                {isActive ? 'Active (48h Window)' : 'Access Expired'}
                                            </span>
                                        </div>

                                        <div className="bg-muted/40 rounded-xl p-3 border border-border/60 text-xs space-y-1">
                                            <div className="flex justify-between items-center">
                                                <span className="text-muted-foreground text-[11px]">Access Deadline:</span>
                                                <span className="font-bold text-foreground text-[11px]">
                                                    {new Date(grant.expiresAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                                                </span>
                                            </div>
                                            {isActive ? (
                                                <div className="flex justify-between items-center text-emerald-700 font-bold text-[11px]">
                                                    <span>Time Left:</span>
                                                    <span>⏱️ {grant.remainingHours}h remaining</span>
                                                </div>
                                            ) : (
                                                <div className="text-[10px] text-muted-foreground">
                                                    Original cloud access has been revoked. Downloaded local copies remain yours.
                                                </div>
                                            )}
                                        </div>

                                        {isActive && grant.accessUrl ? (
                                            <a
                                                href={grant.accessUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="skeuo-button skeuo-button-primary w-full py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                                            >
                                                <ExternalLink size={13} />
                                                Open Files in {grant.storageProvider === 'google_drive' ? 'Google Drive' : 'OneDrive'}
                                            </a>
                                        ) : (
                                            <button
                                                disabled
                                                className="w-full py-2.5 rounded-xl bg-muted/70 text-muted-foreground text-xs font-bold flex items-center justify-center gap-1.5 cursor-not-allowed border border-border/80"
                                            >
                                                <Lock size={13} /> 48-Hour Cloud Access Ended
                                            </button>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {licenses.length === 0 ? (
                    <EmptyState
                        icon={Box}
                        title="No Licenses Found"
                        description="You do not have any active 3D model licenses yet. Browse our professional railway models catalog to purchase assets."
                        actionLabel="Explore 3D Models"
                        actionTo="/products"
                    />
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {licenses.map((lic) => {
                            const remaining = Math.max(0, lic.maxDownloads - lic.downloadCount)
                            const percentUsed = Math.min(100, Math.round((lic.downloadCount / lic.maxDownloads) * 100))

                            return (
                                <motion.div
                                    key={lic._id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                                >
                                    <div className="space-y-4 flex-grow w-full md:w-auto">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <StatusBadge status={lic.status} />
                                            <span className="text-xs font-mono font-bold text-muted-foreground">
                                                Order #{String(lic.orderId).slice(-8).toUpperCase()}
                                            </span>
                                        </div>

                                        <div>
                                            <h3 className="text-xl font-black text-foreground tracking-tight">
                                                {lic.productName}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                                                <span>Formats: <strong className="text-foreground">{lic.product?.fileFormats?.join(', ') || '.blend, .fbx, .obj, .glb'}</strong></span>
                                                <span>•</span>
                                                <span>Size: <strong className="text-foreground">{lic.product?.fileSize || '65 MB'}</strong></span>
                                                {lic.product?.polygonCount && (
                                                    <>
                                                        <span>•</span>
                                                        <span>Polygons: <strong className="text-foreground">{lic.product.polygonCount.toLocaleString()}</strong></span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* License Key Box */}
                                        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/50 border border-border/60 max-w-lg">
                                            <Key size={14} className="text-primary shrink-0" />
                                            <span className="font-mono text-xs font-bold text-foreground truncate select-all">
                                                {lic.licenseKey}
                                            </span>
                                            <button
                                                onClick={() => copyToClipboard(lic.licenseKey, lic.licenseKey)}
                                                className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-muted"
                                                title="Copy License Key"
                                            >
                                                {copiedKey === lic.licenseKey ? (
                                                    <><Check size={12} className="text-emerald-600" /> <span className="text-[10px] text-emerald-600 font-bold">Copied</span></>
                                                ) : (
                                                    <><Copy size={12} /> <span className="text-[10px] font-bold">Copy</span></>
                                                )}
                                            </button>
                                        </div>

                                        {/* Download Limit Meter / Revocation State */}
                                        {lic.status === 'Revoked' ? (
                                            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 text-xs font-medium space-y-1.5 max-w-md">
                                                <div className="font-bold flex items-center gap-1.5 text-red-700">
                                                    <XCircle size={15} className="text-red-600 shrink-0" />
                                                    Access Revoked by Administrator
                                                </div>
                                                {lic.revokedReason && (
                                                    <p className="text-[11px] text-red-600/90 pl-5">
                                                        Reason: <strong className="font-semibold">{lic.revokedReason.trim()}</strong>
                                                    </p>
                                                )}
                                                <div className="flex items-center justify-between text-[10px] text-red-500/80 pl-5 pt-0.5 border-t border-red-500/10">
                                                    <span>Downloads: <strong>0 of {lic.maxDownloads} remaining (Locked)</strong></span>
                                                    <span>Status: Permanently Blocked</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-1.5 max-w-md">
                                                <div className="flex justify-between text-xs font-semibold">
                                                    <span className="text-muted-foreground">Downloads Used:</span>
                                                    <span className="font-bold text-foreground">
                                                        {lic.downloadCount} of {lic.maxDownloads} ({remaining} remaining)
                                                    </span>
                                                </div>
                                                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full transition-all duration-500 ${
                                                            percentUsed >= 100 ? 'bg-amber-500' : 'bg-primary'
                                                        }`}
                                                        style={{ width: `${percentUsed}%` }}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={11} /> {formatDaysRemaining(lic.expiryDate)}
                                                    </span>
                                                    <span>Expires: {new Date(lic.expiryDate).toLocaleDateString('en-IN')}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-3 w-full md:w-auto shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-border/80">
                                        {lic.status === 'Revoked' ? (
                                            <div 
                                                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-muted text-muted-foreground border border-border/80 flex items-center justify-center gap-2 cursor-not-allowed opacity-80"
                                                title="This license has been revoked. Downloads are locked."
                                            >
                                                <Lock size={14} className="text-red-600" /> Download Locked
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleDownload(lic)}
                                                disabled={downloadingKey === lic.licenseKey || lic.status !== 'Active'}
                                                className={`skeuo-button px-5 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2.5 transition-all shadow-sm ${
                                                    lic.status === 'Active'
                                                        ? 'skeuo-button-primary cursor-pointer'
                                                        : 'bg-muted text-muted-foreground opacity-60 cursor-not-allowed border border-border'
                                                }`}
                                            >
                                                {downloadingKey === lic.licenseKey ? (
                                                    <><Loader2 size={15} className="animate-spin" /> Preparing ZIP...</>
                                                ) : (
                                                    <><Download size={15} /> Download Package (.ZIP)</>
                                                )}
                                            </button>
                                        )}

                                        <button
                                            onClick={() => setSelectedLicense(lic)}
                                            className="px-4 py-2 rounded-xl text-xs font-bold text-primary hover:bg-primary/10 border border-primary/20 flex items-center justify-center gap-1.5 transition-colors"
                                        >
                                            <FileText size={13} /> View Certificate
                                        </button>

                                        {lic.status === 'LimitReached' && (
                                            <Link 
                                                to="/contact" 
                                                className="text-[11px] text-amber-700 font-bold underline flex items-center gap-1 hover:text-amber-800"
                                            >
                                                <HelpCircle size={11} /> Need limit reset?
                                            </Link>
                                        )}
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                )}
            </main>

            {/* Certificate Modal */}
            <AnimatePresence>
                {selectedLicense && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between pb-4 border-b border-border">
                                <div className="flex items-center gap-2">
                                    <Shield size={20} className="text-primary" />
                                    <h3 className="text-lg font-black text-foreground">Official License Certificate</h3>
                                </div>
                                <button
                                    onClick={() => setSelectedLicense(null)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground text-sm font-bold"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="p-4 rounded-xl bg-muted/60 font-mono text-xs space-y-2 border border-border/60">
                                <div><span className="text-muted-foreground">License Key:</span> <strong className="text-foreground">{selectedLicense.licenseKey}</strong></div>
                                <div><span className="text-muted-foreground">Product:</span> <strong className="text-foreground">{selectedLicense.productName}</strong></div>
                                <div><span className="text-muted-foreground">Order ID:</span> {selectedLicense.orderId}</div>
                                <div><span className="text-muted-foreground">Buyer:</span> {selectedLicense.customerEmail}</div>
                                <div><span className="text-muted-foreground">Granted:</span> {new Date(selectedLicense.startDate).toLocaleDateString('en-IN')}</div>
                                <div><span className="text-muted-foreground">Expiry Date:</span> {new Date(selectedLicense.expiryDate).toLocaleDateString('en-IN')}</div>
                                <div><span className="text-muted-foreground">Max Downloads:</span> {selectedLicense.maxDownloads}</div>
                                <div><span className="text-muted-foreground">Used Downloads:</span> {selectedLicense.downloadCount}</div>
                            </div>

                            <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                                <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">Summary of Rights:</h4>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li>Non-exclusive single-seat commercial and personal license.</li>
                                    <li>Permitted in compiled games, simulations, renders, and physical prints.</li>
                                    <li>Resale, re-upload, or public distribution of source 3D files is strictly forbidden.</li>
                                    <li>Server access is limited to {selectedLicense.maxDownloads} downloads within 30 days.</li>
                                </ul>
                            </div>

                            <div className="pt-2 flex justify-end gap-3">
                                <button
                                    onClick={() => setSelectedLicense(null)}
                                    className="skeuo-button bg-card border border-border px-5 py-2.5 rounded-xl text-xs font-bold"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => {
                                        copyToClipboard(selectedLicense.licenseKey, selectedLicense.licenseKey)
                                        setSelectedLicense(null)
                                    }}
                                    className="skeuo-button skeuo-button-primary px-5 py-2.5 rounded-xl text-xs font-bold"
                                >
                                    Copy Certificate Key
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <Footer />
        </div>
    )
}
