import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Package, FolderOpen, Mail, LogOut, MessageSquare, ShoppingBag, Key, Activity, Menu, X } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

const sidebarLinks = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/products', icon: Package, label: '3D Products' },
    { to: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
    { to: '/admin/licenses', icon: Key, label: 'Licenses & Limits' },
    { to: '/admin/audit-logs', icon: Activity, label: 'Audit & Storage' },
    { to: '/admin/categories', icon: FolderOpen, label: 'Categories' },
    { to: '/admin/reviews', icon: MessageSquare, label: 'Reviews' },
    { to: '/admin/contacts', icon: Mail, label: 'Contacts' },
]

export default function AdminLayout() {
    const navigate = useNavigate()
    const location = useLocation()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}')

    // Automatically close sidebar on mobile navigation
    useEffect(() => {
        setSidebarOpen(false)
    }, [location.pathname])

    const handleLogout = () => {
        localStorage.removeItem('adminToken')
        localStorage.removeItem('adminUser')
        toast.success('Logged out')
        navigate('/admin/login')
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col lg:flex-row font-sans selection:bg-primary/20">
            {/* Mobile Header Bar */}
            <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#140428] border-b border-white/10 sticky top-0 z-30 shadow-md">
                <div className="flex items-center gap-2.5">
                    <div className="p-1 bg-white rounded-lg shrink-0 shadow-xs">
                        <img src="/svrp.png" alt="SVRP Admin" className="h-6 w-auto" />
                    </div>
                    <div>
                        <h2 className="font-bold text-white text-xs leading-none tracking-wider uppercase font-mono">SVRP ADMIN</h2>
                        <p className="text-[10px] text-white/60 font-medium truncate mt-0.5">Control Center</p>
                    </div>
                </div>
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    aria-label="Toggle Navigation Menu"
                    className="p-2 rounded-xl text-white/80 hover:text-white bg-white/10 hover:bg-white/15 transition-colors"
                >
                    {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </header>

            {/* Mobile Backdrop */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside
                className={`w-64 bg-[#140428] border-r border-white/10 flex flex-col fixed inset-y-0 left-0 z-40 shadow-xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {/* Logo & Close for Mobile */}
                <div className="p-5 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-white rounded-xl shrink-0 shadow-sm">
                            <img src="/svrp.png" alt="SVRP Admin" className="h-8 w-auto" />
                        </div>
                        <div className="overflow-hidden">
                            <h2 className="font-bold text-white text-xs leading-tight tracking-wider uppercase font-mono">SVRP</h2>
                            <p className="text-[10px] text-white/60 font-medium tracking-wide mt-0.5 truncate">Shri Vishwakarma Rail Production</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                        aria-label="Close sidebar"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                    {sidebarLinks.map(({ to, icon: Icon, label }) => {
                        const isActive = location.pathname.startsWith(to)
                        return (
                            <NavLink
                                key={to}
                                to={to}
                                className={`group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${isActive
                                    ? 'text-white bg-primary shadow-md shadow-primary/30'
                                    : 'text-white/60 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <Icon size={17} className={isActive ? 'text-white' : 'text-white/50 group-hover:text-white/80 transition-colors'} />
                                <span>{label}</span>
                            </NavLink>
                        )
                    })}
                </nav>

                {/* Footer (harmonized dark purple) */}
                <div className="p-3.5 border-t border-white/10 bg-[#0e021c]">
                    <div className="flex items-center gap-2.5 px-3 py-2.5 mb-2 rounded-xl bg-white/5 border border-white/10">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs border border-white/10">
                            {adminUser.fullname?.charAt(0) || 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">{adminUser.fullname || 'Administrator'}</p>
                            <p className="text-[10px] text-white/40 truncate font-mono">{adminUser.email || 'admin@svrp.com'}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-300 bg-red-500/10 hover:bg-red-500/20 transition-all w-full border border-red-500/20 hover:border-red-500/30"
                    >
                        <LogOut size={14} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:ml-64 min-h-screen p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
