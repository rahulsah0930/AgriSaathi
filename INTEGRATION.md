# AgriSaathi — System 1 Integration & Data Contract Reference

> **Smart India Hackathon Prototype — Maharashtra Government Agriculture Problem Statement**  
> **System 1:** Farmer, FPO, Crop Lot, Market Intelligence, Price Prediction, AI Recommendation Engine, Farmer-side Buyer Offers, Storage Discovery, FPO Produce Aggregation, In-app Notifications.  
> **Status:** All 21 Steps Completed (System 1 Production-Ready for Evaluation & System 2 Integration).

---

## 1. Project Folder Structure

```text
AgriSaathi/
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── common/         # Button, Card, Modal, Input, Select, Textarea, Table, Badge,
│   │   │   │                   # StatusBadge, Navbar, Sidebar, PageHeader, StatCard, EmptyState,
│   │   │   │                   # LoadingState, ConfirmationDialog, SearchBar, FilterPanel,
│   │   │   │                   # PriceCard, RecommendationCard
│   │   │   ├── farmer/         # Farmer specific UI components
│   │   │   ├── fpo/            # FPO aggregation UI components
│   │   │   ├── market/         # Mandi comparison and trend charts
│   │   │   └── ai/             # AI recommendation comparison cards
│   │   ├── layouts/            # Dashboard & Auth layouts
│   │   ├── pages/              # Landing, Auth, Farmer, Market
│   │   ├── services/           # api.js client (base HTTP wrapper)
│   │   ├── utils/              # Formatting helpers (currency, dates)
│   │   ├── data/               # Isolated mock datasets
│   │   ├── App.jsx             # Main Application root
│   │   ├── main.jsx            # React root
│   │   └── index.css           # Global Design System & CSS variables
│   └── package.json
│
├── backend/
│   ├── app.py                  # Flask application factory
│   ├── config.py               # Environment configuration
│   ├── models/                 # Shared contract models (User, FarmerProfile, FPOProfile, CropLot, FPOLotMember, MarketPrice)
│   ├── routes/
│   │   ├── health_routes.py    # Health check (/api/health)
│   │   ├── auth_routes.py      # Auth (/api/auth)
│   │   ├── dashboard_routes.py # Dashboard intelligence (/api/dashboard)
│   │   ├── lot_routes.py       # Crop Lots CRUD (/api/lots)
│   │   ├── fpo_routes.py       # FPO Aggregation (/api/fpo)
│   │   └── market_routes.py    # APMC Market Prices & Arbitrage (/api/market-prices)
│   ├── services/
│   │   ├── market_service.py   # Mandi price discovery & transport net-back calculator
│   │   ├── price_prediction.py # Price forecasting ML model
│   │   ├── crop_knowledge.py   # Perishability & shelf life data
│   │   └── sale_recommendation.py # Core Net Return AI engine
│   ├── utils/
│   │   ├── error_handlers.py   # Standard JSON error responses
│   │   └── seed_db.py          # Demo accounts, crop lots, and APMC price seeding
│   └── requirements.txt
│
├── database/
│   └── schema.sql              # MySQL DDL schema
│
├── .env.example
├── README.md
└── INTEGRATION.md
```

---

## 2. Important Files

| File | Purpose |
| :--- | :--- |
| `backend/app.py` | Flask entrypoint with CORS, JSON error handlers, blueprint registration |
| `backend/config.py` | Environment variable loader with MySQL / SQLite fallback configuration |
| `backend/models/market.py` | SQLAlchemy `MarketPrice` model representing APMC Mandi rates |
| `backend/services/market_service.py` | Distance-based transport freight deduction & net realizable price calculator |
| `backend/routes/market_routes.py` | Mandi search, 14-day history, and comparative arbitrage endpoints |
| `backend/models/lot.py` | SQLAlchemy `CropLot` and `FPOLotMember` models |
| `backend/routes/lot_routes.py` | Full CRUD, filtering, detail with AI recommendation and buyer offers |
| `backend/routes/fpo_routes.py` | FPO bulk produce aggregation and member allocations |
| `backend/routes/health_routes.py` | Operational health and module status endpoint (`/api/health`) |
| `backend/utils/error_handlers.py` | Standardized error responses preventing stack trace leakage |
| `database/schema.sql` | Canonical database table definitions conforming to shared contracts |
| `frontend/src/index.css` | GovTech agriculture design system (color tokens, cards, buttons, badges) |
| `frontend/src/services/api.js` | Fetch-based API service wrapper handling CORS and JSON responses |
| `frontend/src/pages/market/MarketPricesPage.jsx` | Mandi comparison matrix, 14-day price & volume trends, arbitrage alerts |
| `frontend/src/pages/farmer/AddProducePage.jsx` | Comprehensive Crop Lot listing form with Mandi preview |
| `frontend/src/pages/farmer/MyProducePage.jsx` | Crop lot management with status filters and quick actions |
| `frontend/src/pages/farmer/LotDetailPage.jsx` | Detail view with Net Return AI sale advisory & buyer offers |

