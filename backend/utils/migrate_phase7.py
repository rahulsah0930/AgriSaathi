import sqlite3
import os

def run_phase7_migration():
    """
    Applies SQLite schema migration for Phase 7 (Intelligence & Provenance Layer):
    - Adds commodity_id, source_name to market_prices
    - Adds image_validation_status, buyer_review_status, buyer_review_notes, buyer_reviewed_by, buyer_reviewed_at to quality_reports
    """
    db_paths = [
        os.path.join(os.path.dirname(__file__), '..', 'agrisaathi_dev.db'),
        os.path.join(os.getcwd(), 'agrisaathi_dev.db'),
        os.path.join(os.getcwd(), 'backend', 'agrisaathi_dev.db'),
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

        # 1. Update market_prices table
        mp_cols = [c[1] for c in cur.execute("PRAGMA table_info(market_prices)").fetchall()]
        mp_new_cols = {
            'commodity_id': 'INTEGER',
            'source_name': "VARCHAR(150) DEFAULT 'Maharashtra APMC Bulletin (Historical)'"
        }
        for col, col_def in mp_new_cols.items():
            if col not in mp_cols:
                cur.execute(f"ALTER TABLE market_prices ADD COLUMN {col} {col_def}")

        # 2. Update quality_reports table
        qr_cols = [c[1] for c in cur.execute("PRAGMA table_info(quality_reports)").fetchall()]
        qr_new_cols = {
            'image_validation_status': "VARCHAR(50) DEFAULT 'PASSED'",
            'buyer_review_status': 'VARCHAR(50)',
            'buyer_review_notes': 'TEXT',
            'buyer_reviewed_by': 'VARCHAR(150)',
            'buyer_reviewed_at': 'TIMESTAMP'
        }
        for col, col_def in qr_new_cols.items():
            if col not in qr_cols:
                cur.execute(f"ALTER TABLE quality_reports ADD COLUMN {col} {col_def}")

        con.commit()
        con.close()
        print("[Migration] SQLite Phase 7 intelligence and provenance schema migration completed successfully.")
        return True
    except Exception as e:
        print(f"[Migration Warning] Phase 7 migration: {e}")
        return False

if __name__ == '__main__':
    run_phase7_migration()
