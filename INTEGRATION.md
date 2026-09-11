# AgriSaathi — Unified Architecture & Data Contract Specification

> [!NOTE]
> **Historical Transition Note:**
> AgriSaathi previously operated under a provisional two-system division during early phase prototyping (System 1 for Sellers/Market Intelligence and System 2 for Buyers/Logistics/Escrow/Admin). **This separation has been officially retired.**
> The platform is now **100% merged and unified** into a single monolithic codebase with a consolidated database, shared authentication layer, and interconnected workflows across all five stakeholder roles.

---

## 1. Unified Architectural Overview

AgriSaathi is an end-to-end GovTech agricultural marketplace and supply chain platform engineered for the Government of Maharashtra. It operates as a cohesive client-server application:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AgriSaathi Unified Web Application                       │
│                        (React 19 + Vite + Vanilla CSS)                      │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ Farmer Portal│  │  FPO Portal  │  │ Buyer Portal │  │Warehouse Portal│  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └───────┬────────┘  │
│         │                 │                 │                  │            │
│         └────────────┬────┴────────────┬────┴──────────────────┘            │
│                      │                 │                                    │
│                      ▼                 ▼                                    │
│             ┌────────────────────────────────────┐                          │
│             │   Government Admin Oversight Portal│                          │
│             └─────────────────┬──────────────────┘                          │
└───────────────────────────────┼─────────────────────────────────────────────┘
                                │ JSON REST APIs (HTTP / CORS)
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                   AgriSaathi Unified Python Flask Backend                   │
│                                                                             │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌─────────────────┐ │
│  │  Auth & Verification  │  │ Crop Lots & Visual AI │  │ APMC Mandi Intel│ │
│  └───────────────────────┘  └───────────────────────┘  └─────────────────┘ │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌─────────────────┐ │
│  │ Two-Way Negotiations  │  │  Orders & Fulfillment │  │Two-Stage Escrow │ │
│  └───────────────────────┘  └───────────────────────┘  └─────────────────┘ │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌─────────────────┐ │
│  │ FPO Produce Pooling   │  │  Storage Reservations │  │Grievance Redress│ │
│  └───────────────────────┘  └───────────────────────┘  └─────────────────┘ │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │ SQLAlchemy ORM
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│            Unified Relational Database (MySQL / SQLite Fallback)             │
│  users • farmer_profiles • fpo_profiles • buyer_profiles • warehouse_profiles│
│  crop_lots • crop_lot_images • quality_reports • fpo_lot_members             │
│  warehouses • storage_bookings • offers • negotiation_history                │
│  transactions • payment_records • grievances • notifications                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Entities & Data Contracts

All entities share a single relational database schema (`database/schema.sql`) and are managed through unified SQLAlchemy models in `backend/models/`:

### 2.1 User & Multi-Role Profiles
- **`users`**: Base identity entity storing credentials, phone, email, role (`FARMER`, `FPO`, `BUYER`, `WAREHOUSE`, `ADMIN`), and government verification status (`PENDING`, `VERIFIED`, `REJECTED`).
- **`farmer_profiles`**: 7/12 land record details, farm acreage, taluka/district, masked Aadhaar and bank details.
- **`fpo_profiles`**: Company registration number, board executive contact, member count, primary crops, and banking details.
- **`buyer_profiles`**: Company name, authorized procurement lead, CIN/business registration, GSTIN, procurement categories, and GPS coordinates.
- **`warehouse_profiles`**: Facility name, operator credentials, WDRA registration license, storage type, capacity (MT), IoT telemetry (temperature/humidity), and monthly tariffs.

### 2.2 Crop Produce & Quality Verification
- **`crop_lots`**: Crop type, variety, harvest date, declared quantity, minimum expected price, quality grade (`Grade A`, `Grade B`, `Grade C`), storage status, and listing state (`AVAILABLE`, `RESERVED`, `SOLD`, `EXPIRED`).
- **`crop_lot_images`**: Uploaded photographic proof served statically via `/uploads/crop_lots/<filename>`.
- **`quality_reports`**: Output of the AI visual screening heuristic containing confidence score, crop consistency flag, clarity assessment, and AGMARK laboratory disclaimer.
- **`fpo_lot_members`**: Member farmer contributions, land share, pooled weight, and proportional escrow distribution records.

### 2.3 Trade, Negotiations & Transactions
- **`offers`**: Commercial bids submitted by wholesale buyers against published crop lots. Stores proposed price per kg, requested quantity, proposed advance deposit percentage, expiry date, and status (`PENDING`, `COUNTERED`, `ACCEPTED`, `REJECTED`, `EXPIRED`).
- **`negotiation_history`**: Audit trail of every price proposal and counter-offer exchanged between buyer and seller.
- **`transactions`**: Legally formalized purchase agreement created immediately upon offer acceptance. Lifecycle stages:
  - `DEAL_CONFIRMED` / `ADVANCE_PENDING`: Agreement minted; awaiting buyer advance deposit.
  - `ADVANCE_PAID`: Advance locked in Government Escrow.
  - `PREPARING` / `READY_FOR_PICKUP`: Seller packaging lot.
  - `IN_TRANSIT`: Produce dispatched with carrier tracking details.
  - `DELIVERED`: Produce arrived at buyer destination.
  - `BUYER_CONFIRMED`: Buyer completed physical inspection.
  - `COMPLETED`: Escrow released to seller; balance settled.
  - `DISPUTED`: Suspended pending Government Nodal Officer adjudication.
  - `CANCELLED`: Deal aborted prior to transit.