---

## 3. Frontend Routes

| Route ID / Path | Planned Module | Owner | Status |
| :--- | :--- | :--- | :--- |
| `/` (landing) | Public Landing & Role Selection | System 1 | Step 2 Completed |
| `/auth/login` | Farmer / FPO Login | System 1 | Step 3, 4 Completed |
| `/auth/register/farmer` | Farmer Registration | System 1 | Step 3 Completed |
| `/auth/register/fpo` | FPO Registration | System 1 | Step 4 Completed |
| `/dashboard` | Farmer / FPO Dashboard | System 1 | Step 5 Completed |
| `/add-produce` | Create Crop Lot | System 1 | Step 6 Completed |
| `/my-lots` | View & Manage Lots | System 1 | Step 7 Completed |
| `/lot-detail` | Lot Details with AI & Offers | System 1 | Step 7, 8 Completed |
| `/fpo-aggregation` | FPO Produce Aggregation & Payouts | System 1 | Step 19, 20 Completed |
| `/markets` | Mandi Intelligence & Comparison | System 1 | Step 9, 10 Completed |
| `/ai-advisor` | Net Return AI Advisor & ML Forecaster | System 1 | Step 11, 12, 13, 14 Completed |
| `/buyer-offers` | Farmer Buyer Offers & Counter Flow | System 1 | Step 17, 18 Completed |
| `/storage` | Cold Storage Discovery & Booking Request | System 1 | Step 15, 16 Completed |
| `/notifications` | In-app Seller Notifications | System 1 | Step 21 Completed |
| `/transactions` | Order Transactions (Placeholder) | System 2 | System 2 Dependent |
| `/payments` | Payment Tracking (Placeholder) | System 2 | System 2 Dependent |
| `/grievances` | Grievance Submissions (Placeholder) | System 2 | System 2 Dependent |
| `/logistics` | Transport / Logistics | External | "Coming Soon" Label |

---

## 4. Backend API Routes

