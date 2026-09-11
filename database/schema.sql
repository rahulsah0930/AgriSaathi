-- ====================================================================
-- AgriSaathi Unified Database Schema (MySQL Compatible)
-- Developed for Smart India Hackathon Prototype (Maharashtra Gov Agri)
-- Unified Platform: Farmer, FPO, Wholesale Buyer, Warehouse/Cold Storage,
--                   Government Admin, Escrow Ledger & Grievance Redressal
-- ====================================================================

CREATE DATABASE IF NOT EXISTS agrisaathi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE agrisaathi_db;

-- --------------------------------------------------------------------
-- 1. USERS & PROFILES (Shared Entity: User)
-- Roles: FARMER, FPO, BUYER, WAREHOUSE, ADMIN
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(120) NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('FARMER', 'FPO', 'BUYER', 'WAREHOUSE', 'ADMIN') NOT NULL,
    verification_status ENUM('PENDING', 'VERIFIED', 'REJECTED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS farmer_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    aadhaar_masked VARCHAR(20) NULL, -- Format: 'XXXX XXXX 1234' (Never real full Aadhaar)
    village VARCHAR(100) NOT NULL,
    taluka VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(50) DEFAULT 'Maharashtra',
    farm_size_acres DECIMAL(6, 2) NULL,
    main_crops VARCHAR(255) NULL,
    bank_account_masked VARCHAR(30) NULL, -- Format: 'XXXXXX5678'
    ifsc_code_masked VARCHAR(20) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS fpo_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    fpo_name VARCHAR(200) NOT NULL,
    registration_number VARCHAR(100) NOT NULL,
    contact_person VARCHAR(120) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(50) DEFAULT 'Maharashtra',
    member_count INT DEFAULT 0,
    primary_crops VARCHAR(255) NULL,
    bank_account_masked VARCHAR(30) NULL,
    ifsc_code_masked VARCHAR(20) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- --------------------------------------------------------------------
-- 2. CROP CATALOG & KNOWLEDGE SERVICE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crops (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    perishability ENUM('VERY_HIGH', 'HIGH', 'MEDIUM', 'LOW') NOT NULL,
    recommended_storage_type ENUM('NORMAL', 'COLD_STORAGE', 'CONTROLLED') NOT NULL,
    typical_storage_days_min INT DEFAULT 1,
    typical_storage_days_max INT DEFAULT 7,
    spoilage_rate_daily DECIMAL(4, 3) DEFAULT 0.050,
    temperature_celsius_range VARCHAR(50) NULL
);

-- --------------------------------------------------------------------
-- 3. CROP LOTS (Shared Entity: CropLot)
-- Seller Types: FARMER, FPO
-- Statuses: DRAFT, ACTIVE, RESERVED, SOLD, EXPIRED, CANCELLED
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crop_lots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    seller_id INT NOT NULL,
    seller_type ENUM('FARMER', 'FPO') NOT NULL,
    seller_name VARCHAR(150) NOT NULL,
    seller_verification_status ENUM('PENDING', 'VERIFIED', 'REJECTED') DEFAULT 'PENDING',
    crop VARCHAR(100) NOT NULL,
    variety VARCHAR(100) NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit ENUM('kg', 'quintal', 'tonne') DEFAULT 'kg',
    quality_grade ENUM('Grade A', 'Grade B', 'Grade C') DEFAULT 'Grade A',
    harvest_date DATE NOT NULL,
    location VARCHAR(150) NOT NULL,
    district VARCHAR(100) NOT NULL,
    expected_price DECIMAL(10, 2) NOT NULL,
    storage_status ENUM('NOT_STORED', 'IN_STORAGE', 'SCHEDULED') DEFAULT 'NOT_STORED',
    image_url VARCHAR(255) NULL,
    status ENUM('DRAFT', 'ACTIVE', 'RESERVED', 'SOLD', 'EXPIRED', 'CANCELLED') DEFAULT 'DRAFT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);

-- --------------------------------------------------------------------
-- 3b. CROP LOT IMAGES (Shared Entity: CropLotImage)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crop_lot_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    crop_lot_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crop_lot_id) REFERENCES crop_lots(id) ON DELETE CASCADE
);

