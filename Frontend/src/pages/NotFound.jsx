import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
    return (
        <div className="min-h-[75vh] flex items-center justify-center px-4">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="max-w-md w-full text-center space-y-6"
            >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 text-primary font-mono text-3xl font-extrabold">
                    404
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                        Page Not Found
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        The railway route you are looking for does not exist or has been relocated.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <Link
                        to="/"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition shadow-sm"
                    >
                        <Home size={16} />
                        Back to Home
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-border text-foreground text-sm font-semibold hover:bg-muted transition"
                    >
                        <ArrowLeft size={16} />
                        Go Back
                    </button>
                </div>
            </motion.div>
        </div>
    )
}