### 2.4 Payments & Two-Stage Government Escrow
- **`payment_records`**: Financial transaction ledger tracking payments across stages (`ADVANCE`, `BALANCE`, `REFUND`):
  - `payer_id` (Buyer) and `payee_id` (Seller).
  - `amount`: Monetary value in INR.
  - `status`: `ADVANCE_PENDING`, `ADVANCE_PAID`, `ESCROW_HELD`, `RELEASE_APPROVED`, `SETTLED`, `REFUNDED`.
  - `escrow_status`: `HELD_BY_GOVT_ESCROW`, `RELEASED_TO_SELLER`, `REFUNDED_TO_BUYER`, `NOT_APPLICABLE`.
  - `reference_number`: Bank or UPI transaction tracking reference.
  - `govt_audit_notes`: Nodal audit annotations.

### 2.5 Storage Bookings & Warehouse Management
- **`warehouses`**: Storage facilities across Maharashtra with district, verified status, capacity metrics, and tariffs.
- **`storage_bookings`**: Reservation requests submitted by Farmers or FPOs. Stores crop, quantity, duration in days, estimated cost, and status (`REQUESTED`, `CONFIRMED`, `CANCELLED`, `COMPLETED`).

### 2.6 Dispute Redressal & Administrative Governance
- **`grievances`**: Formal claims filed by buyers or sellers. Categories include `QUALITY_MISMATCH`, `QUANTITY_SHORTAGE`, `DELIVERY_DELAY`, `PAYMENT_ISSUE`, `STORAGE_DAMAGE`, and `OTHER`. Contains photo URL, incident coordinates, and official nodal officer resolution notes.
- **`notifications`**: Real-time in-app alerts categorized by `OFFER`, `PRICE`, `STORAGE`, `VERIFICATION`, and `INFO`.

---

## 3. Unified REST API Directory

| Endpoint Prefix | Blueprint | Description |
| :--- | :--- | :--- |
| `GET /api/health` | `health_bp` | System status, database health, online modules, and role support |
| `/api/auth/*` | `auth_bp` | Unified authentication, registrations for all roles, session validation |
| `/api/dashboard/*` | `dashboard_bp` | Real-time statistics, summary revenue, pending tasks for sellers |
| `/api/lots/*` | `lot_bp` | Crop listing CRUD, image upload, AI visual inspection, lot details |
| `/api/fpo/*` | `fpo_bp` | FPO produce aggregation pools, member farmer allocations, bulk contracts |
| `/api/market-prices/*` | `market_bp` | APMC mandi rates, 14-day history, inter-mandi transport net-backs |
| `/api/predictions/*` | `prediction_bp` | Machine learning price forecasts (Ridge + EMA ensemble with confidence bounds) |
| `/api/recommendations/*` | `recommendation_bp` | Net return AI sale timing engine (Sell Now vs Short-Hold vs Cold Storage) |
| `/api/storage/*` | `storage_bp` | Certified cold storage directory, tariff estimator, reservation booking requests |
| `/api/offers/*` | `offer_bp` | Wholesale buyer bid submission, counter-offers, acceptance, rejection |
| `/api/transactions/*` | `transaction_bp` | Order lifecycle execution, dispatch tracking, delivery confirmation |
| `/api/payments/*` | `payment_bp` | Government Escrow deposit, release settlement, and payment history |
| `/api/grievances/*` | `grievance_bp` | Dispute filing, evidentiary upload, grievance tracking |
| `/api/admin/*` | `admin_bp` | Government verification queue, Escrow financial ledger audit, dispute adjudication |
| `/api/notifications/*` | `notification_bp` | User notification retrieval and unread counter updates |

---

## 4. Portals & Frontend Route Mapping

The frontend operates as a unified single-page application with responsive role-swapping and seamless inter-portal navigation:

| Portal / View | Primary Route / View Key | Accessible Roles | Status |
| :--- | :--- | :--- | :--- |
| **Public Landing** | Landing View (`/`) | Public / All | Active |
| **Universal Login** | Auth View (`/auth/login`) | All 5 Roles | Active (Includes 1-Click Demo Buttons) |
| **Farmer Dashboard** | `dashboard` | `FARMER` | Active |
| **FPO Aggregation** | `fpo-aggregation` | `FARMER`, `FPO` | Active |
| **Crop Listings** | `add-produce`, `my-lots`, `lot-detail` | `FARMER`, `FPO` | Active |
| **Market Intelligence** | `markets`, `price-prediction`, `ai-advisor` | `FARMER`, `FPO`, `BUYER` | Active |
| **Storage Discovery** | `storage` | `FARMER`, `FPO` | Active |
| **Buyer Marketplace** | `buyer-portal` | `BUYER` | Active |
| **Warehouse Operations**| `warehouse-portal` | `WAREHOUSE` | Active |
| **Admin Oversight** | `admin-portal` | `ADMIN` | Active |
| **Orders & Transactions**| `transactions` | `FARMER`, `FPO`, `BUYER`, `ADMIN` | Active |
| **Payments & Escrow** | `payments` | `FARMER`, `FPO`, `BUYER`, `ADMIN` | Active |
| **Grievance Redressal** | `grievances` | `FARMER`, `FPO`, `BUYER`, `ADMIN` | Active |
| **Notifications** | `notifications` | All Authenticated Users | Active |
