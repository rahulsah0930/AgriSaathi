import os
import sqlite3

def run_phase4_migration(db_path=None):
    if not db_path:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        db_path = os.path.join(base_dir, 'agrisaathi_dev.db')
    
    if not os.path.exists(db_path):
        return

    con = sqlite3.connect(db_path)
    cur = con.cursor()

    # Columns to add to transactions
    cur.execute('PRAGMA table_info(transactions)')
    existing_txn_cols = [c[1] for c in cur.fetchall()]

    new_txn_cols = [
        ('commodity_id', 'INTEGER'),
        ('dispute_id', 'INTEGER'),
        ('settled_at', 'DATETIME'),
        ('completed_at', 'DATETIME'),
        ('cancelled_at', 'DATETIME')
    ]

    for col_name, col_type in new_txn_cols:
        if col_name not in existing_txn_cols:
            print(f"[Migration] Adding {col_name} to transactions...")
            cur.execute(f"ALTER TABLE transactions ADD COLUMN {col_name} {col_type}")

    # Columns to add to payment_records
    cur.execute('PRAGMA table_info(payment_records)')
    existing_pay_cols = [c[1] for c in cur.fetchall()]

    new_pay_cols = [
        ('updated_at', 'DATETIME')
    ]

    for col_name, col_type in new_pay_cols:
        if col_name not in existing_pay_cols:
            print(f"[Migration] Adding {col_name} to payment_records...")
            cur.execute(f"ALTER TABLE payment_records ADD COLUMN {col_name} {col_type}")

    # Ensure transaction_history table exists
    cur.execute('''
        CREATE TABLE IF NOT EXISTS transaction_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            transaction_id INTEGER NOT NULL,
            event VARCHAR(100) NOT NULL,
            actor_id INTEGER,
            actor_role VARCHAR(50),
            previous_state VARCHAR(50),
            new_state VARCHAR(50),
            details TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (transaction_id) REFERENCES transactions (id) ON DELETE CASCADE,
            FOREIGN KEY (actor_id) REFERENCES users (id) ON DELETE SET NULL
        )
    ''')
    cur.execute('CREATE INDEX IF NOT EXISTS idx_txn_hist_txn_id ON transaction_history (transaction_id)')

    con.commit()
    con.close()
    print("[Migration] SQLite Phase 4 transaction schema migration completed successfully.")

if __name__ == '__main__':
    run_phase4_migration()
