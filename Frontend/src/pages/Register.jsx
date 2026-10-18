import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useState } from 'react'
import api from '@/lib/api'
import { toast } from 'sonner'

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

export default function RegisterPage() {
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        fullname: '',
        email: '',
        password: ''
    })
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            await api.post('/register', formData)
            toast.success('Account created successfully.')
            navigate('/login')
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full"
        >
            <motion.div variants={itemVariants} className="mb-5 text-left">
                <h2 className="text-2xl font-bold text-primary tracking-tight mb-1">Create Account</h2>
                <p className="text-xs text-muted-foreground font-medium">Enter your details to register as a new client.</p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-3.5">

                {/* Full Name */}
                <motion.div variants={itemVariants} className="space-y-1">
                    <label>Full Name</label>
                    <input
                        type="text"
                        placeholder="John Doe"
                        className="skeuo-input"
                        value={formData.fullname}
                        onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                        required
                    />
                </motion.div>

                {/* Email Field */}
                <motion.div variants={itemVariants} className="space-y-1">
                    <label>Email Address</label>
                    <input
                        type="email"
                        placeholder="name@example.com"
                        className="skeuo-input"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                    />
                </motion.div>

                {/* Password Field */}
                <motion.div variants={itemVariants} className="space-y-1">
                    <label>Password</label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="skeuo-input pr-12"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                </motion.div>

                {/* Submit Action */}
                <motion.div variants={itemVariants} className="pt-2">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full skeuo-button skeuo-button-primary"
                    >
                        {isLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                        {isLoading ? "Creating Account..." : "Create Account"}
                    </button>
                </motion.div>

                {/* Login Link */}
                <motion.div variants={itemVariants} className="text-center pt-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-1.5">
                        Already have an account?
                    </p>
                    <Link to="/login" className="inline-flex items-center gap-1.5 text-primary font-bold hover:text-secondary transition-colors text-xs">
                        <span>Sign In</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                    </Link>
                </motion.div>
            </form>
        </motion.div>
    )
}