# AgriSaathi — Unified Agricultural Marketplace & Supply Chain Platform

> [!IMPORTANT]
> **AgriSaathi now operates as a single unified application. The previous System 1 / System 2 separation has been retired.**  
> All stakeholder portals, marketplace engines, negotiation flows, Government Escrow ledgers, and regulatory oversight modules operate within this single, consolidated repository.

---

## 1. Project Overview

**AgriSaathi** is an integrated GovTech agricultural marketplace and supply chain platform developed for the **Smart India Hackathon Prototype** addressing the **Government of Maharashtra Agriculture Department** problem statement.

The platform unifies the agricultural value chain across Maharashtra by connecting individual farmers, Farmer Producer Organizations (FPOs), commercial wholesale buyers, cold storage/warehouse operators, and state agriculture nodal officers into a transparent, secure, and data-driven ecosystem. By combining AI-assisted visual crop quality screening, machine learning price forecasting, dynamic farm-to-mandi freight deductions, two-way trade negotiations, and a two-stage Government Escrow payment mechanism, AgriSaathi eliminates distress selling, mitigates post-harvest losses, and ensures guaranteed financial settlements for producers.

---

## 2. Problem Statement

Smallholder farmers and cooperatives across Maharashtra face persistent systemic hurdles that depress farmgate realizations:
1. **Distress Selling**: Inability to anticipate market price fluctuations forces farmers to sell immediately after harvest during peak arrivals when mandi prices crash.
2. **Post-Harvest Losses**: Lack of transparent visibility into nearby cold storages, tariffs, and available capacity results in spoilage of perishable commodities (tomatoes, onions, grapes).
3. **Information Asymmetry**: Middlemen exploit geographic gaps; farmers lack net-realizable price intelligence that accounts for transit freight to different APMC mandis.
4. **Counterparty & Payment Risk**: Delayed payments, arbitrary quality deductions upon delivery, and lack of escrow protections expose sellers to default.
5. **Fragmented Supply**: Individual farmers lack the volume to negotiate directly with corporate institutional buyers.

AgriSaathi solves these challenges through a unified platform that aligns market intelligence with secure commerce.

---

## 3. Platform Roles

AgriSaathi provides dedicated, role-tailored dashboards and capabilities for five key stakeholders:

1. **Farmers**: Smallholders and commercial growers who list produce, review AI-backed sale advisory recommendations, compare APMC mandis, discover cold storages, negotiate with wholesale buyers, track in-transit deliveries, and receive escrow-guaranteed payments.
2. **Farmer Producer Organizations (FPOs)**: Cooperatives that aggregate produce across member farmers, pool lots into commercial-scale volumes, manage internal member equity contributions, and negotiate bulk corporate procurement contracts.
3. **Commercial Buyers**: Institutional buyers, food processors, retail chains, and wholesale traders who search verified produce lots, review AI quality scores, submit bids with custom advance deposit terms, and track fulfillment through to delivery receipt.
4. **Storage/Warehouse Providers**: Private and cooperative cold storage operators who manage multi-chamber capacity, monitor IoT temperature/humidity logs, publish tariff schedules, and accept inbound storage reservations from farmers.
5. **Government / Admin Authorities**: State Agriculture Department Nodal Officers who review and verify stakeholder registrations, audit the statewide Government Escrow financial ledger, and formally adjudicate trade grievances.

---

## 4. Major Features

- **Unified Stakeholder Authentication**: Single auth system with role-based access control and built-in 1-click evaluation accounts for all 5 roles.
- **Produce Listing & Multi-Image Upload**: Comprehensive crop lot creation with photographic proof uploaded to the backend server.
- **AI-Assisted Visual Quality Verification**: Transparent heuristic screening evaluating color, morphology, and skin texture consistency with disclaimers regarding laboratory tests.
- **APMC Mandi Intelligence**: Live price discovery across major Maharashtra mandis (Nashik, Pune, Mumbai, Nagpur, etc.) with 14-day trends and comparative arbitrage matrices.
- **Net-Realizable Return Engine**: Real-time Haversine distance and freight cost deduction calculating actual farmgate returns per mandi.
- **ML Price Forecasting**: Ridge Regression and Exponential Moving Average ensemble forecasting future price trajectories with confidence bands.
- **Net Return AI Sale Advisor**: Algorithmic decision engine evaluating three distinct strategies: *Sell Now*, *Short-Hold (3–5 Days)*, or *Cold Storage & Delayed Sale*.
- **Certified Cold Storage Directory**: Discovery of WDRA-registered facilities with live capacity and dynamic tariff estimators.
- **FPO Aggregation & Payout Distribution**: Cooperative pooling of member produce with proportional equity share calculations.
- **Two-Way Trade Negotiations**: Interactive bidding workflow supporting proposals, counter-offers, and formal contract agreement.
- **Binding Digital Transactions**: Automatic creation of legally referenced purchase orders upon offer acceptance with produce locked to `RESERVED`.
- **Two-Stage Government Escrow**: 20% advance locked into Government Escrow prior to dispatch, with final release and balance settlement upon buyer delivery confirmation.
- **Grievance Redressal Mechanism**: Formal dispute logging with photo evidence and GPS coordinates, adjudicated directly by Government Nodal Officers.
- **In-App Notifications**: Real-time updates for offers, counter-proposals, price movements, storage confirmations, and escrow status.