### System 1 Routes (Implemented)
- `GET /api/health` — Service health and module status *(Implemented in Step 1)*
- `POST /api/auth/register/farmer` — Register farmer with masked Aadhaar/bank *(Implemented in Step 3)*
- `POST /api/auth/register/fpo` — Register FPO with members & verification status *(Implemented in Step 4)*
- `POST /api/auth/login` — Seller login supporting FARMER and FPO *(Implemented in Steps 3, 4)*
- `GET /api/auth/me` — Active session/profile *(Implemented in Steps 3, 4)*
- `POST /api/auth/logout` — Logout endpoint *(Implemented in Steps 3, 4)*
- `GET /api/dashboard/summary` — Full dashboard summary, APMC prices, 7-day trend, lots, offers *(Implemented in Step 5)*
- `GET /api/lots` — List seller crop lots with filters (`crop`, `status`, `seller_id`) *(Implemented in Step 6, 7)*
- `POST /api/lots` — Create a new crop lot *(Implemented in Step 6)*
- `GET /api/lots/:id` — Lot details with quality, AI recommendation, and buyer offers *(Implemented in Step 7)*
- `PUT /api/lots/:id` — Edit lot fields *(Implemented in Step 7)*
- `PATCH /api/lots/:id/status` — Update lot status (`ACTIVE`, `RESERVED`, `SOLD`, `CANCELLED`) *(Implemented in Step 7)*
- `DELETE /api/lots/:id` — Remove uncommitted draft/lot *(Implemented in Step 7)*
- `GET /api/fpo/lots` — FPO lots and contributing farmer members *(Implemented in Step 8)*
- `POST /api/fpo/lots` — Create aggregated FPO lot *(Implemented in Step 8)*
- `POST /api/fpo/lots/:id/members` — Add member contribution *(Implemented in Step 8)*
- `DELETE /api/fpo/lots/:id/members/:memberId` — Remove member contribution *(Implemented in Step 8)*
- `POST /api/fpo/lots/:id/publish` — Publish aggregated lot to marketplace *(Implemented in Step 8)*
- `GET /api/market-prices` — Current Mandi rates with crop/district search & filters *(Implemented in Step 9)*
- `GET /api/market-prices/history` — 14-day historical price & arrival trends for charts *(Implemented in Step 9)*
- `GET /api/market-prices/compare` — Comparative Mandi arbitrage with transport deduction *(Implemented in Step 9)*
- `GET /api/market-prices/meta` — Dropdown filters metadata for crops and districts *(Implemented in Step 9)*
- `GET /api/predictions` — ML Ridge + EMA multi-horizon spot price forecasts with 95% CI *(Implemented in Step 11)*
- `POST /api/predictions` — Run custom prediction with specified lot size & target date *(Implemented in Step 11)*
- `GET /api/predictions/models` — Deployed ML architecture metadata and evaluation metrics *(Implemented in Step 11)*
- `POST /api/recommendations` — Run AI Net Return optimization (Storage vs Spot vs Perishability) *(Implemented in Step 13)*
- `GET /api/recommendations` — Quick Net Return optimization query *(Implemented in Step 13)*
- `GET /api/recommendations/knowledge` — Empirical perishability profiles & benchmark storage tariffs *(Implemented in Step 13)*
- `GET /api/warehouses` — Farmer storage discovery & capacity search *(Implemented in Step 15)*
- `GET /api/warehouses/:id` — Warehouse facility details *(Implemented in Step 15)*
- `POST /api/storage-bookings` — Initiate storage reservation request *(Implemented in Step 16)*
- `GET /api/storage-bookings` — Farmer's submitted storage booking inquiries *(Implemented in Step 16)*
- `GET /api/offers` — List inbound buyer procurement bids with status filters *(Implemented in Step 17)*
- `GET /api/offers/:id` — Single buyer offer details *(Implemented in Step 17)*
- `PATCH /api/offers/:id/accept` — Accept buyer offer & transition lot to RESERVED *(Implemented in Step 18)*
- `PATCH /api/offers/:id/reject` — Decline buyer offer *(Implemented in Step 18)*
- `PATCH /api/offers/:id/counter` — Submit counter-offer with proposed rate & note *(Implemented in Step 18)*
- `POST /api/offers` — Simulated buyer bid creation *(Implemented in Step 18)*
- `GET /api/notifications` — In-app notifications with unread counts & filters *(Implemented in Step 21)*
- `PATCH /api/notifications/:id/read` — Mark notification as read *(Implemented in Step 21)*
- `POST /api/notifications/mark-all-read` — Mark all notifications as read *(Implemented in Step 21)*

---

## 5. Database Tables & Shared Contracts

System 1 owns the following tables (defined in `database/schema.sql`):
1. `users`
2. `farmer_profiles`
3. `fpo_profiles`
4. `crops`
5. `crop_lots`
6. `fpo_lot_members`
7. `quality_reports`
8. `market_prices`
9. `price_predictions`
10. `offers`
11. `notifications`

External tables managed by System 2 during integration:
- `buyer_profiles`
- `buyer_requirements`
- `orders`
- `warehouse_profiles`
- `warehouses`
- `storage_bookings`
- `payments`
- `complaints`

---

## 6. Shared Enums & Data Contracts

### User Roles
```text
FARMER | FPO | BUYER | WAREHOUSE | ADMIN
```

### Verification Statuses
```text
PENDING | VERIFIED | REJECTED
```

### CropLot Statuses
```text
DRAFT | ACTIVE | RESERVED | SOLD | EXPIRED | CANCELLED
```

### Offer Statuses
```text
PENDING | ACCEPTED | REJECTED | COUNTERED | EXPIRED
```

### Storage Types
```text
NORMAL | COLD_STORAGE | CONTROLLED
```

---

## 7. CropLot Object Structure