-- --------------------------------------------------------------------
-- 4. FPO AGGREGATION (Shared Entity: FPOLotMember)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fpo_lot_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fpo_lot_id INT NOT NULL,
    farmer_name VARCHAR(150) NOT NULL,
    farmer_reference_placeholder VARCHAR(50) NULL,
    crop VARCHAR(100) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit ENUM('kg', 'quintal', 'tonne') DEFAULT 'kg',
    quality_grade ENUM('Grade A', 'Grade B', 'Grade C') DEFAULT 'Grade A',
    contribution_status ENUM('PLEDGED', 'RECEIVED', 'VERIFIED') DEFAULT 'PLEDGED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fpo_lot_id) REFERENCES crop_lots(id) ON DELETE CASCADE
);

-- --------------------------------------------------------------------
-- 5. QUALITY INFORMATION (Shared Entity: QualityReport)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quality_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    crop_lot_id INT NOT NULL,
    quality_grade VARCHAR(20) DEFAULT 'Grade A',
    condition_summary VARCHAR(255) NULL,
    moisture_percentage DECIMAL(5, 2) NULL,
    damage_percentage DECIMAL(5, 2) NULL,
    freshness_status VARCHAR(50) DEFAULT 'FRESH',
    inspection_status ENUM('NOT_INSPECTED', 'SELF_REPORTED', 'VERIFIED') DEFAULT 'SELF_REPORTED',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crop_lot_id) REFERENCES crop_lots(id) ON DELETE CASCADE
);

-- --------------------------------------------------------------------
-- 6. MARKET PRICES & PREDICTIONS (Shared Entity: MarketPrice, PricePrediction)
-- Source types: MOCK, SAMPLE, HISTORICAL, LIVE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS market_prices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    crop VARCHAR(100) NOT NULL,
    market_name VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    min_price DECIMAL(10, 2) NOT NULL,
    max_price DECIMAL(10, 2) NOT NULL,
    average_price DECIMAL(10, 2) NOT NULL,
    arrival_volume DECIMAL(10, 2) DEFAULT 0,
    source_type ENUM('MOCK', 'SAMPLE', 'HISTORICAL', 'LIVE') DEFAULT 'SAMPLE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS price_predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    crop VARCHAR(100) NOT NULL,
    market VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    prediction_date DATE NOT NULL,
    estimated_price DECIMAL(10, 2) NOT NULL,
    lower_estimate DECIMAL(10, 2) NOT NULL,
    upper_estimate DECIMAL(10, 2) NOT NULL,
    confidence_indicator_placeholder VARCHAR(20) DEFAULT 'MEDIUM',
    model_type VARCHAR(50) DEFAULT 'LINEAR_REGRESSION_MA',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------
-- 7. BUYER OFFERS (Shared Entity: Offer)
-- Statuses: PENDING, ACCEPTED, REJECTED, COUNTERED, EXPIRED
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS offers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    crop_lot_id INT NOT NULL,
    buyer_id INT NOT NULL,
    buyer_name VARCHAR(150) NOT NULL,
    buyer_verification_status ENUM('PENDING', 'VERIFIED', 'REJECTED') DEFAULT 'VERIFIED',
    seller_id INT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit ENUM('kg', 'quintal', 'tonne') DEFAULT 'kg',
    offer_price DECIMAL(10, 2) NOT NULL,
    total_value DECIMAL(12, 2) NOT NULL,
    delivery_date DATE NOT NULL,
    message TEXT NULL,
    counter_price DECIMAL(10, 2) NULL,
    counter_message TEXT NULL,
    status ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'COUNTERED', 'EXPIRED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (crop_lot_id) REFERENCES crop_lots(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);