---

## 5. Farmer/FPO Portal

The Farmer & FPO interface empowers agricultural producers with actionable intelligence:
- **Seller Dashboard**: Real-time summary cards displaying active crop listings, total inventory volume (kg/quintals), prospective buyer inquiries, and total revenue.
- **Add Produce Workflow**: Form capturing crop species, variety, harvest date, declared quantity, expected base price, quality grade, and photo upload.
- **My Produce & Lot Detail**: In-depth view of individual lots featuring current status (`AVAILABLE`, `RESERVED`, `SOLD`), AI quality screening badges, live mandi price previews, and incoming buyer offers.
- **Profile Management**: Profile details including taluka, district, 7/12 land records, farm acreage, and masked bank/Aadhaar credentials for privacy.

---

## 6. Buyer Portal

The Buyer Portal provides commercial procurement teams with end-to-end purchasing tools:
- **Produce Marketplace**: Real-time searchable catalog of published crop lots filterable by crop, grade, district, and minimum quantity.
- **Quality Transparency**: Direct access to uploaded crop photography, declared harvest dates, and AI visual screening indicators.
- **Two-Way Offer Submission**: Interface allowing buyers to submit formal bids with custom price per kg and negotiable advance deposit percentages (default: 20%).
- **Negotiations Hub**: Centralized view of pending, countered, and accepted bids with full chronological history.
- **Procurement Orders & Escrow**: Direct link to deposit advance funds into Government Escrow, monitor dispatch tracking, and trigger payment release upon delivery confirmation.

---

## 7. Storage / Warehouse Management

The Storage & Warehouse module bridges harvest surges with cold storage infrastructure:
- **Facility Discovery**: Searchable directory of cold storage facilities and traditional chawls across Maharashtra districts.
- **Chamber Telemetry**: Monitoring of cold chamber temperature (°C), relative humidity (%), total capacity (MT), and available space.
- **Dynamic Tariff Calculator**: Cost projection tool based on produce weight, anticipated storage duration (days), and monthly per-quintal rates.
- **Inbound Booking Requests**: Farmers and FPOs can submit reservation inquiries; operators review and confirm allocations.

---

## 8. Government / Admin Portal

The Administrative Oversight Portal equips State Agriculture Officers with regulatory control:
- **User Verification Registry**: Multi-tab verification queue (`PENDING`, `VERIFIED`, `REJECTED`, `ALL`) across all roles. Officers can review submitted documents, approve verified badges, or reject applications with mandatory explanatory reasons.
- **Statewide Escrow Financial Ledger**: Real-time audit log of all monetary transactions held in Government Escrow (`HELD_BY_GOVT_ESCROW`, `RELEASED_TO_SELLER`, `REFUNDED_TO_BUYER`).
- **Grievance Redressal Adjudication**: Centralized queue of filed commercial disputes. Officers review claims, inspect photographic evidence, and enter official binding settlement resolutions.
- **Macro Analytics**: High-level platform statistics covering total registered farmers, FPOs, wholesale buyers, active transactions, and total escrow value.

---

## 9. Crop Listings and Crop Image Upload

- **Multi-Part Upload**: Produce listings support image attachments handled via `multipart/form-data` endpoints (`/api/lots`).
- **Media Storage**: Uploaded produce photography is stored in `backend/uploads/crop_lots/` and statically served via `/uploads/crop_lots/<filename>`.
- **CORS-Compliant URL Generation**: Frontend helper functions dynamically construct full asset URLs matching the backend host.
- **Lifecycle Tracking**: Lots transition automatically between states: `AVAILABLE` (open on marketplace) $\rightarrow$ `RESERVED` (offer accepted, trade agreement locked) $\rightarrow$ `SOLD` (order fulfilled and paid).

