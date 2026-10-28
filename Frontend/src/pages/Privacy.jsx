import { Link } from 'react-router-dom'
import { Lock, Shield, Eye, Database } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { PageHeader } from '@/components/ui'

export default function Privacy() {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary flex flex-col">
            <Navbar />
            <main id="main-content" className="page-container-narrow">
                <PageHeader
                    backTo="/"
                    backLabel="Back to Home"
                    badge="Data Protection & Privacy"
                    title="Privacy Policy"
                    subtitle="How Shri Vishwakarma Rail Production (SVRP) Collects, Encrypts, and Protects Your Data"
                />

                <div className="space-y-8 text-sm leading-relaxed text-foreground/90">
                    <section className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <Shield size={18} className="text-primary" /> 1. Information We Collect
                        </h2>
                        <p>We collect only the essential personal data required to authenticate buyers, fulfill digital orders, and enforce software licenses:</p>
                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                            <li><strong className="text-foreground">Identity & Account Data:</strong> Full name, verified email address, encrypted password hash (bcrypt salt rounds: 12), and mobile number.</li>
                            <li><strong className="text-foreground">Transaction & License Records:</strong> Order IDs, Razorpay transaction IDs, purchased 3D asset IDs, and generated cryptographic license certificate keys.</li>
                            <li><strong className="text-foreground">Download & Access Telemetry:</strong> Timestamp of download requests, IP addresses, client User-Agent strings, and socket stream completion flags to reliably track download quotas and detect link abuse.</li>
                        </ul>
                    </section>

                    <section className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <Eye size={18} className="text-primary" /> 2. Payment Card Security
                        </h2>
                        <p>
                            SVRP <strong>never stores or processes credit card numbers, debit card details, CVVs, or UPI PINs</strong> on our servers. All financial transactions are processed directly by PCI-DSS Level 1 compliant payment gateways (such as Razorpay). We receive only tokenized payment IDs and cryptographic webhook signatures.
                        </p>
                    </section>

                    <section className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <Database size={18} className="text-primary" /> 3. Cloud Storage Access & Service Accounts
                        </h2>
                        <p>
                            Original 3D assets are housed in private Google Drive, OneDrive, or Cloudflare R2 object stores. Your account email may be registered as an authorized reader on cloud permissions if chosen, or downloads are streamed via our secure backend proxy. We never sell, rent, or trade your personal information with any third-party marketing entities.
                        </p>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    )
}