```json
{
  "id": 101,
  "seller_id": 1,
  "seller_type": "FARMER",
  "seller_name": "Suresh Patil",
  "seller_verification_status": "PENDING",
  "crop": "Tomato",
  "variety": "Hybrid",
  "quantity": 1000,
  "unit": "kg",
  "quality_grade": "Grade A",
  "harvest_date": "2026-09-09",
  "location": "Dindori",
  "district": "Nashik",
  "expected_price": 25.0,
  "storage_status": "NOT_STORED",
  "image_url": null,
  "status": "ACTIVE",
  "created_at": "2026-09-09T10:00:00Z"
}
```

---

## 8. Warehouse Object Structure (System 2 Mock for Discovery)

```json
{
  "id": 201,
  "name": "Nashik Agro Cold Storage",
  "verification_status": "VERIFIED",
  "district": "Nashik",
  "location": "Panchavati, Nashik",
  "storage_type": "COLD_STORAGE",
  "supported_crops": "Tomato, Potato, Grapes, Pomegranate",
  "total_capacity": 100000,
  "available_capacity": 35000,
  "price_per_kg_per_day": 0.50,
  "temperature_range_placeholder": "2°C - 8°C",
  "availability_status": "AVAILABLE"
}
```

---

## 9. AI Recommendation Engine Contract

### Input Contract:
```json
{
  "crop_lot_id": 101,
  "crop": "Tomato",
  "quantity": 1000,
  "unit": "kg",
  "harvest_date": "2026-09-09",
  "district": "Nashik",
  "quality_grade": "Grade A",
  "storage_status": "NOT_STORED"
}
```

### Core Logic Formula:
$$\text{Expected Net Return} = (\text{Predicted Price} \times \text{Expected Sellable Quantity}) - \text{Storage Cost} - \text{Spoilage Loss} - \text{Transaction Cost}$$

- **Estimated Spoilage Rate**: Derived from `crops` perishability and storage type.
- **Expected Sellable Quantity**: $\text{Quantity} \times (1 - \text{Spoilage Rate})$.
- **Decision Window**: Compares `Today (SELL NOW)`, `Day 1-2 (SELL SOON)`, `Day 3-5 (WAIT)`, and `Cold Storage (STORE & SELL)`.

### Output Contract:
```json
{
  "recommendation": "SELL_SOON",
  "recommended_window": "Within 2 Days",
  "current_price": 20.0,
  "predicted_price": 23.0,
  "estimated_net_return": 21500.0,
  "risk": "HIGH",
  "storage_required": false,
  "reason": "Market prices may increase over the next two days, but tomato has high perishability. Waiting longer creates post-harvest losses exceeding price gains."
}
```

---

## 10. Privacy & Security Constraints
- **Aadhaar**: Never store or accept 12-digit real Aadhaar. Must be masked: `XXXX XXXX 1234`.
- **Bank Account**: Masked: `XXXXXX5678`.
- **Mock Warnings**: All sample data labeled as demo/historical data.
- **Predicted Prices**: Always labeled as `Estimated Price`, never `Guaranteed`.

---

## 11. Known Limitations & Potential Conflicts with System 2

| Topic | System 1 Handling | System 2 Integration Point | Conflict Mitigation |
| :--- | :--- | :--- | :--- |
| **Orders** | Farmer accepts offer $\rightarrow$ Status `ACCEPTED`. Shows transition banner. | System 2 creates `Order` row and tracks execution. | System 1 does not create its own Order table or IDs. |
| **Warehouses** | Reads mock warehouses for discovery and cost modeling. | System 2 manages real warehouse onboarding and capacity. | Warehouse schema columns strictly aligned with System 2 spec. |
| **Verification** | Sets default `PENDING`. UI allows limited access. | System 2 Admin portal updates status to `VERIFIED`. | No conflicting verification logic. Read-only status display in System 1. |
| **Logistics** | Clearly marked "Logistics Integration — Coming Soon". | Future logistics phase. | Accurate GPS & Haversine distance implemented in System 1 for seamless handoff. |

---

## 12. Post-Completion Enhancements Data Contract (System 1 <-> System 2)

