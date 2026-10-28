import { Link } from 'react-router-dom'
import { AlertCircle, HardDrive, ShieldAlert, RefreshCw, Mail, CheckCircle2 } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { PageHeader } from '@/components/ui'

export default function Disclaimer() {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary flex flex-col">
            <Navbar />
            <main id="main-content" className="page-container-narrow">
                <PageHeader
                    backTo="/"
                    backLabel="Back to Home"
                    badge="Technical Disclosure & Legal Limitations"
                    title="3D Model Access & Anti-Copy Protection Disclaimer"
                    subtitle="Essential Technical Realities Regarding Download Limits, Cloud Storage Revocation, and Digital Rights Management"
                />

                <div className="space-y-8 text-sm leading-relaxed text-foreground/90">
                    {/* Key Technical Disclosure */}
                    <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl p-6 sm:p-8 space-y-4">
                        <div className="flex items-center gap-3 text-amber-900 font-black text-lg">
                            <HardDrive size={22} className="text-amber-700" />
                            Client-Side Storage Permanence (Crucial Disclosure)
                        </div>
                        <p className="text-amber-950/90 leading-relaxed">
                            Once an original downloadable 3D model asset (<code className="px-1.5 py-0.5 rounded bg-white/70 font-mono text-xs">.blend</code>, <code className="px-1.5 py-0.5 rounded bg-white/70 font-mono text-xs">.fbx</code>, <code className="px-1.5 py-0.5 rounded bg-white/70 font-mono text-xs">.obj</code>, <code className="px-1.5 py-0.5 rounded bg-white/70 font-mono text-xs">.stl</code>, <code className="px-1.5 py-0.5 rounded bg-white/70 font-mono text-xs">.zip</code>) is successfully transferred and stored on a customer’s local hard drive or personal device, <strong>no cloud storage provider (Google Drive, Microsoft OneDrive, Cloudflare R2, or Amazon Web Services) has the technical capability to remotely delete, purge, or corrupt that local file</strong>.
                        </p>
                        <p className="text-amber-950/90 leading-relaxed">
                            Revoking Google Drive or OneDrive permissions, expiring signed download links, or locking download tokens operates strictly as a <strong>server-side gate</strong> to prevent future transfer attempts from our servers. Customers must not interpret access revocation as retroactive data wiping on their physical computers.
                        </p>
                    </div>

                    <section className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <ShieldAlert size={18} className="text-primary" /> Technical Copy Protection Limits
                        </h2>
                        <p>
                            Digital Rights Management (DRM) technologies designed for streaming video or encrypted ebooks cannot be applied to editable, open standard 3D meshes without breaking native compatibility with DCC applications such as Blender, Maya, 3ds Max, or game engines like Unreal Engine and Unity.
                        </p>
                        <p>
                            While our backend strictly enforces <strong>single-use signed URLs, server-side download limits, IP monitoring, and cryptographic license certificate generation</strong>, these technical measures significantly minimize unauthorized link sharing but <strong>cannot guarantee 100% prevention of local mesh exfiltration or copy creation by bad actors</strong>. Commercial protection relies on legal contracts, verified identities, and copyright enforcement under applicable law.
                        </p>
                    </section>

                    <section className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <RefreshCw size={18} className="text-primary" /> Customer Responsibility & 30-Day Window
                        </h2>
                        <ul className="list-disc pl-6 space-y-3 text-muted-foreground">
                            <li><strong className="text-foreground">Timely Download:</strong> You are solely responsible for initiating and saving your purchased models during the active 30-day licensing window.</li>
                            <li><strong className="text-foreground">Local Backups:</strong> Once downloaded, it is your responsibility to maintain secure local backups (external SSD, secure private cloud backup) of your editable project files.</li>
                            <li><strong className="text-foreground">Download Limit Reset Requests:</strong> If you exhaust your download quota due to verified computer hardware failure, you may contact support for a courtesy review and reset.</li>
                        </ul>
                    </section>

                    <section className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <Mail size={18} className="text-primary" /> Failed Download Support Procedure
                        </h2>
                        <p>
                            Our servers employ socket-aware byte accounting: if your download disconnects, your allowance is not consumed. However, if you experience corrupt ZIP archives, unexpected network firewall blocks, or expired links, please visit our <Link to="/contact" className="text-primary font-bold underline">Support Desk</Link> with your Order ID and License Key for immediate manual resolution.
                        </p>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    )
}
