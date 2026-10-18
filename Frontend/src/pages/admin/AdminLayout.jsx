import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Package, FolderOpen, Mail, LogOut, Shield, MessageSquare, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

const sidebarLinks = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/products', icon: Package, label: 'Products' },
    { to: '/admin/categories', icon: FolderOpen, label: 'Categories' },
    { to: '/admin/reviews', icon: MessageSquare, label: 'Reviews' },
    { to: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
    { to: '/admin/contacts', icon: Mail, label: 'Contacts' },
]

export default function AdminLayout() {
    const navigate = useNavigate()
    const location = useLocation()
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}')

    const handleLogout = () => {
        localStorage.removeItem('adminToken')
        localStorage.removeItem('adminUser')
        toast.success('Logged out')
        navigate('/admin/login')
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] flex font-sans selection:bg-primary/20">
            {/* Sidebar */}
            <aside className="w-64 bg-[#140428] border-r border-white/10 flex flex-col fixed h-full z-20 shadow-xl">
                {/* Logo */}
                <div className="p-5 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-white rounded-xl shrink-0 shadow-sm">
                            <img src="/svrp.png" alt="SVRP Admin" className="h-8 w-auto" />
                        </div>
                        <div className="overflow-hidden">
                            <h2 className="font-bold text-white text-xs leading-tight tracking-wide uppercase font-mono">SHREE VISWAKARMA</h2>
                            <p className="text-[10px] text-white/50 font-medium tracking-wider uppercase mt-0.5">Rail Admin Console</p>
                        </div>
                    </div>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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

                {/* Footer (harmonized dark purple, no green clash) */}
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
            <main className="flex-1 ml-64 min-h-screen p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