---

## 10. Crop Quality Verification

AgriSaathi incorporates an AI-assisted visual screening service (`backend/services/ai_verification_service.py`):
- **Surface Feature Inspection**: Analyzes uploaded crop images against declared crop types (e.g., Tomato, Onion, Grapes, Wheat) evaluating color spectrum, morphology, and skin texture consistency.
- **Clarity & Placeholder Heuristics**: Flags low-resolution files, generic mock images, or ambiguous photos with a `FLAGGED` or `MANUAL_REVIEW` status.
- **Transparent Indicator**: Produces an indicative quality score (0.60–0.99) and human-readable signal explanation.
- **Ethical AI Disclaimer**: The interface prominently displays:  
  > *"AI-assisted visual screening provides indicative grading based on surface features and does not replace official AGMARK physical laboratory tests."*

---

## 11. Market Intelligence / Price Forecasting

- **APMC Mandi Coverage**: Aggregates benchmark mandi prices across Maharashtra agricultural centers (Nashik, Lasalgaon, Pune, Mumbai APMC, Pimpalgaon, Ahmednagar, Nagpur).
- **Transport Net-Back Calculator**: Uses Haversine geodesic distance modeling and standard per-ton-kilometer freight rates to deduct transportation expenses, revealing the actual *Net Realizable Farmgate Price* for each destination mandi.
- **Arbitrage Matrix**: Highlights price differentials across mandis, identifying opportunities where higher prices offset longer transport distances.
- **Time-Series Forecasting Engine**: Combines Ridge Regression with Exponential Moving Average (EMA) smoothing over 14-day historical price sequences to generate 7-day future price trajectories, complete with an upper and lower uncertainty band.

---

## 12. FPO Aggregation & Time-Bound Collective Pooling

AgriSaathi features a structured, time-bound harvest aggregation system that allows Farmer Producer Organizations (FPOs) to issue formal crop procurement requirements with volume quotas, time-limited collection windows, and farm-gate batch traceability:

### 12.1 Independent Target Quotas & 5 Tracked Quantities
Unlike standard individual seller listings, FPO aggregation pools define an independent commercial target volume (`target_quantity`) and track produce through five distinct quantities across its physical and quality lifecycle:
1. **Target Volume (`target_quantity`)**: The total commercial volume required to fulfill institutional buyer contracts or full truckload shipments (e.g., 2,000 kg or 15 MT).
2. **Committed / Pledged (`committed_quantity`)**: The cumulative harvest volume committed by member farmers through the online portal.
3. **Physically Received (`received_quantity`)**: The portion of committed produce that has physically arrived and been checked into the FPO packhouse or collection center.
4. **Quality Verified (`verified_quantity`)**: Produce that has passed physical inspection for weight, moisture content, and quality grade compliance.
5. **Available for Sale (`available_for_sale`)**: Strictly the verified volume ready for institutional procurement contracts. Produce that is merely pledged or received without quality verification cannot be committed to buyers (`available_for_sale = 0` until verified).

### 12.2 Perishability-Based Collection Window Advisory
To prevent post-harvest spoilage and packhouse bottlenecks, collection windows can be determined through an agronomic advisory engine (`backend/services/fpo_aggregation_service.py`):
- **Agronomic Perishability Tiers**:
  - `VERY_HIGH` (Leafy Vegetables, Strawberry): Rapid 6h–8h collection window.
  - `HIGH` (Tomato, Guava, Capsicum): 10h–12h collection window under ambient conditions (28°C) to prevent respiration softening, moisture loss, and transit decay.
  - `MEDIUM` (Pomegranate, Grapes, Citrus): 24h–48h collection window.
  - `LOW` (Onion, Potato, Grains, Soybean, Pulses): Extended 72h–168h collection windows.
- **Facility Condition Adaptation**: When stored in a cold chain hub (`STORED`), collection windows are safely extended by a crop-specific multiplier with transparent justification.
- **FPO Window Selection Modes**: FPOs can choose between:
  - `[ Smart Suggested Duration ]`: Dynamically fetches suggested duration, perishability rating, and transparent agronomic reasoning with clear disclosures that it serves as an advisory guide.
  - `[ Set Manually ]`: Quick-selection preset duration chips (6h, 10h, 12h, 24h, 48h) or custom hours input.
- **Timestamps & Deadlines**: Each pool records `collection_start_at` and `collection_deadline_at`, displayed with a live countdown timer (`time_remaining_seconds`).

