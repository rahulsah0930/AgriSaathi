-- ====================================================================
-- AgriSaathi Database Schema (MySQL Compatible)
-- Developed for Smart India Hackathon Prototype (Maharashtra Gov Agri)
-- System 1: Farmer, FPO, Crop Lot, Market Intel, AI Recommendations, 
--           Buyer Offers (Farmer-side), Storage Discovery
-- Note: System 2 tables (Buyer, Warehouse, Orders, Payments, Admin)
--       are noted as external contracts to merge seamlessly.
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
-- 8. WAREHOUSES & STORAGE BOOKINGS (Shared Contract with System 2)
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
-- 9. NOTIFICATIONS (Shared Entity: Notification)
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
-- 10. EXTERNAL SYSTEM 2 PLACEHOLDER CONTRACTS
-- These tables are fully managed by System 2 during eventual merge.
-- buyer_profiles, buyer_requirements, orders, payments, complaints
-- --------------------------------------------------------------------
