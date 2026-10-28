import { useEffect, useState } from 'react'
import { 
    Shield, Activity, RefreshCw, Loader2, Cloud, HardDrive, 
    CheckCircle2, AlertTriangle, XCircle, Info, Database, Lock
} from 'lucide-react'
import api from '@/lib/api'
import { toast } from 'sonner'

export default function AdminAuditLogs() {
    const [logs, setLogs] = useState([])
    const [storageStats, setStorageStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [filterEvent, setFilterEvent] = useState('all')
    const token = localStorage.getItem('adminToken')

    useEffect(() => {
        fetchData()
    }, [filterEvent])

    const fetchData = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (filterEvent !== 'all') params.append('eventType', filterEvent)
            params.append('limit', '100')

            const [logsRes, storageRes] = await Promise.all([
                api.get(`/admin/audit-logs?${params.toString()}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                api.get('/admin/storage-stats', {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ])

            setLogs(logsRes.data || [])
            setStorageStats(storageRes.data)
        } catch (err) {
            toast.error('Failed to load audit logs or storage stats')
        } finally {
            setLoading(false)
        }
    }

    const getEventBadge = (type) => {
        switch (type) {
            case 'DOWNLOAD_SUCCESS':
                return { color: 'text-emerald-700 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 }
            case 'DOWNLOAD_ATTEMPT':
                return { color: 'text-blue-700 bg-blue-500/10 border-blue-500/20', icon: Info }
            case 'DOWNLOAD_INTERRUPTED':
                return { color: 'text-amber-700 bg-amber-500/10 border-amber-500/20', icon: AlertTriangle }
            case 'LIMIT_REACHED':
                return { color: 'text-purple-700 bg-purple-500/10 border-purple-500/20', icon: Lock }
            case 'LICENSE_REVOKED':
                return { color: 'text-destructive bg-destructive/10 border-destructive/20', icon: XCircle }
            case 'PAYMENT_VERIFIED':
                return { color: 'text-emerald-700 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 }
            default:
                return { color: 'text-muted-foreground bg-muted border-border', icon: Activity }
        }
    }

    return (
        <div className="space-y-8 font-sans">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                        Security Audit Logs & Cloud Storage Monitor
                    </h1>
                    <p className="text-muted-foreground text-xs font-medium mt-1">
                        Real-time telemetry on download stream completions, socket drops, payments, and storage providers.
                    </p>
                </div>
                <button
                    onClick={() => fetchData()}
                    className="skeuo-button bg-card border border-border px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 self-start shadow-xs"
                >
                    <RefreshCw size={13} /> Refresh Telemetry
                </button>
            </div>

            {/* Cloud Storage Providers Health Widget */}
            {storageStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Google Drive */}
                    <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                                <Cloud size={14} className="text-blue-500" /> Google Drive API
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                storageStats.googleDrive?.configured 
                                    ? 'bg-emerald-500/10 text-emerald-700' 
                                    : 'bg-amber-500/10 text-amber-800'
                            }`}>
                                {storageStats.googleDrive?.configured ? 'Active' : 'Fallback Mode'}
                            </span>
                        </div>
                        <div className="text-[11px] font-mono text-muted-foreground space-y-1">
                            <div>Account: <strong className="text-foreground">{storageStats.googleDrive?.clientEmail}</strong></div>
                            <div>Folder: {storageStats.googleDrive?.folderId}</div>
                        </div>
                    </div>

                    {/* Microsoft OneDrive */}
                    <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                                <Cloud size={14} className="text-sky-600" /> Microsoft OneDrive
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                storageStats.oneDrive?.configured 
                                    ? 'bg-emerald-500/10 text-emerald-700' 
                                    : 'bg-amber-500/10 text-amber-800'
                            }`}>
                                {storageStats.oneDrive?.configured ? 'Active' : 'Fallback Mode'}
                            </span>
                        </div>
                        <div className="text-[11px] font-mono text-muted-foreground space-y-1">
                            <div>Client ID: <strong className="text-foreground">{storageStats.oneDrive?.clientId}</strong></div>
                            <div>Tenant: {storageStats.oneDrive?.tenantId}</div>
                        </div>
                    </div>

                    {/* Cloudflare R2 */}
                    <div className="bg-card border border-primary/20 rounded-2xl p-5 shadow-xs space-y-3 bg-primary/5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                                <Database size={14} /> Cloudflare R2 (Recommended)
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                storageStats.cloudflareR2?.configured 
                                    ? 'bg-emerald-500/10 text-emerald-700' 
                                    : 'bg-primary/20 text-primary'
                            }`}>
                                {storageStats.cloudflareR2?.configured ? 'Active' : 'Standby'}
                            </span>
                        </div>
                        <div className="text-[11px] font-mono text-muted-foreground space-y-1">
                            <div>Bucket: <strong className="text-foreground">{storageStats.cloudflareR2?.bucketName}</strong></div>
                            <div className="text-emerald-700 font-bold">{storageStats.cloudflareR2?.egressFeeNotice}</div>
                        </div>
                    </div>

                    {/* Local Repository */}
                    <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                                <HardDrive size={14} className="text-purple-600" /> Local Repository
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700">
                                Ready
                            </span>
                        </div>
                        <div className="text-[11px] font-mono text-muted-foreground space-y-1">
                            <div>Stored Files: <strong className="text-foreground">{storageStats.localRepository?.fileCount} files</strong></div>
                            <div>Total Stored: <strong className="text-foreground">{storageStats.localRepository?.totalSizeMB} MB</strong></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filter Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[
                    { id: 'all', label: 'All Events' },
                    { id: 'DOWNLOAD_SUCCESS', label: 'Completed Downloads' },
                    { id: 'DOWNLOAD_INTERRUPTED', label: 'Interrupted Downloads' },
                    { id: 'LIMIT_REACHED', label: 'Limit Reached' },
                    { id: 'LICENSE_REVOKED', label: 'Revocations' },
                    { id: 'PAYMENT_VERIFIED', label: 'Payments' }
                ].map((f) => (
                    <button
                        key={f.id}
                        onClick={() => setFilterEvent(f.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                            filterEvent === f.id
                                ? 'bg-primary text-white shadow-xs'
                                : 'bg-card border border-border text-muted-foreground hover:bg-muted'
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Audit Log Table */}
            <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xs">
                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="animate-spin text-primary" size={28} />
                        <span className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-widest">Loading telemetry...</span>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="py-16 text-center text-muted-foreground text-xs font-medium">
                        No audit logs recorded for this category yet.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-border bg-muted/40 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                    <th className="py-3 px-4">Event & Timestamp</th>
                                    <th className="py-3 px-4">Customer Email</th>
                                    <th className="py-3 px-4">IP & Network</th>
                                    <th className="py-3 px-4">Details & Payload</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60 font-medium">
                                {logs.map((log) => {
                                    const badge = getEventBadge(log.eventType)
                                    const Icon = badge.icon

                                    return (
                                        <tr key={log._id} className="hover:bg-muted/20 transition-colors">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>
                                                        <Icon size={11} /> {log.eventType}
                                                    </span>
                                                </div>
                                                <div className="text-[10px] font-mono text-muted-foreground">
                                                    {new Date(log.timestamp).toLocaleString('en-IN')}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="text-foreground font-semibold">
                                                    {log.userId?.email || 'System / Guest'}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                                                {log.ipAddress}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="font-mono text-[11px] text-foreground/90 max-w-lg truncate" title={JSON.stringify(log.details)}>
                                                    {typeof log.details === 'object' 
                                                        ? Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(' | ') 
                                                        : String(log.details)}
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
        </div>
    )
}
