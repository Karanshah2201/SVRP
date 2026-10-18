import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
    Train, Users2, ShieldCheck, Globe2, Rocket,
    Award, TrendingUp, Clock, Cpu, Heart, Target, ArrowRight, Sparkles
} from 'lucide-react'
import Navbar from '../components/Navbar'
import SmoothScroll from '../components/animations/SmoothScroll'
import { MaskText } from '../components/animations/MaskText'
import StackingSection from '../components/animations/StackingSection'
import Footer from '../components/Footer'


export default function AboutPage() {
    return (
        <SmoothScroll>
            <div className="min-h-screen bg-background text-foreground relative selection:bg-primary/20 selection:text-primary font-sans">
                <Navbar />

                {/* Section 1: Hero & Stats - Light Theme */}
                <StackingSection id="about-hero" className="z-10 bg-background pt-20">
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
                                className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full blur-[100px]"
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
                                <Sparkles size={14} className="text-secondary" />
                                Next Generation Engineering
                            </motion.div>

                            <div className="flex justify-center mb-8">
                                <MaskText className="text-center">
                                    <h1 className="text-4xl md:text-6xl font-black tracking-tight text-foreground leading-[1.15]">
                                        We don't just create 3D models—<br />
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-700 to-secondary animate-gradient-x">
                                            we build immersive digital realities.
                                        </span>
                                    </h1>
                                </MaskText>
                            </div>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6, duration: 0.8 }}
                                className="text-lg md:text-xl text-muted-foreground max-w-4xl mx-auto mb-12 leading-relaxed font-normal"
                            >
                                We are a dedicated team of passionate artists, technical engineers, and creative innovators committed to transforming your concepts into breathtaking, high-fidelity visualizations.
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 }}
                            >
                                <Link to="/products" className="inline-block">
                                    <motion.button
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        className="group relative px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-base shadow-lg shadow-primary/25 transition-all overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] animate-shine opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        <span className="relative flex items-center gap-3 z-10">
                                            Start Your Project <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                        </span>
                                    </motion.button>
                                </Link>
                            </motion.div>
                        </div>
                    </div>
                </StackingSection>

                {/* Section 2: Mission - Darker/Contrast Theme */}
                <StackingSection id="mission" className="z-20 bg-[#E9E6F0]">
                    <div className="max-w-7xl mx-auto px-6 h-full flex flex-col justify-center">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="space-y-8"
                            >
                                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">Our Mission</h2>
                                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                                    At SVRP, our mission is to push the boundaries of visual storytelling. We leverage cutting-edge technology and artistic excellence to deliver solutions that not only meet but exceed our clients' expectations.
                                </p>
                                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                                    From initial concept to final render, we are dedicated to precision, quality, and innovation in every project we undertake.
                                </p>
                                <div className="flex flex-wrap gap-3 pt-4">
                                    <FeatureTag icon={Globe2} label="Global Network" />
                                    <FeatureTag icon={ShieldCheck} label="Enterprise Security" />
                                    <FeatureTag icon={Heart} label="Customer First" />
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                className="relative h-[480px] rounded-3xl overflow-hidden group shadow-lg shadow-primary/10 border border-border"
                            >
                                <div className="absolute inset-0 bg-[#130324]" />
                                <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent z-10" />
                                <img
                                    src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                                    alt="Team working"
                                    className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700 mix-blend-overlay"
                                />
                                <div className="absolute bottom-10 left-10 z-20 text-white">
                                    <BlockQuote />
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </StackingSection>

                {/* Section 3: Values - Light Theme */}
                <StackingSection id="values" className="z-30 bg-background">
                    <div className="max-w-7xl mx-auto px-6 h-full flex flex-col justify-center">
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-14"
                        >
                            <h2 className="text-3xl md:text-5xl font-extrabold text-primary mb-3">What drives us every day</h2>
                            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">Our core values that guide every decision and creation.</p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { icon: Award, title: 'Excellence', desc: 'We pursue the highest standards in everything we build and deliver.' },
                                { icon: Users2, title: 'Collaboration', desc: 'Great things happen when brilliant minds work together as one team.' },
                                { icon: Rocket, title: 'Innovation', desc: 'We push boundaries to create solutions that shape the future of rail.' },
                            ].map((val, i) => (
                                <motion.div
                                    key={val.title}
                                    initial={{ opacity: 0, y: 40 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.2, duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
                                    className="p-8 bg-card rounded-2xl border border-border shadow-xs hover:shadow-md hover:border-primary/40 transition-all text-center group cursor-default"
                                >
                                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform text-primary border border-primary/20 duration-500">
                                        <val.icon size={28} strokeWidth={1.75} />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground mb-3">{val.title}</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed font-normal">{val.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </StackingSection>

                {/* Section 4: CTA - Dark Theme */}
                <StackingSection id="cta" className="z-40 bg-[#130324]">
                    <div className="max-w-7xl mx-auto px-6 h-full flex flex-col justify-center">
                        <div className="text-center py-16 text-white rounded-3xl relative overflow-hidden shadow-xl shadow-primary/20 border border-white/10 bg-[#130324]">
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
                            <div className="absolute w-[400px] h-[400px] bg-primary rounded-full blur-[100px] top-[-150px] left-[-100px] opacity-40" />
                            <div className="absolute w-[300px] h-[300px] bg-secondary rounded-full blur-[100px] bottom-[-100px] right-[-100px] opacity-20" />

                            <div className="relative z-10 max-w-2xl mx-auto space-y-6 px-6">
                                <Users2 size={54} className="mx-auto text-secondary opacity-90" />
                                <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white">Join the movement</h2>
                                <p className="text-white/80 text-base md:text-lg font-normal">
                                    We're always looking for exceptional talent to join our mission. Explore open roles and help us shape the future.
                                </p>
                                <button className="px-8 py-3.5 bg-white text-primary font-bold rounded-xl hover:bg-white/95 transition-colors shadow-md inline-flex items-center gap-2 transform hover:scale-105 duration-200 text-sm">
                                    See Careers <Rocket size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </StackingSection>

                {/* Section 5: Footer */}
                <div className="relative z-50 bg-background w-full">
                    <Footer />
                </div>

            </div>
        </SmoothScroll>
    )
}


function FeatureTag({ icon: Icon, label }) {
    return (
        <div className="flex items-center gap-2 px-3.5 py-2 bg-card border border-border rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shadow-xs">
            <Icon size={15} className="text-primary" /> {label}
        </div>
    )
}

function BlockQuote() {
    return (
        <div className="max-w-md">
            <p className="text-xl font-bold italic mb-3 text-white">"Simplicity is the ultimate sophistication in railway engineering."</p>
            <p className="text-xs font-bold uppercase tracking-widest text-secondary">— Sarah Chen, CTO</p>
        </div>
    )
}