-- --------------------------------------------------------------------
-- 8. WAREHOUSES & STORAGE BOOKINGS
-- Storage Types: NORMAL, COLD_STORAGE, CONTROLLED
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS warehouses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    verification_status ENUM('PENDING', 'VERIFIED', 'REJECTED') DEFAULT 'VERIFIED',
    district VARCHAR(100) NOT NULL,
    location VARCHAR(200) NOT NULL,
    storage_type ENUM('NORMAL', 'COLD_STORAGE', 'CONTROLLED') NOT NULL,
    supported_crops VARCHAR(255) NOT NULL,
    total_capacity DECIMAL(10, 2) NOT NULL,
    available_capacity DECIMAL(10, 2) NOT NULL,
    price_per_kg_per_day DECIMAL(6, 3) NOT NULL,
    temperature_range_placeholder VARCHAR(50) NULL,
    availability_status ENUM('AVAILABLE', 'LIMITED', 'FULL') DEFAULT 'AVAILABLE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS storage_bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    user_role ENUM('FARMER', 'FPO') NOT NULL,
    warehouse_id INT NOT NULL,
    crop VARCHAR(100) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit ENUM('kg', 'quintal', 'tonne') DEFAULT 'kg',
    start_date DATE NOT NULL,
    expected_duration_days INT NOT NULL,
    estimated_cost DECIMAL(10, 2) NOT NULL,
    status ENUM('REQUESTED', 'CONFIRMED', 'CANCELLED', 'COMPLETED') DEFAULT 'REQUESTED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
);

