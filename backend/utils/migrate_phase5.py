import os
import sqlite3

def run_phase5_migration(db_path=None):
    if not db_path:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        db_path = os.path.join(base_dir, 'agrisaathi_dev.db')
    
    if not os.path.exists(db_path):
        return

    con = sqlite3.connect(db_path)
    cur = con.cursor()

    # 1. Create logistics_profiles table if not exists
    cur.execute('''
        CREATE TABLE IF NOT EXISTS logistics_profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            company_name VARCHAR(150) NOT NULL,
            contact_person VARCHAR(120) NOT NULL,
            phone VARCHAR(20) NOT NULL,
            email VARCHAR(120),
            vehicle_types VARCHAR(255) DEFAULT 'MINI_TRUCK,PICKUP,LCV,TRUCK,REFRIGERATED_VEHICLE',
            vehicle_count INTEGER DEFAULT 5,
            service_districts VARCHAR(255) DEFAULT 'Nashik,Pune,Mumbai,Ahmednagar',
            availability_status VARCHAR(50) DEFAULT 'AVAILABLE',
            license_number_masked VARCHAR(100),
            aadhaar_masked VARCHAR(20),
            bank_name VARCHAR(100),
            bank_account_masked VARCHAR(30),
            ifsc_code_masked VARCHAR(20),
            account_holder_name VARCHAR(120),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    ''')

    # 2. Create transport_orders table if not exists
    cur.execute('''
        CREATE TABLE IF NOT EXISTS transport_orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_ref VARCHAR(50) NOT NULL UNIQUE,
            transaction_id INTEGER NOT NULL,
            commodity_id INTEGER,
            seller_id INTEGER NOT NULL,
            buyer_id INTEGER NOT NULL,
            pickup_address VARCHAR(255) NOT NULL,
            pickup_district VARCHAR(100),
            pickup_latitude FLOAT,
            pickup_longitude FLOAT,
            delivery_address VARCHAR(255) NOT NULL,
            delivery_district VARCHAR(100),
            delivery_latitude FLOAT,
            delivery_longitude FLOAT,
            crop_name VARCHAR(100) NOT NULL,
            quantity FLOAT NOT NULL,
            unit VARCHAR(20) DEFAULT 'KG',
            vehicle_type_required VARCHAR(50) DEFAULT 'PICKUP',
            refrigerated_recommended BOOLEAN DEFAULT 0,
            refrigeration_note VARCHAR(255),
            estimated_distance_km FLOAT,
            estimated_transport_cost FLOAT,
            cost_status VARCHAR(30) DEFAULT 'ESTIMATED',
            assigned_provider_id INTEGER,
            vehicle_number VARCHAR(50),
            vehicle_type VARCHAR(50),
            driver_name VARCHAR(100),
            driver_phone VARCHAR(20),
            requested_pickup_at DATETIME,
            scheduled_pickup_at DATETIME,
            picked_up_at DATETIME,
            in_transit_at DATETIME,
            delivered_at DATETIME,
            pod_image_url VARCHAR(255),
            pod_notes TEXT,
            pod_uploaded_at DATETIME,
            pod_uploaded_by INTEGER,
            status VARCHAR(50) NOT NULL DEFAULT 'REQUESTED',
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (transaction_id) REFERENCES transactions (id) ON DELETE CASCADE,
            FOREIGN KEY (commodity_id) REFERENCES commodities (id) ON DELETE SET NULL,
            FOREIGN KEY (seller_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (buyer_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (assigned_provider_id) REFERENCES users (id) ON DELETE SET NULL
        )
    ''')

    # 3. Create indices for performance
    cur.execute('CREATE INDEX IF NOT EXISTS idx_trans_order_txn_id ON transport_orders (transaction_id)')
    cur.execute('CREATE INDEX IF NOT EXISTS idx_trans_order_status ON transport_orders (status)')
    cur.execute('CREATE INDEX IF NOT EXISTS idx_trans_order_provider ON transport_orders (assigned_provider_id)')

    con.commit()
    con.close()
    print("[Migration] SQLite Phase 5 logistics schema migration completed successfully.")

if __name__ == '__main__':
    run_phase5_migration()
