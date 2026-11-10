# Shri Vishwakarma Rail Production (SVRP)
# Enterprise Cloud Infrastructure Procurement & Cost Analysis Report

**Document Title:** Cloud Infrastructure Procurement, Provider Comparison & Comprehensive Pricing Guide  
**File Path:** `CLOUD_PROCUREMENT_AND_COST_ANALYSIS.md`  
**Target SaaS Product:** Commercial Precision 3D Railway Asset & Digital Engineering Marketplace  
**Author:** Senior Cloud Architect & Infrastructure Cost Optimization Consultant  
**Date of Research:** February 2026  
**Financial Baseline:** 1 USD = ₹86.50 INR *(Q1 2026 Interbank Reference Rate)*  
**Primary Region Target:** India (Mumbai `ap-south-1` / `asia-south1`) for DPDP Act 2023 compliance & sub-15ms domestic latency

---

## Table of Contents
1. [Service Requirements Assessment](#1-service-requirements-assessment)
2. [Deep Provider Comparison by Service Category](#2-deep-provider-comparison-by-service-category)
3. [Master Service Pricing Comparison Table](#3-master-service-pricing-comparison-table)
4. [Three Production Budget Configurations](#4-three-production-budget-configurations)
5. [Total Cost Calculation Matrix (Budget vs Professional vs Enterprise)](#5-total-cost-calculation-matrix)
6. [Usage-Based Cost Scenarios (100 to 50,000 MAU)](#6-usage-based-cost-scenarios)
7. [Procurement Strategy & Final Recommendations](#7-procurement-strategy--final-recommendations)
8. [Taxes, Hidden Costs, and Optimization Rules](#8-taxes-hidden-costs-and-optimization-rules)

---

## 1. Service Requirements Assessment

Based on analysis of the SVRP codebase (`Backend/server.js`, `Backend/services/`, and `Frontend/src/`), this platform hosts and distributes large CAD-calibrated 3D digital assets (`.blend`, `.fbx`, `.obj`, `.glb`, `.zip`), ranging in size from 45MB to 250MB+ per file. It provides user authentication, dynamic product filtering, Three.js 3D WebGL preview rendering, Razorpay checkout, 48-hour temporary Google Drive and Microsoft OneDrive access granting, automated background access revocation, license certificate generation, and transactional email dispatch.

```
+----------------------------------------------------------------------------------------------------+
|                                    SVRP ARCHITECTURE TOPOLOGY                                      |
|                                                                                                    |
|  [ Client Browser: React 19 + Three.js / WebGL ]                                                  |
|         │                                                                                          |
|         ▼ (HTTPS / TLS 1.3 - Cloudflare Global Anycast DNS)                                        |
|  [ Cloudflare Edge: DNS + Universal SSL + WAF + L3-L7 DDoS Shield ]                                |
|         │                                      │                                                   |
|         ├──────────────────────────┐           ├──────────────────────────────────┐                |
|         ▼                          ▼           ▼                                  ▼                |
|  [ Cloudflare Pages ]      [ AWS ALB ]   [ Cloudflare R2 Store ]        [ Third-Party APIs ]       |
|  (React 19 SPA Assets)     (Port 443)    (Zero-Egress CAD Assets)       (Razorpay, GDrive,         |
|                                    │           ▲                         OneDrive, AWS SES)        |
|                                    ▼           │ (SigV4 Presigned URL)                             |
|                        [ AWS ECS Fargate ] ────┘                                                   |
|                        (Express 5 REST API)                                                        |
|                               │     │                                                              |
|            ┌──────────────────┘     └──────────────────┐                                           |
|            ▼                                           ▼                                           |
|  [ MongoDB Atlas M10 ]                      [ Upstash / ElastiCache Redis ]                        |
|  (Dedicated 3-Node Replica)                 (BullMQ 48-Hr Revocation Queue)                        |
+----------------------------------------------------------------------------------------------------+
```

### 1.1 Evaluated Infrastructure Services for SVRP

| Infrastructure Service | Classification | Specific Role in SVRP Platform |
| :--- | :--- | :--- |
| **Frontend Hosting** | **Mandatory** | Hosts compiled React 19 / Vite static bundles, CSS, and 3D preview meshes (`.glb`, `.fbx`). |
| **Backend Container Hosting** | **Mandatory** | Runs Express 5 API runtime, JWT authentication, payment webhooks, and licensing services. |
| **Managed Database** | **Mandatory** | Stores 11 collections (`User`, `Profile`, `Product`, `Category`, `Order`, `License`, `AccessGrant`, etc.). |
| **Object Storage (3D Assets)** | **Mandatory** | Stores multi-gigabyte master CAD assets (`.blend`, `.fbx`, `.zip`) with zero data egress charges. |
| **CDN (Content Delivery)** | **Mandatory** | Globally caches static assets and 3D preview files at edge nodes with single-digit millisecond latency. |
| **Domain Registration** | **Mandatory** | Secures brand identity (`railworks.in` / `svrp.com`) with wholesale at-cost pricing. |
| **DNS Management** | **Mandatory** | Anycast authoritative DNS with fast TTL resolution (<15ms) and DNSSEC enforcement. |
| **SSL / TLS Certificate** | **Mandatory** | Enforces TLS 1.3 encryption, protecting sensitive payment tokens and authentication cookies. |
| **Load Balancer (Reverse Proxy)**| **Mandatory** | Performs active health checking (`/api/health`), SSL termination, and zero-downtime rolling deploys. |
| **Background Task Processing** | **Mandatory** | Runs BullMQ workers executing 48-hour access revocation sweeps against Google Drive / OneDrive APIs. |
| **Redis / In-Memory Cache** | **Mandatory** | Powers BullMQ distributed queues, stateful job scheduling, and high-frequency catalog caching. |
| **Message Queue** | **Mandatory (Stg 2+)**| Decouples post-payment actions (drive sharing, license compilation) from synchronous checkout requests. |
| **Transactional Email** | **Mandatory** | Dispatches order receipts, license keys, 48-hour download links, and password reset instructions. |
| **Logging & System Metrics** | **Mandatory** | Centralizes API request logs, latency metrics, container health, and regulatory audit records. |
| **Error Tracking** | **Mandatory** | Real-time tracking of unhandled Node.js exceptions and frontend Three.js WebGL rendering crashes. |
| **Backup & Disaster Recovery** | **Mandatory** | Continuous automated database oplog backups with 1-second Point-in-Time Recovery (PITR). |
| **CI/CD Pipeline** | **Mandatory** | Automates test execution (`tests/revocation.test.js`), Docker image builds, and zero-downtime rollouts. |
| **WAF & DDoS Protection** | **Mandatory** | Edge filtering against NoSQL injection, Layer 7 HTTP floods, and malicious scraping bots. |
| **Secrets Management** | **Mandatory** | Stores and rotates `JWT_SECRET`, Razorpay credentials, and Google Drive private service keys. |
| **API Gateway (Standalone)** | **Unnecessary** | Express 5 middleware + Cloudflare edge rules provide sufficient routing and rate-limiting. |
| **Kubernetes (EKS/GKE)** | **Unnecessary** | Adds unnecessary cost and operational complexity for a monolithic SaaS application architecture. |

---

## 2. Deep Provider Comparison by Service Category

We evaluate 3 to 5 industry-standard cloud providers for each service category against SVRP's operational requirements.

---

### 2.1 Frontend Hosting

#### Provider 1: Cloudflare Pages *(Recommended Production Winner)*
* **Service Name:** Cloudflare Pages
* **Available Plans:** Free ($0/mo), Pro ($20/mo), Business ($200/mo), Enterprise (Custom).
* **Starting Price:** $0.00 / month.
* **Recommended Plan:** **Free Tier (Stage 1) / Pro Tier (Stage 2–3 at $20/mo)**.
* **Included Resources:** Unlimited bandwidth, 500 builds/month (Free) / 5,000 builds/month (Pro).
* **Storage Limits:** 25MB max single file size; unlimited total storage.
* **Bandwidth Limits:** **Unlimited free unmetered bandwidth** across 300+ edge locations (12+ in India).
* **Enterprise Availability:** Yes (Custom SLA, dedicated cache reserves).
* **SLA & Support:** 99.99% edge uptime; ticket support on Pro, 24/7 phone on Enterprise.
* **Official Pricing Link:** [https://www.cloudflare.com/plans/developer-platform/](https://www.cloudflare.com/plans/developer-platform/)

#### Provider 2: Vercel
* **Service Name:** Vercel Frontend Cloud
* **Available Plans:** Hobby ($0/mo), Pro ($20/seat/mo), Enterprise ($40,000+/yr).
* **Starting Price:** $20.00 / user / month (Hobby terms strictly prohibit commercial SaaS).
* **Recommended Plan:** **Pro Plan ($20.00 / member / month)**.
* **Included Resources:** 1 TB bandwidth/month, 6,000 build minutes.
* **Storage / Limits:** 100MB static asset limit.
* **Bandwidth Overages:** $0.15 per GB over 1 TB ($150 per extra TB).
* **Enterprise Availability:** Yes (99.99% SLA, SSO, SOC 2 compliance).
* **SLA & Support:** Community on Hobby; standard business hours email on Pro.
* **Official Pricing Link:** [https://vercel.com/pricing](https://vercel.com/pricing)

#### Provider 3: AWS Amplify
* **Service Name:** AWS Amplify Hosting
* **Available Plans:** Pay-as-you-go based on compute and bandwidth.
* **Starting Price:** Pay-as-you-go (~$5.00–$15.00/mo).
* **Recommended Plan:** **Amplify Hosting Pay-As-You-Go**.
* **Included Resources:** Free tier includes 1,000 build mins/mo, 15 GB served/mo for 12 months.
* **Usage Charges:** $0.01 per build minute, $0.023/GB storage, $0.09/GB data transfer out.
* **Enterprise Availability:** Yes (under AWS Enterprise Support agreement).
* **SLA & Support:** 99.9% uptime SLA; AWS Support plans from $29/mo.
* **Official Pricing Link:** [https://aws.amazon.com/amplify/pricing/](https://aws.amazon.com/amplify/pricing/)

#### Provider 4: Netlify
* **Service Name:** Netlify Web Suite
* **Available Plans:** Starter ($0/mo), Core ($19/seat/mo), Enterprise ($3,000+/mo).
* **Starting Price:** $19.00 / seat / month (Starter has commercial restrictions).
* **Recommended Plan:** **Core Plan ($19.00 / user / month)**.
* **Included Resources:** 1 TB bandwidth/month, 300 build minutes.
* **Bandwidth Overages:** $55 per additional 100 GB.
* **Official Pricing Link:** [https://www.netlify.com/pricing/](https://www.netlify.com/pricing/)

---

### 2.2 Backend Container Hosting

#### Provider 1: AWS ECS Fargate *(Enterprise Production Winner)*
* **Service Name:** Amazon Elastic Container Service (ECS) with Fargate vCPU compute
* **Region:** India (Mumbai `ap-south-1` / Hyderabad `ap-south-2`).
* **Available Plans:** Pure pay-as-you-go per vCPU-second and GB-second.
* **Starting Price:** ~$15.00 / month (1 Task: 0.5 vCPU, 1 GB RAM).
* **Recommended Plan:** **2-Task High Availability (1 vCPU, 2 GB RAM per task) behind ALB**.
* **Compute Rates (Mumbai `ap-south-1`):**
  * vCPU: $0.04048 per vCPU-hour.
  * Memory: $0.004445 per GB-hour.
  * Baseline 2-Task Cost: `2 * ((1 * 0.04048) + (2 * 0.004445)) * 730 = ~$35.80 / month`.
* **Storage Limits:** 20 GB ephemeral container storage included (expandable up to 200 GB).
* **Bandwidth Limits:** Free inbound; standard AWS data transfer out.
* **Enterprise Availability:** Full AWS Well-Architected and Enterprise Support availability.
* **SLA & Support:** 99.99% availability SLA with multi-AZ deployment.
* **Official Pricing Link:** [https://aws.amazon.com/fargate/pricing/](https://aws.amazon.com/fargate/pricing/)

#### Provider 2: Google Cloud Run *(Best Serverless Container Alternative)*
* **Service Name:** Google Cloud Run (Fully Managed Serverless Container Engine)
* **Region:** India (Mumbai `asia-south1` / Delhi `asia-south2`).
* **Available Plans:** Pay-per-use (CPU allocated during request or always-on).
* **Starting Price:** $0.00 (within generous free tier of 2M requests, 360,000 vCPU-seconds).
* **Recommended Plan:** **Always-on CPU baseline (1 vCPU, 2 GB RAM in Mumbai) ~$28.00–$38.00/mo**.
* **Compute Rates:** $0.000024 per vCPU-second, $0.0000025 per GB-second.
* **Storage Limits:** Ephemeral in-memory file system.
* **SLA & Support:** 99.95% monthly uptime SLA.
* **Official Pricing Link:** [https://cloud.google.com/run/pricing](https://cloud.google.com/run/pricing)

#### Provider 3: DigitalOcean App Platform
* **Service Name:** DigitalOcean App Platform (PaaS)
* **Region:** India (Bangalore `blr1`).
* **Available Plans:** Basic ($5–$20/mo), Professional ($12–$96/mo per container).
* **Starting Price:** $5.00 / month.
* **Recommended Plan:** **Professional 2-Instance Container (1 vCPU, 2 GB RAM per instance) = $50.00/mo**.
* **Included Bandwidth:** 100 GB included; $0.01 per additional GB.
* **SLA & Support:** 99.95% compute SLA; Standard ticket support.
* **Official Pricing Link:** [https://www.digitalocean.com/pricing/app-platform](https://www.digitalocean.com/pricing/app-platform)

#### Provider 4: Render
* **Service Name:** Render Web Services (Docker Runtime)
* **Region:** US-East, Frankfurt, Singapore (No native Indian data center).
* **Available Plans:** Starter ($7/mo), Standard ($25/mo), Pro ($85/mo).
* **Starting Price:** $7.00 / month.
* **Recommended Plan:** **Standard Tier ($25.00 / month, 1 vCPU, 2 GB RAM)**.
* **Latency Tradeoff:** 120ms–160ms latency from India to European/US data centers.
* **Official Pricing Link:** [https://render.com/pricing](https://render.com/pricing)

---

### 2.3 Managed Database (MongoDB)

#### Provider 1: MongoDB Atlas *(Production Winner)*
* **Service Name:** MongoDB Atlas Managed Cloud Database
* **Deployment Region:** AWS Mumbai (`ap-south-1`) with VPC Peering.
* **Available Plans:** Free (M0), Flex (Usage-based), Dedicated (M10, M20, M30, M40+).
* **Starting Price:** $0.00 (M0 512MB) / Flex: ~$8.00–$30.00/mo / M10: ~$57.00/mo single node baseline.
* **Recommended Production Plan:**
  * **Stage 1:** Flex Tier (~$8.00–$15.00/mo, 5GB storage, auto-scaling operations).
  * **Stage 2–3:** **M10 Dedicated 3-Node Replica Set (~$170.00–$175.00/mo)**.
* **Specs (M10):** 2 Dedicated vCPUs, 2 GB RAM, 10 GB–128 GB NVMe Storage, automated multi-AZ failover.
* **Backups Included:** Continuous oplog replication with 1-second Point-In-Time Recovery (PITR).
* **SLA & Support:** 99.995% uptime SLA on dedicated multi-AZ replica sets.
* **Official Pricing Link:** [https://www.mongodb.com/pricing](https://www.mongodb.com/pricing)

#### Provider 2: AWS DocumentDB (MongoDB Compatible)
* **Service Name:** Amazon DocumentDB (with MongoDB compatibility)
* **Region:** Mumbai (`ap-south-1`).
* **Available Plans:** Instance-based (`db.t4g.medium`, `db.r6g.large`).
* **Starting Price:** ~$56.00 / month per single instance.
* **Recommended Plan:** **2-Instance Multi-AZ Cluster (`db.t4g.medium`) = ~$165.00 / month**.
* **Technical Limitations:** Incomplete compatibility with modern Mongoose 9 operators and schemas.
* **Official Pricing Link:** [https://aws.amazon.com/documentdb/pricing/](https://aws.amazon.com/documentdb/pricing/)

#### Provider 3: DigitalOcean Managed MongoDB
* **Service Name:** DigitalOcean Managed Database for MongoDB
* **Region:** Bangalore (`blr1`).
* **Available Plans:** 1 Node ($15/mo), 3-Node Primary/Standby ($45/mo to $90/mo).
* **Recommended Plan:** **3-Node Cluster (2 GB RAM, 1 vCPU, 38 GB Disk) = $75.00 / month**.
* **SLA & Support:** 99.95% SLA on high-availability clusters.
* **Official Pricing Link:** [https://www.digitalocean.com/pricing/databases](https://www.digitalocean.com/pricing/databases)

---

### 2.4 Object Storage & 3D Asset File Delivery

#### Provider 1: Cloudflare R2 *(Cost Optimization & Production Winner)*
* **Service Name:** Cloudflare R2 Object Storage
* **Available Plans:** Pay-as-you-go with permanent monthly free allowance.
* **Starting Price:** $0.00 / month.
* **Free Tier Allowance:** 10 GB storage/mo, 1M Class A operations (write/list), 10M Class B (read).
* **Storage Rate:** **$0.015 per GB-month**.
* **Egress Rate:** **$0.00 / GB (ZERO DATA EGRESS FEES TO THE INTERNET)**.
* **Operation Rates:** Class A: $4.50 / 1M requests; Class B: $0.36 / 1M requests.
* **API Compatibility:** 100% AWS S3 SigV4 compatible (natively implemented in `r2Service.js`).
* **Enterprise Availability:** Yes (Custom SLAs, regional bucket placement).
* **Official Pricing Link:** [https://www.cloudflare.com/developer-platform/products/r2/](https://www.cloudflare.com/developer-platform/products/r2/)

#### Provider 2: Amazon Web Services S3 Standard
* **Service Name:** Amazon Simple Storage Service (S3 Standard)
* **Region:** Mumbai (`ap-south-1`).
* **Starting Price:** $0.023 per GB-month.
* **Egress Bandwidth:** **$0.090 per GB (Severe cost multiplier for 3D binary assets)**.
* **Cost for 1TB Storage + 4TB Egress:** $23.00 (Storage) + $360.00 (Egress) = **$383.00 / month**.
* **Official Pricing Link:** [https://aws.amazon.com/s3/pricing/](https://aws.amazon.com/s3/pricing/)

#### Provider 3: Google Cloud Storage (GCS)
* **Service Name:** Google Cloud Storage Standard
* **Region:** Mumbai (`asia-south1`).
* **Starting Price:** $0.020 per GB-month.
* **Egress Bandwidth:** $0.085–$0.120 per GB to internet.
* **Cost for 1TB Storage + 4TB Egress:** $20.00 (Storage) + $340.00 (Egress) = **$360.00 / month**.
* **Official Pricing Link:** [https://cloud.google.com/storage/pricing](https://cloud.google.com/storage/pricing)

#### Provider 4: DigitalOcean Spaces
* **Service Name:** DigitalOcean Spaces Object Storage & CDN
* **Region:** Bangalore (`blr1`).
* **Starting Price:** $5.00 / month (Includes 250 GB storage and 1 TB outbound transfer).
* **Overages:** $0.02/GB storage over 250 GB; $0.01/GB bandwidth over 1 TB.
* **Cost for 1TB Storage + 4TB Egress:** $5.00 + $15.00 (Storage) + $30.00 (Egress) = **$50.00 / month**.
* **Official Pricing Link:** [https://www.digitalocean.com/pricing/spaces-object-storage](https://www.digitalocean.com/pricing/spaces-object-storage)

---

### 2.5 Edge CDN & Web Application Firewall (WAF)

#### Provider 1: Cloudflare *(Production Winner)*
* **Service Name:** Cloudflare Application Security & Global Anycast CDN
* **Available Plans:** Free ($0/mo), Pro ($20/mo), Business ($200/mo), Enterprise (Custom).
* **Starting Price:** $0.00 (Free includes L3/L4 DDoS mitigation, 300+ Edge PoPs).
* **Recommended Plan:** **Cloudflare Pro Plan ($20.00 / month)**.
* **Included Security:** Managed OWASP Core Rulesets, bot mitigation, custom firewall rules.
* **Official Pricing Link:** [https://www.cloudflare.com/plans/](https://www.cloudflare.com/plans/)

#### Provider 2: AWS CloudFront + AWS WAF
* **Service Name:** Amazon CloudFront + AWS WAF
* **Starting Price:** Pay-as-you-go based on requests and web ACL rules.
* **Pricing Structure:**
  * AWS WAF Web ACL: $5.00/month base.
  * Rule Charge: $1.00/rule/month (Typical 5-rule set = $5.00/mo).
  * Request Charges: $0.60 per 1M requests.
  * Estimated Monthly Cost: **~$25.00–$45.00 / month**.
* **Official Pricing Link:** [https://aws.amazon.com/waf/pricing/](https://aws.amazon.com/waf/pricing/)

---

### 2.6 Background Worker, Task Queue & Redis

#### Provider 1: Upstash Serverless Redis *(Stage 1–2 Winner)*
* **Service Name:** Upstash Serverless Redis for BullMQ
* **Region:** AWS Mumbai (`ap-south-1`).
* **Available Plans:** Free (10,000 commands/day), Pay-as-you-go ($0.20 per 100k commands).
* **Recommended Plan:** **Pay-as-you-go ($0.00–$5.00 / month)**.
* **Official Pricing Link:** [https://upstash.com/pricing/redis](https://upstash.com/pricing/redis)

#### Provider 2: AWS ElastiCache for Redis *(Stage 3 Enterprise Winner)*
* **Service Name:** Amazon ElastiCache for Redis
* **Region:** Mumbai (`ap-south-1`).
* **Available Plans:** Node-based (`cache.t4g.micro`, `cache.t4g.small`, `cache.r6g.large`).
* **Recommended Plan:** **`cache.t4g.micro` (0.5 GB RAM) = ~$12.50 / month** or Multi-AZ (~$35.00/mo).
* **Official Pricing Link:** [https://aws.amazon.com/elasticache/pricing/](https://aws.amazon.com/elasticache/pricing/)

---

### 2.7 Transactional Email Delivery

#### Provider 1: Amazon Simple Email Service (SES) *(Cost & Scale Winner)*
* **Service Name:** Amazon SES (Mumbai Region `ap-south-1`)
* **Available Plans:** Pay-as-you-go.
* **Starting Price:** $0.00 (Free 62,000 emails/mo when sent from EC2/Fargate in the same region).
* **Public Unit Rate:** **$0.10 per 1,000 emails ($0.0001 per email)**.
* **Cost for 10,000 Emails:** **$1.00 USD (~₹86.50 INR)**.
* **Deliverability:** Dedicated SPF, DKIM, and DMARC identity verification.
* **Official Pricing Link:** [https://aws.amazon.com/ses/pricing/](https://aws.amazon.com/ses/pricing/)

#### Provider 2: Resend *(Developer Experience Winner)*
* **Service Name:** Resend Email API
* **Available Plans:** Free (3,000 emails/mo, 100/day limit), Pro ($20/mo for 50,000 emails).
* **Starting Price:** $0.00 (Free tier) / Pro: $20.00/mo.
* **Official Pricing Link:** [https://resend.com/pricing](https://resend.com/pricing)

#### Provider 3: SendGrid (Twilio)
* **Service Name:** Twilio SendGrid Email API
* **Available Plans:** Free (100 emails/day), Essentials ($19.95/mo for 50,000 emails).
* **Starting Price:** $19.95 / month.
* **Official Pricing Link:** [https://sendgrid.com/pricing/](https://sendgrid.com/pricing/)

---

### 2.8 Logging, Error Tracking & Monitoring

#### Provider 1: Sentry.io *(Error Tracking Winner)*
* **Service Name:** Sentry Application Performance Monitoring
* **Available Plans:** Developer ($0/mo), Team ($26/mo), Business ($80/mo).
* **Starting Price:** $0.00 (Includes 5,000 error events/month, full Three.js/Node stack traces).
* **Recommended Plan:** Developer Free (Stage 1–2) / Team Plan ($26.00/mo for Stage 3).
* **Official Pricing Link:** [https://sentry.io/pricing/](https://sentry.io/pricing/)

#### Provider 2: Better Stack (Logtail + Uptime) *(Uptime & Log Winner)*
* **Service Name:** Better Stack Infrastructure Suite
* **Available Plans:** Free (10 monitors, 3-min checks, 1GB logs), Freelancer ($24/mo).
* **Starting Price:** $0.00 / month.
* **Official Pricing Link:** [https://betterstack.com/pricing](https://betterstack.com/pricing)

#### Provider 3: Datadog *(Enterprise Alternative - High Cost)*
* **Service Name:** Datadog APM & Log Management
* **Starting Price:** $15.00 per host/month for Infrastructure + $31.00 per host for APM.
* **Minimum Monthly Spend:** ~$60.00–$120.00/month.
* **Official Pricing Link:** [https://www.datadoghq.com/pricing/](https://www.datadoghq.com/pricing/)

---

## 3. Master Service Pricing Comparison Table

*All currency figures calculated at 1 USD = ₹86.50 INR. Annual prices include 12 months standard run rate.*

| Service Category | Provider | Product / Service Name | Plan / Tier | Monthly Cost (USD) | Monthly Cost (INR) | Annual Cost (INR) | Official Pricing Reference Link |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Frontend Hosting** | Cloudflare | Cloudflare Pages | Free Tier | **$0.00** | **₹0.00** | **₹0.00** | [cloudflare.com/plans](https://www.cloudflare.com/plans/developer-platform/) |
| **Frontend Hosting** | Cloudflare | Cloudflare Pages | Pro Plan | **$20.00** | **₹1,730.00** | **₹20,760.00** | [cloudflare.com/plans](https://www.cloudflare.com/plans/developer-platform/) |
| **Frontend Hosting** | Vercel | Vercel Platform | Pro Team | **$20.00** | **₹1,730.00** | **₹20,760.00** | [vercel.com/pricing](https://vercel.com/pricing) |
| **Frontend Hosting** | Netlify | Netlify Web | Core Plan | **$19.00** | **₹1,643.50** | **₹19,722.00** | [netlify.com/pricing](https://www.netlify.com/pricing/) |
| **Backend Hosting** | AWS | ECS Fargate (Mumbai) | 2 Tasks (1 vCPU, 2GB) | **$35.80** | **₹3,096.70** | **₹37,160.40** | [aws.amazon.com/fargate](https://aws.amazon.com/fargate/pricing/) |
| **Backend Hosting** | Google Cloud | Cloud Run (Mumbai) | Always-On (1 vCPU, 2GB)| **$28.50** | **₹2,465.25** | **₹29,583.00** | [cloud.google.com/run](https://cloud.google.com/run/pricing) |
| **Backend Hosting** | DigitalOcean | App Platform (Bangalore) | 2x Pro Container (2GB) | **$50.00** | **₹4,325.00** | **₹51,900.00** | [digitalocean.com/app-platform](https://www.digitalocean.com/pricing/app-platform) |
| **Backend Hosting** | Render | Web Services | Standard Plan | **$25.00** | **₹2,162.50** | **₹25,950.00** | [render.com/pricing](https://render.com/pricing) |
| **Managed Database** | MongoDB | MongoDB Atlas (AWS Mumbai)| Flex Usage-Based | **$8.00** | **₹692.00** | **₹8,304.00** | [mongodb.com/pricing](https://www.mongodb.com/pricing) |
| **Managed Database** | MongoDB | MongoDB Atlas (AWS Mumbai)| M10 Dedicated Replica | **$57.00** | **₹4,930.50** | **₹59,166.00** | [mongodb.com/pricing](https://www.mongodb.com/pricing) |
| **Managed Database** | MongoDB | MongoDB Atlas (AWS Mumbai)| M10 3-Node Multi-AZ | **$175.00** | **₹15,137.50** | **₹181,650.00** | [mongodb.com/pricing](https://www.mongodb.com/pricing) |
| **Managed Database** | AWS | DocumentDB (Mumbai) | db.t4g.medium (2 nodes)| **$165.00** | **₹14,272.50** | **₹171,270.00** | [aws.amazon.com/documentdb](https://aws.amazon.com/documentdb/pricing/) |
| **Managed Database** | DigitalOcean | Managed MongoDB (BLR) | 3-Node Cluster (2GB) | **$75.00** | **₹6,487.50** | **₹77,850.00** | [digitalocean.com/databases](https://www.digitalocean.com/pricing/databases) |
| **Object Storage** | Cloudflare | R2 Object Storage | 250 GB + Zero Egress | **$3.60** | **₹311.40** | **₹3,736.80** | [cloudflare.com/r2](https://www.cloudflare.com/developer-platform/products/r2/) |
| **Object Storage** | Cloudflare | R2 Object Storage | 2.5 TB + Zero Egress | **$37.50** | **₹3,243.75** | **₹38,925.00** | [cloudflare.com/r2](https://www.cloudflare.com/developer-platform/products/r2/) |
| **Object Storage** | AWS | S3 Standard (Mumbai) | 250 GB + 800 GB Egress | **$77.75** | **₹6,725.38** | **₹80,704.50** | [aws.amazon.com/s3](https://aws.amazon.com/s3/pricing/) |
| **Object Storage** | AWS | S3 Standard (Mumbai) | 2.5 TB + 9 TB Egress | **$867.50** | **₹75,038.75** | **₹900,465.00** | [aws.amazon.com/s3](https://aws.amazon.com/s3/pricing/) |
| **CDN & Edge WAF** | Cloudflare | Cloudflare Core | Free Tier | **$0.00** | **₹0.00** | **₹0.00** | [cloudflare.com/plans](https://www.cloudflare.com/plans/) |
| **CDN & Edge WAF** | Cloudflare | Cloudflare Core | Pro Plan | **$20.00** | **₹1,730.00** | **₹20,760.00** | [cloudflare.com/plans](https://www.cloudflare.com/plans/) |
| **CDN & Edge WAF** | AWS | CloudFront + WAF | Pay-As-You-Go | **$35.00** | **₹3,027.50** | **₹36,330.00** | [aws.amazon.com/waf](https://aws.amazon.com/waf/pricing/) |
| **Reverse Proxy / LB**| AWS | Application Load Balancer| Multi-AZ ALB Base | **$21.50** | **₹1,859.75** | **₹22,317.00** | [aws.amazon.com/elasticloadbalancing](https://aws.amazon.com/elasticloadbalancing/pricing/) |
| **Task Queue / Redis**| Upstash | Serverless Redis | Pay-as-you-go | **$5.00** | **₹432.50** | **₹5,190.00** | [upstash.com/pricing](https://upstash.com/pricing/redis) |
| **Task Queue / Redis**| AWS | ElastiCache Redis | cache.t4g.micro | **$12.50** | **₹1,081.25** | **₹12,975.00** | [aws.amazon.com/elasticache](https://aws.amazon.com/elasticache/pricing/) |
| **Transactional Email**| AWS | Amazon SES (Mumbai) | Pay-per-email ($0.10/1k) | **$1.00** | **₹86.50** | **₹1,038.00** | [aws.amazon.com/ses](https://aws.amazon.com/ses/pricing/) |
| **Transactional Email**| Resend | Resend Email API | Free (3k/mo) / Pro (50k) | **$0.00** / **$20.00**| **₹0.00** / **₹1,730.00**| **₹20,760.00** | [resend.com/pricing](https://resend.com/pricing) |
| **Transactional Email**| SendGrid | Twilio SendGrid | Essentials 50k | **$19.95** | **₹1,725.68** | **₹20,708.10** | [sendgrid.com/pricing](https://sendgrid.com/pricing/) |
| **Error Tracking** | Sentry.io | Sentry Performance | Developer Free Tier | **$0.00** | **₹0.00** | **₹0.00** | [sentry.io/pricing](https://sentry.io/pricing/) |
| **Error Tracking** | Sentry.io | Sentry Performance | Team Plan | **$26.00** | **₹2,249.00** | **₹26,988.00** | [sentry.io/pricing](https://sentry.io/pricing/) |
| **Monitoring & Logs** | Better Stack | Uptime + Logtail | Free Tier (10 monitors) | **$0.00** | **₹0.00** | **₹0.00** | [betterstack.com](https://betterstack.com/pricing) |
| **Monitoring & Logs** | AWS | CloudWatch | Custom Metrics & Logs | **$15.00** | **₹1,297.50** | **₹15,570.00** | [aws.amazon.com/cloudwatch](https://aws.amazon.com/cloudwatch/pricing/) |
| **Domain Name** | Cloudflare | Cloudflare Registrar | Annual Registration (`.in`)| **$0.90** | **₹77.85** | **₹934.20** | [cloudflare.com/products/registrar](https://www.cloudflare.com/products/registrar/) |

---

## 4. Three Production Budget Configurations

```
+----------------------------------------------------------------------------------------------------+
|  PACKAGE A: Budget Production (~$16.00/mo -> Rs 1,384/mo)                                         |
|  Ideal For: Pre-revenue launch, pilot testing, customer validation (< 500 MAU)                     |
|  Providers: Cloudflare Pages + Render / Cloud Run + MongoDB Atlas Flex + Cloudflare R2            |
+----------------------------------------------------------------------------------------------------+
                                                 │
                                                 ▼
+----------------------------------------------------------------------------------------------------+
|  PACKAGE B: Professional Production (~$129.50/mo -> Rs 11,202/mo) - RECOMMENDED BASELINE          |
|  Ideal For: Commercial operations, paying corporate customers, high availability (500 - 5,000 MAU)|
|  Providers: Cloudflare Pages Pro + AWS ECS Fargate (Mumbai) + MongoDB Atlas M10 + Upstash + SES   |
+----------------------------------------------------------------------------------------------------+
                                                 │
                                                 ▼
+----------------------------------------------------------------------------------------------------+
|  PACKAGE C: Enterprise Production (~$465.00/mo -> Rs 40,223/mo)                                   |
|  Ideal For: Scaling enterprise SaaS, multi-region compliance, mission-critical SLAs (50,000+ MAU) |
|  Providers: Multi-AZ ECS Fargate Fleet + Atlas M10 Multi-AZ + ElastiCache + Sentry Team + SES     |
+----------------------------------------------------------------------------------------------------+
```

### 4.1 Package A – Budget Production Architecture (Low-Cost Launch)
* **Goal:** Launch a secure, publicly accessible production store at minimal monthly run-rate.
* **Component List & Costs:**
  1. *Frontend Hosting:* Cloudflare Pages Free Tier (**$0.00**)
  2. *Backend API:* Render Web Service Starter Docker Container (**$7.00 / mo**)
  3. *Managed Database:* MongoDB Atlas Flex Tier (**$8.00 / mo**)
  4. *Object Storage:* Cloudflare R2 Standard (15 GB within free allowance) (**$0.10 / mo**)
  5. *Data Egress Bandwidth:* Cloudflare Zero Egress Policy (**$0.00**)
  6. *Edge CDN & DNS:* Cloudflare Core DNS + Universal SSL + Anti-DDoS (**$0.00**)
  7. *Task Scheduling:* In-process scheduler (`revocationScheduler.js`) on container (**$0.00**)
  8. *Email Gateway:* Resend Free Tier (up to 3,000 emails/mo) (**$0.00**)
  9. *Monitoring & Logs:* Better Stack Uptime Free (10 monitors) + Sentry Developer Free (**$0.00**)
  10. *Domain Registration:* Cloudflare Registrar at wholesale cost prorated (**$0.90 / mo**)
* **Package A Total:** **$16.00 USD / month (~₹1,384 INR / month -> ₹16,608 INR / year)**.

---

### 4.2 Package B – Professional Production Architecture (*Recommended Standard*)
* **Goal:** Deliver sub-15ms latency across India, high availability, zero container wipes, managed BullMQ queues, and continuous point-in-time database recovery.
* **Component List & Costs:**
  1. *Frontend Hosting:* Cloudflare Pages Pro Tier (**$20.00 / mo**)
  2. *Backend API:* AWS ECS Fargate Mumbai (`ap-south-1`) 2 Tasks (1 vCPU, 2 GB RAM) (**$35.80 / mo**)
  3. *Load Balancer:* AWS Application Load Balancer with SSL Termination (**$21.50 / mo**)
  4. *Managed Database:* MongoDB Atlas M10 Dedicated Instance in AWS Mumbai (**$57.00 / mo**)
  5. *Object Storage:* Cloudflare R2 Standard (250 GB storage) (**$3.60 / mo**)
  6. *Data Egress Bandwidth:* Cloudflare Zero Egress Policy (**$0.00**)
  7. *Edge Security & WAF:* Cloudflare Pro Managed WAF Rulesets (**$0.00** - included in Pages Pro)
  8. *Task Queue & Caching:* Upstash Serverless Redis for BullMQ Revocation Worker (**$5.00 / mo**)
  9. *Email Delivery:* AWS SES Mumbai Region (5,000 emails/mo) (**$0.90 / mo**)
  10. *Application Telemetry:* Better Stack + CloudWatch Basic Logs (**$5.00 / mo**)
  11. *Domain Name:* Cloudflare Registrar (`.in` domain at cost) (**$0.70 / mo**)
* **Package B Total:** **$149.50 USD / month (~₹12,931 INR / month -> ₹155,180 INR / year)**.
*(Note: If utilizing Google Cloud Run instead of AWS ALB/Fargate in Stage 2, monthly cost drops to **$129.50 USD / mo (~₹11,202 INR)**).*

---

### 4.3 Package C – Enterprise Production Architecture (High Availability & Scale)
* **Goal:** Multi-AZ redundancy, autoscaling container fleet, dedicated revocation workers, enterprise observability, and compliance with the Indian DPDP Act.
* **Component List & Costs:**
  1. *Frontend Hosting:* Cloudflare Pages Pro Tier (**$20.00 / mo**)
  2. *Backend Fleet:* AWS ECS Fargate Autoscaling (4 to 12 Tasks) (**$145.00 / mo**)
  3. *Load Balancer:* AWS Application Load Balancer Multi-AZ (**$25.00 / mo**)
  4. *Managed Database:* MongoDB Atlas M10 Dedicated 3-Node Multi-AZ Replica Set (**$175.00 / mo**)
  5. *Object Storage:* Cloudflare R2 Standard (2.5 TB Storage) (**$37.50 / mo**)
  6. *Data Egress Bandwidth:* Cloudflare Zero Egress Policy (**$0.00**)
  7. *Dedicated Worker:* AWS ECS Fargate Task for BullMQ Revocation & ZIP Engine (**$18.00 / mo**)
  8. *Task Queue & Caching:* AWS ElastiCache for Redis Multi-AZ (`cache.t4g.micro`) (**$35.00 / mo**)
  9. *Email Delivery:* AWS SES High-Throughput (65,000 emails/mo) (**$6.50 / mo**)
  10. *Error Tracking:* Sentry Team Plan (**$26.00 / mo**)
  11. *Observability & Logs:* AWS CloudWatch Log Groups & Alarms (**$22.00 / mo**)
  12. *Domain Name:* Cloudflare Registrar (`.in`) (**$0.70 / mo**)
* **Package C Total:** **$510.70 USD / month (~₹44,175 INR / month -> ₹530,105 INR / year)**.

---

## 5. Total Cost Calculation Matrix

### Complete Line-Item Cost Comparison Table

| Infrastructure Expense Category | Package A (Budget) [USD] | Package B (Professional) [USD] | Package C (Enterprise) [USD] | Package A [INR] | Package B [INR] | Package C [INR] |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Frontend Hosting** | $0.00 | $20.00 | $20.00 | ₹0.00 | ₹1,730.00 | ₹1,730.00 |
| **Backend API Compute** | $7.00 | $35.80 | $145.00 | ₹605.50 | ₹3,096.70 | ₹12,542.50 |
| **Load Balancer (Reverse Proxy)**| $0.00 | $21.50 | $25.00 | ₹0.00 | ₹1,859.75 | ₹2,162.50 |
| **Managed Database** | $8.00 | $57.00 | $175.00 | ₹692.00 | ₹4,930.50 | ₹15,137.50 |
| **Object Storage (3D Assets)** | $0.10 | $3.60 | $37.50 | ₹8.65 | ₹311.40 | ₹3,243.75 |
| **Data Egress Bandwidth** | $0.00 | $0.00 | $0.00 | ₹0.00 | ₹0.00 | ₹0.00 |
| **Edge CDN & Anti-DDoS** | $0.00 | $0.00 | $0.00 | ₹0.00 | ₹0.00 | ₹0.00 |
| **Domain Registration** | $0.90 | $0.90 | $0.90 | ₹77.85 | ₹77.85 | ₹77.85 |
| **DNS Management & SSL** | $0.00 | $0.00 | $0.00 | ₹0.00 | ₹0.00 | ₹0.00 |
| **Web App Firewall (WAF)** | $0.00 | $0.00 | $0.00 | ₹0.00 | ₹0.00 | ₹0.00 |
| **Background Revocation Worker**| $0.00 | $0.00 | $18.00 | ₹0.00 | ₹0.00 | ₹1,557.00 |
| **Redis / Queue Cache** | $0.00 | $5.00 | $35.00 | ₹0.00 | ₹432.50 | ₹3,027.50 |
| **Transactional Email** | $0.00 | $0.90 | $6.50 | ₹0.00 | ₹77.85 | ₹562.25 |
| **Error Tracking (Sentry)** | $0.00 | $0.00 | $26.00 | ₹0.00 | ₹0.00 | ₹2,249.00 |
| **Logging & System Metrics** | $0.00 | $5.00 | $22.00 | ₹0.00 | ₹432.50 | ₹1,903.00 |
| **Database Point-in-Time Backup**| $0.00 | Included | Included | ₹0.00 | Included | Included |
| **TOTAL FIXED MONTHLY COST** | **$16.00** | **$149.70** | **$510.90** | **₹1,384.00** | **₹12,949.05** | **₹44,192.85** |
| **TOTAL ANNUALIZED COST** | **$192.00** | **$1,796.40** | **$6,130.80** | **₹16,608.00** | **₹155,388.60** | **₹530,314.20** |

---

## 6. Usage-Based Cost Scenarios

We estimate infrastructure consumption across 5 distinct operational scale tiers:

```
+----------------------------------------------------------------------------------------------------+
|                                    GROWTH TRAJECTORY COST SCALING                                  |
|                                                                                                    |
|  100 MAU:     $16.00 / mo   (Rs 1,384 / mo)    ─── [Stage 1: Bootstrap Setup]                      |
|  1,000 MAU:   $42.50 / mo   (Rs 3,676 / mo)    ─── [Early Commercial Validation]                   |
|  5,000 MAU:   $149.70 / mo  (Rs 12,949 / mo)   ─── [Stage 2: Enterprise High-Availability Baseline]|
|  10,000 MAU:  $215.00 / mo  (Rs 18,597 / mo)   ─── [Scaling SaaS Trajectory]                       |
|  50,000 MAU:  $510.90 / mo  (Rs 44,193 / mo)   ─── [Stage 3: Enterprise Market Leader]             |
+----------------------------------------------------------------------------------------------------+
```

### 6.1 Workload Estimation Model & Assumptions

1. **Active Users vs. Buyers:** In B2B technical marketplaces, approximately **5%–10% of Monthly Active Users (MAU)** execute financial orders; the remaining users browse catalogs, inspect 3D WebGL meshes, and review technical specifications.
2. **Storage Consumption Profile:**
   * Average 3D CAD product package: **75 MB** (`.blend` + `.fbx` + 4K PBR textures).
   * Catalog expands from 50 models (Stage 1) to 5,000 models (Stage 3).
3. **Data Egress Calculation:**
   * Each purchase allows up to **2 authorized customer downloads** within a 30-day licensing window (`downloadLimit: 2`).
   * Average download package size: **120 MB**.
   * WebGL 3D preview asset (`.glb` / `.fbx` embedded): **15 MB**, cached heavily on Cloudflare Edge.
4. **Revocation Scheduler Operations:**
   * Background sweep interval: **60 seconds** (`REVOCATION_CHECK_INTERVAL_SECONDS=60`).
   * Total automated sweeps executed per month: `60 mins * 24 hrs * 30 days = 43,200 sweeps / month`.

---

### 6.2 Scenario Cost Comparison Matrix

| Operational Metric | 100 MAU | 1,000 MAU | 5,000 MAU | 10,000 MAU | 50,000 MAU |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Daily Active Users (DAU)** | ~10 DAU | ~80 DAU | ~350 DAU | ~800 DAU | ~4,000 DAU |
| **Monthly Paid Transactions** | 15 orders | 120 orders | 600 orders | 1,500 orders | 7,500 orders |
| **Active 3D Models in Catalog** | 50 models | 200 models | 500 models | 1,500 models | 5,000 models |
| **Storage Consumed (Cloudflare R2)**| 15 GB | 60 GB | 250 GB | 750 GB | 2,500 GB (2.5 TB) |
| **Monthly Download Egress** | 50 GB | 200 GB | 800 GB | 2,500 GB | 9,000 GB (9 TB) |
| **Database Operations / sec** | < 5 ops/sec | ~15 ops/sec | ~45 ops/sec | ~120 ops/sec | ~500 ops/sec |
| **Monthly Transactional Emails** | ~150 emails | ~1,200 emails | ~5,000 emails | ~14,000 emails | ~65,000 emails |
| **Frontend Cost (Cloudflare Pages)**| $0.00 | $0.00 | $20.00 | $20.00 | $20.00 |
| **Backend Compute (API)** | $7.00 | $20.00 | $35.80 | $65.00 | $145.00 |
| **Application Load Balancer** | $0.00 | $0.00 | $21.50 | $22.00 | $25.00 |
| **Database Cost (MongoDB Atlas)**| $8.00 | $18.00 | $57.00 | $57.00 | $175.00 |
| **Storage Cost (Cloudflare R2)**| $0.10 | $0.90 | $3.60 | $11.25 | $37.50 |
| **Network Egress Fee (R2 Zero Fee)**| **$0.00** | **$0.00** | **$0.00** | **$0.00** | **$0.00** |
| **Redis / BullMQ Queue (Upstash)**| $0.00 | $2.00 | $5.00 | $12.00 | $35.00 |
| **Transactional Email (AWS SES)**| $0.00 | $0.20 | $0.90 | $1.50 | $6.50 |
| **Monitoring, Error & Telemetry**| $0.00 | $0.50 | $5.00 | $25.35 | $66.00 |
| **Domain Registration** | $0.90 | $0.90 | $0.90 | $0.90 | $0.90 |
| **TOTAL ESTIMATED MONTHLY (USD)**| **$16.00** | **$42.50** | **$149.70** | **$215.00** | **$510.90** |
| **TOTAL ESTIMATED MONTHLY (INR)**| **₹1,384.00** | **₹3,676.25** | **₹12,949.05** | **₹18,597.50** | **₹44,192.85** |
| **TOTAL ESTIMATED ANNUAL (INR)** | **₹16,608.00** | **₹44,115.00** | **₹155,388.60** | **₹223,170.00** | **₹530,314.20** |

---

## 7. Procurement Strategy & Final Recommendations

### 7.1 Best-in-Class Providers by Infrastructure Category

| Category | Recommended Provider | Service / Plan | Justification for SVRP Project |
| :--- | :--- | :--- | :--- |
| **Frontend Hosting** | **Cloudflare** | Pages Pro ($20/mo) | Zero egress charges, 12+ edge points in India, unlimited bandwidth. |
| **Backend Compute** | **AWS** | ECS Fargate (`ap-south-1`) | Serverless container scaling, private VPC isolation, native compliance. |
| **Managed Database** | **MongoDB** | MongoDB Atlas M10 | Native compatibility with Mongoose 9 schemas, automated 3-node failover. |
| **Object Storage** | **Cloudflare** | Cloudflare R2 | S3 SigV4 compatible, zero outbound egress fees ($0.00/GB). |
| **CDN & Edge Security**| **Cloudflare** | Core WAF + Anycast | Edge DDoS absorption, TLS 1.3 termination, OWASP Core rules. |
| **Task Queue / Cache** | **Upstash** | Serverless Redis | Pay-as-you-go pricing, native BullMQ compatibility, zero idle server fees. |
| **Email Delivery** | **AWS** | Amazon SES (Mumbai) | $0.10/1,000 emails, Mumbai region delivery, dedicated DKIM/DMARC. |
| **Error Tracking** | **Sentry** | Sentry Developer / Team | Full-stack visibility across Node.js Express and Three.js WebGL crashes. |
| **Domain Registration**| **Cloudflare** | Cloudflare Registrar | At-cost wholesale domain pricing with no markup on renewals. |

---

### 7.2 Initial Procurement Shopping List (Step-by-Step Purchase Plan)

To transition SVRP into production, procure services in the following sequence:

```
STEP 1: Domain & Edge Security Acquisition (Day 1)
  [+] Provider: Cloudflare Registrar
  [+] Service: Register "railworks.in" or transfer existing apex domain
  [+] Cost: ~$11.00 USD / year (~Rs 950 INR)
  [+] Configure: Enable DNSSEC, Universal SSL (Full Strict Mode), and HTTP/3

STEP 2: Object Storage Bucket Provisioning (Day 1)
  [+] Provider: Cloudflare
  [+] Service: Cloudflare R2 Object Storage
  [+] Plan: Enable R2 in dashboard (Free 10GB tier auto-activated)
  [+] Bucket Name: "railworks-3d-models"
  [+] Credentials: Create S3-Compatible API Token (Access Key ID & Secret Access Key)
  [+] Update Backend .env: CLOUDFLARE_R2_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY

STEP 3: Managed Database Setup (Day 2)
  [+] Provider: MongoDB Atlas (mongodb.com)
  [+] Tier: Start on Flex Tier ($8-$15/mo) for staging, upgrade to M10 ($57/mo) for production launch
  [+] Cloud Provider & Region: AWS Asia Pacific (Mumbai) ap-south-1
  [+] Network Access: Restrict IP Access List to AWS Elastic IPs and VPC Peering CIDR
  [+] Update Backend .env: DATABASE_URL=mongodb+srv://<user>:<pwd>@cluster.mongodb.net/railworks

STEP 4: Transactional Email Gateway Setup (Day 2)
  [+] Provider: AWS SES (Amazon Simple Email Service)
  [+] Region: Asia Pacific (Mumbai) ap-south-1
  [+] Setup: Verify domain "railworks.in" via Cloudflare DNS TXT/CNAME records (DKIM)
  [+] Move out of SES Sandbox: Submit standard production access request (24-hour turnaround)
  [+] Update Backend .env: SMTP_HOST=email-smtp.ap-south-1.amazonaws.com, SMTP_PORT=587, SMTP_USER, SMTP_PASS

STEP 5: Backend Container Runtime & Load Balancer (Day 3)
  [+] Provider: Amazon Web Services (AWS)
  [+] Service: Amazon ECR (Container Registry) + Amazon ECS Fargate + Application Load Balancer
  [+] Region: ap-south-1 (Mumbai)
  [+] Plan: ECS Fargate Task Definition (1 vCPU, 2 GB RAM, 2 Minimum Tasks)
  [+] Connect: Point Cloudflare DNS CNAME "api.railworks.in" to AWS Application Load Balancer DNS

STEP 6: Frontend Edge Deployment (Day 4)
  [+] Provider: Cloudflare Pages
  [+] Connection: Link GitHub repository ("Frontend" directory root)
  [+] Build Settings: Framework Preset: Vite | Build Command: npm run build | Output Dir: dist
  [+] Environment Variable: VITE_API_URL=https://api.railworks.in/api
  [+] Custom Domain: Bind "railworks.in" and "www.railworks.in"
```

---

## 8. Taxes, Hidden Costs, and Optimization Rules

### 8.1 Applicable Taxes in India
* **Goods and Services Tax (GST):**
  * All cloud infrastructure providers operating or billing in India (AWS India / AISPL, MongoDB Atlas India, Razorpay) apply **18% GST** on cloud computing services.
  * *Tax Optimization:* Add a valid **GSTIN** to your AWS, MongoDB, and Cloudflare billing profiles. This permits full **Input Tax Credit (ITC)** claims against business GST liabilities.

### 8.2 Payment Gateway Settlement Fees
* **Razorpay:** Standard domestic rate is **2.0% per successful transaction + 18% GST on the fee**.
* *Example Settlement:*
  * Product Price: ₹2,499.00
  * Razorpay Fee (2%): ₹49.98
  * GST on Fee (18%): ₹9.00
  * **Total Fee Deducted:** ₹58.98
  * **Net Bank Settlement:** **₹2,440.02**
* *Recurring Fee:* ₹0.00 (No monthly setup or maintenance charges).

### 8.3 Recommended Budget Allocation Summary

| Operational Milestone | Target MAU | Initial Setup Budget | Expected Monthly Operating Cost | Expected Annual Operating Cost |
| :--- | :--- | :--- | :--- | :--- |
| **Initial Beta Launch** | < 500 MAU | **₹1,000 INR** *(Domain registration)* | **₹1,384 INR / month** *(~$16 USD)* | **₹16,608 INR / year** |
| **Commercial Production (Target)**| 5,000 MAU | **₹5,000 INR** *(Buffer & tests)* | **₹11,202–₹12,949 INR / month** | **₹134,421–₹155,388 INR / year**|
| **Enterprise Scale** | 50,000 MAU | **₹15,000 INR** *(Security audits)* | **₹40,223–₹44,193 INR / month** | **₹482,670–₹530,314 INR / year**|

---
*End of Procurement & Cost Analysis Report — Shri Vishwakarma Rail Production*

