import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react'
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

export default function UpdatePasswordPage() {
    const navigate = useNavigate()
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: ''
    })

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (formData.password !== formData.confirmPassword) {
            return toast.error('Passwords do not match.')
        }
        if (formData.password.length < 8) {
            return toast.error('Password must be at least 8 characters long.')
        }
        setIsLoading(true)
        try {
            await api.post('/update-password', {
                email: formData.email,
                password: formData.password
            })
            setIsSubmitted(true)
            toast.success('Password updated successfully.')
        } catch (error) {
            toast.error(error.response?.data?.message || 'Update failed.')
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
            <motion.div variants={itemVariants} className="mb-8">
                <h2 className="text-primary mb-2">{isSubmitted ? "Password Updated" : "Reset Password"}</h2>
                <p className="text-sm font-medium text-muted-foreground">
                    {isSubmitted 
                        ? "Your password has been changed successfully." 
                        : "Enter your registered email and choose a new password."}
                </p>
            </motion.div>

            {!isSubmitted ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email Field */}
                    <motion.div variants={itemVariants} className="space-y-2">
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

                    {/* New Password */}
                    <motion.div variants={itemVariants} className="space-y-2">
                        <label>New Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                className="skeuo-input pr-16"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/60 hover:text-primary transition-colors p-2"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </motion.div>

                    {/* Confirm Password */}
                    <motion.div variants={itemVariants} className="space-y-2">
                        <label>Confirm Password</label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="••••••••"
                                className="skeuo-input pr-16"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/60 hover:text-primary transition-colors p-2"
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                            {isLoading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                            {isLoading ? "Updating..." : "Update Password"}
                        </button>
                    </motion.div>
                </form>
            ) : (
                <motion.div variants={itemVariants} className="skeuo-card bg-primary/5 p-8 border border-border/40 text-center space-y-4">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm text-emerald-600">
                        <CheckCircle2 size={32} />
                    </div>
                    <p className="font-bold text-primary text-base">Your password has been changed</p>
                    <p className="text-xs text-muted-foreground">
                        You can now sign in using your new credentials.
                    </p>
                    <div className="pt-4">
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="w-full skeuo-button skeuo-button-primary"
                        >
                            Proceed to Sign In
                        </button>
                    </div>
                </motion.div>
            )}

            <motion.div variants={itemVariants} className="text-center pt-6 border-t border-border/40 mt-8">
                <Link to="/login" className="inline-flex items-center gap-2 text-primary font-bold hover:text-secondary transition-all text-sm">
                    <ArrowLeft size={16} />
                    <span>Back to Sign In</span>
                </Link>
            </motion.div>
        </motion.div>
    )
}