### 12.1 Multi-Photo Visual Evidence Contract
- **Table**: `crop_lot_images` (`id`, `crop_lot_id`, `image_url`, `is_primary`, `uploaded_at`)
- **Relationship**: 1-to-many on `CropLot.images`
- **File Storage**: Uploads persisted under `/backend/uploads/crop_lots/`, served via `GET /uploads/crop_lots/<filename>`.
- **Endpoints**:
  - `POST /api/lots/upload-image`: Uploads image file (`multipart/form-data`), returns `{ success: true, image_url: "/uploads/crop_lots/..." }`.
  - `POST /api/lots/<id>/images`: Attaches image directly to existing lot.
  - `DELETE /api/lots/<id>/images/<image_id>`: Removes image record and deletes file from disk.
  - `PATCH /api/lots/<id>/images/<image_id>/primary`: Marks designated image as primary photo.
- **Publishing Rule**: Active listings (`status == 'ACTIVE'`) require at least 1 image. Drafts (`status == 'DRAFT'`) can be saved without photos.

### 12.2 Quality Information & Verification Contract
- **Table**: `quality_reports`
  - `condition_summary`: VARCHAR(150) (e.g. "Freshly Harvested, Sorted & Cleaned")
  - `moisture_percentage`: FLOAT (e.g. 11.5%)
  - `damage_percentage`: FLOAT (e.g. 1.2%)
  - `freshness_status`: ENUM ('FRESH', 'FAIR', 'AGING')
  - `seller_declared_grade`: ENUM ('Grade A', 'Grade B', 'Grade C')
  - `verification_status`: ENUM ('SELF_REPORTED', 'VERIFICATION_REQUESTED', 'INSPECTION_SCHEDULED', 'VERIFIED', 'REJECTED')
  - `verified_grade`: ENUM ('Grade A', 'Grade B', 'Grade C', NULL)
  - `verified_by`: VARCHAR(150) (e.g. "MahaAgri Quality Inspector")
  - `verifier_role`: VARCHAR(50) ('AUTHORIZED_OFFICER', 'APMC_GRADER', 'FPO_LEAD')
  - `verifier_notes`: TEXT
- **Endpoints**:
  - `GET /api/lots/<id>/quality`: Returns quality parameters and audit record.
  - `POST /api/lots/<id>/quality/request-verification`: Farmer requests physical inspection.
  - `POST /api/lots/<id>/quality/verify`: Nodal officer reviews and confirms verified grade.
- **FPO Quality Disparity Audit**:
  - `GET /api/fpo/lots/<id>` includes `quality_audit`:
    ```json
    {
      "has_mismatch": true,
      "distinct_grades": ["Grade A", "Grade B"],
      "warning_message": "Quality Disparity Detected: Aggregated pool contains mixed member grades..."
    }
    ```

### 12.3 High-Precision Farm Gate Coordinates & Address Contract
- **Columns on `crop_lots`**:
  - `latitude`: REAL / Float (e.g. `20.198300`)
  - `longitude`: REAL / Float (e.g. `73.834400`)
  - `address`: VARCHAR(255) (Gat No. / Landmark / Road)
  - `village`: VARCHAR(100) (e.g. "Dindori")
  - `taluka`: VARCHAR(100) (e.g. "Dindori")
  - `district`: VARCHAR(100) (e.g. "Nashik")
  - `pincode`: VARCHAR(20) (e.g. "422202")
  - `state`: VARCHAR(50) DEFAULT 'Maharashtra'
- **Serialized JSON Object (`lot.to_dict()`)**:
  ```json
  {
    "latitude": 20.1983,
    "longitude": 73.8344,
    "coordinates": {
      "lat": 20.1983,
      "lng": 73.8344
    },
    "address": "Gat No. 142, Near APMC Sub-Yard",
    "village": "Dindori",
    "taluka": "Dindori",
    "district": "Nashik",
    "pincode": "422202",
    "state": "Maharashtra"
  }
  ```

### 12.4 Distance & Logistics Calculations (Haversine Formula)
Frontend utility at `frontend/src/utils/geoUtils.js`:
- **Haversine Distance**:
  $$d = 2 \cdot R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\text{lat}}{2}\right) + \cos(\text{lat}_1)\cos(\text{lat}_2)\sin^2\left(\frac{\Delta\text{lon}}{2}\right)}\right)$$
  Where $R = 6371\text{ km}$.
- **Estimated Transit Time**: Rural agricultural speed average $\approx 35\text{ km/h}$.
- **Freight Cost Estimation**: Base driver pickup charge (₹350) + (Distance in km $\times$ ₹14/tonne/km $\times$ Tonnes).

