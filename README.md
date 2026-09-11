# AgriSaathi — System 1 (Seller & Market Intelligence)

Smart India Hackathon Prototype for the **Maharashtra Government Agriculture Problem Statement**.

AgriSaathi connects farmers, FPOs, buyers, and cold storages across Maharashtra to prevent distress selling and post-harvest losses. **System 1** is the seller and market-intelligence side of the platform, answering the critical question:

> **"When should a farmer sell the crop to obtain the best realistic net return?"**

---

## System 1 Scope & Responsibilities

- **Farmer & FPO Portals**: Registration, login, and dashboard with government verification status indicators.
- **Crop Lot Lifecycle**: Creation, lot management, quality self-reporting, and FPO aggregation across member farmers.
- **Market Intelligence**: Real-time mandi prices across Maharashtra APMCs (Nashik, Pune, Mumbai, etc.) and historical trends.
- **Crop Knowledge & Shelf Life**: Perishability profiles, spoilage risks, and temperature requirements.
- **Price Forecasting**: Understandable ML and time-series price predictions with upper/lower bounds.
- **AI Recommendation Engine**: Net return optimization (`SELL NOW`, `SELL SOON`, `WAIT`, `STORE & SELL`) comparing future prices, spoilage, and cold storage costs.
- **Buyer Offers**: Farmer-side offer acceptance, rejection, and counter-offer workflows.
- **Storage Discovery**: Discover verified cold storage facilities and submit booking requests.
- **Notifications**: Real-time seller alerts.

*Note: System 2 (Buyer Portal, Warehouse Management, Government Admin, Orders, Payments, and Grievances) is being developed separately and will be merged seamlessly via the contracts documented in [INTEGRATION.md](./INTEGRATION.md).*

---

## Tech Stack

- **Frontend**: React 19 (Vite), Lucide Icons, Recharts, Custom GovTech Design System CSS
- **Backend**: Python Flask 3.0, Flask-CORS, Flask-SQLAlchemy
- **AI & Analytics**: Scikit-learn, NumPy, Pandas
- **Database**: MySQL schema (`database/schema.sql`) with SQLite development fallback

---

## Setup & Running Locally

### 1. Backend Setup
```bash
# In the repository root
cd backend

# Install dependencies
pip install -r requirements.txt

# Run the Flask backend
python app.py
```
The backend starts on `http://localhost:5000` with the health check at `http://localhost:5000/api/health`.

### 2. Frontend Setup
```bash
# In the repository root
cd frontend

# Install dependencies (already installed during setup)
npm install

# Start the Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Demonstration Accounts

| Role | Mobile Number | Password | Profile Name | District |
| :--- | :--- | :--- | :--- | :--- |
| **Verified Farmer** | `9823012345` | `farmer123` | Suresh Patil | Nashik (Dindori) |
| **Pending Farmer** | `9823054321` | `farmer123` | Ramesh Khot | Kolhapur |
| **Verified FPO** | `9823099999` | `fpo123` | Sahyadri Farmers Producer Co. Ltd. | Nashik |
| **Pending FPO** | `9823088888` | `fpo123` | Godavari Krushi Agro Producer Co. | Ahmednagar |

---

## Development Sequence (All 21 Steps Completed)

- [x] **Step 1**: Project foundation + React/Flask setup + GovTech UI components + README + INTEGRATION.md
- [x] **Step 2**: Landing Page + Seller Role Selection
- [x] **Step 3**: Farmer Registration + Login with Masked Aadhaar & Bank Details
- [x] **Step 4**: FPO Registration + Member Registry Setup
- [x] **Step 5**: Farmer / FPO Unified Seller Intelligence Dashboard
- [x] **Step 6**: Add Produce / Crop Lot Creation with Live Mandi Rate Previews
- [x] **Step 7**: My Crop Lots Management + Comprehensive Lot Detail View
- [x] **Step 8**: FPO Aggregation Backend & Member Contributions
- [x] **Step 9**: APMC Mandi Intelligence & Farm-to-Mandi Freight Deduction Engine
- [x] **Step 10**: Comparative Mandi Arbitrage Matrix & 14-Day Price Trend Charts
- [x] **Step 11**: Machine Learning Price Forecasting Engine (Ridge + EMA Ensemble)
- [x] **Step 12**: Price Prediction UI with Cone of Uncertainty & Horizon Fan Chart
- [x] **Step 13**: Empirical Crop Shelf-Life & Perishability Knowledge Service
- [x] **Step 14**: Net Return AI Sale Advisor (3 Strategies: Spot vs Short-Hold vs Cold Storage)
- [x] **Step 15**: Certified Maharashtra Cold Storage & Warehouse Discovery Directory
- [x] **Step 16**: Interactive Storage Booking Inquiries with Dynamic Tariff Calculator
- [x] **Step 17**: Farmer-Side Inbound Buyer Procurement Bids Discovery
- [x] **Step 18**: Negotiation Workflow (Accept & Lock to RESERVED, Decline, Counter-Offer)
- [x] **Step 19**: FPO Bulk Produce Aggregation Pool Management
- [x] **Step 20**: Member Farmer Contributions, Equity Shares & Payout Distribution
- [x] **Step 21**: In-App Seller Notifications, Price Surge Alerts & Dynamic Unread Counter