### 12.3 Farmer Contribution Pledges & Overbooking Prevention
- Smallholder farmers discover active FPO aggregation pools in their district and pledge harvest quantities toward open quotas.
- **Backend Overbooking Enforcement**: The backend rigorously calculates remaining capacity (`target_quantity - committed_quantity`). Any pledge exceeding this capacity is rejected with the exact error: `"Only X kg capacity remains in this aggregation."`

### 12.4 Automatic Closures & Lifecycle State Machine
Aggregation pools dynamically transition through well-defined lifecycle states:
- `OPEN`: Pool active and accepting farmer contribution pledges.
- `CLOSING_SOON`: Automatically triggered when pledged volume reaches **$\ge$ 90%** of target capacity. Exactly **one idempotent notification** is issued to the FPO and participating farmers.
- `FILLED`: Automatically triggered when pledged volume reaches **100%** of target quota. Contributions are immediately locked, and **one idempotent notification** is issued.
- `EXPIRED`: Automatically triggered when current time surpasses `collection_deadline_at`. Contributions are blocked, and **one idempotent notification** is issued.
- **Zero Notification Spam**: Timestamp audit columns (`near_capacity_notified_at`, `filled_notified_at`, `deadline_notified_at`) guarantee that repeated page reloads or status evaluations never generate duplicate alerts.

### 12.5 Post-Deadline FPO Decisions
When a collection window closes or expires, FPO administrators have explicit lifecycle actions:
- **Proceed with Collected Quantity (`/api/fpo/lots/<id>/proceed`)**: Finalizes the requirement with current collected volume, updates status to `PROCEEDED`, and keeps the lot available on the buyer marketplace.
- **Extend Collection Window (`/api/fpo/lots/<id>/extend`)**: Allows the FPO to add hours (e.g., +10h), recalculates a new deadline, reopens contributions (`OPEN`), and increments `deadline_extension_count`.
- **Cancel Aggregation (`/api/fpo/lots/<id>/cancel`)**: Aborts the aggregation while preserving all historical farmer contribution records and audit trails.

### 12.6 Consolidated Produce Inventory & Farm Gate Traceability
- **FPO Inventory Hub (`/api/fpo/inventory`)**: A consolidated view aggregating committed, received, verified, and sale-ready volumes across all pools grouped by crop.
- **Agronomic Sell Urgency**: Classifies inventory as `SELL URGENTLY` (red), `SELL SOON` (amber), or `STABLE` (green) based on commodity perishability, storage facility, and remaining shelf life to guide sales prioritization.
- **Farm Gate Batch Traceability**: Complete audit modal mapping every consolidated commercial lot back to individual member farmers, contact references, delivered weights, quality grades, and percentage equity shares.

---

## 13. Buyer Offers / Transactions

- **Interactive Negotiation Flow**:
  1. Wholesale Buyer discovers an available lot and submits an offer (`proposed_price_per_kg`, `advance_percentage`).
  2. Seller receives an in-app alert and reviews the proposal on the Lot Detail or Buyer Offers page.
  3. Seller can **Accept**, **Decline**, or submit a **Counter-Offer** with an updated rate and explanatory message.
  4. Buyer reviews the counter-offer and can accept or further negotiate.
- **Negotiation Audit Trail**: Every offer transition is logged in `negotiation_history` with timestamps and party attribution.
- **Trade Formalization**: Accepting an offer triggers automatic generation of a legally binding digital `Transaction` in the system.

---

## 14. Orders

Orders are managed through the `transactions` domain, tracking the complete physical and commercial lifecycle:
1. `DEAL_CONFIRMED`: Trade terms finalized between buyer and seller.
2. `ADVANCE_PENDING`: Awaiting buyer deposit into Government Escrow.
3. `ADVANCE_PAID`: Advance verified; seller notified to prepare produce.
4. `PREPARING` / `READY_FOR_PICKUP`: Produce graded, packaged, and staged at farm/FPO warehouse.
5. `IN_TRANSIT`: Produce picked up by carrier; tracking number and carrier name registered.
6. `DELIVERED`: Produce physically arrives at buyer facility.
7. `BUYER_CONFIRMED`: Buyer conducts physical inspection and confirms quality receipt.
8. `COMPLETED`: Full transaction settled; escrow disbursed to seller.
9. `DISPUTED`: Placed on hold pending Government Nodal Officer investigation.

---

## 15. Payments / Escrow

AgriSaathi implements a **Two-Stage Government Escrow Protocol** designed to eliminate default risk for both parties:

