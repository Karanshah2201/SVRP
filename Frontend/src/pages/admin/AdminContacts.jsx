import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Mail, Clock, Loader2, User, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'

export default function AdminContacts() {
    const [contacts, setContacts] = useState([])
    const [loading, setLoading] = useState(true)
    const [selected, setSelected] = useState(null)

    const token = localStorage.getItem('adminToken')
    const headers = { Authorization: `Bearer ${token}` }

    const fetchContacts = async () => {
        try {
            const res = await api.get('/admin/contacts', { headers })
            setContacts(res.data)
        } catch (err) {
            toast.error('Failed to fetch contacts')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchContacts() }, [])

    const handleDelete = async (id) => {
        if (!confirm('Delete this message?')) return
        try {
            await api.delete(`/admin/contacts/${id}`, { headers })
            toast.success('Message deleted')
            if (selected?._id === id) setSelected(null)
            fetchContacts()
        } catch (err) {
            toast.error('Failed to delete')
        }
    }

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-2xl font-bold text-foreground">Contact Messages</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">Inquiries and messages submitted via the contact form</p>
                </motion.div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-border text-foreground shadow-xs">
                        Total: {contacts.length} messages
                    </span>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary" size={32} /></div>
            ) : contacts.length === 0 ? (
                <div className="text-center py-20 bg-card rounded-2xl border border-border border-dashed">
                    <Mail size={44} className="text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium text-base">No contact messages yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[calc(100vh-200px)]">
                    {/* Message List */}
                    <div className="lg:col-span-2 space-y-3 overflow-y-auto pr-2 pb-4 scrollbar-hide">
                        {contacts.map((c, i) => (
                            <motion.div
                                key={c._id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => setSelected(c)}
                                className={`p-4 sm:p-5 rounded-2xl cursor-pointer transition-all border shadow-xs group ${selected?._id === c._id
                                    ? 'bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20'
                                    : 'bg-card border-border hover:border-primary/40 hover:shadow-xs'
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center transition-colors ${selected?._id === c._id ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`}>
                                            <User size={18} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className={`text-sm font-bold truncate ${selected?._id === c._id ? 'text-white' : 'text-foreground'}`}>{c.name}</p>
                                            <p className={`text-xs truncate ${selected?._id === c._id ? 'text-white/80' : 'text-muted-foreground'}`}>{c.subject || 'No subject'}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(c._id) }}
                                        className={`p-2 rounded-lg transition-all flex-shrink-0 opacity-0 group-hover:opacity-100 ${selected?._id === c._id
                                            ? 'text-white/80 hover:text-white hover:bg-white/20'
                                            : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                                            }`}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <p className={`text-[11px] font-medium flex items-center gap-1.5 ${selected?._id === c._id ? 'text-white/60' : 'text-muted-foreground'}`}>
                                    <Clock size={12} /> {formatDate(c.createdAt)}
                                </p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Message Detail */}
                    <div className="lg:col-span-3 h-full">
                        <AnimatePresence mode="wait">
                            {selected ? (
                                <motion.div
                                    key={selected._id}
                                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                                    className="bg-card border border-border rounded-2xl p-6 sm:p-8 h-full shadow-xs flex flex-col"
                                >
                                    <div className="flex items-start justify-between mb-8 border-b border-border/60 pb-6">
                                        <div>
                                            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 leading-tight">{selected.subject || 'No Subject'}</h2>
                                            <div className="flex flex-wrap items-center gap-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                                        <User size={14} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Sender</p>
                                                        <p className="text-sm font-bold text-foreground">{selected.name}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                                        <Mail size={14} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Email</p>
                                                        <p className="text-sm font-bold text-foreground">{selected.email}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="bg-muted/50 px-3 py-1.5 rounded-lg border border-border inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                                <Clock size={14} />
                                                {formatDate(selected.createdAt)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto">
                                        <div className="flex gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex-shrink-0 flex items-center justify-center text-primary">
                                                <MessageSquare size={18} />
                                            </div>
                                            <div className="flex-1 pt-1.5">
                                                <p className="text-foreground leading-relaxed whitespace-pre-wrap text-sm sm:text-base font-normal">{selected.message}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-border/60 flex justify-end gap-3">
                                        <button
                                            onClick={() => handleDelete(selected._id)}
                                            className="px-4 py-2.5 rounded-xl border border-destructive/20 text-destructive bg-destructive/10 hover:bg-destructive/20 font-bold text-xs transition-colors flex items-center gap-2"
                                        >
                                            <Trash2 size={15} /> Delete Message
                                        </button>
                                        <button
                                            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs transition-colors shadow-xs flex items-center gap-2"
                                            onClick={() => window.location.href = `mailto:${selected.email}`}
                                        >
                                            <Mail size={15} /> Reply via Email
                                        </button>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="bg-card border-2 border-border border-dashed rounded-2xl h-full flex flex-col items-center justify-center text-center p-8">
                                    <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-3">
                                        <MessageSquare size={28} className="text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground mb-1">No Message Selected</h3>
                                    <p className="text-muted-foreground text-xs max-w-xs">Select a message from the list to view its contents and details.</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            )}
        </div>
    )
}
