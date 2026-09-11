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

## 12. FPO Aggregation

- **Produce Pooling**: Individual smallholder farmers can pool sub-commercial lots (e.g., 500 kg lots) into unified commercial bulk pools (e.g., 10,000 kg container loads).
- **Member Equity Ledger**: The `fpo_lot_members` table maintains exact records of each contributing farmer's contributed volume, quality grade, and percentage share.
- **Bulk Contract Execution**: FPO managers negotiate with institutional wholesale buyers on behalf of the cooperative.
- **Proportional Payouts**: Upon escrow release, sales proceeds and advance deposits are automatically divided proportionally according to each member farmer's contributed share.

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
| `GET` | `/api/fpo/pools` | Active FPO produce aggregation pools |
| `POST` | `/api/fpo/contribute` | Add member farmer produce contribution to an FPO pool |
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
- **Verification**: Complete end-to-end user journeys (Produce Listing $\rightarrow$ AI Quality Check $\rightarrow$ Market Discovery $\rightarrow$ Buyer Offer $\rightarrow$ Two-Way Negotiation $\rightarrow$ Agreement $\rightarrow$ Government Escrow Deposit $\rightarrow$ Dispatch Tracking $\rightarrow$ Quality Receipt $\rightarrow$ Escrow Release $\rightarrow$ Grievance Redressal) have been verified.
- **Frontend Build**: Tested with Vite 8 (`npm run build` exits cleanly with 0 errors).