```text
Trade Agreement Finalized (Offer Accepted)
                   │
                   ▼
┌────────────────────────────────────────────────────────┐
│  Stage 1: Buyer Pays Agreed Advance (Default: 20%)     │
│  Funds deposited into State Government Escrow Account  │
│  Status: HELD_BY_GOVT_ESCROW                           │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│  Seller Dispatches Produce (IN_TRANSIT -> DELIVERED)   │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│  Stage 2: Buyer Inspects Produce & Confirms Delivery   │
│  - Escrow Advance released to Seller Bank Account      │
│  - Remaining Balance Settled                           │
│  Status: RELEASED_TO_SELLER / COMPLETED                │
└────────────────────────────────────────────────────────┘
```

- **Full Auditability**: Every monetary transaction is recorded in `payment_records` with references, timestamps, and regulatory audit notes.
- **Dispute Protection**: In the event of an unresolvable breach or rejected delivery, Government Admins hold the authority to approve a `REFUNDED_TO_BUYER` resolution.

---

## 16. Grievance Management

When trade disputes arise during transit or inspection, parties file formal claims via `/api/grievances`:
- **Categorized Filing**: Claims are categorized under `QUALITY_MISMATCH`, `QUANTITY_SHORTAGE`, `DELIVERY_DELAY`, `PAYMENT_ISSUE`, `STORAGE_DAMAGE`, or `OTHER`.
- **Evidentiary Upload**: Complainants attach photographic proof and geolocation coordinates.
- **Nodal Adjudication**: Government Agriculture Officers review open grievances in the Admin Portal, communicate with both parties, and submit official binding resolution notes (`RESOLVED` or `DISMISSED`).

---

## 17. Notifications

A centralized notification engine (`backend/routes/notification_routes.py`) delivers alerts across all modules:
- **Offer Alerts**: Informs sellers of new bids and counter-proposals.
- **Price Surge Alerts**: Notifies farmers when APMC mandi rates spike.
- **Escrow Milestones**: Confirms advance deposits, order dispatch, and payment releases.
- **Verification Updates**: Alerts newly registered users when Government Officers approve their credentials.
- **Unread Counter**: Navbar displays real-time badge count with one-click "Mark All as Read" functionality.

---

## 18. Technology Stack

### Frontend
- **Framework**: React 19 (SPA) with Vite 8
- **Styling**: Vanilla CSS GovTech Design System with semantic design tokens (emerald green, saffron amber, clean card elevations, responsive layouts)
- **Icons**: Lucide-React
- **Charts & Visualizations**: Recharts (price trends, volume bar charts, uncertainty cones)
- **HTTP Client**: Native fetch API with custom `api.js` wrapper supporting multipart uploads and JSON handling

### Backend
- **Framework**: Python 3.10+ / Flask 3.0
- **Database ORM**: Flask-SQLAlchemy 3.1
- **Cross-Origin Resource Sharing**: Flask-CORS
- **Analytics & ML**: Scikit-learn (Ridge Regression), NumPy, Pandas
- **Architecture**: Modular Flask Blueprints with centralized error handlers and application factory pattern

### Database
- **Production Standard**: MySQL 8.0+ (`database/schema.sql`)
- **Development Fallback**: SQLite 3 (`backend/agrisaathi_dev.db`) with automatic table creation and data seeding

---

## 19. Project Architecture

```text
AgriSaathi/
│
├── frontend/                     # React 19 + Vite Application
│   ├── src/
│   │   ├── components/common/    # Reusable UI library (Button, Card, Modal, Table, Badge, Navbar, Sidebar, etc.)
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx   # Public landing & role selector
│   │   │   ├── auth/             # Login & role-specific registration pages
│   │   │   ├── farmer/           # Farmer dashboard, crop lots, offers, storage, payments, grievances
│   │   │   ├── fpo/              # FPO cooperative aggregation & member pooling
│   │   │   ├── buyer/            # Wholesale buyer marketplace & negotiations dashboard
│   │   │   ├── warehouse/        # Cold storage operator capacity & booking management
│   │   │   ├── admin/            # Government regulatory verification & escrow audit portal
│   │   │   ├── market/           # Mandi price comparison & ML forecast charts
│   │   │   └── ai/               # Net Return AI Sale Advisor
│   │   ├── services/api.js       # Centralized REST client
│   │   ├── index.css             # Unified GovTech CSS design system
│   │   └── App.jsx               # Root single-page application router & state manager
│   └── package.json
│
├── backend/                      # Python Flask Application
│   ├── app.py                    # Application factory & Blueprint registry
│   ├── config.py                 # Configuration loader (MySQL / SQLite fallback)
│   ├── models/                   # SQLAlchemy database models (User, CropLot, Transaction, Payment, etc.)
│   ├── routes/                   # 15 modular REST API Blueprints
│   ├── services/                 # AI verification, ML price forecasting, market intelligence, sale advisor
│   ├── utils/                    # Seed script with demo accounts & error handlers
│   ├── uploads/crop_lots/        # Statically served uploaded crop photography
│   └── requirements.txt          # Python dependencies
│
├── database/
│   └── schema.sql                # Complete MySQL DDL schema definitions
├── .env.example                  # Environment configuration template
├── INTEGRATION.md                # Unified architecture & data contract reference
├── WALKTHROUGH.md                # Verification guide & walkthrough evidence
└── README.md                     # Platform documentation
```

