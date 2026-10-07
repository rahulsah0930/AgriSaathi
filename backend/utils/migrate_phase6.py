import sqlite3
import os

def run_phase6_migration():
    """
    Applies SQLite schema migration for Phase 6:
    - Adds operator_user_id, latitude, longitude, verified_at, verified_by_admin_id, rejection_reason to warehouses
    - Adds booking_ref, commodity_id, storage_type, expected_end_date, actual_check_in_at, actual_check_out_at,
      approved_at, approved_by, rejection_reason, notes, updated_at to storage_bookings
    - Creates admin_audit_logs table if not exists
    """
    db_paths = [
        os.path.join(os.path.dirname(__file__), '..', 'agrisaathi_dev.db'),
        os.path.join(os.getcwd(), 'agrisaathi_dev.db'),
        'agrisaathi_dev.db'
    ]

    db_path = None
    for p in db_paths:
        if os.path.exists(p):
            db_path = os.path.abspath(p)
            break

    if not db_path:
        db_path = os.path.abspath(db_paths[0])

    try:
        con = sqlite3.connect(db_path)
        cur = con.cursor()

        # 1. Update warehouses table
        wh_cols = [c[1] for c in cur.execute("PRAGMA table_info(warehouses)").fetchall()]
        wh_new_cols = {
            'operator_user_id': 'INTEGER',
            'latitude': 'REAL',
            'longitude': 'REAL',
            'verified_at': 'TIMESTAMP',
            'verified_by_admin_id': 'INTEGER',
            'rejection_reason': 'TEXT'
        }
        for col, col_type in wh_new_cols.items():
            if col not in wh_cols:
                cur.execute(f"ALTER TABLE warehouses ADD COLUMN {col} {col_type}")

        # 2. Update storage_bookings table
        sb_cols = [c[1] for c in cur.execute("PRAGMA table_info(storage_bookings)").fetchall()]
        sb_new_cols = {
            'booking_ref': 'VARCHAR(50)',
            'commodity_id': 'INTEGER',
            'storage_type': 'VARCHAR(50) DEFAULT "COLD_STORAGE"',
            'expected_end_date': 'DATE',
            'actual_check_in_at': 'TIMESTAMP',
            'actual_check_out_at': 'TIMESTAMP',
            'approved_at': 'TIMESTAMP',
            'approved_by': 'INTEGER',
            'rejection_reason': 'TEXT',
            'notes': 'TEXT',
            'updated_at': 'TIMESTAMP'
        }
        for col, col_type in sb_new_cols.items():
            if col not in sb_cols:
                cur.execute(f"ALTER TABLE storage_bookings ADD COLUMN {col} {col_type}")

        # 3. Create admin_audit_logs table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS admin_audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                admin_id INTEGER,
                action VARCHAR(100) NOT NULL,
                target_type VARCHAR(50) NOT NULL,
                target_id INTEGER,
                details TEXT,
                reason TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
            )
        """)

        # 4. Associate seeded warehouse with warehouse user if operator_user_id is NULL
        wh_user = cur.execute("SELECT id FROM users WHERE phone='9830022334'").fetchone()
        if wh_user:
            wh_user_id = wh_user[0]
            cur.execute("UPDATE warehouses SET operator_user_id = ? WHERE operator_user_id IS NULL", (wh_user_id,))

        con.commit()
        con.close()
        print("[Migration] SQLite Phase 6 storage and admin schema migration completed successfully.")
        return True
    except Exception as e:
        print(f"[Migration Warning] Phase 6 migration: {e}")
        return False

if __name__ == '__main__':
    run_phase6_migration()
