import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Save, Loader2, ArrowLeft, Phone, Lock, ShieldCheck, ShoppingBag } from 'lucide-react'
import { useState, useEffect } from 'react'
import api from '@/lib/api'
import { getUser, setUser as setStoreUser } from '@/lib/authStore'
import { toast } from 'sonner'
import Navbar from '../components/Navbar'
import SmoothScroll from '../components/animations/SmoothScroll'
import Footer from '../components/Footer'

export default function ProfilePage() {
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(false)
    const [user, setUser] = useState({
        fullname: '',
        email: '',
        phoneNumber: '',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    })

    useEffect(() => {
        const storedUser = getUser()
        if (storedUser) {
            setUser(prev => ({
                ...prev,
                fullname: storedUser.fullname || '',
                email: storedUser.email || '',
                phoneNumber: storedUser.phoneNumber || ''
            }))
        } else {
            navigate('/login')
        }
    }, [navigate])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)

        if (user.newPassword && user.newPassword !== user.confirmNewPassword) {
            toast.error('New passwords do not match')
            setIsLoading(false)
            return
        }

        try {
            const storedUser = getUser()

            const payload = {
                userId: storedUser.id,
                fullname: user.fullname,
                email: user.email,
                phoneNumber: user.phoneNumber
            }

            if (user.currentPassword) payload.currentPassword = user.currentPassword
            if (user.newPassword) payload.newPassword = user.newPassword

            const response = await api.post('/update-profile', payload)

            // Update in-memory auth store
            setStoreUser(response.data.user)
            setUser(prev => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmNewPassword: ''
            }))

            toast.success('Profile updated successfully')
        } catch (error) {
            toast.error(error.response?.data?.message || 'Update failed.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <SmoothScroll>
            <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary flex flex-col">
                <Navbar />

                <main className="pt-36 pb-20 px-6 max-w-2xl mx-auto flex-grow w-full">
                    <div className="flex items-center justify-between mb-8">
                        <Link 
                            to="/products" 
                            className="inline-flex items-center gap-2 text-primary/60 hover:text-primary transition-colors text-xs font-bold uppercase tracking-wider group"
                        >
                            <div className="w-8 h-8 skeuo-card bg-white flex items-center justify-center group-hover:-translate-x-1 transition-transform border border-border/50 shadow-sm rounded-lg">
                                <ArrowLeft size={16} />
                            </div>
                            Back to Products
                        </Link>

                        <Link
                            to="/orders"
                            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all text-xs font-bold uppercase tracking-wider shadow-2xs"
                        >
                            <ShoppingBag size={14} />
                            <span>My Orders</span>
                        </Link>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="skeuo-card bg-white p-8 sm:p-10 border border-border/60 shadow-md rounded-2xl mb-8"
                    >
                        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border/40">
                            <div className="w-14 h-14 skeuo-card bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-xs">
                                <User size={28} />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-primary tracking-tight leading-none mb-1.5">My Profile</h1>
                                <p className="text-muted-foreground text-sm font-medium">Manage your personal information and password</p>
                            </div>
                        </div>

                        {/* Quick Orders Access Card */}
                        <div className="mb-8 p-4 rounded-xl bg-slate-50 border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
                                    <ShoppingBag size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-foreground">3D Models & Orders</p>
                                    <p className="text-xs text-muted-foreground">Access your purchased 3D railway files and Google Drive links</p>
                                </div>
                            </div>
                            <Link
                                to="/orders"
                                className="skeuo-button skeuo-button-primary px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl whitespace-nowrap self-start sm:self-auto inline-flex items-center gap-1.5"
                            >
                                View Orders &rarr;
                            </Link>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-mono font-black uppercase tracking-[0.15em] text-primary/80 block">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40" size={18} />
                                    <input
                                        type="text"
                                        value={user.fullname}
                                        onChange={(e) => setUser({ ...user, fullname: e.target.value })}
                                        className="w-full pl-11 pr-4 skeuo-input text-sm font-medium text-foreground h-12"
                                        placeholder="Full Name"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-mono font-black uppercase tracking-[0.15em] text-primary/80 block">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40" size={18} />
                                    <input
                                        type="email"
                                        value={user.email}
                                        onChange={(e) => setUser({ ...user, email: e.target.value })}
                                        className="w-full pl-11 pr-4 skeuo-input text-sm font-medium text-foreground h-12"
                                        placeholder="yourname@gmail.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-primary/80 block">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40" size={18} />
                                    <input
                                        type="tel"
                                        value={user.phoneNumber}
                                        onChange={(e) => setUser({ ...user, phoneNumber: e.target.value })}
                                        className="w-full pl-11 pr-4 skeuo-input text-sm font-medium text-foreground h-12"
                                        placeholder="+91 000 000 0000"
                                    />
                                </div>
                            </div>

                            <div className="border-t border-border/40 my-6 pt-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <ShieldCheck size={18} className="text-secondary" />
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
                                        Password & Security
                                    </h3>
                                </div>

                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                                            Current Password <span className="opacity-60 lowercase font-normal">(required only to update password)</span>
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40" size={18} />
                                            <input
                                                type="password"
                                                value={user.currentPassword}
                                                onChange={(e) => setUser({ ...user, currentPassword: e.target.value })}
                                                className="w-full pl-11 pr-4 skeuo-input text-sm font-medium text-foreground h-12"
                                                placeholder="Enter current password"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                                                New Password
                                            </label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40" size={18} />
                                                <input
                                                    type="password"
                                                    value={user.newPassword}
                                                    onChange={(e) => setUser({ ...user, newPassword: e.target.value })}
                                                    className="w-full pl-11 pr-4 skeuo-input text-sm font-medium text-foreground h-12"
                                                    placeholder="New password"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                                                Confirm New Password
                                            </label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40" size={18} />
                                                <input
                                                    type="password"
                                                    value={user.confirmNewPassword}
                                                    onChange={(e) => setUser({ ...user, confirmNewPassword: e.target.value })}
                                                    className="w-full pl-11 pr-4 skeuo-input text-sm font-medium text-foreground h-12"
                                                    placeholder="Confirm password"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="skeuo-button skeuo-button-primary w-full h-12 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md rounded-xl"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </main>

                <Footer />
            </div>
        </SmoothScroll>
    )
}
