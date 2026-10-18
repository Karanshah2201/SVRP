import { motion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
}

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: { type: "spring", damping: 20, stiffness: 100 }
    }
}

export default function AdminLogin() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            const response = await api.post('/admin/login', { email, password })
            localStorage.setItem('adminToken', response.data.token)
            localStorage.setItem('adminUser', JSON.stringify(response.data.user))
            toast.success('Administrator Access Verified.')
            navigate('/admin/dashboard')
        } catch (error) {
            toast.error(error.response?.data?.message || 'Access Denied. Credentials Invalid.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden selection:bg-primary/10">
            
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none opacity-25">
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/15 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-secondary/15 rounded-full blur-3xl" />
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="w-full max-w-[440px] relative z-10 py-6 my-auto"
            >
                {/* Header Section */}
                <motion.div variants={itemVariants} className="text-center mb-5">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="skeuo-card p-3 bg-white inline-block mb-2.5 mx-auto shadow-md border-border/80"
                    >
                        <img src="/svrp.png" alt="SVRP" className="h-10 w-auto" />
                    </motion.div>
                    <p className="text-[11px] font-mono font-bold text-primary/80 uppercase tracking-[0.2em]">Institutional Admin Portal</p>
                </motion.div>

                {/* Secure Form Card */}
                <motion.div variants={itemVariants} className="skeuo-card p-6 sm:p-8 bg-white border border-border/70 relative overflow-hidden shadow-lg">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                    
                    <div className="mb-5 text-left">
                        <h2 className="text-2xl font-bold text-primary tracking-tight mb-1">Admin Access</h2>
                        <p className="text-xs text-muted-foreground font-medium">Enter your administrative credentials to continue.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <label>Admin Identifier</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@svrp.com"
                                className="skeuo-input"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label>Secure Key</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="skeuo-input pr-12"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors p-1.5"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full skeuo-button skeuo-button-primary"
                            >
                                {isLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                                {isLoading ? "Verifying Access..." : "Sign In to Dashboard"}
                            </button>
                        </div>
                    </form>
                </motion.div>

                {/* Footer Disclaimer */}
                <motion.footer variants={itemVariants} className="mt-5 text-center">
                    <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-white/80 rounded-full border border-border/60 shadow-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                        <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider font-mono">
                            SVRP Production Console v4.2
                        </span>
                    </div>
                </motion.footer>
            </motion.div>
        </div>
    )
}
