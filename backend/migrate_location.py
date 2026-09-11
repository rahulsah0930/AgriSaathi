import sqlite3

def run_migration():
    conn = sqlite3.connect('agrisaathi_dev.db')
    c = conn.cursor()
    c.execute('PRAGMA table_info(crop_lots)')
    cols = [r[1] for r in c.fetchall()]

    new_cols = [
        ('latitude', 'REAL'),
        ('longitude', 'REAL'),
        ('address', 'VARCHAR(255)'),
        ('village', 'VARCHAR(100)'),
        ('taluka', 'VARCHAR(100)'),
        ('pincode', 'VARCHAR(20)'),
        ('state', "VARCHAR(50) DEFAULT 'Maharashtra'")
    ]

    for col_name, col_type in new_cols:
        if col_name not in cols:
            c.execute(f'ALTER TABLE crop_lots ADD COLUMN {col_name} {col_type}')
            print(f'Added column {col_name}')

    # Seed coordinates for sample lots
    updates = [
        (1, 20.1983, 73.8344, 'Gat No. 142, Near APMC Sub-Yard', 'Dindori', 'Dindori', '422202'),
        (2, 20.1472, 74.2268, 'Survey No. 89, Vinchur Road', 'Lasalgaon', 'Niphad', '422306'),
        (3, 20.1706, 73.9856, 'Nashik Highway, Near Toll Plaza', 'Pimpalgaon Baswant', 'Niphad', '422209'),
        (4, 19.5768, 74.2091, 'Akole Bypass, Farm Plot 4B', 'Sangamner', 'Sangamner', '422605'),
        (6, 20.1706, 73.9856, 'Sahyadri FPO Packhouse Hub, Pimpalgaon', 'Pimpalgaon Baswant', 'Niphad', '422209'),
    ]

    for lot_id, lat, lng, addr, village, taluka, pin in updates:
        c.execute('''
            UPDATE crop_lots 
            SET latitude = ?, longitude = ?, address = ?, village = ?, taluka = ?, pincode = ?, state = 'Maharashtra'
            WHERE id = ?
        ''', (lat, lng, addr, village, taluka, pin, lot_id))

    conn.commit()
    print('[OK] crop_lots table updated with location columns and seeded coordinates')

if __name__ == '__main__':
    run_migration()
