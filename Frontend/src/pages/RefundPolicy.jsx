import { Link } from 'react-router-dom'
import { RotateCcw, CheckCircle2, XCircle, HelpCircle } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { PageHeader } from '@/components/ui'

export default function RefundPolicy() {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary flex flex-col">
            <Navbar />
            <main id="main-content" className="page-container-narrow">
                <PageHeader
                    backTo="/"
                    backLabel="Back to Home"
                    badge="Digital Asset Policy"
                    title="Refund & Replacement Policy"
                    subtitle="Standard Terms for Intangible Digital Goods & Downloadable 3D Assets"
                />

                <div className="space-y-8 text-sm leading-relaxed text-foreground/90">
                    <section className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
                        <h2 className="text-xl font-bold text-foreground">1. Nature of Digital Goods</h2>
                        <p>
                            Because 3D model assets are non-tangible, irrevocable digital goods delivered immediately upon payment verification, <strong>standard retail returns are generally not possible once a file has been successfully downloaded</strong>. However, we stand behind the technical quality of every model we produce.
                        </p>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 space-y-3">
                            <div className="flex items-center gap-2 text-emerald-800 font-bold text-base">
                                <CheckCircle2 size={18} /> Eligible for Refund or Correction
                            </div>
                            <ul className="text-xs text-emerald-950/80 space-y-2 list-disc pl-4">
                                <li>The file is materially defective, unopenable, or corrupted and our technical team cannot provide a working fix within 48 hours.</li>
                                <li>The model significantly deviates from the listed specifications (e.g., missing documented textures, wrong scale, incorrect geometry).</li>
                                <li>Duplicate charges resulting from an authenticated payment gateway error.</li>
                            </ul>
                        </div>

                        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 space-y-3">
                            <div className="flex items-center gap-2 text-destructive font-bold text-base">
                                <XCircle size={18} /> Not Eligible for Refund
                            </div>
                            <ul className="text-xs text-foreground/80 space-y-2 list-disc pl-4">
                                <li>Customer changed their mind after downloading the complete package.</li>
                                <li>Customer lacks suitable 3D software capable of importing the documented file formats (.blend, .fbx, .obj, .stl).</li>
                                <li>Customer did not download files within the permitted 30-day active license window.</li>
                            </ul>
                        </div>
                    </div>

                    <section className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <HelpCircle size={18} className="text-primary" /> How to Request Technical Assistance
                        </h2>
                        <p>
                            If you encounter any difficulty with an archive, please submit a support ticket via our <Link to="/contact" className="text-primary font-bold underline">Contact Page</Link> with your <strong>Order ID</strong> and <strong>License Key</strong>. We resolve 95% of issues by providing direct replacement builds or re-exported format conversions within 24 hours.
                        </p>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    )
}
