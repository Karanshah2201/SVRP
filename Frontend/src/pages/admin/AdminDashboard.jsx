import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Package, FolderOpen, Mail, Users, ShoppingBag, IndianRupee, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '@/lib/api'

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
}

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
}

const StatCard = ({ icon: Icon, label, value, change, changeType }) => (
    <motion.div
        variants={item}
        whileHover={{ y: -3, boxShadow: "0 8px 20px -4px rgba(74, 20, 140, 0.1)" }}
        className="bg-white border border-border/80 rounded-2xl p-5 transition-all group relative overflow-hidden shadow-xs"
    >
        <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full -mr-3 -mt-3 transition-transform group-hover:scale-110" />

        <div className="relative z-10 flex items-center justify-between mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-muted/60 text-primary border border-border/60 group-hover:border-primary/30 transition-colors shadow-xs`}>
                <Icon size={19} className="group-hover:scale-105 transition-transform" />
            </div>
            {change && (
                <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${changeType === 'up' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                    }`}>
                    {changeType === 'up' ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                    {change}
                </div>
            )}
        </div>
        <p className="relative z-10 text-2xl font-bold text-foreground tracking-tight font-mono">{value}</p>
        <p className="relative z-10 text-[11px] text-muted-foreground font-semibold mt-0.5 uppercase tracking-wider">{label}</p>
    </motion.div>
)

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 shadow-xl">
                <p className="text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">{label}</p>
                {payload.map((entry, i) => (
                    <p key={i} className="text-xs font-bold flex items-center gap-2 text-white">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        {entry.name === 'revenue' ? `₹${entry.value.toLocaleString()}` : entry.value}
                        <span className="text-slate-400 text-[10px] font-medium ml-1">
                            {entry.name === 'revenue' ? 'Revenue' : 'Sales'}
                        </span>
                    </p>
                ))}
            </div>
        )
    }
    return null
}

export default function AdminDashboard() {
    const navigate = useNavigate()
    const [stats, setStats] = useState({ products: 0, categories: 0, contacts: 0, users: 0 })
    const [orders, setOrders] = useState([])

    const token = localStorage.getItem('adminToken')

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, ordersRes, publicStatsRes] = await Promise.all([
                    api.get('/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
                    api.get('/admin/orders', { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
                    api.get('/public/stats')
                ])
                setStats({ ...statsRes.data, ...publicStatsRes.data }) // Merge stats
                setOrders(ordersRes.data)
            } catch (error) {
                console.error('Failed to fetch stats:', error)
            }
        }
        fetchData()
    }, [])

    const totalRevenue = orders
        .filter(o => o.status === 'Approved')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0)


    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard Overview</h1>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">
                        Welcome back to your command center
                    </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-primary bg-white px-3.5 py-1.5 rounded-xl border border-border shadow-xs self-start sm:self-auto">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    System Operational
                </div>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
            >
                <StatCard icon={Package} label="Total Products" value={stats.products || 0} change="+12%" changeType="up" />
                <StatCard icon={FolderOpen} label="Categories" value={stats.categories || 0} />
                <StatCard icon={ShoppingBag} label="Total Orders" value={orders.length} change="+24%" changeType="up" />
                <StatCard icon={IndianRupee} label="Total Revenue" value={`₹${totalRevenue.toLocaleString()}`} change="+32%" changeType="up" />
                <StatCard icon={Users} label="Registered Users" value={stats.users || 0} change="+8%" changeType="up" />
                <StatCard icon={Mail} label="New Messages" value={stats.contacts || 0} />
            </motion.div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Main Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="xl:col-span-2 bg-white border border-border/80 rounded-2xl p-6 shadow-xs relative overflow-hidden"
                >
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="text-base font-bold text-foreground">Performance Analytics</h2>
                            <p className="text-xs text-muted-foreground font-medium mt-0.5">Real-time sales & revenue data</p>
                        </div>
                        <select className="bg-muted/60 border border-border text-foreground text-xs font-semibold rounded-lg px-2.5 py-1.5 outline-none focus:border-primary">
                            <option>This Week</option>
                            <option>This Month</option>
                            <option>This Year</option>
                        </select>
                    </div>

                    <div className="h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.salesAreaChartData || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4a148c" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#4a148c" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ff8f00" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#ff8f00" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#94a3b8"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    yAxisId="left"
                                    stroke="#94a3b8"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    dx={-10}
                                />
                                <YAxis yAxisId="right" orientation="right" hide />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#4a148c', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                <Area
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="sales"
                                    stroke="#4a148c"
                                    strokeWidth={3}
                                    fill="url(#salesGradient)"
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                                <Area
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#ff8f00"
                                    strokeWidth={3}
                                    fill="url(#revenueGradient)"
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Top Products */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white border border-border/80 rounded-2xl p-6 shadow-xs relative overflow-hidden flex flex-col"
                >
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="text-base font-bold text-foreground">Top Products</h2>
                            <p className="text-xs text-muted-foreground font-medium mt-0.5">Best selling items this month</p>
                        </div>
                    </div>

                    <div className="space-y-3 relative z-10 flex-1 overflow-y-auto overflow-x-hidden pr-2 custom-scrollbar">
                        {stats.productBreakdown?.slice(0, 5).map((product, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.08, duration: 0.25 }}
                                className="flex items-center gap-3.5 p-3 rounded-xl bg-muted/40 border border-border/60 hover:bg-muted/70 transition-colors cursor-default group"
                            >
                                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                                    {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-xs truncate text-foreground">{product.name}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{product.category}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="font-bold text-emerald-600 text-xs">{product.sold}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Sold</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {!stats.productBreakdown?.length && (
                        <div className="text-center py-10 text-muted-foreground text-xs font-medium">No sales data available</div>
                    )}
                </motion.div>
            </div>

            {/* Recent Orders Table */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-6 bg-card border border-border rounded-2xl p-6 shadow-xs"
            >
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-foreground">Recent Transactions</h2>
                        <p className="text-xs text-muted-foreground font-medium mt-0.5">Latest orders pending verification</p>
                    </div>
                    <button
                        onClick={() => navigate('/admin/orders')}
                        className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold rounded-xl transition-colors border border-border"
                    >
                        View All Orders
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-3 pl-4">ID</th>
                                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-3">Customer</th>
                                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-3">Amount</th>
                                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-3">Status</th>
                                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-3 pr-4">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {orders.slice(0, 5).map((order) => (
                                <tr key={order._id} className="group hover:bg-muted/40 transition-colors">
                                    <td className="py-3.5 pl-4 text-xs font-mono font-semibold text-primary">
                                        #{order._id.slice(-6).toUpperCase()}
                                    </td>
                                    <td className="py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xs font-bold border border-primary/20">
                                                {order.email.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-xs sm:text-sm font-semibold text-foreground">{order.email.split('@')[0]}</p>
                                                <p className="text-[11px] text-muted-foreground">{order.mobile}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3.5 text-xs sm:text-sm font-semibold text-foreground">
                                        ₹{order.totalAmount?.toLocaleString()}
                                    </td>
                                    <td className="py-3.5">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${order.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                                            order.status === 'Rejected' ? 'bg-destructive/10 text-destructive border border-destructive/20' :
                                                'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${order.status === 'Approved' ? 'bg-emerald-500' :
                                                order.status === 'Rejected' ? 'bg-destructive' :
                                                    'bg-amber-500'
                                                }`} />
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="py-3.5 pr-4 text-right text-xs font-medium text-muted-foreground">
                                        {new Date(order.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div >
    )
}
