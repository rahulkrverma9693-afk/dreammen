# ✦ DREAMGIRL FAMILY SALON ✦
## Salon Management Software — Product Requirements Document
### Version 2.0 · August 2026 · Status: Draft
#### *A Multi-Tenant SaaS Platform for Premium & Family Salons*

---

> **Vision:** Build the most elegant, powerful, and intuitive salon management platform in India — one that DreamGirl runs first, then licenses to hundreds of other salons as a SaaS product.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Business Model](#2-product-vision--business-model)
3. [Goals & Success Metrics](#3-goals--success-metrics)
4. [Market Opportunity](#4-market-opportunity)
5. [User Personas](#5-user-personas)
6. [System Architecture](#6-system-architecture)
7. [Multi-Tenancy & SaaS Infrastructure](#7-multi-tenancy--saas-infrastructure)
8. [Feature Modules — Detailed Requirements](#8-feature-modules--detailed-requirements)
   - [8.1 Dashboard](#81-dashboard)
   - [8.2 Billing Module](#82-billing-module)
   - [8.3 Appointments Module](#83-appointments-module)
   - [8.4 Customers Module](#84-customers-module)
   - [8.5 Marketing Module](#85-marketing-module)
   - [8.6 Reports Module](#86-reports-module)
   - [8.7 Settings Module](#87-settings-module)
   - [8.8 Inventory Module](#88-inventory-module)
9. [UI/UX Design System — Luxury Premium Theme](#9-uiux-design-system--luxury-premium-theme)
10. [SaaS Subscription & Pricing Plans](#10-saas-subscription--pricing-plans)
11. [Super Admin Panel (Platform Owner)](#11-super-admin-panel-platform-owner)
12. [Non-Functional Requirements](#12-non-functional-requirements)
13. [Technology Stack](#13-technology-stack)
14. [Milestones & Timeline](#14-milestones--timeline)
15. [Risk Register](#15-risk-register)
16. [Appendix — Data Models](#16-appendix--data-models)

---

## 1. Executive Summary

**DreamGirl Salon Management Software** is a comprehensive, web-based SaaS platform that digitises and elevates every aspect of salon operations — from client walk-ins and premium service billing to staff performance tracking and automated marketing campaigns.

**Phase 1 — Internal Use:** DreamGirl Family Salon deploys the platform for its own branch(es), eliminating manual processes and gaining real-time business intelligence.

**Phase 2 — SaaS Product:** The same platform is packaged as a white-label / branded SaaS offering sold to other salons across India, with tiered subscription plans, a Super Admin dashboard for the platform owner, and onboarding tooling.

The product is inspired by platforms like Salonify but designed with a **significantly superior UI/UX** — a luxury, dark-mode-capable aesthetic with gold accents, glassmorphism cards, and cinematic typography — positioning it at the premium end of the salon software market.

---

## 2. Product Vision & Business Model

### 2.1 Two-Layer Business Model

```
┌─────────────────────────────────────────────────────────┐
│              DREAMGIRL PLATFORM (You)                   │
│   Owns the software · Hosts infrastructure · Sets SaaS  │
│   pricing · Provides support · Controls Super Admin     │
└──────────────────────┬──────────────────────────────────┘
                       │ sells subscriptions to
          ┌────────────┴────────────┐
          │                         │
   ┌──────▼──────┐         ┌────────▼────────┐
   │ DreamGirl   │         │  Other Salons   │
   │ (Tenant #1) │  · · ·  │ (Tenant #2–N)   │
   │ Your branch │         │ Paying customers │
   └─────────────┘         └─────────────────┘
```

### 2.2 Revenue Streams

| Stream | Model | Estimated ARR Potential |
|--------|-------|------------------------|
| SaaS Subscriptions | Monthly/Annual per salon | ₹3,000–₹15,000/salon/month |
| Setup & Onboarding Fee | One-time per new salon | ₹5,000–₹25,000 |
| SMS/WhatsApp Add-ons | Pay-per-use top-ups | Variable |
| White-label Licensing | Per enterprise chain | ₹1,00,000+/year |
| Training & Support | Premium support tiers | ₹2,000–₹8,000/month |

### 2.3 Positioning

> *"The Rolls-Royce of salon management software — built for salons that value elegance as much as efficiency."*

**Target Customers:**
- Family salons (primary — like DreamGirl)
- Unisex luxury salons
- Boutique beauty studios
- Chains with 2–10 branches
- Spa centers and wellness studios

---

## 3. Goals & Success Metrics

### 3.1 Product Goals

- ◆ Eliminate billing errors → reduce checkout time by **60%**
- ◆ Increase customer return rate from ~40% to **>60%** via loyalty and marketing
- ◆ Enable real-time revenue visibility for owners via **live dashboard**
- ◆ Onboard **50 paying salons** within 12 months of SaaS launch
- ◆ Achieve **MRR of ₹3,00,000** within 18 months

### 3.2 Key Performance Indicators

| KPI | Baseline | Target (6 months) |
|-----|----------|-------------------|
| Avg. billing time/customer | 8–10 min | < 3 min |
| Customer return rate | ~40% | > 60% |
| Online appointments booked | 0% | > 30% of total |
| Inventory stockout incidents | Frequent | Near zero |
| SaaS tenants onboarded | 0 | 20 (Month 6) |
| Monthly churn rate | — | < 5% |
| NPS score | — | > 50 |

---

## 4. Market Opportunity

### 4.1 Indian Salon Market

- India has **~700,000+ registered salons** with millions of unregistered establishments
- Beauty & wellness industry projected to reach **₹2.68 lakh crore by 2025**
- Less than **8% of salons** use dedicated management software — massive greenfield opportunity
- Existing software (Salonify, Zenoti, Vagaro) either too expensive, too complex, or poorly designed for Indian SMBs

### 4.2 Competitive Gap

| Feature | Salonify | Zenoti | **DreamGirl Platform** |
|---------|----------|--------|------------------------|
| UI Quality | Average | Good | **Luxury Premium ✦** |
| India-first payments | Yes | No | **Yes — Razorpay/UPI** |
| WhatsApp Marketing | Basic | No | **Advanced** |
| Price (SMB) | ₹3,000/mo | ₹15,000/mo | **₹1,499–₹7,999/mo** |
| Multi-tenant SaaS | No | Yes | **Yes** |
| White-label | No | Yes | **Yes** |
| Offline capability | No | No | **PWA (Phase 2)** |
| AI Upsell | No | Basic | **Yes** |

---

## 5. User Personas

### Persona 1 — Priya, Head Receptionist
> *Age 24 · Tier-2 city · Uses WhatsApp daily · Low-to-medium tech comfort*

**Goals:** Complete a bill in under 3 minutes. Book appointments without confusion. Look competent in front of customers.

**Pain Points:**
- Current billing is slow and prone to mistakes
- No visibility into a customer's history during checkout
- Remembering which packages a customer has redeemed is hard

**Needs from Software:**
- Clean, fast billing form with auto-complete
- Customer history at a glance on the billing screen
- One-tap package redemption

---

### Persona 2 — Raj, Salon Owner
> *Age 38 · Entrepreneur · Uses Instagram & Excel · Business-focused*

**Goals:** Know his daily revenue without asking staff. Run offers that bring customers back. Monitor which employee is performing.

**Pain Points:**
- No real-time revenue data — relies on EOD cash counting
- No easy way to run campaigns without WhatsApp broadcast lists
- Suspects discounts are being misused

**Needs from Software:**
- Live dashboard on phone
- Campaign builder for WhatsApp
- Discount audit logs

---

### Persona 3 — Meena, Senior Stylist
> *Age 29 · Skilled professional · Wants recognition · Mobile-first*

**Goals:** Know her appointments for the day. Track her tips and commissions. Not waste time with admin.

**Pain Points:**
- Doesn't know her targets or how close she is
- Appointment schedule changes aren't communicated quickly

**Needs from Software:**
- Personal dashboard (mobile view)
- Real-time appointment notifications
- Monthly earnings breakdown

---

### Persona 4 — Arjun, Owner of "Glam Studio" (SaaS Customer)
> *Age 35 · Runs 2 salons · Looking to digitalise · Budget-conscious*

**Goals:** Affordable, beautiful software that doesn't require IT staff. Easy onboarding. Works on existing computers/tablets.

**Pain Points:**
- Enterprise software too expensive and complex
- Basic apps look cheap — embarrassing for a premium salon image
- Needs data to be separated per branch

**Needs from Software:**
- Premium look that matches his salon brand
- Simple self-onboarding with guided setup
- Per-branch dashboards with owner-level overview

---

## 6. System Architecture

### 6.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Web App     │  │  PWA (v2)    │  │  Super Admin Portal       │  │
│  │  React SPA   │  │  Mobile      │  │  (Platform Owner)         │  │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬─────────────┘  │
└─────────┼─────────────────┼──────────────────────── ┼───────────────┘
          │                 │                          │
┌─────────▼─────────────────▼──────────────────────── ▼───────────────┐
│                      API GATEWAY (Nginx + Rate Limiting)              │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────────┐
│                    BACKEND SERVICES                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Auth Service│  │  Core API    │  │  Notification │              │
│  │  JWT + RBAC  │  │  Node.js/    │  │  Service      │              │
│  │              │  │  Express     │  │  SMS/WA/Email │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Payment Svc │  │  Report Svc  │  │  AI/ML Svc   │              │
│  │  Razorpay    │  │  Aggregation │  │  Upsell Engine│              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────────┐
│                       DATA LAYER                                      │
│  PostgreSQL (per-tenant schema)  ·  Redis (cache/sessions)           │
│  AWS S3 (files/receipts)         ·  Elasticsearch (search)           │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 Component Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + Vite | SPA, fast HMR, component-driven |
| Styling | TailwindCSS + Custom Design System | Luxury UI tokens |
| State | Zustand + React Query | Client + server state |
| Charts | Recharts + D3.js | Dashboard analytics |
| Backend | Node.js + Express.js | REST API |
| ORM | Prisma | Type-safe DB access |
| Database | PostgreSQL 15 | ACID, relational, multi-schema |
| Cache | Redis 7 | Session, rate limit, real-time |
| Search | Elasticsearch | Customer/service search |
| Storage | AWS S3 + CloudFront | Assets, receipts, photos |
| Auth | JWT + RBAC | Stateless, role-based |
| Payments | Razorpay | UPI, Cards, Netbanking, Wallets |
| SMS | MSG91 / Twilio | OTP, reminders |
| WhatsApp | WhatsApp Business API | Campaigns, receipts |
| Email | SendGrid | Receipts, reports, OTP |
| Monitoring | Sentry + Datadog | Error tracking + APM |
| CI/CD | GitHub Actions → Docker → AWS ECS | Automated deploy |
| Hosting | AWS (ECS + RDS + ElastiCache) | Scalable, managed |

---

## 7. Multi-Tenancy & SaaS Infrastructure

### 7.1 Tenancy Model

Each salon that subscribes gets a **dedicated schema** within the shared PostgreSQL cluster:

```
PostgreSQL Cluster
├── schema: public          (shared: plans, platform config)
├── schema: tenant_dreamgirl (DreamGirl's data)
├── schema: tenant_glam_studio
├── schema: tenant_beauty_palace
└── schema: tenant_N...
```

**Benefits:**
- Strong data isolation (no cross-tenant data leaks)
- Easy per-tenant backup and migration
- Schema-level performance tuning per tenant

### 7.2 Tenant Onboarding Flow

```
1. Owner visits landing page → selects plan → registers
2. System creates tenant schema + seeds default data
3. Guided setup wizard (5 steps):
   Step 1: Business info (name, logo, address)
   Step 2: Add employees
   Step 3: Add services & prices
   Step 4: Configure taxes & payment methods
   Step 5: Test first bill → Go live!
4. Welcome email + video tutorial links sent
5. 14-day free trial starts
```

### 7.3 Subdomain / Custom Domain

- Default: `{salonname}.dreamgirlapp.in`
- Custom domain (Pro+): `app.glamstudio.in` with SSL auto-provisioned via Let's Encrypt

### 7.4 White-Label Option (Enterprise Plan)

- Remove all DreamGirl branding
- Use salon's own logo, colours, domain
- Custom email sender name
- Ideal for chains with 5+ branches

---

## 8. Feature Modules — Detailed Requirements

---

### 8.1 Dashboard

The Dashboard is the first screen after login. It provides a real-time operational overview with role-specific widgets.

#### Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  TOPBAR: Logo | Branch Selector | Date | Notifications | Profile │
├──────────────┬──────────────────────────────────────────────────┤
│              │                                                   │
│  SIDEBAR     │   KPI CARDS ROW (Income / Expense / Service /    │
│  (collapsed  │   Product / Membership)                          │
│   on tablet) │                                                   │
│              │   ┌─────────────────────┬───────────────────┐    │
│  Dashboard   │   │  Payment Summary    │  Income Summary   │    │
│  Billing     │   │  Table              │  Panel            │    │
│  Appts       │   ├─────────────────────┼───────────────────┤    │
│  Customers   │   │  Balance Due        │  Advance Payment  │    │
│  Marketing   │   ├─────────────────────┴───────────────────┤    │
│  Reports     │   │  Revenue Trend Chart (30-day sparkline) │    │
│  Settings    │   ├─────────────────────┬───────────────────┤    │
│              │   │  Product Stock      │  Upcoming         │    │
│              │   │  (Low Qty alerts)   │  Occasions        │    │
│              │   ├─────────────────────┼───────────────────┤    │
│              │   │  Irregular          │  Today's          │    │
│              │   │  Customers          │  Appointments     │    │
│              │   └─────────────────────┴───────────────────┘    │
└──────────────┴──────────────────────────────────────────────────┘
```

#### Dashboard Tabs

| Tab | Contents |
|-----|----------|
| **Sales** | Revenue KPIs, Payment Summary, Income Summary, Balance Due, Charts |
| **Attendance** | Staff check-in/out status, hours worked, absent today |
| **Employee** | Per-staff revenue, services count, targets progress bar |
| **Packages** | Active memberships, spa packs expiring in 7 days |
| **Expenses** | Today's logged expenses by category |
| **Reminders** | Follow-ups and scheduled reminders due today |
| **Inhouse Inventory** | Low-stock consumables, recent transfers |
| **Analytics** | Revenue trend, footfall chart, top services, peak hours heatmap |

#### KPI Widget Specifications

| Widget | Data | Update |
|--------|------|--------|
| Income — Total | Sum of all revenue today | Real-time |
| Expense — Total | Sum of all expenses today | Real-time |
| Income — Service | Service billing revenue | Real-time |
| Income — Product | Retail product revenue | Real-time |
| Income — Memberships | Membership sales | Real-time |
| Income — Spa Packs | Spa pack sales | Real-time |
| Payment Summary Table | Cash / Card / UPI / Wallet per billing type | Real-time |
| Income Summary Panel | Gross → Discount → Net → Tax → Tips → **Total** | Real-time |
| Balance Due Summary | Today's due + Past due collected today | Real-time |
| Advance Payment Summary | Advance collected today | Real-time |
| Revenue Trend (30d) | Sparkline chart, day-by-day | Hourly |
| Product Stock Alerts | Items below minimum level | Hourly |
| Occasions | Birthdays & anniversaries in next 7 days | Daily |
| Irregular Customers | Not visited in 30+ days | Daily |

---

### 8.2 Billing Module

The core revenue-capture interface. Six billing types accessible via tabs.

#### Billing Tab Overview

| Tab | Purpose |
|-----|---------|
| **Service** | Bill for hair, beauty, and wellness services |
| **Product** | Bill for retail product sales |
| **Combo Pack** | Sell bundled service packages |
| **Spa Pack** | Assign or redeem spa packages |
| **Prepaid Pack** | Sell and redeem prepaid credit packs |
| **Membership** | Sell and manage membership plans |

---

#### 8.2.1 Service Billing — Field Specifications

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Customer Name | Autocomplete text | No | Creates new if not found |
| Customer Phone | Phone input | No | Auto-populates on select |
| Customer ID | Text / Barcode scan | No | QR or barcode supported |
| Gender | Toggle (Male / Female) | Yes | Filters available services |
| Membership | Dropdown | No | Auto-applies member discounts |
| Category | Dropdown | Yes | Service category filter |
| Service | Dropdown + Search | Yes | Filtered by category & gender |
| Quantity | Number stepper | Yes | Default: 1 |
| Gross Amount | Auto-calculated | — | Unit price × qty |
| Discount % or ₹ | Toggle + Number | No | Per-line or global |
| Net Amount | Auto-calculated | — | After discount |
| Tax % | GST toggle | No | Configurable per bill |
| Price Inclusive of GST | Checkbox | No | Extracts GST from price |
| Employee | Dropdown | No | Commission tracking |
| Referred Service | Dropdown | No | Cross-sell/upsell reference |
| Bill Note | Text area | No | Printed on receipt |
| Private Note | Text area | No | Internal only, not printed |

#### 8.2.2 Bill Line Items Table

| Column | Description |
|--------|-------------|
| Sl No | Auto-numbered |
| Item Description | Service/Product name |
| Referred Service/Product | Cross-sell link |
| Gross Amount | Unit price |
| Qty | Quantity |
| Gross Amt × Qty | Subtotal |
| Discount | Discount % and ₹ amount |
| Discount (₹) | Calculated discount |
| Net Amount | After discount |
| Tax (%) | Applied tax slab |
| Employee | Assigned staff |
| Actions | Edit / Delete row |

#### 8.2.3 Invoice Summary Panel

```
┌─────────────────────────────────┐
│  INVOICE SUMMARY                │
├─────────────────────────────────┤
│  Gross Total          ₹ 1,200  │
│  Discount (10%)        - ₹ 120  │
│  ────────────────────────────── │
│  Net Total (after disc.) ₹ 1,080│
│  GST @ 18%             + ₹ 194  │
│  Tips                  + ₹  50  │
│  ════════════════════════════  │
│  NET PAYABLE          ₹ 1,324  │ ← Highlighted in brand gold
└─────────────────────────────────┘
```

#### 8.2.4 Payment Modal — Methods

| Method | Flow |
|--------|------|
| **Cash** | Enter cash received → System shows change due |
| **Card (Debit/Credit)** | Enter last 4 digits for reference; optional POS integration |
| **UPI / QR Code** | Display dynamic QR; auto-verify via Razorpay webhook |
| **Customer Wallet** | Shows available balance → deduct |
| **Membership Credits** | Deduct applicable service credits |
| **Cashback Wallet** | Redeem earned cashback |
| **Split Payment** | Any combination of above methods |
| **Advance Payment** | Mark partial payment; track balance due |
| **Complimentary** | Mark as comp with mandatory reason |

#### 8.2.5 Billing Actions

- **Proceed to Payment** — Opens payment modal
- **Save as Draft** — Resume incomplete bill later
- **Reset** — Clear form with confirmation
- **Set Bill Number** — Manual override of auto-increment
- **Bill History** — Search/filter all past bills
- **Drafts** — View and resume saved drafts
- **Print Preview** — Preview receipt before printing
- **Send Receipt** — WhatsApp/SMS/Email receipt to customer

#### 8.2.6 Spa Pack — Assign & Redeem

**Assign Flow:**
```
Select Customer → Select Employee → Select Spa Pack
→ View Pack Details (price, validity, included services)
→ Apply Discount (if applicable)
→ Review Invoice Summary → Proceed to Payment
```

**Redeem Flow:**
```
Select Customer → View Active Packs
→ Select Pack → Choose Services to Redeem
→ Assign Employee → Confirm Redemption
→ Print Service Slip
```

---

### 8.3 Appointments Module

#### 8.3.1 Views

| View | Description |
|------|-------------|
| **Overview** | Today's appointment list, colour-coded by status |
| **Calendar** | Monthly / Weekly / Daily grid with drag-and-drop |
| **Chairs/Rooms** | Gantt-style resource view showing occupancy per chair |

#### 8.3.2 Appointment Fields

| Field | Type | Notes |
|-------|------|-------|
| Customer | Autocomplete | Create new inline |
| Date & Time | Date-time picker | Validates against business hours |
| Services | Multi-select | Each has estimated duration |
| Employee | Dropdown | Checks staff availability |
| Chair / Room | Dropdown | Conflict detection |
| Duration | Auto-calculated | Sum of selected service durations |
| Notes | Text area | Special requests, allergies |
| Status | Dropdown | Scheduled / Confirmed / In Progress / Completed / Cancelled / No-Show |
| Source | Auto-set | Walk-in / Online / Phone / WhatsApp |
| Colour Label | Colour picker | Visual categorisation on calendar |

#### 8.3.3 Appointment Status Flow

```
[Scheduled] → [Confirmed] → [In Progress] → [Completed]
     ↓              ↓                              ↓
[Cancelled]    [No-Show]              [Convert to Bill]
```

#### 8.3.4 Actions

| Action | Description |
|--------|-------------|
| Create Appointment | Manual entry or from booking portal |
| Convert to Bill | One-click bill creation, pre-fills all services |
| Send Reminder | SMS / WhatsApp reminder to customer |
| Reschedule | Drag on calendar or edit modal |
| Cancel | With optional cancellation reason + customer notification |
| Mark No-Show | Updates customer visit history |
| Add to Waitlist | If slot unavailable, adds to waitlist |

#### 8.3.5 Online Booking (BookingZone)

- Public URL: `{salonname}.dreamgirlapp.in/book`
- Customer journey: Select service → Date → Time → Employee preference → Enter phone → OTP → Confirmed
- Configurable slot duration (15 / 30 / 45 / 60 min)
- Buffer time between appointments
- Maximum advance booking days
- Separate appointment hours from business hours
- Real-time availability display
- Auto-SMS/WhatsApp confirmation to customer and salon

---

### 8.4 Customers Module

#### 8.4.1 Customer List View

| Feature | Specification |
|---------|--------------|
| Columns | Name, Phone, Gender, Group, Wallet Balance, Last Visit, Actions |
| Filters | Group, Gender, Last Visit date range, Search (name/phone/email) |
| Sorting | Any column, ascending/descending |
| Bulk Actions | Export CSV, Send WhatsApp, Add to Group, Delete |
| Pagination | Configurable (10 / 25 / 50 / 100 per page) |

#### 8.4.2 Customer Profile Sections

| Section | Fields |
|---------|--------|
| **Personal Info** | Name, Phone, Email, DOB, Anniversary, Gender, Photo, Customer ID |
| **Address** | Street, City, State, PIN, Google Maps link |
| **Notes** | Preferences, allergies, hair type, skin type |
| **Membership** | Active plan, expiry, remaining credits, history |
| **Wallet** | Current balance, all transactions (credited / debited) |
| **Visit History** | All past bills with service details, amounts, employee, feedback |
| **Appointment History** | Past and upcoming appointments |
| **Packages** | Active Spa Packs, Combo Packs, Prepaid Packs with usage |
| **Loyalty Points** | Points earned, redeemed, balance (if programme enabled) |
| **Documents** | Consent forms, intake forms |
| **Communications** | Log of all SMS/WhatsApp/Email sent to this customer |

#### 8.4.3 Customer Management Features

- **Groups** — Segment customers (VIP, Regular, Staff, Corporate, Bridal)
- **Cards** — Physical or digital loyalty card management with barcode
- **Bulk Import** — CSV import with field mapping wizard
- **Merge Duplicates** — Detect and merge duplicate profiles
- **Referral Tracking** — Track which customer referred whom
- **Customer Timeline** — Chronological activity feed for each customer

---

### 8.5 Marketing Module

#### 8.5.1 Cashback System

| Setting | Description |
|---------|-------------|
| Enable/Disable | Global toggle in Settings → Billing → Cashback |
| Cashback % | Configurable per billing type (Service, Product, etc.) |
| Minimum Bill Value | Minimum amount for cashback eligibility |
| Wallet Credit | Auto-credited post bill payment |
| Expiry | Optional cashback expiry date |
| Dashboard Widget | Cashback Added vs Redeemed for any date range |

#### 8.5.2 WhatsApp Marketing

| Feature | Specification |
|---------|--------------|
| Message Builder | Text + Image + Template variables (name, offer, expiry) |
| Targeting | By Group, Gender, Last Visit range, Birthday/Anniversary, Spend tier |
| Scheduling | Set send date and time |
| Templates | Save reusable campaign templates |
| Delivery Tracking | Sent / Delivered / Read status per recipient |
| Opt-out | Auto-handles STOP replies; removes from future campaigns |
| Campaign History | All past campaigns with performance metrics |

#### 8.5.3 Customer Groups (Segmentation)

- Create named segments (e.g., "VIP Ladies", "Birthday This Month", "Lapsed 60+ Days")
- **Rule-based auto-assignment:**
  - Total spend > ₹X
  - Visit count > Y in last Z days
  - Has active membership
  - Last visit > 60 days ago (lapsed)
  - Birthday in current month
- Manual add/remove customers to any group
- Groups visible in customer profile and billing screen

#### 8.5.4 Smart Upsell (SUHA — AI Engine)

| Feature | Description |
|---------|-------------|
| Trigger | At checkout, when certain services are in the bill |
| Suggestion | AI recommends complementary services based on history |
| Configuration | Admin maps trigger services → suggested services |
| Display | Non-intrusive suggestion card on billing screen |
| Tracking | Acceptance rate of each upsell pair |
| A/B Testing | Test two upsell messages for the same trigger |

#### 8.5.5 Loyalty Points Programme

- Earn points per ₹ spent (configurable ratio, e.g., 1 point per ₹10)
- Redeem points as discount on bills
- Points expiry option
- Tier levels: Silver / Gold / Platinum based on annual spend
- Tier benefits: extra discount %, priority booking, free services

---

### 8.6 Reports Module

All reports support: **Date Range Filter · Branch Filter · Export (PDF / CSV / Excel) · Print**

#### 8.6.1 Finance Reports

| Report | Description |
|--------|-------------|
| Finance Summary | Total income, expenses, taxes, net profit |
| Income Summary | Revenue by day/week/month with trend |
| Expense Summary | Expenses by category and date |
| Payments Summary | Cash vs Card vs UPI vs Wallet breakdown |
| Taxes Summary | GST collected, by slab |
| Income Growth Chart | Month-over-month revenue trend chart |
| Income vs Expense Chart | Profit/loss visualisation |
| Bills with Balance Due | All outstanding payments with contact info |

#### 8.6.2 Sales Reports

| Report | Description |
|--------|-------------|
| Sales by Service | Revenue per service, sorted by volume |
| Sales by Product | Retail product performance |
| Sales by Combo Pack | Pack sales and usage |
| Sales by Spa Pack | Spa pack assign/redeem summary |
| Sales by Prepaid Pack | Prepaid pack sales |
| Sales by Membership | Membership revenue and active count |
| Sales by Customer | Top spender ranking |
| Sales by Bill Type | Walk-in vs Online vs Phone breakdown |
| Sales by Recommendation | Cross-sell success tracking |

#### 8.6.3 Customer Reports

| Report | Description |
|--------|-------------|
| Churn Report | Customers not visited in N days |
| Footfall Summary | Total visits per day/week/month |
| Irregular Customers | Below-average visit frequency |
| Top Spenders | Ranked by total spend |
| Group Summary | Revenue and visits by customer group |
| New vs Returning | Acquisition vs retention ratio chart |

#### 8.6.4 Employee Reports

| Report | Description |
|--------|-------------|
| Performance Summary | Revenue, services, commissions, tips per employee |
| Employee Target Report | Actual vs monthly target |
| Attendance Report | Clock-in/out log, total hours, absent days |
| Yearwise Performance Chart | Annual comparison per employee |
| Tip Summary | Tips collected per employee |

#### 8.6.5 Package & Membership Reports

| Category | Reports |
|----------|---------|
| Spa Pack | Purchase History · Redeem History · About to Expire · Active Pack |
| Combo Pack | Purchase History · Redeem History · About to Expire |
| Prepaid Pack | Purchase History |
| Membership | Purchase History · About to Expire · Credits Balance · Redeem History |
| Wallet Recharges | Purchase History |

#### 8.6.6 Inventory & Other Reports

| Category | Reports |
|----------|---------|
| Retail Inventory | Stock History |
| Inhouse Inventory | Pool Stock Movement Log · Station Stock Movement Log |
| Customer Wallet | Summary · Transactions · Customer Transactions · Balances List |
| Cashbacks | Summary · Transactions |
| Reminders | Upcoming Reminders |

---

### 8.7 Settings Module

#### 8.7.1 General Settings

| Setting Group | Fields |
|--------------|--------|
| **Logo & Branding** | Upload logo, brand colour override (for white-label) |
| **Business Info** | Name, Branch Name, Phone, Email, Address, Google Maps Link |
| **Social Media** | Twitter, Facebook, Instagram, YouTube, LinkedIn |
| **Business Hours** | Per-day open/close time, closed day toggle (Mon–Sun) |
| **Appointment Hours** | Separate from business hours; for online booking slots |
| **Holidays** | Mark specific dates as closed; blocks online bookings |
| **BookingZone** | Enable/disable, slot duration, buffer time, max advance days |

#### 8.7.2 Billing Settings

| Setting | Description |
|---------|-------------|
| Next Bill Number | Starting number for auto-increment |
| Bill Prefix | E.g., `DG-2026-` → Bill: `DG-2026-0001` |
| Currency | Default: Indian Rupee (₹); configurable |
| Phone Number Prefix | Default: India (+91) |
| Enable Advance Payment | Toggle for partial payment tracking |
| Bill Footer Text | Custom text printed at bottom of all receipts |

#### 8.7.3 Tax Configuration

- Define multiple tax slabs (GST 5%, GST 12%, GST 18%)
- Assign taxes to service categories or individual services
- Toggle "Price Inclusive of Tax" globally or per bill
- GSTIN field for receipts

#### 8.7.4 Cashback Configuration

- Enable/disable cashback globally
- Set cashback percentage per billing type
- Set minimum bill value for eligibility
- Set cashback wallet expiry (days)

#### 8.7.5 Payment Methods

- Enable/disable: Cash, Card, UPI, Wallet, Cashback, Complimentary
- Configure Razorpay API keys (test and live)
- Custom payment method names (e.g., "Paytm", "Google Pay")

#### 8.7.6 OTP Settings

- Enable OTP for online booking confirmation
- Enable OTP for bill finalisation (optional, high-security mode)
- Configure MSG91 / Twilio credentials
- OTP expiry time (default: 10 minutes)

#### 8.7.7 Employee Management

| Field | Description |
|-------|-------------|
| Name, Phone, Email | Basic info |
| Role | Owner / Manager / Receptionist / Stylist |
| Commission Structure | % per service or flat ₹ per service |
| Monthly Target | Revenue target for performance tracking |
| Attendance PIN | 4-digit PIN for clock-in/out |
| Active / Inactive | Deactivate without deleting history |

#### 8.7.8 Services & Products

**Services:**
- Category with gender applicability (Male / Female / Unisex)
- Service: name, price, duration (minutes), commission, tax slab, display order
- Service image (optional, shown on online booking)

**Products:**
- SKU, name, brand, price, stock quantity, minimum stock level, supplier
- Product image

#### 8.7.9 Access Control — Role Matrix

| Permission | Owner | Manager | Receptionist | Stylist |
|-----------|-------|---------|--------------|---------|
| Dashboard — All | ✅ | ✅ | Limited | Own only |
| Billing — Create | ✅ | ✅ | ✅ | ❌ |
| Billing — Delete | ✅ | ✅ | ❌ | ❌ |
| Discounts — Apply | ✅ | ✅ | Limited | ❌ |
| Customers — View | ✅ | ✅ | ✅ | ❌ |
| Customers — Delete | ✅ | ❌ | ❌ | ❌ |
| Reports — All | ✅ | ✅ | ❌ | ❌ |
| Reports — Own | ✅ | ✅ | ✅ | ✅ |
| Marketing | ✅ | ✅ | ❌ | ❌ |
| Settings — Billing | ✅ | ❌ | ❌ | ❌ |
| Settings — Employees | ✅ | ❌ | ❌ | ❌ |
| Settings — Access | ✅ | ❌ | ❌ | ❌ |
| Inventory | ✅ | ✅ | ✅ | ❌ |

#### 8.7.10 Other Settings

| Setting | Description |
|---------|-------------|
| Printer | Configure thermal receipt printer (80mm, ESC/POS) |
| Intake Form | Custom digital consent/intake form builder |
| Data Migration | CSV import wizard for existing data |
| Downloads | Backup exports |
| 3rd Party Integrations | Google Calendar, Tally export, WhatsApp Business API |
| Notifications | Configure SMS/Email triggers per event |

---

### 8.8 Inventory Module

#### 8.8.1 Retail Inventory (Products for Sale)

| Feature | Description |
|---------|-------------|
| Product Catalogue | All products with current stock levels |
| Auto-deduction | Stock decremented on product billing |
| Low Stock Alert | Dashboard warning when below minimum |
| Manual Adjustment | Override stock with reason log |
| Stock History | Full audit trail of all movements |
| Expiry Tracking | Track product batch expiry dates |

#### 8.8.2 Inhouse Inventory (Consumables)

| Feature | Description |
|---------|-------------|
| Pool Stock | Central store — all consumables received here |
| Station Stock | Each stylist workstation's allocated items |
| Transfer | Move items from Pool → Station with quantity |
| Movement Log | Full log of all pool-to-station transfers |
| Usage Tracking | Optional: log consumable usage per service |

#### 8.8.3 Suppliers

- Supplier directory with contact info
- Purchase order creation and status tracking
- Goods received note (GRN) to update stock on delivery
- Supplier-wise purchase history and spend analysis

---

## 9. UI/UX Design System — Luxury Premium Theme

### 9.1 Design Philosophy

> *"Where every pixel feels intentional. The software should feel as premium as a visit to the salon itself."*

The DreamGirl platform adopts a **Luxury Dark-Accented** design language. Unlike standard salon software (plain white backgrounds, flat magenta buttons), this system draws inspiration from luxury fashion apps, high-end hotel booking platforms, and premium fintech dashboards.

**Design Pillars:**
- **Elegance** — Generous whitespace, refined typography, deliberate colour use
- **Confidence** — Bold, decisive layouts; no clutter
- **Warmth** — Gold and rose accents feel inviting, not clinical
- **Speed** — Micro-interactions under 200ms; perceived performance is top priority

---

### 9.2 Colour System

#### Primary Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--gold-primary` | `#C9A84C` | CTA buttons, active states, key numbers |
| `--gold-light` | `#E8C97A` | Hover states, highlights |
| `--gold-dark` | `#9A7A2E` | Pressed states, dark backgrounds |
| `--rose-primary` | `#A0334A` | Secondary actions, error states |
| `--rose-soft` | `#D4688A` | Tags, badges, soft accents |

#### Neutral Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-base` | `#0F0F0F` | Full dark mode base background |
| `--bg-surface` | `#1A1A1A` | Cards, modals, panels |
| `--bg-elevated` | `#242424` | Elevated cards, dropdowns |
| `--bg-light` | `#FAFAF8` | Light mode base |
| `--text-primary` | `#F5F0E8` | Primary text (dark mode) |
| `--text-secondary` | `#A09880` | Muted text, labels |
| `--text-dark` | `#1C1C1E` | Primary text (light mode) |
| `--border-subtle` | `#2C2C2C` | Card borders, dividers (dark) |
| `--border-gold` | `#C9A84C30` | Subtle gold borders (30% opacity) |

#### Semantic Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--success` | `#2A9D5C` | Paid status, success toasts |
| `--warning` | `#E9A822` | Low stock, due payments |
| `--error` | `#D94040` | Errors, cancelled status |
| `--info` | `#4A9ECC` | Information, help text |

---

### 9.3 Typography

```
Heading Font:    "Cormorant Garamond" — Elegant serif for luxury feel
                 (Headings H1–H3)

Body Font:       "Inter" — Clean, highly legible sans-serif
                 (Body text, labels, data)

Monospace:       "JetBrains Mono" — For bill numbers, IDs, codes

Display/Hero:    "Playfair Display" — For landing page and marketing
```

#### Type Scale

| Level | Font | Size | Weight | Use |
|-------|------|------|--------|-----|
| Display | Cormorant | 48px | 300 | Hero headings |
| H1 | Cormorant | 36px | 400 | Page titles |
| H2 | Cormorant | 28px | 500 | Section headers |
| H3 | Inter | 20px | 600 | Sub-section headers |
| Body Large | Inter | 16px | 400 | Primary body text |
| Body | Inter | 14px | 400 | Standard UI text |
| Caption | Inter | 12px | 400 | Labels, hints |
| Overline | Inter | 11px | 600 | All-caps category labels |

---

### 9.4 Component Library

#### 9.4.1 Cards

```
┌─────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  ← Gold gradient top border (2px)
│                                 │
│  OVERLINE LABEL                 │  ← 11px, gold, uppercase, tracked
│  ₹ 48,250                      │  ← 36px, white, Cormorant, bold
│                                 │
│  ↑ +12.4% vs yesterday         │  ← 13px, success green
│                                 │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└─────────────────────────────────┘
Background: #1A1A1A
Border: 1px solid #2C2C2C
Border-top: 2px solid linear-gradient(90deg, #C9A84C, #E8C97A)
Border-radius: 12px
Shadow: 0 4px 24px rgba(0,0,0,0.4)
```

**Glassmorphism variant (for overlays/featured):**
```css
background: rgba(201, 168, 76, 0.06);
backdrop-filter: blur(20px);
border: 1px solid rgba(201, 168, 76, 0.2);
```

#### 9.4.2 Buttons

| Variant | Background | Text | Use |
|---------|-----------|------|-----|
| **Primary** | `linear-gradient(135deg, #C9A84C, #E8C97A)` | `#0F0F0F` | Main CTA: Pay, Save, Confirm |
| **Secondary** | `transparent` | `#C9A84C` | Border: `1px solid #C9A84C` |
| **Destructive** | `#D94040` | `#FFFFFF` | Delete, Cancel (irreversible) |
| **Ghost** | `transparent` | `#A09880` | Tertiary actions |
| **Icon** | `#242424` | `#C9A84C` | Icon-only actions in tables |

```css
/* Primary Button */
border-radius: 8px;
padding: 12px 24px;
font: 600 14px 'Inter';
letter-spacing: 0.5px;
text-transform: uppercase;
transition: all 0.2s ease;
box-shadow: 0 4px 16px rgba(201,168,76,0.25);

/* Hover */
transform: translateY(-1px);
box-shadow: 0 6px 20px rgba(201,168,76,0.35);
```

#### 9.4.3 Form Inputs

```css
/* Default state */
background: #1A1A1A;
border: 1px solid #2C2C2C;
border-radius: 8px;
color: #F5F0E8;
font: 14px 'Inter';
padding: 10px 14px;
transition: border-color 0.2s;

/* Focus state */
border-color: #C9A84C;
box-shadow: 0 0 0 3px rgba(201,168,76,0.12);
outline: none;

/* Placeholder */
color: #5A5245;
```

#### 9.4.4 Navigation (Left Sidebar)

```
┌────────────────────┐
│  ✦ DREAMGIRL       │  ← Logo area, gold star, Cormorant font
│    SALON           │
├────────────────────┤
│  [Branch Selector] │  ← Dropdown if multi-branch
├────────────────────┤
│  ⬡ Dashboard       │  ← Active: gold icon + text, gold left bar
│  ₹ Billing         │  ← Inactive: #A09880 icon + text
│  📅 Appointments   │
│  👥 Customers      │
│  📣 Marketing      │
│  📊 Reports        │
│  ⚙ Settings        │
├────────────────────┤
│  [User Avatar]     │
│  Priya Sharma      │  ← Logged-in user
│  Receptionist      │
│  [Logout]          │
└────────────────────┘

Width: 240px (expanded) / 64px (collapsed)
Background: #0F0F0F
Border-right: 1px solid #1C1C1C
Active indicator: 3px solid #C9A84C on left edge
```

#### 9.4.5 Top Bar

```
┌──────────────────────────────────────────────────────────────┐
│  [≡]  ✦ DreamGirl    [Branch: Main ▾]    Thu, 8 Aug 2026    │
│                                           🔔  [+]  [👤 Dr▾]  │
└──────────────────────────────────────────────────────────────┘
Background: #0F0F0F / rgba(15,15,15,0.92) with blur
Border-bottom: 1px solid #1C1C1C
Height: 64px
```

Quick-add `[+]` dropdown:
- `+ New Bill`
- `+ New Customer`
- `+ New Appointment`
- `+ Log Expense`
- `+ Set Reminder`

#### 9.4.6 Data Tables

```css
/* Table wrapper */
background: #1A1A1A;
border-radius: 12px;
border: 1px solid #2C2C2C;
overflow: hidden;

/* Header row */
background: #242424;
color: #A09880;
font: 11px/600 'Inter', uppercase, letter-spacing: 1px;
border-bottom: 1px solid #C9A84C30;

/* Data rows */
color: #F5F0E8;
font: 14px 'Inter';
border-bottom: 1px solid #1C1C1C;

/* Hover */
background: rgba(201,168,76,0.04);

/* Stripe: even rows */
background: rgba(255,255,255,0.01);
```

#### 9.4.7 Status Badges

| Status | Background | Text |
|--------|-----------|------|
| Completed / Paid | `#2A9D5C20` | `#2A9D5C` |
| Pending / Scheduled | `#C9A84C20` | `#C9A84C` |
| Cancelled / Due | `#D9404020` | `#D94040` |
| In Progress | `#4A9ECC20` | `#4A9ECC` |
| Draft | `#A0988020` | `#A09880` |

```css
border-radius: 20px;
padding: 4px 12px;
font: 11px/600 'Inter', uppercase;
letter-spacing: 0.5px;
```

---

### 9.5 Layout Principles

#### Billing Screen Layout (Two-Panel)

```
┌────────────────────────────────────┬──────────────────────────┐
│  LEFT PANEL (Customer Info)        │  RIGHT PANEL (Service)    │
│                                    │                            │
│  Customer Name  [___________] [👤] │  Gender: [Male] [Female]  │
│  Customer Phone [___________] [📱] │  Membership: [Dropdown ▾] │
│  Customer ID    [___________] [💳] │  Category:  [Dropdown ▾]  │
│                                    │  Service:   [Dropdown ▾] 🔍│
│  ┌────────────────────────────┐   │                            │
│  │  Customer history preview  │   │                            │
│  │  Last visit: 15 Jul 2026   │   │                            │
│  │  Active membership: Gold   │   │                            │
│  │  Wallet balance: ₹ 250     │   │                            │
│  └────────────────────────────┘   │                            │
└────────────────────────────────────┴──────────────────────────┘
│                                                                  │
│  BILL LINE ITEMS TABLE                                           │
│  (scrollable if many items)                                      │
│                                                                  │
├──────────────────────────┬───────────────────────────────────── ┤
│  Taxes panel             │  Invoice Summary panel               │
│  [ ] GST @ 18%           │  Gross: ₹1,200  Discount: -₹120     │
│  [ ] Price incl. GST     │  Net: ₹1,080  GST: +₹194            │
│                          │  ═══════════════════════             │
│                          │  NET PAYABLE:  ₹ 1,274    [PAY →]   │
└──────────────────────────┴───────────────────────────────────── ┘
```

#### Dashboard KPI Cards Row

```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ TOTAL    │ │ SERVICE  │ │ PRODUCT  │ │ MEMBERS  │ │ EXPENSE  │
│ INCOME   │ │ INCOME   │ │ INCOME   │ │ INCOME   │ │          │
│          │ │          │ │          │ │          │ │          │
│ ₹48,250  │ │ ₹31,200  │ │ ₹8,400   │ │ ₹6,000   │ │ ₹3,200   │
│ +12.4% ↑ │ │ +8.2% ↑  │ │ +24% ↑   │ │ +0% →    │ │ -5% ↓    │
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
Gold gradient top border on each card
```

---

### 9.6 Dark Mode / Light Mode

- **Default:** Dark mode (luxury premium feel)
- **Light mode:** Clean ivory/cream (#FAFAF8) background with same gold accents
- **Toggle:** User preference saved per account
- **System sync:** Respects OS preference on first load

---

### 9.7 Micro-Interactions & Animation

| Interaction | Animation |
|-------------|-----------|
| Button hover | `translateY(-1px)` + enhanced shadow (200ms ease) |
| Card hover | Subtle gold border glow (300ms ease) |
| Modal open | Fade + scale from 95% to 100% (200ms) |
| Toast notifications | Slide in from top-right (300ms spring) |
| Page transitions | Fade + slide left (150ms) |
| Number changes | Animate count up/down (600ms) |
| Loading states | Skeleton shimmer with gold sheen |
| Table row hover | Background gold tint (150ms) |

---

### 9.8 Mobile Responsiveness

| Breakpoint | Layout | Navigation |
|-----------|--------|-----------|
| Desktop ≥ 1280px | Full sidebar + content area | Left sidebar (240px) |
| Tablet 768–1279px | Collapsed sidebar + content | Icon-only sidebar (64px) |
| Mobile < 768px | Full screen content | Bottom tab bar (Phase 2) |

Minimum touch target: **48×48px** (WCAG 2.5.5)

---

### 9.9 Key UX Differences from Existing Salon Software

| Aspect | Legacy Salon Software | DreamGirl Platform |
|--------|----------------------|-------------------|
| Theme | Flat magenta on white | Dark luxury with gold accents |
| Cards | Plain white boxes | Glassmorphism / gradient border cards |
| Typography | Generic web fonts | Cormorant + Inter premium pairing |
| Navigation | Top bar tabs | Sidebar + top bar hybrid |
| Billing form | Dense single column | Two-panel split layout |
| Data tables | Basic HTML table | Styled dark tables with hover effects |
| Status badges | Coloured text | Pill badges with background tint |
| Buttons | Flat colour | Gradient with subtle shadow |
| Charts | Basic bar/line | Animated area charts with gold fill |
| Onboarding | None / manual | 5-step guided wizard |
| Receipt | Plain text | Styled HTML receipt with logo |
| Loading | White spinner | Skeleton screens |

---

## 10. SaaS Subscription & Pricing Plans

### 10.1 Plan Tiers

| Feature | **Starter** | **Professional** | **Premium** | **Enterprise** |
|---------|-------------|-----------------|-------------|----------------|
| Price | ₹1,499/mo | ₹3,499/mo | ₹6,999/mo | ₹14,999/mo |
| Annual discount | 20% off | 20% off | 20% off | Custom |
| Branches | 1 | 1 | Up to 3 | Unlimited |
| Employees | Up to 5 | Up to 15 | Up to 50 | Unlimited |
| Customers | Up to 2,000 | Up to 10,000 | Unlimited | Unlimited |
| Billing | ✅ | ✅ | ✅ | ✅ |
| Appointments | ✅ | ✅ | ✅ | ✅ |
| Online Booking | ❌ | ✅ | ✅ | ✅ |
| WhatsApp Marketing | ❌ | ✅ | ✅ | ✅ |
| Cashback / Loyalty | ❌ | ✅ | ✅ | ✅ |
| Memberships & Packs | Basic | ✅ | ✅ | ✅ |
| Reports | Basic | Advanced | Full | Full + Custom |
| Inventory | ❌ | Basic | Full | Full |
| API Access | ❌ | ❌ | ✅ | ✅ |
| White-label | ❌ | ❌ | ❌ | ✅ |
| Dedicated Support | Email | Email + Chat | Priority | Dedicated AM |
| Free trial | 14 days | 14 days | 14 days | 30 days |

### 10.2 Add-ons

| Add-on | Price |
|--------|-------|
| Extra Branch | ₹1,499/month per branch |
| SMS Top-up (1,000 SMS) | ₹199 |
| WhatsApp Top-up (1,000 msgs) | ₹299 |
| Data Migration Service | ₹2,999 one-time |
| Premium Onboarding (3 hours) | ₹4,999 one-time |
| Custom Report Development | ₹9,999+ per report |

---

## 11. Super Admin Panel (Platform Owner)

The Super Admin Panel is the DreamGirl team's internal control center for managing all tenants, subscriptions, and platform health.

### 11.1 Super Admin Features

| Module | Features |
|--------|----------|
| **Tenant Management** | List all tenants, view plan, status (active/trial/cancelled/suspended) |
| **Subscription Management** | View MRR, ARR, churn, upgrade/downgrade history |
| **Tenant Details** | Access any tenant's account (support mode), impersonate |
| **Billing & Invoicing** | Auto-generated monthly invoices per tenant |
| **Payment Tracking** | Failed payments, retry logic, dunning management |
| **Usage Analytics** | API calls, storage used, SMS/WA messages sent per tenant |
| **Feature Flags** | Enable/disable features per plan or per tenant |
| **Announcements** | In-app notification to all tenants or specific plans |
| **Support Tickets** | View and respond to all tenant support requests |
| **Platform Analytics** | Total tenants, MRR trend, new signups, churn rate, NPS |
| **Onboarding Tracker** | Which tenants completed setup wizard, where they dropped off |

### 11.2 Super Admin Dashboard

```
┌──────────────────────────────────────────────────────────────┐
│  PLATFORM OVERVIEW                              Aug 2026     │
├──────────────┬───────────────┬───────────────┬──────────────┤
│ Total Tenants│ Active Tenants│ MRR           │ Churn Rate   │
│    247       │    231        │ ₹8,42,000     │   3.2%       │
│  +12 this mo │  +10 this mo  │  +₹62,000 MoM │  -0.4% MoM  │
├──────────────┴───────────────┴───────────────┴──────────────┤
│  MRR GROWTH CHART (12 months)                               │
│  [████████████████████████████████████████████████████]     │
├──────────────────────────────────────────────────────────────┤
│  NEW SIGNUPS (last 30 days)    │  EXPIRING TRIALS (7 days)  │
│  [Table: salon name, plan, date│  [Table: salon, trial ends] │
└──────────────────────────────────────────────────────────────┘
```

---

## 12. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | Page load < 2s on 4G; billing form response < 300ms; API response < 500ms p95 |
| **Scalability** | Support 1,000 concurrent tenants; 50,000+ customers per tenant |
| **Availability** | 99.9% uptime SLA; maintenance windows < 1hr/month with advance notice |
| **Security** | HTTPS everywhere; JWT (8hr expiry); bcrypt passwords; input sanitisation; SQL injection prevention |
| **Data Privacy** | Customer data stored in India (ap-south-1); DPDP Act 2023 compliance |
| **Data Isolation** | Strict per-tenant schema separation; no cross-tenant data access |
| **Backup** | Automated daily backups; 30-day retention; point-in-time recovery |
| **Browser Support** | Chrome 80+, Edge 88+, Firefox 85+, Safari 13+ |
| **Accessibility** | WCAG 2.1 AA: contrast ratios ≥ 4.5:1, keyboard navigable, ARIA labels |
| **Audit Log** | All financial transactions, settings changes, and login events logged |
| **Print** | 80mm thermal receipt printing via browser or ESC/POS direct |
| **Internationalisation** | Currency configurable; date format configurable; Hindi UI (Phase 2) |

---

## 13. Technology Stack

### 13.1 Full Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| **Frontend** | React | 18.x | SPA |
| Build Tool | Vite | 5.x | Fast HMR |
| Styling | TailwindCSS | 3.x | Utility-first |
| Design System | Custom (DS v1) | — | Gold/dark tokens |
| State — Client | Zustand | 4.x | Lightweight |
| State — Server | TanStack Query | 5.x | Caching, sync |
| Charts | Recharts + D3 | — | Animated charts |
| Forms | React Hook Form | — | Performant |
| Validation | Zod | — | TypeScript schema |
| Routing | React Router | 6.x | SPA routing |
| **Backend** | Node.js | 20 LTS | Runtime |
| Framework | Express.js | 4.x | REST API |
| ORM | Prisma | 5.x | Type-safe, migrations |
| **Database** | PostgreSQL | 15 | Relational, ACID |
| Cache | Redis | 7.x | Sessions, queues |
| Search | Elasticsearch | 8.x | Customer/service search |
| **Auth** | JWT + RBAC | — | Stateless tokens |
| **Payments** | Razorpay | — | India-first |
| **SMS** | MSG91 | — | India delivery |
| **WhatsApp** | WA Business API | — | Campaigns + receipts |
| **Email** | SendGrid | — | Transactional |
| **Storage** | AWS S3 + CloudFront | — | Files, receipts, logos |
| **Hosting** | AWS ECS + Fargate | — | Containerised |
| Database hosting | AWS RDS PostgreSQL | — | Managed, Multi-AZ |
| Cache hosting | AWS ElastiCache | — | Redis managed |
| **CI/CD** | GitHub Actions | — | Auto test + deploy |
| Containers | Docker | — | Consistent environments |
| **Monitoring** | Sentry + Datadog | — | Errors + APM |
| **Analytics** | PostHog (self-hosted) | — | Product analytics |

---

## 14. Milestones & Timeline

### 14.1 Development Phases

| Phase | Duration | Deliverables |
|-------|----------|-------------|
| **Phase 0 — Foundation** | 3 weeks | DB schema, API design, design system, dev environment |
| **Phase 1 — Core Billing** | 6 weeks | Service/Product billing, payment modal, receipts, basic dashboard |
| **Phase 2 — Customers & Appointments** | 5 weeks | Customer CRM, appointment module, calendar view, online booking |
| **Phase 3 — Packages & Memberships** | 4 weeks | Combo/Spa/Prepaid packs, membership, wallet, cashback |
| **Phase 4 — Reports & Analytics** | 4 weeks | All 40+ report screens, dashboard widgets, charts |
| **Phase 5 — Marketing & Loyalty** | 3 weeks | WhatsApp campaigns, loyalty points, smart upsell |
| **Phase 6 — Inventory & Settings** | 3 weeks | Full inventory, all settings, printer, integrations |
| **Phase 7 — SaaS Infrastructure** | 4 weeks | Multi-tenancy, Super Admin panel, billing/subscription engine |
| **Phase 8 — QA, UAT & Launch** | 3 weeks | Bug fixing, UAT, data migration, DreamGirl go-live |
| **Phase 9 — SaaS Launch** | 2 weeks | Landing page, onboarding wizard, first 5 paying tenants |

**Total: ~37 weeks (~9 months)**

### 14.2 Milestones

| Milestone | Target Date |
|-----------|------------|
| Design System Complete | Week 3 |
| DreamGirl Internal Beta | Week 22 |
| DreamGirl Full Launch | Week 32 |
| SaaS Public Beta (10 salons) | Week 37 |
| 50 Paying Tenants | Month 15 |
| ₹3L MRR | Month 18 |

---

## 15. Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Scope creep | High | High | Strict change control; v2 backlog for new features |
| Data migration errors | Medium | High | Dry-run on staging; parallel operation for 2 weeks |
| Staff adoption resistance | Medium | Medium | On-site training sessions; help videos; 24hr support |
| Payment gateway downtime | Low | High | Razorpay + fallback to PayU; offline cash mode |
| SMS delivery failure | Medium | Low | Retry logic; fallback to email |
| Security breach | Low | Critical | Pen testing pre-launch; WAF; bug bounty programme |
| Multi-tenancy data leak | Very Low | Critical | Schema-level isolation; automated isolation tests |
| SaaS churn | Medium | Medium | Strong onboarding; customer success calls at day 7, 30 |
| Regulatory (GST changes) | Low | Medium | Configurable tax slabs; no hard-coded rates |
| Competition launches similar | Medium | Medium | 12-month head start; focus on superior UX as moat |

---

## 16. Appendix — Data Models

### 16.1 Core Entities

#### `tenants` (Platform Level)
```sql
id              UUID PRIMARY KEY
slug            VARCHAR(50) UNIQUE        -- used for subdomain
name            VARCHAR(100)
plan            ENUM('starter','professional','premium','enterprise')
status          ENUM('trial','active','suspended','cancelled')
trial_ends_at   TIMESTAMP
created_at      TIMESTAMP
```

#### `customers` (Per Tenant Schema)
```sql
id              UUID PRIMARY KEY
name            VARCHAR(100)
phone           VARCHAR(15) UNIQUE
email           VARCHAR(100)
gender          ENUM('male','female','other')
dob             DATE
anniversary     DATE
photo_url       TEXT
group_id        UUID → groups
wallet_balance  DECIMAL(10,2) DEFAULT 0
loyalty_points  INTEGER DEFAULT 0
notes           TEXT
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

#### `bills`
```sql
id              UUID PRIMARY KEY
bill_number     VARCHAR(20) UNIQUE
customer_id     UUID → customers (nullable)
bill_type       ENUM('service','product','combo','spa','prepaid','membership')
gender          ENUM('male','female')
gross_total     DECIMAL(10,2)
discount_pct    DECIMAL(5,2)
discount_amount DECIMAL(10,2)
tax_amount      DECIMAL(10,2)
tip_amount      DECIMAL(10,2)
net_payable     DECIMAL(10,2)
payment_status  ENUM('paid','partial','due','complimentary')
notes           TEXT
private_notes   TEXT
created_by      UUID → employees
branch_id       UUID → branches
created_at      TIMESTAMP
```

#### `bill_items`
```sql
id              UUID PRIMARY KEY
bill_id         UUID → bills
item_type       ENUM('service','product')
item_id         UUID → services / products
name            VARCHAR(200)
unit_price      DECIMAL(10,2)
quantity        DECIMAL(8,2)
gross_amount    DECIMAL(10,2)
discount_pct    DECIMAL(5,2)
discount_amount DECIMAL(10,2)
net_amount      DECIMAL(10,2)
tax_pct         DECIMAL(5,2)
tax_amount      DECIMAL(10,2)
employee_id     UUID → employees
referred_item   UUID (nullable)
```

#### `appointments`
```sql
id              UUID PRIMARY KEY
customer_id     UUID → customers
employee_id     UUID → employees
chair_id        UUID → chairs (nullable)
start_time      TIMESTAMP
end_time        TIMESTAMP
status          ENUM('scheduled','confirmed','in_progress','completed','cancelled','no_show')
source          ENUM('walk_in','online','phone','whatsapp')
notes           TEXT
bill_id         UUID → bills (nullable, set on checkout)
created_at      TIMESTAMP
```

#### `employees`
```sql
id              UUID PRIMARY KEY
name            VARCHAR(100)
phone           VARCHAR(15)
email           VARCHAR(100)
role            ENUM('owner','manager','receptionist','stylist')
commission_type ENUM('percent','flat')
commission_value DECIMAL(8,2)
monthly_target  DECIMAL(10,2)
pin             VARCHAR(4)        -- attendance PIN
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMP
```

#### `services`
```sql
id              UUID PRIMARY KEY
category_id     UUID → service_categories
name            VARCHAR(200)
gender          ENUM('male','female','unisex')
price           DECIMAL(10,2)
duration_mins   INTEGER
commission_type ENUM('percent','flat')
commission_value DECIMAL(8,2)
tax_slab_id     UUID → tax_slabs (nullable)
is_active       BOOLEAN DEFAULT true
sort_order      INTEGER
```

#### `spa_packs`
```sql
id              UUID PRIMARY KEY
name            VARCHAR(200)
price           DECIMAL(10,2)
validity_days   INTEGER
description     TEXT
is_active       BOOLEAN DEFAULT true
```

#### `customer_spa_packs` (Assigned packs)
```sql
id              UUID PRIMARY KEY
customer_id     UUID → customers
spa_pack_id     UUID → spa_packs
bill_id         UUID → bills
assigned_at     TIMESTAMP
expires_at      TIMESTAMP
status          ENUM('active','expired','fully_redeemed')
```

#### `wallet_transactions`
```sql
id              UUID PRIMARY KEY
customer_id     UUID → customers
type            ENUM('credit','debit')
source          ENUM('cashback','manual_recharge','bill_payment','refund')
amount          DECIMAL(10,2)
balance_after   DECIMAL(10,2)
reference_id    UUID (bill_id or null)
notes           TEXT
created_by      UUID → employees
created_at      TIMESTAMP
```

---

## Document Footer

---

```
✦ DREAMGIRL FAMILY SALON MANAGEMENT SOFTWARE
  Product Requirements Document · Version 2.0 · August 2026

  Prepared by: DreamGirl Technology Team
  Status: Draft — Pending Owner Review & Sign-off

  This document is CONFIDENTIAL.
  Distribution restricted to development team and stakeholders only.

  "Where every pixel feels intentional."
```

---

*End of PRD — DreamGirl Salon Management Software v2.0*
