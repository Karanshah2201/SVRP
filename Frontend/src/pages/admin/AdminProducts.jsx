import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Edit3, Package, X, Loader2, Star, Upload, Image, FileVideo, FileAudio, Box, Cloud, Link2, ExternalLink, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'

const emptyForm = { name: '', category: '', subcategory: '', price: '', rating: '', description: '', features: '', mediaType: 'image', driveUrl: '' }

export default function AdminProducts() {
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [form, setForm] = useState(emptyForm)
    const [editingId, setEditingId] = useState(null)
    const [saving, setSaving] = useState(false)
    const [imageFile, setImageFile] = useState(null)
    const [mediaFile, setMediaFile] = useState(null)
    const [imagePreview, setImagePreview] = useState('')
    const [uploading, setUploading] = useState(false)

    const token = localStorage.getItem('adminToken')
    const headers = { Authorization: `Bearer ${token}` }

    const fetchProducts = async () => {
        try {
            const res = await api.get('/admin/products', { headers })
            setProducts(res.data)
        } catch (err) {
            toast.error('Failed to fetch products')
        } finally {
            setLoading(false)
        }
    }

    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories')
            setCategories(res.data)
        } catch (err) { /* ignore */ }
    }

    useEffect(() => { fetchProducts(); fetchCategories() }, [])

    const openCreate = () => {
        setForm(emptyForm)
        setEditingId(null)
        setImageFile(null)
        setMediaFile(null)
        setImagePreview('')
        setShowModal(true)
    }

    const openEdit = (product) => {
        setForm({
            name: product.name || '',
            category: product.category || '',
            subcategory: product.subcategory || '',
            price: product.price || '',
            rating: product.rating?.toString() || '',
            description: product.description || '',
            features: (product.features || []).join(', '),
            mediaType: product.mediaType || 'image',
            driveUrl: product.driveUrl || '',
        })
        setEditingId(product.id)
        setImageFile(null)
        setMediaFile(null)
        setImagePreview(product.image || '')
        setShowModal(true)
    }

    const uploadFile = async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        const res = await api.post('/upload', formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            }
        })
        // Return full backend URL
        const backendOrigin = (import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://svrp-1.onrender.com/api' : 'http://localhost:5000/api')).replace(/\/api\/?$/, '');
        return `${backendOrigin}${res.data.url}`
    }

    const handleImageSelect = (e) => {
        const file = e.target.files[0]
        if (file) {
            setImageFile(file)
            setImagePreview(URL.createObjectURL(file))
        }
    }

    const handleMediaSelect = (e) => {
        const file = e.target.files[0]
        if (file) setMediaFile(file)
    }

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)
        setUploading(true)
        try {
            let imageUrl = imagePreview
            let mediaUrl = ''

            // Upload image file if selected
            if (imageFile) {
                imageUrl = await uploadFile(imageFile)
            }

            // Upload media file if selected
            if (mediaFile) {
                mediaUrl = await uploadFile(mediaFile)
            }

            const payload = {
                name: form.name,
                category: form.category,
                subcategory: form.subcategory,
                price: form.price,
                rating: parseFloat(form.rating) || 0,
                image: imageUrl,
                description: form.description,
                features: form.features.split(',').map(f => f.trim()).filter(Boolean),
                mediaType: form.mediaType,
                mediaUrl: mediaUrl || undefined,
                driveUrl: form.driveUrl ? form.driveUrl.trim() : ''
            }

            if (editingId) {
                await api.put(`/admin/products/${editingId}`, payload, { headers })
                toast.success('Product updated!')
            } else {
                await api.post('/admin/products', payload, { headers })
                toast.success('Product created!')
            }
            setShowModal(false)
            fetchProducts()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save')
        } finally {
            setSaving(false)
            setUploading(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this product?')) return
        try {
            await api.delete(`/admin/products/${id}`, { headers })
            toast.success('Product deleted')
            fetchProducts()
        } catch (err) {
            toast.error('Failed to delete')
        }
    }

    const mediaTypeIcon = (type) => {
        switch (type) {
            case '3d': return <Box size={14} />
            case 'video': return <FileVideo size={14} />
            case 'audio': return <FileAudio size={14} />
            case 'zip': return <Package size={14} />
            default: return <Image size={14} />
        }
    }

    const acceptMap = {
        image: 'image/*',
        video: 'video/*',
        audio: 'audio/*',
        '3d': '.fbx,.glb,.gltf,.obj,.blend',
        zip: '.zip,.rar,.7z'
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-2xl font-bold text-foreground">Products</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">Manage your digital assets and 3D product catalog</p>
                </motion.div>
                <motion.button
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={openCreate}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-xs transition-all shadow-sm"
                >
                    <Plus size={16} /> Add Product
                </motion.button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary" size={30} /></div>
            ) : products.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-border border-dashed">
                    <Package size={44} className="text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium text-sm">No products found in catalog.</p>
                </div>
            ) : (
                <div className="bg-white border border-border/80 rounded-2xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-border/80 bg-muted/40">
                                    <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3.5">Product</th>
                                    <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3.5">Category</th>
                                    <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3.5">Price</th>
                                    <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3.5">Media</th>
                                    <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3.5">Cloud Link</th>
                                    <th className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3.5">Rating</th>
                                    <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3.5">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {products.map((p, i) => (
                                    <motion.tr
                                        key={p._id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.02 }}
                                        className="hover:bg-muted/30 transition-colors"
                                    >
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-11 h-11 rounded-lg bg-muted border border-border/80 overflow-hidden shrink-0">
                                                    <img
                                                        src={p.image}
                                                        alt={p.name}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect fill="%23f1f5f9" width="40" height="40"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%2394a3b8" font-family="sans-serif" font-size="10">No img</text></svg>' }}
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-foreground truncate max-w-[200px]">{p.name}</p>
                                                    <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">{p.description}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex flex-col gap-1 items-start">
                                                <span className="text-[11px] font-semibold bg-muted text-foreground/80 px-2 py-0.5 rounded-md border border-border/60">{p.category}</span>
                                                {p.subcategory && <span className="text-[10px] text-primary font-bold px-1.5 py-0.2 bg-primary/10 rounded">{p.subcategory}</span>}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-xs text-foreground font-bold font-mono">{(p.price && /^\D/.test(p.price)) ? p.price : `₹${p.price || 0}`}</td>
                                        <td className="px-5 py-3.5">
                                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1.5 w-fit border ${p.mediaType === '3d' ? 'bg-primary/10 text-primary border-primary/20' :
                                                p.mediaType === 'video' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                    p.mediaType === 'audio' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                        p.mediaType === 'zip' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                            'bg-muted text-muted-foreground border-border/60'
                                                }`}>
                                                {mediaTypeIcon(p.mediaType)}
                                                {p.mediaType || 'image'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {p.driveUrl ? (
                                                <a
                                                    href={p.driveUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors max-w-[130px] truncate"
                                                    title={p.driveUrl}
                                                >
                                                    <Cloud size={12} className="shrink-0" />
                                                    <span className="truncate">Attached</span>
                                                    <ExternalLink size={10} className="shrink-0" />
                                                </a>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                                    <AlertCircle size={11} />
                                                    No link
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                                                <Star size={13} fill="currentColor" />
                                                <span>{p.rating}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button onClick={() => openEdit(p)} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Edit">
                                                    <Edit3 size={15} />
                                                </button>
                                                <button onClick={() => handleDelete(p.id)} className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 12 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white border border-border rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-5 border-b border-border/80 pb-3.5">
                                <h2 className="text-lg font-bold text-foreground">{editingId ? 'Edit Product' : 'New Product'}</h2>
                                <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground p-1 transition-colors"><X size={18} /></button>
                            </div>
                            <form onSubmit={handleSave} className="space-y-3.5">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-foreground">Name *</label>
                                        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Product name" className="w-full h-10 px-3 bg-white border border-border rounded-xl text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" required />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-foreground">Category *</label>
                                        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value, subcategory: '' })} className="w-full h-10 px-3 bg-white border border-border rounded-xl text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" required>
                                            <option value="">Select...</option>
                                            {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                {/* Subcategory Dropdown */}
                                {form.category && (() => {
                                    const selectedCat = categories.find(c => c.name === form.category)
                                    const subs = selectedCat?.subcategories || []
                                    if (subs.length === 0) return null
                                    return (
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-foreground">Subcategory</label>
                                            <select value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })} className="w-full h-10 px-3 bg-white border border-border rounded-xl text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                                                <option value="">None</option>
                                                {subs.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
                                            </select>
                                        </div>
                                    )
                                })()}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-foreground">Price *</label>
                                        <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="₹10,000" className="w-full h-10 px-3 bg-white border border-border rounded-xl text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono" required />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-foreground">Rating</label>
                                        <input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} placeholder="4.5" className="w-full h-10 px-3 bg-white border border-border rounded-xl text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                                    </div>
                                </div>

                                {/* Image Upload */}
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-foreground">Product Image</label>
                                    <div className="flex items-center gap-3">
                                        {imagePreview && (
                                            <img src={imagePreview} alt="Preview" className="w-16 h-16 rounded-xl object-cover border border-border bg-muted" />
                                        )}
                                        <label className="flex-1 h-20 border-2 border-dashed border-border bg-muted/40 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary">
                                            <Upload size={18} className="mb-1" />
                                            <span className="text-[11px] font-semibold">{imageFile ? imageFile.name : 'Click to upload image'}</span>
                                            <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-foreground">Description</label>
                                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Product description..." rows={2} className="w-full px-3 py-2 bg-white border border-border rounded-xl text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-all" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-foreground">Features (comma separated)</label>
                                    <input value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder="Feature 1, Feature 2" className="w-full h-10 px-3 bg-white border border-border rounded-xl text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                                </div>

                                {/* Media Type */}
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-foreground">Media Type</label>
                                    <div className="grid grid-cols-5 gap-1.5 mb-2">
                                        {['image', 'video', 'audio', '3d', 'zip'].map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setForm({ ...form, mediaType: type })}
                                                className={`py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all border ${form.mediaType === type
                                                    ? 'bg-primary border-primary text-white shadow-xs'
                                                    : 'bg-muted/60 border-border text-muted-foreground hover:bg-muted'
                                                    }`}
                                            >
                                                {type === 'image' && <Image size={13} />}
                                                {type === 'video' && <FileVideo size={13} />}
                                                {type === 'audio' && <FileAudio size={13} />}
                                                {type === '3d' && <Box size={13} />}
                                                {type === 'zip' && <Package size={13} />}
                                                {type.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>

                                    {form.mediaType !== 'image' && (
                                        <label className="h-16 border-2 border-dashed border-border bg-muted/40 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary">
                                            <Upload size={16} className="mb-0.5" />
                                            <span className="text-[11px] font-semibold">
                                                {mediaFile ? mediaFile.name : `Upload ${form.mediaType} file`}
                                            </span>
                                            <input type="file" accept={acceptMap[form.mediaType]} onChange={handleMediaSelect} className="hidden" />
                                        </label>
                                    )}
                                </div>

                                {/* Google Drive / OneDrive Link for Digital Asset */}
                                <div className="space-y-1.5 p-3 rounded-xl bg-primary/5 border border-primary/15">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-primary flex items-center gap-1.5 mb-0">
                                            <Cloud size={14} /> 3D Model Cloud Link (Google Drive / OneDrive)
                                        </label>
                                        {form.driveUrl && (
                                            <a 
                                                href={form.driveUrl} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                className="text-[11px] text-primary hover:underline flex items-center gap-1 font-bold"
                                            >
                                                Test Link <ExternalLink size={11} />
                                            </a>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <Link2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <input 
                                            value={form.driveUrl} 
                                            onChange={(e) => setForm({ ...form, driveUrl: e.target.value })} 
                                            placeholder="https://drive.google.com/drive/folders/... or https://1drv.ms/..." 
                                            className="w-full h-10 pl-9 pr-3 bg-white border border-border rounded-xl text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono" 
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground leading-normal">
                                        💡 Attach Google Drive or OneDrive folder/file link. Once payment is verified, this link is automatically emailed to customer.
                                    </p>
                                </div>

                                <button type="submit" disabled={saving} className="w-full h-11 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all mt-3 disabled:opacity-50 text-xs shadow-sm">
                                    {saving ? (
                                        <><Loader2 className="animate-spin" size={16} /> {uploading ? 'Uploading...' : 'Saving...'}</>
                                    ) : (
                                        editingId ? 'Update Product' : 'Create Product'
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
