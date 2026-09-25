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
- **`crop_lots`**: Base produce entity supporting both individual seller listings and multi-member FPO aggregation pools:
  - *Core Attributes*: `seller_id`, `seller_type` (`FARMER` / `FPO`), `crop`, `variety`, `harvest_date`, `quantity`, `unit`, `expected_price`, `quality_grade`, `storage_status`, `status` (`AVAILABLE`, `RESERVED`, `SOLD`, `EXPIRED`).
  - *Time-Bound FPO Aggregation Fields*:
    - `target_quantity`: Target commercial volume quota.
    - `collection_start_at` & `collection_deadline_at`: Window start and cutoff timestamps.
    - `delivery_deadline_at`: Agreed fulfillment deadline.
    - `collection_window_source`: `SMART_SUGGESTED` (perishability algorithm) vs `MANUAL`.
    - `aggregation_status`: `OPEN`, `CLOSING_SOON` ($\ge$ 90%), `FILLED` (100%), `EXPIRED` (past deadline), `PROCEEDED` (finalized with collected volume), `CANCELLED`.
    - `near_capacity_notified_at`, `filled_notified_at`, `deadline_notified_at`: Audit timestamps enforcing single idempotent notifications (zero spam).
    - `deadline_extension_count`: Number of times the collection window was extended by the FPO.
  - *Dynamically Derived Quantities (`to_dict`)*: `committed_quantity`, `received_quantity`, `verified_quantity`, `available_for_sale`, `remaining_capacity`, `percentage_filled`, `time_remaining_seconds`, `is_expired`.
- **`crop_lot_images`**: Uploaded photographic proof served statically via `/uploads/crop_lots/<filename>`.
- **`quality_reports`**: Output of the AI visual screening heuristic containing confidence score, crop consistency flag, clarity assessment, and AGMARK laboratory disclaimer.
- **`fpo_lot_members`**: Member farmer contribution records:
  - `lot_id`: Parent aggregation lot reference.
  - `farmer_id`: Optional registered user reference.
  - `farmer_name`: Name of contributing farmer.
  - `farmer_reference_placeholder`: Contact or membership identifier.
  - `quantity` & `unit`: Contributed volume.
  - `quality_grade`: Grade of harvest delivered.
  - `contribution_status`: `PLEDGED` (committed in field) $\rightarrow$ `RECEIVED` (arrived at packhouse) $\rightarrow$ `VERIFIED` (inspected & weighed).
  - `percentage_share` / `share_percentage`: Automatically calculated proportional equity.
  - `estimated_payout`: Projected earnings based on lot price.

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

| Endpoint Prefix / Path | Blueprint | Description |
| :--- | :--- | :--- |
| `GET /api/health` | `health_bp` | System status, database health, online modules, and role support |
| `/api/auth/*` | `auth_bp` | Unified authentication, registrations for all roles, session validation |
| `/api/dashboard/*` | `dashboard_bp` | Real-time statistics, summary revenue, pending tasks for sellers |
| `/api/lots/*` | `lot_bp` | Crop listing CRUD, image upload, AI visual inspection, lot details |
| `GET /api/fpo/lots` | `fpo_bp` | Active FPO aggregation pools with live capacity and status evaluation |
| `POST /api/fpo/lots` | `fpo_bp` | Create aggregation requirement with target quota, window mode & duration |
| `GET /api/fpo/lots/<id>` | `fpo_bp` | Detail profile of an FPO pool with member breakdown and countdown |
| `POST /api/fpo/lots/<id>/members` | `fpo_bp` | Pledge member harvest volume with backend overbooking enforcement |
| `PUT /api/fpo/lots/<id>/members/<id>/status` | `fpo_bp` | Advance contribution status (`PLEDGED` → `RECEIVED` → `VERIFIED`) |
| `DELETE /api/fpo/lots/<id>/members/<id>` | `fpo_bp` | Remove member contribution from draft/open pool |
| `POST /api/fpo/lots/<id>/publish` | `fpo_bp` | Publish aggregated commercial lot to public buyer marketplace |
| `GET /api/fpo/suggest-duration` | `fpo_bp` | Agronomic perishability lookup and collection window advisory |
| `POST /api/fpo/lots/<id>/extend` | `fpo_bp` | Extend collection deadline by N hours and reopen contributions |
| `POST /api/fpo/lots/<id>/proceed` | `fpo_bp` | Finalize aggregation with collected volume and proceed to market |
| `POST /api/fpo/lots/<id>/cancel` | `fpo_bp` | Cancel aggregation pool while preserving historical farmer records |
| `GET /api/fpo/inventory` | `fpo_bp` | Consolidated produce inventory by crop with sell urgency and batch traceability |
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

---

## 5. Integration Status: Operational Prototype vs. Simulated Functionality

To provide clear technical boundaries for evaluators and developers, the integration tiers are classified as follows:

| Component / Service | Implementation Type | Current Mechanism in Codebase | Planned Production Integration |
| :--- | :--- | :--- | :--- |
| **FPO Aggregation Engine** | **Operational Prototype** | Real-time state machine (`OPEN`, `CLOSING_SOON`, `FILLED`, `EXPIRED`, `PROCEEDED`), backend overbooking rejection, and dynamic quantity derivation. | Production database migration with background scheduler (Celery/Cron). |
| **Perishability Advisory** | **Operational Prototype** | Rule-based agronomic algorithm in `fpo_aggregation_service.py` evaluating crop respiration and ambient vs cold chain storage. | Live weather API feeds (IMD) for ambient temperature adjustments. |
| **Farmer Traceability** | **Operational Prototype** | Relational link between `CropLot`, `FPOLotMember`, and `User` with proportional equity calculations. | Blockchain/ledger or QR-coded tamper-evident crate labels. |
| **Government Escrow** | **Simulated Demo Ledger** | Modeled via relational `PaymentRecord` entities in SQLite/MySQL simulating advance locks and settlement releases. | Scheduled commercial bank escrow APIs (e.g. ICICI/HDFC Escrow) and NPCI e-RUPI. |
| **Logistics & Dispatch** | **Simulated Demo Data** | Carriers, vehicle numbers, and tracking references stored in `Transaction` entities. | ULIP (Unified Logistics Interface Platform) & VAHAN API integration. |
| **APMC Mandi Prices** | **Simulated Demo Baseline** | Seeded historical Maharashtra mandi prices with Haversine transport net-back calculations. | Live AGMARKNET & MSAMB real-time mandi price streaming APIs. |
| **Visual Crop Quality** | **Heuristic Prototype** | Image analysis checking surface features, morphology rules, and resolution. | Multi-spectral analysis models & AGMARK lab assay certification integration. |
| **Cold Storage Telemetry** | **Simulated Demo Data** | Mock chamber temperature and humidity logs in `WarehouseProfile`. | IoT gateway telemetry via MQTT / Modbus sensors. |
| **Identity Verification** | **Simulated Demo Queue** | Admin approval workflow in `admin_bp` storing masked Aadhaar/PAN fields. | UIDAI Aadhaar e-KYC, Digilocker, and Mahabhulekh (7/12 Land Records) APIs. |

