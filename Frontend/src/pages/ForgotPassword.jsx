import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Mail, Loader2, ArrowLeft } from 'lucide-react'
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

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            await api.post('/forgot-password', { email })
            setIsSubmitted(true)
            toast.success('Password reset link sent to your email.')
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send reset link.')
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
                <h2 className="text-2xl font-bold text-primary tracking-tight mb-1">Forgot Password</h2>
                <p className="text-xs text-muted-foreground font-medium">
                    {isSubmitted 
                        ? "A password reset link has been sent to your email address." 
                        : "Enter your registered email address to receive password reset instructions."}
                </p>
            </motion.div>

            {!isSubmitted ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <motion.div variants={itemVariants} className="space-y-1">
                        <label>Email Address</label>
                        <input
                            type="email"
                            placeholder="name@example.com"
                            className="skeuo-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </motion.div>

                    <motion.div variants={itemVariants} className="pt-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full skeuo-button skeuo-button-primary"
                        >
                            {isLoading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                            {isLoading ? "Sending Link..." : "Send Reset Link"}
                        </button>
                    </motion.div>
                </form>
            ) : (
                <motion.div variants={itemVariants} className="skeuo-card bg-primary/5 p-8 border border-border/40 text-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
                        <Mail className="text-primary" size={28} />
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Sent to</p>
                    <p className="font-bold text-primary text-base break-all mb-4">{email}</p>
                    <p className="text-xs text-muted-foreground">
                        Please check your inbox and spam folder for instructions to reset your password.
                    </p>
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