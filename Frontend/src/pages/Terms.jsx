import { Link } from 'react-router-dom'
import { ShieldCheck, Scale, FileText, CheckCircle2, AlertTriangle } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { PageHeader } from '@/components/ui'

export default function Terms() {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary flex flex-col">
            <Navbar />
            <main id="main-content" className="page-container-narrow">
                <PageHeader
                    backTo="/"
                    backLabel="Back to Home"
                    badge="Legal Documentation"
                    title="Terms of Service & 3D Asset License Agreement"
                    subtitle="Last Updated: October 2026 • Shri Vishwakarma Rail Production (SVRP) Digital Marketplace"
                />

                <div className="space-y-10 text-sm leading-relaxed text-foreground/90">
                    <section className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <FileText size={18} className="text-primary" /> 1. Overview & Acceptance of Terms
                        </h2>
                        <p>
                            By creating an account, browsing the catalog, purchasing, or downloading digital 3D models from Shri Vishwakarma Rail Production ("SVRP", "we", "us"), you ("Customer", "Licensee") agree to be legally bound by these Terms of Service and End-User License Agreement (EULA).
                        </p>
                        <p>
                            All downloadable assets sold on this platform—including but not limited to 3D geometry files (<code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs text-primary">.blend</code>, <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs text-primary">.fbx</code>, <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs text-primary">.obj</code>, <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs text-primary">.stl</code>, <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs text-primary">.glb</code>, <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs text-primary">.gltf</code>, <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs text-primary">.max</code>), texture maps, shaders, and measurement rigs—are licensed, not sold.
                        </p>
                    </section>

                    <section className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <CheckCircle2 size={18} className="text-emerald-600" /> 2. Permitted Uses (Grant of License)
                        </h2>
                        <p>Upon verified payment, SVRP grants you a worldwide, non-exclusive, non-transferable license to use the purchased 3D asset in:</p>
                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                            <li><strong className="text-foreground">Commercial & Indie Video Games:</strong> As embedded 3D assets within compiled binary game builds (Unreal Engine, Unity, Godot) where raw source geometry cannot be trivially extracted.</li>
                            <li><strong className="text-foreground">Film, TV & Broadcast Animation:</strong> Linear rendered footage, VFX composites, YouTube productions, and promotional motion design.</li>
                            <li><strong className="text-foreground">Architectural & Engineering Simulation:</strong> CAD mockups, infrastructure simulations, virtual reality railway driver training, and academic research.</li>
                            <li><strong className="text-foreground">Physical 3D Prints:</strong> Fabricating non-commercial or custom end-use prototypes using STL/OBJ meshes.</li>
                        </ul>
                    </section>

                    <section className="bg-card border border-destructive/20 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm bg-destructive/5">
                        <h2 className="text-xl font-bold text-destructive flex items-center gap-2">
                            <AlertTriangle size={18} /> 3. Strict Restrictions & Prohibited Actions
                        </h2>
                        <p className="font-semibold text-destructive">You shall NOT under any circumstances:</p>
                        <ul className="list-disc pl-6 space-y-2 text-foreground/80">
                            <li>Resell, redistribute, sub-license, donate, or freely share the original 3D files or direct download links with third parties.</li>
                            <li>Upload the 3D models to any public repository, 3D asset marketplace (e.g. TurboSquid, CGTrader, Sketchfab), Discord server, or torrent tracker.</li>
                            <li>Use our 3D geometry to train generative 3D artificial intelligence models without express prior written permission from SVRP.</li>
                            <li>Circumvent, tamper with, or reverse-engineer backend download tokens, rate limits, or license expiration timers.</li>
                        </ul>
                    </section>

                    <section className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <ShieldCheck size={18} className="text-primary" /> 4. Limited Access & Download Governance
                        </h2>
                        <p>
                            To prevent unauthorized bulk distribution and bandwidth exploitation, each purchased product comes with server-enforced access constraints:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                            <li><strong className="text-foreground">Download Limit:</strong> Each purchase authorizes up to the configured limit (normally <span className="text-primary font-bold">2 successful downloads</span> per product).</li>
                            <li><strong className="text-foreground">30-Day Access Window:</strong> Download authorization remains active for <span className="text-primary font-bold">30 days</span> from the timestamp of payment verification. Customers are responsible for downloading and archiving files to their local backup systems within this period.</li>
                            <li><strong className="text-foreground">Interrupted Downloads:</strong> If your network transfer fails or drops prematurely, our server detects incomplete socket transmission and preserves your download allowance.</li>
                        </ul>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    )
}