---

## 20. Folder Structure

| Directory / File | Description |
| :--- | :--- |
| `frontend/src/pages/farmer/` | Farmer views: Add Produce, My Lots, Lot Detail, Offers, Storage, Payments, Grievances |
| `frontend/src/pages/fpo/` | FPO bulk aggregation, member contributions, and revenue distribution |
| `frontend/src/pages/buyer/` | Wholesale marketplace, offer counter-negotiations, and order tracking |
| `frontend/src/pages/warehouse/` | Cold storage chamber metrics, temperature logs, and booking inquiries |
| `frontend/src/pages/admin/` | Government verification registry, Escrow ledger audit, and dispute adjudication |
| `frontend/src/components/common/` | Shared GovTech UI components (Button, Modal, Input, Badge, StatCard, etc.) |
| `backend/models/` | Relational entities: `User`, `CropLot`, `Offer`, `Transaction`, `PaymentRecord`, `Grievance`, `Warehouse` |
| `backend/routes/` | REST Blueprints: `auth`, `lot`, `fpo`, `market`, `prediction`, `offer`, `transaction`, `payment`, `admin`, `grievance` |
| `backend/services/` | Business engines: ML price forecasting, AI visual inspection, freight deductions, sale timing |
| `backend/utils/seed_db.py` | Automatic database seeder for demo accounts across all 5 roles |

---

## 21. Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Python**: v3.10 or higher
- **Git**

---

## 22. Backend Setup

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # Linux / macOS
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Verify configuration:
   By default, `config.py` uses SQLite fallback (`agrisaathi_dev.db`) if local MySQL credentials are empty, allowing instant zero-configuration startup.

---

## 23. Frontend Setup

1. Open a separate terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Verify production build:
   ```bash
   npm run build
   ```

---

## 24. Environment Variables

Copy `.env.example` to `.env` in the repository root or configure as needed:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `FLASK_ENV` | `development` | Flask runtime environment |
| `SECRET_KEY` | `agrisaathi-unified-dev-secret-key-2026` | Session and token signing key |
| `PORT` | `5000` | Backend server port |
| `DATABASE_HOST` | `localhost` | MySQL host address |
| `DATABASE_PORT` | `3306` | MySQL port |
| `DATABASE_NAME` | `agrisaathi_db` | MySQL database name |
| `DATABASE_USER` | `root` | MySQL username |
| `DATABASE_PASSWORD` | *(empty)* | MySQL password |
| `USE_SQLITE_FALLBACK`| `true` | Enables automatic SQLite fallback if MySQL is offline |
| `FRONTEND_URL` | `http://localhost:5173` | Allowed origin for CORS headers |

---

## 25. Running the Project

### Start the Backend
From `AgriSaathi/backend`:
```bash
python app.py
```
- Server URL: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`

### Start the Frontend
From `AgriSaathi/frontend`:
```bash
npm run dev
```
- Client application: `http://localhost:5173`

---

## 26. Demo Credentials

The platform includes verified demonstration accounts for all stakeholder roles, seeded automatically via `backend/utils/seed_db.py`. Users can log in using credentials or click the **1-Click Quick Evaluation** buttons on the login page:

| Role | Organization / Name | Phone | Password | Verification Status | District |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FARMER (Verified)** | Suresh Patil | `9823012345` | `farmer123` | `VERIFIED` | Nashik |
| **FARMER (Pending)** | Ramesh Khot | `9823054321` | `farmer123` | `PENDING` | Kolhapur |
| **FPO (Verified)** | Sahyadri Farmers Producer Co. | `9823099999` | `fpo123` | `VERIFIED` | Nashik |
| **FPO (Pending)** | Godavari Krushi Agro Co. | `9823088888` | `fpo123` | `PENDING` | Ahmednagar |
| **BUYER (Verified)** | MahaFresh Wholesale & Retail | `9820011223` | `buyer123` | `VERIFIED` | Navi Mumbai |
| **WAREHOUSE (Verified)**| Nashik Agro Cold Storage | `9830022334` | `warehouse123` | `VERIFIED` | Nashik |
| **ADMIN (Government)** | MahaAgri State Nodal Officer | `9810000001` | `admin123` | `VERIFIED` | State HQ (Pune) |

