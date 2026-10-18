import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, FolderOpen, X, Loader2, Upload, ChevronDown, ChevronRight, Tag } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'

export default function AdminCategories() {
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [showSubModal, setShowSubModal] = useState(false)
    const [form, setForm] = useState({ name: '', description: '' })
    const [subForm, setSubForm] = useState({ name: '', description: '' })
    const [selectedCategory, setSelectedCategory] = useState(null)
    const [expandedCats, setExpandedCats] = useState({})
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState('')
    const [saving, setSaving] = useState(false)

    const token = localStorage.getItem('adminToken')
    const headers = { Authorization: `Bearer ${token}` }

    const fetchCategories = async () => {
        try {
            const res = await api.get('/admin/categories', { headers })
            setCategories(res.data)
        } catch (err) {
            toast.error('Failed to fetch categories')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchCategories() }, [])

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
        const backendOrigin = (import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://svrp-1.onrender.com/api' : 'http://localhost:5000/api')).replace(/\/api\/?$/, '');
        return `${backendOrigin}${res.data.url}`
    }

    const handleCreate = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            let imageUrl = ''
            if (imageFile) {
                imageUrl = await uploadFile(imageFile)
            }
            await api.post('/admin/categories', { ...form, image: imageUrl }, { headers })
            toast.success('Category created!')
            setForm({ name: '', description: '' })
            setImageFile(null)
            setImagePreview('')
            setShowModal(false)
            fetchCategories()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this category and all its subcategories?')) return
        try {
            await api.delete(`/admin/categories/${id}`, { headers })
            toast.success('Category deleted')
            fetchCategories()
        } catch (err) {
            toast.error('Failed to delete')
        }
    }

    const handleAddSubcategory = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            await api.post(`/admin/categories/${selectedCategory._id}/subcategories`, subForm, { headers })
            toast.success('Subcategory added!')
            setSubForm({ name: '', description: '' })
            setShowSubModal(false)
            fetchCategories()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add subcategory')
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteSubcategory = async (catId, subId) => {
        if (!confirm('Delete this subcategory?')) return
        try {
            await api.delete(`/admin/categories/${catId}/subcategories/${subId}`, { headers })
            toast.success('Subcategory deleted')
            fetchCategories()
        } catch (err) {
            toast.error('Failed to delete subcategory')
        }
    }

    const toggleExpand = (id) => {
        setExpandedCats(prev => ({ ...prev, [id]: !prev[id] }))
    }

    const openSubModal = (cat) => {
        setSelectedCategory(cat)
        setSubForm({ name: '', description: '' })
        setShowSubModal(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-2xl font-bold text-foreground">Categories</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">Manage product categories & subcategories</p>
                </motion.div>
                <motion.button
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => { setShowModal(true); setForm({ name: '', description: '' }); setImageFile(null); setImagePreview('') }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-xs transition-all shadow-sm"
                >
                    <Plus size={16} /> Add Category
                </motion.button>
            </div>

            {/* Categories List */}
            {loading ? (
                <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary" size={30} /></div>
            ) : categories.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-border border-dashed">
                    <FolderOpen size={44} className="text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium text-sm">No categories yet. Create your first one!</p>
                </div>
            ) : (
                <div className="space-y-3.5">
                    {categories.map((cat, i) => (
                        <motion.div
                            key={cat._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="bg-white border border-border/80 rounded-2xl overflow-hidden hover:shadow-xs transition-all shadow-xs"
                        >
                            {/* Category Header */}
                            <div className="p-4 sm:p-5 flex items-center justify-between">
                                <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => toggleExpand(cat._id)}>
                                    {cat.image && (
                                        <img src={cat.image} alt={cat.name} className="w-12 h-12 rounded-xl object-cover border border-border bg-muted" />
                                    )}
                                    {!cat.image && (
                                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                            <FolderOpen size={22} />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2.5">
                                            <h3 className="font-bold text-foreground text-sm">{cat.name}</h3>
                                            <span className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-md font-semibold border border-border/60">
                                                {cat.subcategories?.length || 0} sub
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-md">{cat.description || 'No description'}</p>
                                    </div>
                                    <motion.div
                                        animate={{ rotate: expandedCats[cat._id] ? 180 : 0 }}
                                        className="text-muted-foreground"
                                    >
                                        <ChevronDown size={18} />
                                    </motion.div>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                    <button
                                        onClick={() => openSubModal(cat)}
                                        className="px-2.5 py-1.5 text-primary hover:bg-primary/10 rounded-lg transition-all text-xs font-semibold flex items-center gap-1.5 border border-primary/20"
                                    >
                                        <Plus size={14} /> Sub
                                    </button>
                                    <button
                                        onClick={() => handleDelete(cat._id)}
                                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Subcategories (Expanded) */}
                            <AnimatePresence>
                                {expandedCats[cat._id] && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="border-t border-border px-5 py-4 bg-muted/20">
                                            {(!cat.subcategories || cat.subcategories.length === 0) ? (
                                                <p className="text-muted-foreground text-xs py-3 text-center font-medium">No subcategories yet</p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {cat.subcategories.map((sub) => (
                                                        <div key={sub._id} className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-card border border-border hover:border-primary/40 transition-all group">
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                                                                    <Tag size={14} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs sm:text-sm font-bold text-foreground">{sub.name}</p>
                                                                    {sub.description && <p className="text-[11px] text-muted-foreground mt-0.5">{sub.description}</p>}
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => handleDeleteSubcategory(cat._id, sub._id)}
                                                                className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <button
                                                onClick={() => openSubModal(cat)}
                                                className="mt-3 w-full py-2.5 border border-dashed border-border rounded-xl text-muted-foreground text-xs font-semibold hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Plus size={14} /> Add Subcategory
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Create Category Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl"
                        >
                            <div className="flex items-center justify-between mb-5 border-b border-border pb-3.5">
                                <h2 className="text-lg font-bold text-foreground">New Category</h2>
                                <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground p-1 transition-colors"><X size={18} /></button>
                            </div>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground/80">Name *</label>
                                    <input
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="e.g. Locomotives, Rolling Stock"
                                        className="w-full h-10 px-3.5 bg-background border border-border rounded-xl text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground/80">Description</label>
                                    <input
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        placeholder="Brief description"
                                        className="w-full h-10 px-3.5 bg-background border border-border rounded-xl text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground/80">Category Image</label>
                                    <div className="flex items-center gap-4">
                                        {imagePreview && (
                                            <img src={imagePreview} alt="Preview" className="w-16 h-16 rounded-xl object-cover border border-border bg-muted" />
                                        )}
                                        <label className="flex-1 h-20 border-2 border-dashed border-border bg-muted/20 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary">
                                            <Upload size={18} className="mb-1" />
                                            <span className="text-xs font-semibold">{imageFile ? imageFile.name : 'Click to upload'}</span>
                                            <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                                        </label>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl flex items-center justify-center gap-2 transition-all mt-4 disabled:opacity-50 shadow-xs"
                                >
                                    {saving ? <><Loader2 className="animate-spin" size={16} /> Uploading...</> : 'Create Category'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Subcategory Modal */}
            <AnimatePresence>
                {showSubModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowSubModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl"
                        >
                            <div className="flex items-center justify-between mb-5 border-b border-border pb-3.5">
                                <div>
                                    <h2 className="text-lg font-bold text-foreground">Add Subcategory</h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">Under: <span className="font-bold text-primary">{selectedCategory?.name}</span></p>
                                </div>
                                <button onClick={() => setShowSubModal(false)} className="text-muted-foreground hover:text-foreground p-1 transition-colors"><X size={18} /></button>
                            </div>
                            <form onSubmit={handleAddSubcategory} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground/80">Subcategory Name *</label>
                                    <input
                                        value={subForm.name}
                                        onChange={(e) => setSubForm({ ...subForm, name: e.target.value })}
                                        placeholder="e.g. Diesel, Electric"
                                        className="w-full h-10 px-3.5 bg-background border border-border rounded-xl text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground/80">Description (optional)</label>
                                    <input
                                        value={subForm.description}
                                        onChange={(e) => setSubForm({ ...subForm, description: e.target.value })}
                                        placeholder="Brief description"
                                        className="w-full h-10 px-3.5 bg-background border border-border rounded-xl text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl flex items-center justify-center gap-2 transition-all mt-4 disabled:opacity-50 shadow-xs"
                                >
                                    {saving ? <Loader2 className="animate-spin" size={16} /> : 'Add Subcategory'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
