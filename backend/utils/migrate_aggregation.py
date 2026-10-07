import os
import sqlite3

def run_aggregation_migration(db_path=None):
    if not db_path:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        db_path = os.path.join(base_dir, 'agrisaathi_dev.db')
    
    if not os.path.exists(db_path):
        print(f"[Migration] Database file not found at {db_path}, skipping alter table.")
        return

    con = sqlite3.connect(db_path)
    cur = con.cursor()

    # Columns to add to crop_lots
    cur.execute('PRAGMA table_info(crop_lots)')
    existing_cols = [c[1] for c in cur.fetchall()]

    new_crop_lot_cols = [
        ('target_quantity', 'REAL'),
        ('collection_start_at', 'DATETIME'),
        ('collection_deadline_at', 'DATETIME'),
        ('delivery_deadline_at', 'DATETIME'),
        ('collection_window_source', "TEXT DEFAULT 'MANUAL'"),
        ('aggregation_status', "TEXT DEFAULT 'OPEN'"),
        ('near_capacity_notified_at', 'DATETIME'),
        ('filled_notified_at', 'DATETIME'),
        ('deadline_notified_at', 'DATETIME'),
        ('deadline_extension_count', 'INTEGER DEFAULT 0'),
        ('commodity_id', 'INTEGER')
    ]

    for col_name, col_type in new_crop_lot_cols:
        if col_name not in existing_cols:
            print(f"[Migration] Adding {col_name} to crop_lots...")
            cur.execute(f"ALTER TABLE crop_lots ADD COLUMN {col_name} {col_type}")

    # Columns to add to fpo_lot_members
    cur.execute('PRAGMA table_info(fpo_lot_members)')
    existing_member_cols = [c[1] for c in cur.fetchall()]
    if 'farmer_id' not in existing_member_cols:
        print("[Migration] Adding farmer_id to fpo_lot_members...")
        cur.execute("ALTER TABLE fpo_lot_members ADD COLUMN farmer_id INTEGER")

    # Ensure notification_events table exists
    cur.execute('''
        CREATE TABLE IF NOT EXISTS notification_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_key VARCHAR(150) UNIQUE NOT NULL,
            recipient_user_id INTEGER,
            notification_id INTEGER,
            event_type VARCHAR(50) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (recipient_user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (notification_id) REFERENCES notifications (id) ON DELETE SET NULL
        )
    ''')
    cur.execute('CREATE INDEX IF NOT EXISTS idx_notif_events_key ON notification_events (event_key)')

    con.commit()
    con.close()
    print("[Migration] SQLite aggregation schema migration completed successfully.")

if __name__ == '__main__':
    run_aggregation_migration()