> [!TIP]
> The authentication layer supports both role-specific passwords (e.g. `farmer123`, `buyer123`, `admin123`) and generic `password123` across all accounts.

---

## 27. API Overview

All endpoints return standardized JSON structures. Key operational routes include:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health, online modules, and active roles |
| `POST` | `/api/auth/login` | Stakeholder authentication with role validation |
| `POST` | `/api/auth/register/<role>` | Registration for farmer, fpo, buyer, or warehouse |
| `GET` | `/api/lots` | Filterable catalog of published crop produce lots |
| `POST` | `/api/lots` | Create crop lot with multi-part image upload and AI screening |
| `GET` | `/api/lots/<id>` | Full lot profile with AI quality report, mandi preview & offers |
| `GET` | `/api/fpo/lots` | Active FPO aggregation pools with live capacity and status evaluation |
| `POST` | `/api/fpo/lots` | Create aggregation requirement with target quota, window mode & duration |
| `GET` | `/api/fpo/lots/<id>` | Detail profile of an FPO pool with member breakdown and countdown |
| `POST` | `/api/fpo/lots/<id>/members` | Pledge member harvest volume with backend overbooking enforcement |
| `PUT` | `/api/fpo/lots/<id>/members/<id>/status` | Advance contribution status (`PLEDGED` → `RECEIVED` → `VERIFIED`) |
| `DELETE` | `/api/fpo/lots/<id>/members/<id>` | Remove member contribution from draft/open pool |
| `POST` | `/api/fpo/lots/<id>/publish` | Publish aggregated commercial lot to public buyer marketplace |
| `GET` | `/api/fpo/suggest-duration` | Agronomic perishability lookup and collection window advisory |
| `POST` | `/api/fpo/lots/<id>/extend` | Extend collection deadline by N hours and reopen contributions |
| `POST` | `/api/fpo/lots/<id>/proceed` | Finalize aggregation with collected volume and proceed to market |
| `POST` | `/api/fpo/lots/<id>/cancel` | Cancel aggregation pool while preserving historical farmer records |
| `GET` | `/api/fpo/inventory` | Consolidated produce inventory by crop with sell urgency and batch traceability |
| `GET` | `/api/fpo/organizations` | Directory of verified Maharashtra FPO cooperatives for farmer discovery |
| `POST` | `/api/fpo/join-request` | Submit farmer membership application to join an FPO |
| `GET` | `/api/market-prices` | Mandi prices, 14-day history, and comparative arbitrage matrix |
| `GET` | `/api/predictions/<crop>` | 7-day ML price forecast with upper/lower uncertainty bounds |
| `POST` | `/api/recommendations/evaluate` | Net return sale advisor (Sell Now vs Hold vs Cold Storage) |
| `GET` | `/api/storage/warehouses` | Verified cold storage directory with capacity and rates |
| `POST` | `/api/storage/bookings` | Submit cold storage reservation inquiry |
| `GET` | `/api/offers` | Incoming buyer offers and active negotiations |
| `POST` | `/api/offers` | Submit new wholesale procurement bid |
| `POST` | `/api/offers/<id>/counter` | Submit seller counter-offer |
| `POST` | `/api/offers/<id>/accept` | Accept offer, lock lot to `RESERVED`, and create Transaction |
| `GET` | `/api/transactions` | Order transaction history with dispatch & delivery status |
| `POST` | `/api/payments/pay-advance` | Deposit advance payment into Government Escrow |
| `POST` | `/api/transactions/<id>/confirm-delivery` | Confirm receipt, release escrow to seller, and complete trade |
| `GET` | `/api/grievances` | List open and resolved trade disputes |
| `POST` | `/api/grievances` | File formal grievance with photo proof and location coordinates |
| `GET` | `/api/admin/stats` | State overview metrics for Nodal Officers |
| `GET` | `/api/admin/escrow-ledger` | Regulatory audit log of all Government Escrow funds |
| `POST` | `/api/admin/users/<id>/verify` | Update stakeholder verification status (`VERIFIED` / `REJECTED`) |
| `POST` | `/api/admin/grievances/<id>/resolve` | Issue official government adjudication on dispute |

