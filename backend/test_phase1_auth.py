import sys
import os

sys.path.insert(0, r"c:\Users\mrswa\OneDrive\Desktop\AgriSaathi2\AgriSaathi\backend")
from app import app
from models import db, User

client = app.test_client()

print("=" * 65)
print("  PHASE 1 AUTHENTICATION & FOUNDATION TEST SUITE")
print("=" * 65)

# 1. Health check
res = client.get("/api/health")
print(f"1. Health check: Status {res.status_code} | {res.get_json()}")
assert res.status_code == 200

# 2. Demo accounts list
res = client.get("/api/auth/demo-accounts")
data = res.get_json()
print(f"2. Demo accounts: Status {res.status_code} | {len(data.get('demo_accounts', []))} roles available")
assert len(data.get("demo_accounts", [])) == 5

# 3. Login as Farmer (Suresh Patil)
res = client.post("/api/auth/login", json={"identifier": "9823012345", "password": "password123"})
user_data = res.get_json().get("user", {})
print(f"3. Login Farmer (Suresh Patil): Status {res.status_code} | Name: {user_data.get('name')} | Role: {user_data.get('role')}")
assert res.status_code == 200 and user_data.get("role") == "FARMER"

# 4. Login as FPO (Sahyadri FPO)
res = client.post("/api/auth/login", json={"identifier": "9823099999", "password": "password123"})
user_data = res.get_json().get("user", {})
print(f"4. Login FPO (Sahyadri FPO): Status {res.status_code} | Name: {user_data.get('name')} | Role: {user_data.get('role')}")
assert res.status_code == 200 and user_data.get("role") == "FPO"

# 5. Login as Buyer (MahaFresh Foods)
res = client.post("/api/auth/login", json={"identifier": "9820011223", "password": "password123"})
user_data = res.get_json().get("user", {})
print(f"5. Login Buyer (MahaFresh): Status {res.status_code} | Name: {user_data.get('name')} | Role: {user_data.get('role')}")
assert res.status_code == 200 and user_data.get("role") == "BUYER"

# 6. Login as Warehouse (Nashik Agro)
res = client.post("/api/auth/login", json={"identifier": "9830022334", "password": "password123"})
user_data = res.get_json().get("user", {})
print(f"6. Login Warehouse (Nashik Agro): Status {res.status_code} | Name: {user_data.get('name')} | Role: {user_data.get('role')}")
assert res.status_code == 200 and user_data.get("role") == "WAREHOUSE"

# 7. Login as Admin (MahaAgri Officer)
res = client.post("/api/auth/login", json={"identifier": "9810000001", "password": "password123"})
user_data = res.get_json().get("user", {})
print(f"7. Login Admin (MahaAgri Admin): Status {res.status_code} | Name: {user_data.get('name')} | Role: {user_data.get('role')}")
assert res.status_code == 200 and user_data.get("role") == "ADMIN"

# 8. Register new Farmer test
test_phone = "9823099111"
existing = User.query.filter_by(phone=test_phone).first()
if existing:
    db.session.delete(existing)
    db.session.commit()

farmer_payload = {
    "full_name": "Test Ganpatrao Shinde",
    "phone": test_phone,
    "password": "password123",
    "confirm_password": "password123",
    "village": "Niphad",
    "taluka": "Niphad",
    "district": "Nashik",
    "farm_size_acres": 3.0,
    "main_crops": "Onion, Wheat"
}
res = client.post("/api/auth/register/farmer", json=farmer_payload)
print(f"8. Register new Farmer: Status {res.status_code} | {res.get_json().get('message')}")
assert res.status_code == 201

print("=" * 65)
print("  ALL PHASE 1 AUTHENTICATION TESTS PASSED SUCCESSFULLY!")
print("=" * 65)