-- --------------------------------------------------------------------
-- 9. NOTIFICATIONS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('INFO', 'OFFER', 'PRICE', 'STORAGE', 'VERIFICATION') DEFAULT 'INFO',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- --------------------------------------------------------------------
-- 10. UNIFIED MARKETPLACE TRANSACTIONS, ESCROW & GRIEVANCES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS buyer_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    company_name VARCHAR(150) NOT NULL,
    authorized_person VARCHAR(120) NOT NULL,
    business_registration VARCHAR(100) NULL,
    gst_number VARCHAR(50) NULL,
    procurement_categories VARCHAR(255) DEFAULT 'Vegetables, Grains, Fruits',
    address VARCHAR(255) NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(50) DEFAULT 'Maharashtra',
    latitude FLOAT NULL,
    longitude FLOAT NULL,
    aadhaar_masked VARCHAR(30) NULL,
    bank_name VARCHAR(100) NULL,
    bank_account_masked VARCHAR(30) NULL,
    ifsc_code_masked VARCHAR(20) NULL,
    account_holder_name VARCHAR(120) NULL,
    documents VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS warehouse_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    warehouse_name VARCHAR(150) NOT NULL,
    operator_name VARCHAR(120) NOT NULL,
    license_number VARCHAR(100) NULL,
    storage_type VARCHAR(100) DEFAULT 'Cold Storage (Multi-Chamber)',
    capacity_mt FLOAT DEFAULT 2500.0,
    available_capacity_mt FLOAT DEFAULT 1100.0,
    supported_crops VARCHAR(255) DEFAULT 'Tomato, Onion, Grapes, Pomegranate',
    tariff_per_quintal_month FLOAT DEFAULT 55.0,
    temperature_celsius FLOAT DEFAULT 3.5,
    humidity_percentage FLOAT DEFAULT 85.0,
    address VARCHAR(255) NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(50) DEFAULT 'Maharashtra',
    latitude FLOAT NULL,
    longitude FLOAT NULL,
    phone VARCHAR(20) NULL,
    email VARCHAR(120) NULL,
    aadhaar_masked VARCHAR(30) NULL,
    bank_name VARCHAR(100) NULL,
    bank_account_masked VARCHAR(30) NULL,
    ifsc_code_masked VARCHAR(20) NULL,
    account_holder_name VARCHAR(120) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_ref VARCHAR(50) NOT NULL UNIQUE,
    crop_lot_id INT NULL,
    offer_id INT NULL,
    buyer_id INT NOT NULL,
    seller_id INT NOT NULL,
    crop VARCHAR(100) NOT NULL,
    variety VARCHAR(100) NULL,
    quantity FLOAT NOT NULL,
    unit VARCHAR(20) DEFAULT 'kg',
    agreed_price_per_unit FLOAT NOT NULL,
    total_amount FLOAT NOT NULL,
    advance_percentage FLOAT DEFAULT 20.0,
    advance_amount FLOAT NOT NULL,
    balance_amount FLOAT NOT NULL,
    status ENUM('DEAL_CONFIRMED', 'ADVANCE_PENDING', 'ADVANCE_PAID', 'PREPARING', 'READY_FOR_PICKUP', 'IN_TRANSIT', 'DELIVERED', 'BUYER_CONFIRMED', 'COMPLETED', 'DISPUTED', 'CANCELLED') DEFAULT 'ADVANCE_PENDING',
    pickup_address VARCHAR(255) NULL,
    pickup_district VARCHAR(100) NULL,
    pickup_lat FLOAT NULL,
    pickup_lng FLOAT NULL,
    delivery_address VARCHAR(255) NULL,
    delivery_district VARCHAR(100) NULL,
    delivery_lat FLOAT NULL,
    delivery_lng FLOAT NULL,
    warehouse_id INT NULL,
    carrier_name VARCHAR(100) NULL,
    tracking_number VARCHAR(100) NULL,
    delivery_confirmed_at DATETIME NULL,
    notes TEXT NULL,
    govt_audit_notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (crop_lot_id) REFERENCES crop_lots(id) ON DELETE SET NULL,
    FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE SET NULL,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payment_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payment_ref VARCHAR(50) NOT NULL UNIQUE,
    transaction_id INT NOT NULL,
    payer_id INT NOT NULL,
    payee_id INT NOT NULL,
    amount FLOAT NOT NULL,
    stage ENUM('ADVANCE', 'BALANCE', 'REFUND') NOT NULL,
    status ENUM('ADVANCE_PENDING', 'ADVANCE_PAID', 'BALANCE_PENDING', 'BALANCE_PAID', 'ESCROW_HELD', 'RELEASE_APPROVED', 'SETTLED', 'REFUNDED') DEFAULT 'ADVANCE_PENDING',
    escrow_status ENUM('HELD_BY_GOVT_ESCROW', 'RELEASED_TO_SELLER', 'REFUNDED_TO_BUYER', 'NOT_APPLICABLE') DEFAULT 'HELD_BY_GOVT_ESCROW',
    payment_method VARCHAR(50) DEFAULT 'UPI_SIMULATED',
    reference_number VARCHAR(100) NULL,
    govt_audit_notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    settled_at DATETIME NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (payer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (payee_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS grievances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    grievance_ref VARCHAR(50) NOT NULL UNIQUE,
    transaction_id INT NULL,
    complainant_id INT NOT NULL,
    respondent_id INT NULL,
    category ENUM('QUALITY_MISMATCH', 'QUANTITY_SHORTAGE', 'DELIVERY_DELAY', 'PAYMENT_ISSUE', 'STORAGE_DAMAGE', 'OTHER') DEFAULT 'QUALITY_MISMATCH',
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    evidence_photo_url VARCHAR(255) NULL,
    location_address VARCHAR(255) NULL,
    location_district VARCHAR(100) NULL,
    location_lat FLOAT NULL,
    location_lng FLOAT NULL,
    status ENUM('OPEN', 'UNDER_INVESTIGATION', 'RESOLVED', 'DISMISSED') DEFAULT 'OPEN',
    resolution_notes TEXT NULL,
    resolved_by_admin_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
    FOREIGN KEY (complainant_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (respondent_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (resolved_by_admin_id) REFERENCES users(id) ON DELETE SET NULL
);
