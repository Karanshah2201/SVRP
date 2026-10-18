import { motion } from 'framer-motion'
import { Mail, MapPin, Phone, Send, Loader2, MessageSquare, Clock, Headphones, ArrowUpRight } from 'lucide-react'
import Navbar from '../components/Navbar'
import { useState } from 'react'
import api from '@/lib/api'
import { toast } from 'sonner'
import SmoothScroll from '../components/animations/SmoothScroll'
import { MaskText } from '../components/animations/MaskText'
import Magnetic from '../components/animations/Magnetic'
import StackingSection from '../components/animations/StackingSection'
import Footer from '../components/Footer'

export default function ContactPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            await api.post('/contact', formData)
            toast.success('Message sent successfully!')
            setFormData({ name: '', email: '', subject: '', message: '' })
        } catch (error) {
            toast.error('Failed to send message.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <SmoothScroll>
            <div className="min-h-screen bg-background text-foreground relative selection:bg-primary/20 selection:text-primary font-sans">
                <Navbar />

                {/* Section 1: Intro & Quick Info - Light Theme */}
                <StackingSection id="contact-intro" className="z-10 bg-background pt-20">
                    <div className="relative h-full flex flex-col justify-center max-w-7xl mx-auto px-6">
                        {/* Background Blobs - Animated like Landing */}
                        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                            <motion.div
                                animate={{
                                    scale: [1, 1.1, 0.9, 1],
                                    opacity: [0.3, 0.5, 0.3],
                                    rotate: [0, 45, -45, 0]
                                }}
                                transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px]  rounded-full blur-[100px]"
                            />
                            <motion.div
                                animate={{
                                    scale: [1, 0.9, 1.1, 1],
                                    opacity: [0.2, 0.4, 0.2],
                                    rotate: [0, -45, 45, 0]
                                }}
                                transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px]"
                            />
                        </div>

                        <div className="max-w-7xl mx-auto text-center relative z-10 w-full mb-10 mt-10">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                                className="inline-flex items-center gap-2 px-5 py-2 bg-card/80 backdrop-blur-md border border-border rounded-full text-xs font-bold text-primary uppercase tracking-widest mb-8 shadow-xs hover:scale-105 transition-transform cursor-default"
                            >
                                <MessageSquare size={14} className="text-secondary" />
                                Get in Touch
                            </motion.div>

                            <div className="flex justify-center mb-8">
                                <MaskText className="text-center">
                                    <h1 className="text-4xl md:text-6xl font-black tracking-tight text-foreground leading-[1.15]">
                                        Let's build something <br />
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-700 to-secondary">
                                            together.
                                        </span>
                                    </h1>
                                </MaskText>
                            </div>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6, duration: 0.8 }}
                                className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed font-normal"
                            >
                                Have a question or want to discuss a project? We'd love to hear from you.
                            </motion.p>

                            {/* Quick Info Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                                {[
                                    { icon: Headphones, title: 'Support', desc: '24/7 dedicated support', color: 'text-primary', bg: 'bg-primary/10' },
                                    { icon: Clock, title: 'Response Time', desc: 'Under 2 hours', color: 'text-secondary', bg: 'bg-secondary/10' },
                                    { icon: Mail, title: 'Email Us', desc: 'hello@svrp.com', color: 'text-foreground', bg: 'bg-muted' },
                                ].map((card, i) => (
                                    <div key={card.title}>
                                        <Magnetic>
                                            <div className="flex items-center gap-4 p-5 bg-card backdrop-blur-sm rounded-2xl border border-border shadow-xs hover:shadow-sm hover:border-primary/40 transition-all group cursor-pointer h-full">
                                                <div className={`p-3 rounded-xl ${card.bg}`}>
                                                    <card.icon size={22} className={`${card.color} shrink-0 group-hover:scale-110 transition-transform duration-300`} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-foreground text-base">{card.title}</p>
                                                    <p className="text-muted-foreground text-xs font-medium">{card.desc}</p>
                                                </div>
                                            </div>
                                        </Magnetic>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </StackingSection>

                {/* Section 2: Contact Form - Theme Cohesion */}
                <StackingSection id="contact-form" className="z-20 bg-muted/30">
                    <div className="max-w-7xl mx-auto px-6 h-full flex flex-col justify-center">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-6xl mx-auto w-full">
                            {/* Contact Form */}
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
                                className="bg-card p-6 sm:p-8 rounded-2xl shadow-xs border border-border relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-full -mr-16 -mt-16 pointer-events-none" />

                                <div className="flex items-center gap-4 mb-6 relative z-10">
                                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                                        <Send size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-foreground text-xl">Send a Message</h3>
                                        <p className="text-xs text-muted-foreground font-medium">Fill out the form and we'll respond quickly</p>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5 group">
                                            <label className="text-xs font-semibold text-foreground/80 pl-1">Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full h-11 px-3.5 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all font-medium text-sm text-foreground placeholder:text-muted-foreground"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                        <div className="space-y-1.5 group">
                                            <label className="text-xs font-semibold text-foreground/80 pl-1">Email</label>
                                            <input
                                                type="email"
                                                required
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full h-11 px-3.5 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all font-medium text-sm text-foreground placeholder:text-muted-foreground"
                                                placeholder="john@example.com"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 group">
                                        <label className="text-xs font-semibold text-foreground/80 pl-1">Subject</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            className="w-full h-11 px-3.5 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all font-medium text-sm text-foreground placeholder:text-muted-foreground"
                                            placeholder="Project Inquiry"
                                        />
                                    </div>
                                    <div className="space-y-1.5 group">
                                        <label className="text-xs font-semibold text-foreground/80 pl-1">Message</label>
                                        <textarea
                                            rows={4}
                                            required
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            className="w-full p-3.5 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all font-medium resize-none text-sm text-foreground placeholder:text-muted-foreground"
                                            placeholder="Tell us about your project..."
                                        />
                                    </div>
                                    <div className="mt-4">
                                        <Magnetic>
                                            <button
                                                disabled={isLoading}
                                                className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl shadow-md hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-70 transition-all text-sm"
                                            >
                                                {isLoading ? (
                                                    <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={18} /> Sending...</span>
                                                ) : (
                                                    <span className="flex items-center gap-2">Send Message <Send size={16} /></span>
                                                )}
                                            </button>
                                        </Magnetic>
                                    </div>
                                </form>
                            </motion.div>

                            {/* Contact Info */}
                            <motion.div
                                initial={{ opacity: 0, x: 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1], delay: 0.2 }}
                                className="space-y-5 flex flex-col justify-center lg:pl-6"
                            >
                                <div className="space-y-3.5">
                                    <div className="w-full"><ContactItem icon={Mail} title="Email" content="hello@svrp.com" color="text-primary" bg="bg-primary/10" /></div>
                                    <div className="w-full"><ContactItem icon={Phone} title="Phone" content="+1 (555) 123-4567" color="text-secondary" bg="bg-secondary/10" /></div>
                                    <div className="w-full"><ContactItem icon={MapPin} title="Office" content="123 Innovation Dr, Tech City, TC 94043" color="text-foreground" bg="bg-muted" /></div>
                                </div>

                                {/* Map placeholder */}
                                <div className="h-64 bg-card rounded-2xl border border-border flex items-center justify-center overflow-hidden relative group">
                                    <div className="text-center transition-transform duration-300 group-hover:scale-105">
                                        <MapPin size={36} className="mx-auto text-muted-foreground/60 mb-2" />
                                        <p className="text-muted-foreground text-sm font-semibold">Map View</p>
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-8">
                                        <div>
                                            <Magnetic>
                                                <button className="px-5 py-2.5 bg-card border border-border rounded-xl text-xs font-semibold text-primary shadow-sm flex items-center gap-2 hover:bg-muted transition-colors">
                                                    Open in Maps <ArrowUpRight size={14} />
                                                </button>
                                            </Magnetic>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </StackingSection>

                {/* Section 3: Footer */}
                <div className="relative z-30 bg-background w-full">
                    <Footer />
                </div>
            </div>
        </SmoothScroll>
    )
}

function ContactItem({ icon: Icon, title, content, color, bg }) {
    return (
        <Magnetic>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/40 hover:shadow-xs transition-all cursor-default group w-full">
                <div className={`p-2.5 rounded-lg ${bg}`}>
                    <Icon size={20} className={`${color} shrink-0 group-hover:scale-110 transition-transform duration-300`} />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">{title}</p>
                    <p className="text-base font-bold text-foreground">{content}</p>
                </div>
            </div>
        </Magnetic>
    )
}
