import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Phone, Facebook, Twitter, Instagram, Linkedin, ArrowUpRight, ShieldCheck, MapPin } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export default function Footer() {
    const [newsletterEmail, setNewsletterEmail] = useState('')

    const handleNewsletterSubmit = (e) => {
        e.preventDefault()
        if (!newsletterEmail || !newsletterEmail.includes('@')) {
            toast.error('Please enter a valid email address')
            return
        }
        toast.success('Terminal transmission subscribed successfully')
        setNewsletterEmail('')
    }

    return (
        <footer className="w-full border-t border-border/50 bg-gradient-to-b from-background via-slate-50/70 to-slate-100/90 text-foreground pt-20 pb-12 mt-auto relative overflow-hidden transition-colors">
            {/* Subtle industrial blueprint grid background */}
            <div 
                className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                style={{ 
                    backgroundImage: 'linear-gradient(to right, #4a148c 1px, transparent 1px), linear-gradient(to bottom, #4a148c 1px, transparent 1px)', 
                    backgroundSize: '36px 36px' 
                }} 
            />

            <div className="max-w-7xl mx-auto px-6 sm:px-10 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-16 mb-16">
                    
                    {/* Brand Section */}
                    <div className="col-span-1 md:col-span-1">
                        <Link to="/" className="flex items-center gap-3.5 mb-6 group">
                            <motion.div 
                                whileHover={{ rotate: 8, scale: 1.05 }}
                                className="skeuo-card p-2 bg-white border border-primary/10 shadow-sm"
                            >
                                <img src="/svrp.png" alt="SVRP" className="h-8 w-auto grayscale group-hover:grayscale-0 transition-all duration-300" />
                            </motion.div>
                            <div className="flex flex-col">
                                <span className="text-primary font-black text-xl tracking-tight uppercase leading-none">SVRP</span>
                                <span className="text-[11px] font-mono font-black text-secondary tracking-[0.2em] leading-none mt-1">RAIL WORKS</span>
                            </div>
                        </Link>
                        <p className="text-muted-foreground text-sm font-medium leading-relaxed mb-8">
                            The definitive industrial engineering and rail asset marketplace. High-precision 3D digital infrastructure and rolling stock architecture at scale.
                        </p>
                        <div className="flex items-center gap-3">
                            {[
                                { Icon: Facebook, href: "https://facebook.com", label: "Facebook" },
                                { Icon: Twitter, href: "https://twitter.com", label: "Twitter" },
                                { Icon: Instagram, href: "https://instagram.com", label: "Instagram" },
                                { Icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" }
                            ].map(({ Icon, href, label }, i) => (
                                <motion.a 
                                    key={i}
                                    whileHover={{ y: -3, scale: 1.08 }}
                                    whileTap={{ scale: 0.95 }}
                                    href={href} 
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label={label}
                                    className="w-10 h-10 skeuo-card bg-white flex items-center justify-center text-primary/60 hover:text-primary transition-all border border-border/50 shadow-sm hover:shadow-md"
                                >
                                    <Icon size={16} />
                                </motion.a>
                            ))}
                        </div>
                    </div>

                    {/* Navigation Column */}
                    <div>
                        <h4 className="text-primary font-black uppercase text-xs tracking-[0.2em] mb-6 font-mono">
                            System Map
                        </h4>
                        <ul className="space-y-3.5">
                            {[
                                { label: 'Asset Catalog', path: '/products' },
                                { label: 'About SVRP', path: '/about' },
                                { label: 'Support & Inquiries', path: '/contact' },
                                { label: 'Orders & Shipments', path: '/orders' },
                                { label: 'User Console', path: '/profile' }
                            ].map((item) => (
                                <li key={item.label}>
                                    <Link 
                                        to={item.path} 
                                        className="text-muted-foreground hover:text-primary font-semibold text-sm transition-all flex items-center gap-2.5 group"
                                    >
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/20 group-hover:bg-secondary group-hover:scale-125 transition-all" />
                                        <span>{item.label}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Column */}
                    <div>
                        <h4 className="text-primary font-black uppercase text-xs tracking-[0.2em] mb-6 font-mono">
                            Support Terminal
                        </h4>
                        <ul className="space-y-6">
                            <li className="flex items-start gap-3.5">
                                <div className="w-10 h-10 skeuo-card bg-white flex items-center justify-center text-primary/70 shrink-0 border border-border/50 shadow-sm">
                                    <Mail size={16} />
                                </div>
                                <div>
                                    <p className="text-[11px] text-muted-foreground font-black uppercase tracking-widest leading-none mb-1.5 font-mono">Main Channel</p>
                                    <a href="mailto:contact@svrp.rail" className="text-sm font-bold text-primary hover:text-secondary transition-colors">contact@svrp.rail</a>
                                </div>
                            </li>
                            <li className="flex items-start gap-3.5">
                                <div className="w-10 h-10 skeuo-card bg-white flex items-center justify-center text-primary/70 shrink-0 border border-border/50 shadow-sm">
                                    <Phone size={16} />
                                </div>
                                <div>
                                    <p className="text-[11px] text-muted-foreground font-black uppercase tracking-widest leading-none mb-1.5 font-mono">Direct Line</p>
                                    <a href="tel:+910000000000" className="text-sm font-bold text-primary hover:text-secondary transition-colors">+91 000 000 0000</a>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter Column */}
                    <div>
                        <h4 className="text-primary font-black uppercase text-xs tracking-[0.2em] mb-6 font-mono">
                            Transmissions
                        </h4>
                        <p className="text-sm text-muted-foreground font-medium mb-5 leading-relaxed">
                            Subscribe for localized asset release notifications, blueprint specifications, and network updates.
                        </p>
                        <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                            <input 
                                type="email" 
                                required
                                value={newsletterEmail}
                                onChange={(e) => setNewsletterEmail(e.target.value)}
                                placeholder="Terminal Address" 
                                className="flex-1 skeuo-input text-xs font-mono font-medium h-11 px-4"
                            />
                            <button 
                                type="submit"
                                aria-label="Subscribe"
                                className="skeuo-button skeuo-button-primary w-11 h-11 p-0 flex items-center justify-center shrink-0 rounded-xl"
                            >
                                <ArrowUpRight size={16} />
                            </button>
                        </form>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-[0.2em] font-mono">
                            © 2026 SVRP RAIL WORKS PRODUCTION [INSTITUTIONAL]
                        </p>
                    </div>
                    <div className="flex items-center gap-8">
                        <Link to="/about" className="text-[11px] text-muted-foreground hover:text-primary font-bold uppercase tracking-widest transition-colors font-mono">
                            Privacy Protocol
                        </Link>
                        <Link to="/about" className="text-[11px] text-muted-foreground hover:text-primary font-bold uppercase tracking-widest transition-colors font-mono">
                            Terms of Use
                        </Link>
                        <Link to="/contact" className="text-[11px] text-muted-foreground hover:text-primary font-bold uppercase tracking-widest transition-colors font-mono">
                            Support
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