---

## 28. Current Project Status

- **Architecture**: 100% Unified Monolithic Architecture. The legacy System 1 and System 2 separation has been retired.
- **Portals**: All 5 stakeholder portals (Farmer, FPO, Buyer, Warehouse, Government Admin) are implemented, styled, and functional.
- **Backend**: 15 modular REST API Blueprints registered and verified on Python Flask 3.0.
- **Verification**: Complete end-to-end user journeys (Produce Listing → AI Quality Check → Market Discovery → Buyer Offer → Two-Way Negotiation → Agreement → Government Escrow Deposit → Dispatch Tracking → Quality Receipt → Escrow Release → Grievance Redressal) have been verified.
- **Frontend Build**: Tested with Vite 8 (`npm run build` exits cleanly with 0 errors).

---

## 29. Implementation Scope & Prototype vs. Production Reality

To maintain technical transparency, this section distinguishes between what is functional in the prototype codebase, what operates via simulation or local heuristics, and what represents planned future production integrations:

### 29.1 Currently Implemented Functional Features (Working Code)
- **Unified Stakeholder Authentication**: Role-based authentication (`FARMER`, `FPO`, `BUYER`, `WAREHOUSE`, `ADMIN`) with session validation and 1-click evaluation demo profiles.
- **Time-Bound FPO Aggregation State Machine**: Full lifecycle tracking (`OPEN`, `CLOSING_SOON`, `FILLED`, `EXPIRED`, `PROCEEDED`, `CANCELLED`), target quota vs committed volume, backend overbooking rejection, and post-deadline actions.
- **Perishability-Based Window Advisory**: Agronomic calculation engine categorizing crops by perishability with storage facility adjustments.
- **Farmer Equity & Farm Gate Batch Traceability**: Automated proportional equity share calculations and batch-level traceability modals.
- **Interactive Two-Way Negotiations**: Bidding, counter-offers, and deal acceptance with chronological audit logs.
- **Government User Verification Registry**: Multi-tab admin approval queue supporting verified credentials or rejections with mandatory reasons.
- **Dispute Redressal Logging & Nodal Adjudication**: Filing and resolving commercial disputes with photo uploads and status updates.
- **Machine Learning Price Forecasting**: Ridge Regression and EMA smoothing calculating 7-day trajectories from historical sequences.
- **Net Return AI Sale Timing**: Algorithmic comparison between immediate sale, short holding, and cold storage net-backs.

### 29.2 Simulated / Demo Functionality (Current Code Realization)
- **Government Escrow Ledger**: Implemented as an in-database double-entry transaction record within SQLite/MySQL (`payment_records`). It models the complete two-stage legal state flow (`HELD_BY_GOVT_ESCROW` $\rightarrow$ `RELEASED_TO_SELLER`), but is not connected to a live banking payment gateway or RBI-regulated commercial escrow account.
- **Logistics & Carrier Dispatch**: Dispatches, carrier names, and tracking numbers are simulated within the transaction entity; there is no live integration with commercial fleet APIs or GPS vehicle sensors.
- **Mandi Price Feeds**: APMC market prices, 14-day histories, and modal rates are pre-seeded reference datasets reflecting historical Maharashtra mandis, rather than live WebSocket or scraping feeds from real-time mandi gates.
- **Warehouse IoT Telemetry**: Cold chamber temperatures (°C) and relative humidity (%) are simulated representative metrics rather than real-time Modbus/MQTT hardware sensor streams.
- **AI Visual Quality Screening**: Evaluates uploaded images using surface heuristic checks (color spectrum, aspect ratio, resolution, morphology rules) with an explicit disclosure that it does not replace official AGMARK laboratory chemical assays.

### 29.3 Planned Future Production Integrations
- **Banking & Escrow**: Live integration with NPCI / e-RUPI programmable tokens and scheduled commercial bank escrow APIs.
- **Government Agricultural Market Data**: Real-time integration with the AGMARKNET national portal and Maharashtra State Agricultural Marketing Board (MSAMB) API gateways.
- **Logistics & Transport**: Integration with ULIP (Unified Logistics Interface Platform) and VAHAN/SARATHI national transport registries for verified vehicle GPS tracking.
- **Identity & Land Verification**: Direct API connectivity with UIDAI Aadhaar e-KYC, Mahabhulekh (e-Ferfar / 7/12 Land Records), and Digilocker.
- **Physical Assaying**: Interfacing with NABL-accredited testing laboratories and portable spectroscopic rapid-assay scanners for certified AGMARK grade issuance.
