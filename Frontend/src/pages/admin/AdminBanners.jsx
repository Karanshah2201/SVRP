import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Edit3, X, Loader2, Upload, Sparkles, Eye, CheckCircle2, XCircle, ArrowUpRight, Box, Tag, Percent, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'

const emptyForm = {
    title: '',
    subtitle: '',
    badge: 'Featured 3D Model',
    discount: '',
    productId: '',
    productName: '',
    image: '',
    ctaText: 'View 3D Model',
    ctaLink: '/products',
    isActive: true,
    displayOrder: 0
}

const PRESET_BADGES = [
    'Featured 3D Model',
    'Exclusive Discount',
    'New Release',
    'Special Promo',
    'Industrial Grade',
    'Limited Time Offer'
]

export default function AdminBanners() {
    const [banners, setBanners] = useState([])
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [form, setForm] = useState(emptyForm)
    const [editingId, setEditingId] = useState(null)
    const [saving, setSaving] = useState(false)
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState('')
    const [uploading, setUploading] = useState(false)

    const token = localStorage.getItem('adminToken')
    const headers = { Authorization: `Bearer ${token}` }

    const fetchBanners = async () => {
        try {
            const res = await api.get('/admin/banners', { headers })
            setBanners(res.data)
        } catch (err) {
            toast.error('Failed to fetch hero promotional banners')
        } finally {
            setLoading(false)
        }
    }

    const fetchProducts = async () => {
        try {
            const res = await api.get('/admin/products', { headers })
            setProducts(res.data)
        } catch (err) {
            // non-blocking
        }
    }

    useEffect(() => {
        fetchBanners()
        fetchProducts()
    }, [])

    const openCreate = () => {
        setForm({
            ...emptyForm,
            displayOrder: (banners.length + 1)
        })
        setEditingId(null)
        setImageFile(null)
        setImagePreview('')
        setShowModal(true)
    }

    const openEdit = (banner) => {
        setForm({
            title: banner.title || '',
            subtitle: banner.subtitle || '',
            badge: banner.badge || 'Featured 3D Model',
            discount: banner.discount || '',
            productId: banner.productId ? String(banner.productId) : '',
            productName: banner.productName || '',
            image: banner.image || '',
            ctaText: banner.ctaText || 'View 3D Model',
            ctaLink: banner.ctaLink || '/products',
            isActive: banner.isActive !== false,
            displayOrder: banner.displayOrder || 0
        })
        setEditingId(banner._id)
        setImageFile(null)
        setImagePreview(banner.image || '')
        setShowModal(true)
    }

    const handleProductSelect = (e) => {
        const prodId = e.target.value
        if (!prodId) {
            setForm(prev => ({
                ...prev,
                productId: '',
                productName: '',
                ctaLink: '/products'
            }))
            return
        }

        const selected = products.find(p => String(p.id) === String(prodId))
        if (selected) {
            setForm(prev => ({
                ...prev,
                productId: selected.id,
                productName: selected.name,
                title: prev.title ? prev.title : selected.name,
                image: prev.image ? prev.image : (selected.image || ''),
                ctaLink: `/product/${selected.id}`
            }))
            if (!imagePreview && selected.image) {
                setImagePreview(selected.image)
            }
        }
    }

    const handleImageSelect = (e) => {
        const file = e.target.files[0]
        if (file) {
            setImageFile(file)
            setImagePreview(URL.createObjectURL(file))
        }
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
        const backendOrigin = (import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://svrp-1.onrender.com/api' : 'http://localhost:5000/api')).replace(/\/api\/?$/, '')
        return `${backendOrigin}${res.data.url}`
    }

    const handleSave = async (e) => {
        e.preventDefault()
        if (!form.title.trim()) {
            toast.error('Banner title is required')
            return
        }

        setSaving(true)
        try {
            let finalImageUrl = form.image

            if (imageFile) {
                setUploading(true)
                finalImageUrl = await uploadFile(imageFile)
                setUploading(false)
            }

            const payload = {
                ...form,
                image: finalImageUrl,
                displayOrder: Number(form.displayOrder) || 0,
                productId: form.productId ? Number(form.productId) : null
            }

            if (editingId) {
                const res = await api.put(`/admin/banners/${editingId}`, payload, { headers })
                setBanners(prev => prev.map(b => (b._id === editingId ? res.data.banner : b)))
                toast.success('Hero banner updated successfully')
            } else {
                const res = await api.post('/admin/banners', payload, { headers })
                setBanners(prev => [...prev, res.data.banner])
                toast.success('New hero promotional banner created')
            }

            setShowModal(false)
            fetchBanners()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save banner')
        } finally {
            setSaving(false)
            setUploading(false)
        }
    }

    const handleToggleActive = async (banner) => {
        try {
            const nextActive = !banner.isActive
            const res = await api.put(`/admin/banners/${banner._id}`, { isActive: nextActive }, { headers })
            setBanners(prev => prev.map(b => (b._id === banner._id ? res.data.banner : b)))
            toast.success(`Banner set to ${nextActive ? 'Active' : 'Inactive'}`)
        } catch (err) {
            toast.error('Failed to update status')
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this promotional banner?')) return
        try {
            await api.delete(`/admin/banners/${id}`, { headers })
            setBanners(prev => prev.filter(b => b._id !== id))
            toast.success('Banner deleted')
        } catch (err) {
            toast.error('Failed to delete banner')
        }
    }

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/80">
                <div>
                    <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-widest font-bold mb-1">
                        <Sparkles size={14} className="text-secondary" />
                        <span>Homepage Control</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Hero Promotional Banners</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Manage dynamic promotional slides, exclusive discount badges, and featured 3D models shown on the homepage.
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="skeuo-button skeuo-button-primary h-11 px-5 rounded-xl flex items-center gap-2 text-xs font-bold uppercase tracking-wider shrink-0"
                >
                    <Plus size={16} />
                    <span>Create New Banner</span>
                </button>
            </div>

            {/* Quick Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="admin-card p-5">
                    <span className="text-[11px] font-mono font-bold uppercase text-muted-foreground tracking-wider block mb-1">Total Banners</span>
                    <span className="text-2xl font-black text-primary font-mono">{banners.length}</span>
                </div>
                <div className="admin-card p-5">
                    <span className="text-[11px] font-mono font-bold uppercase text-muted-foreground tracking-wider block mb-1">Active on Homepage</span>
                    <span className="text-2xl font-black text-emerald-600 font-mono">
                        {banners.filter(b => b.isActive).length}
                    </span>
                </div>
                <div className="admin-card p-5">
                    <span className="text-[11px] font-mono font-bold uppercase text-muted-foreground tracking-wider block mb-1">Catalog Linked</span>
                    <span className="text-2xl font-black text-secondary font-mono">
                        {banners.filter(b => b.productId).length}
                    </span>
                </div>
            </div>

            {/* Banner List */}
            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center">
                    <Loader2 className="animate-spin text-primary" size={32} />
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-3">Loading Banners...</span>
                </div>
            ) : banners.length === 0 ? (
                <div className="admin-card p-12 text-center border-dashed border-2">
                    <Sparkles className="mx-auto text-secondary/70 mb-3" size={36} />
                    <h3 className="text-base font-bold text-foreground">No Custom Banners Yet</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                        The homepage is currently displaying automatically generated dynamic slides from your 3D product catalog. Create your first promotional banner to showcase a custom offer!
                    </p>
                    <button
                        onClick={openCreate}
                        className="skeuo-button skeuo-button-primary mt-6 h-10 px-5 text-xs font-bold uppercase tracking-wider rounded-xl inline-flex items-center gap-2"
                    >
                        <Plus size={15} /> Add First Banner
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {banners.map((banner) => (
                        <div
                            key={banner._id}
                            className={`admin-card overflow-hidden flex flex-col transition-all duration-200 ${
                                !banner.isActive ? 'opacity-65 grayscale-[30%]' : 'hover:shadow-md'
                            }`}
                        >
                            {/* Slide Thumbnail Preview */}
                            <div className="relative aspect-[16/9] bg-[#130324] overflow-hidden flex items-center justify-center">
                                {banner.image ? (
                                    <img
                                        src={banner.image}
                                        alt={banner.title}
                                        className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-white/40 gap-2">
                                        <Box size={28} />
                                        <span className="text-[10px] font-mono tracking-wider uppercase font-bold">3D Rail Render</span>
                                    </div>
                                )}

                                {/* Subtle purple/amber ambient lighting overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#130324] via-transparent to-transparent opacity-80" />

                                {/* Badge */}
                                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider font-mono bg-white/90 text-primary backdrop-blur-md shadow-xs border border-white/60">
                                        {banner.badge || 'Featured'}
                                    </span>
                                    {banner.discount && (
                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider font-mono bg-secondary text-white shadow-xs">
                                            {banner.discount}
                                        </span>
                                    )}
                                </div>

                                {/* Order & Active Pill */}
                                <div className="absolute top-3 right-3 flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-black/60 text-white backdrop-blur-md">
                                        #{banner.displayOrder || 0}
                                    </span>
                                </div>
                            </div>

                            {/* Card Content */}
                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className="font-bold text-sm text-foreground line-clamp-1 mb-1" title={banner.title}>
                                    {banner.title}
                                </h3>
                                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4 flex-1">
                                    {banner.subtitle || 'No subtitle specified'}
                                </p>

                                {banner.productName && (
                                    <div className="mb-4 p-2 rounded-lg bg-muted/50 border border-border/50 flex items-center gap-2">
                                        <Tag size={13} className="text-secondary shrink-0" />
                                        <span className="text-[11px] font-medium text-foreground truncate">
                                            Linked: <strong>{banner.productName}</strong>
                                        </span>
                                    </div>
                                )}

                                {/* Card Actions */}
                                <div className="pt-3 border-t border-border/70 flex items-center justify-between gap-2">
                                    <button
                                        onClick={() => handleToggleActive(banner)}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                            banner.isActive
                                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        {banner.isActive ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                                        <span>{banner.isActive ? 'Active' : 'Inactive'}</span>
                                    </button>

                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => openEdit(banner)}
                                            className="p-2 text-foreground/70 hover:text-primary hover:bg-muted rounded-lg transition-colors"
                                            title="Edit Banner"
                                        >
                                            <Edit3 size={15} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(banner._id)}
                                            className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                                            title="Delete Banner"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create / Edit Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl border border-border/80 w-full max-w-2xl overflow-hidden my-8"
                        >
                            {/* Modal Header */}
                            <div className="px-6 py-4 border-b border-border/80 flex items-center justify-between bg-muted/20">
                                <div className="flex items-center gap-2">
                                    <Sparkles size={18} className="text-secondary" />
                                    <h2 className="text-base font-bold text-foreground">
                                        {editingId ? 'Edit Hero Banner' : 'Create Promotional Banner'}
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
                                {/* Banner Title */}
                                <div>
                                    <label className="text-xs font-bold text-foreground uppercase tracking-wider block mb-1.5">
                                        Banner Headline / Title *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. WAP-7 High-Speed Electric Locomotive 3D Asset"
                                        value={form.title}
                                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                                        className="skeuo-input text-sm"
                                    />
                                </div>

                                {/* Subtitle / Description */}
                                <div>
                                    <label className="text-xs font-bold text-foreground uppercase tracking-wider block mb-1.5">
                                        Subtitle / Supporting Tagline
                                    </label>
                                    <textarea
                                        rows={2}
                                        placeholder="e.g. Flagship 6000 HP digital asset with driver cab interior & 4K PBR UDIM textures."
                                        value={form.subtitle}
                                        onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                                        className="w-full bg-white border border-border p-3 font-medium text-sm text-foreground rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground/50 resize-none"
                                    />
                                </div>

                                {/* Link with Product from Catalog */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-foreground uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                                            <Box size={14} className="text-primary" />
                                            <span>Link to Product (Auto-Fills)</span>
                                        </label>
                                        <select
                                            value={form.productId}
                                            onChange={handleProductSelect}
                                            className="skeuo-input text-sm cursor-pointer"
                                        >
                                            <option value="">-- Standalone / Custom Link --</option>
                                            {products.map(p => (
                                                <option key={p.id} value={p.id}>
                                                    #{p.id} - {p.name} ({p.price})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-foreground uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                                            <Percent size={14} className="text-secondary" />
                                            <span>Discount / Offer Badge</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. 25% OFF, Save ₹1,500, Special Offer"
                                            value={form.discount}
                                            onChange={(e) => setForm({ ...form, discount: e.target.value })}
                                            className="skeuo-input text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Badge & Display Order */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-foreground uppercase tracking-wider block mb-1.5">
                                            Highlight Badge Text
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Exclusive Discount, New Release"
                                            value={form.badge}
                                            onChange={(e) => setForm({ ...form, badge: e.target.value })}
                                            className="skeuo-input text-sm mb-2"
                                        />
                                        <div className="flex flex-wrap gap-1.5">
                                            {PRESET_BADGES.map((b) => (
                                                <button
                                                    key={b}
                                                    type="button"
                                                    onClick={() => setForm({ ...form, badge: b })}
                                                    className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-colors ${
                                                        form.badge === b
                                                            ? 'bg-primary text-white'
                                                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                                    }`}
                                                >
                                                    {b}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-foreground uppercase tracking-wider block mb-1.5">
                                            Display Sequence Order
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={form.displayOrder}
                                            onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
                                            className="skeuo-input text-sm"
                                        />
                                        <span className="text-[11px] text-muted-foreground mt-1 block">Lower numbers appear first on the slider</span>
                                    </div>
                                </div>

                                {/* CTA Button Settings */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-foreground uppercase tracking-wider block mb-1.5">
                                            CTA Button Label
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="View 3D Model, Claim Discount..."
                                            value={form.ctaText}
                                            onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                                            className="skeuo-input text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-foreground uppercase tracking-wider block mb-1.5">
                                            CTA Target Link
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="/product/2, /products, /register"
                                            value={form.ctaLink}
                                            onChange={(e) => setForm({ ...form, ctaLink: e.target.value })}
                                            className="skeuo-input text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Banner Visual / 3D Render Upload */}
                                <div>
                                    <label className="text-xs font-bold text-foreground uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                                        <ImageIcon size={14} className="text-primary" />
                                        <span>Banner 3D Render / Image</span>
                                    </label>

                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            placeholder="Paste Image URL (or upload below)"
                                            value={form.image}
                                            onChange={(e) => {
                                                setForm({ ...form, image: e.target.value })
                                                setImagePreview(e.target.value)
                                            }}
                                            className="skeuo-input text-sm"
                                        />

                                        <div className="flex items-center gap-3">
                                            <label className="skeuo-button skeuo-button-outline h-9 px-4 text-xs font-bold uppercase tracking-wider rounded-lg cursor-pointer inline-flex items-center gap-2">
                                                <Upload size={14} /> Upload Image
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageSelect}
                                                    className="hidden"
                                                />
                                            </label>
                                            {imageFile && (
                                                <span className="text-xs text-muted-foreground truncate max-w-xs">
                                                    {imageFile.name}
                                                </span>
                                            )}
                                        </div>

                                        {imagePreview && (
                                            <div className="relative aspect-[16/7] rounded-xl overflow-hidden bg-[#130324] border border-border/80">
                                                <img
                                                    src={imagePreview}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover opacity-90"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-[#130324] via-transparent to-transparent opacity-80" />
                                                <div className="absolute bottom-3 left-3 text-white">
                                                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary text-white">
                                                        {form.badge || 'Banner Preview'}
                                                    </span>
                                                    <h4 className="text-xs font-bold mt-1 text-white line-clamp-1">{form.title || 'Untitled Banner'}</h4>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Active Switch */}
                                <div className="flex items-center gap-3 pt-2">
                                    <input
                                        type="checkbox"
                                        id="isActiveCheckbox"
                                        checked={form.isActive}
                                        onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                                        className="w-4 h-4 text-primary rounded border-border focus:ring-primary cursor-pointer"
                                    />
                                    <label htmlFor="isActiveCheckbox" className="text-xs font-bold text-foreground cursor-pointer select-none">
                                        Activate on Homepage Slider Immediately
                                    </label>
                                </div>

                                {/* Modal Actions */}
                                <div className="pt-4 border-t border-border/80 flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="skeuo-button skeuo-button-outline h-10 px-4 text-xs font-bold uppercase tracking-wider rounded-xl"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving || uploading}
                                        className="skeuo-button skeuo-button-primary h-10 px-6 text-xs font-bold uppercase tracking-wider rounded-xl inline-flex items-center gap-2"
                                    >
                                        {(saving || uploading) && <Loader2 size={14} className="animate-spin" />}
                                        <span>{saving ? 'Saving...' : editingId ? 'Update Banner' : 'Create Banner'}</span>
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

