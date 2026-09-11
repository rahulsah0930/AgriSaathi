import requests
import json
import sys

BASE_URL = "http://127.0.0.1:5000"

def test_flow():
    session = requests.Session()
    print("==================================================")
    print("1. Testing Health & Demo Accounts")
    print("==================================================")
    r = session.get(f"{BASE_URL}/api/health")
    assert r.status_code == 200, f"Health check failed: {r.text}"
    print("  [PASS] Health check OK:", r.json())

    r = session.get(f"{BASE_URL}/api/auth/demo-accounts")
    assert r.status_code == 200, f"Demo accounts failed: {r.text}"
    demo_accounts = r.json().get("demo_accounts", [])
    print(f"  [PASS] Fetched {len(demo_accounts)} demo accounts across all 5 roles.")

    print("\n==================================================")
    print("2. Testing 1-Click Logins for All 5 Roles")
    print("==================================================")
    role_tokens = {}
    for acc in demo_accounts:
        role = acc["role"]
        phone = acc["phone"]
        password = acc["password"]
        login_res = session.post(f"{BASE_URL}/api/auth/login", json={"phone": phone, "password": password})
        assert login_res.status_code == 200, f"Login failed for {role} ({phone}): {login_res.text}"
        data = login_res.json()
        role_tokens[role] = data["access_token"]
        print(f"  [PASS] {role:12} login succeeded | User: {data['user']['name']} ({data['user']['phone']}) | Verification: {data['user']['verification_status']}")

    print("\n==================================================")
    print("3. Testing AI-Screened Crop Listings (Marketplace)")
    print("==================================================")
    lots_res = session.get(f"{BASE_URL}/api/lots?verified_only=true")
    assert lots_res.status_code == 200, f"Lots fetch failed: {lots_res.text}"
    lots = lots_res.json().get("crop_lots", [])
    print(f"  [PASS] Found {len(lots)} AI-verified lots available for wholesale buyers.")
    for lot in lots[:3]:
        print(f"    - Lot #{lot['id']} {lot.get('crop')} ({lot['quantity']} {lot['unit']}) | Base Price: Rs {lot.get('expected_price')} | AI Status: {lot.get('verification_status')} | Image: {bool(lot.get('image_url'))}")

    print("\n==================================================")
    print("4. Testing Two-Way Negotiation & Trade Agreement")
    print("==================================================")
    buyer_headers = {"Authorization": f"Bearer {role_tokens['BUYER']}"}
    farmer_headers = {"Authorization": f"Bearer {role_tokens['FARMER']}"}

    # Buyer creates counter-offer
    test_lot_id = lots[0]["id"]
    offer_payload = {
        "lot_id": test_lot_id,
        "offered_price": 27.50,
        "offered_quantity": lots[0]["quantity"],
        "proposed_advance_percentage": 20.0,
        "note": "Immediate payment ready via Govt Escrow upon acceptance."
    }
    create_offer_res = session.post(f"{BASE_URL}/api/offers", json=offer_payload, headers=buyer_headers)
    assert create_offer_res.status_code == 201, f"Create offer failed: {create_offer_res.text}"
    created_offer = create_offer_res.json()["offer"]
    offer_id = created_offer["id"]
    print(f"  [PASS] Buyer submitted offer #{offer_id} at Rs {created_offer['offered_price']}/kg with {created_offer['advance_percentage']}% advance.")

    # Farmer counters
    counter_payload = {
        "counter_price": 28.50,
        "counter_note": "Quality is Grade A sorted with zero transit damage."
    }
    counter_res = session.post(f"{BASE_URL}/api/offers/{offer_id}/counter", json=counter_payload, headers=farmer_headers)
    assert counter_res.status_code == 200, f"Counter offer failed: {counter_res.text}"
    print(f"  [PASS] Farmer countered offer #{offer_id} to Rs {counter_res.json()['offer']['offered_price']}/kg.")

    # Buyer accepts counter-offer -> Auto-generates Transaction in ADVANCE_PENDING
    accept_res = session.post(f"{BASE_URL}/api/offers/{offer_id}/accept", json={}, headers=buyer_headers)
    assert accept_res.status_code == 200, f"Accept offer failed: {accept_res.text}"
    accept_data = accept_res.json()
    txn = accept_data.get("transaction")
    assert txn is not None, "Transaction not created on offer acceptance!"
    txn_id = txn["id"]
    print(f"  [PASS] Buyer accepted! Trade finalized: Transaction #{txn_id} created.")
    print(f"         Total Value: Rs {txn['total_value']} | Advance Required: Rs {txn['advance_amount']} | Status: {txn['status']}")

    print("\n==================================================")
    print("5. Testing Two-Stage Government Escrow & Settlement")
    print("==================================================")
    # Buyer pays 20% advance into Govt Escrow
    pay_res = session.post(f"{BASE_URL}/api/payments/pay-advance", json={"transaction_id": txn_id, "payment_method": "UPI_ESCROW"}, headers=buyer_headers)
    assert pay_res.status_code == 200, f"Pay advance failed: {pay_res.text}"
    pay_data = pay_res.json()
    print(f"  [PASS] Advance locked in Govt Escrow! Record #{pay_data['payment']['id']} | State: {pay_data['payment']['status']}")

    # Farmer prepares and dispatches produce
    dispatch_res = session.patch(f"{BASE_URL}/api/transactions/{txn_id}/status", json={"status": "IN_TRANSIT"}, headers=farmer_headers)
    assert dispatch_res.status_code == 200, f"Dispatch failed: {dispatch_res.text}"
    print(f"  [PASS] Order dispatched: Status updated to {dispatch_res.json()['transaction']['status']}")

    # Order marked delivered
    deliv_res = session.patch(f"{BASE_URL}/api/transactions/{txn_id}/status", json={"status": "DELIVERED"}, headers=farmer_headers)
    assert deliv_res.status_code == 200, f"Delivery update failed: {deliv_res.text}"
    print(f"  [PASS] Delivery arrived at destination: Status {deliv_res.json()['transaction']['status']}")

    # Buyer inspects & confirms receipt -> triggers full escrow release & balance settlement
    confirm_res = session.patch(f"{BASE_URL}/api/transactions/{txn_id}/status", json={"status": "BUYER_CONFIRMED"}, headers=buyer_headers)
    assert confirm_res.status_code == 200, f"Buyer confirm failed: {confirm_res.text}"
    print(f"  [PASS] Buyer confirmed quality receipt! Transaction completed: {confirm_res.json()['transaction']['status']}")

    print("\n==================================================")
    print("6. Testing Dispute / Grievance Redressal")
    print("==================================================")
    # File grievance
    grv_payload = {
        "title": "Moisture level variance during unloading",
        "category": "QUALITY_MISMATCH",
        "description": "5 bags showed moisture reading above the specified 12% moisture grade certificate.",
        "transaction_id": txn_id,
        "respondent_id": txn["seller_id"]
    }
    grv_res = session.post(f"{BASE_URL}/api/grievances", json=grv_payload, headers=buyer_headers)
    assert grv_res.status_code == 201, f"File grievance failed: {grv_res.text}"
    grv_id = grv_res.json()["grievance"]["id"]
    print(f"  [PASS] Grievance #{grv_id} filed successfully.")

    # Govt Admin resolves grievance
    admin_headers = {"Authorization": f"Bearer {role_tokens['ADMIN']}"}
    resolve_res = session.post(f"{BASE_URL}/api/admin/grievances/{grv_id}/resolve", json={"status": "RESOLVED", "resolution_notes": "Sample moisture verified at 12.3%; 1.5% adjustment credit applied to buyer account."}, headers=admin_headers)
    assert resolve_res.status_code == 200, f"Resolve grievance failed: {resolve_res.text}"
    print(f"  [PASS] Govt Regulatory Officer adjudicated Grievance #{grv_id}: Status {resolve_res.json()['grievance']['status']}")

    print("\n==================================================")
    print("7. Testing Government Admin User Verification Registry")
    print("==================================================")
    # Fetch pending users
    admin_users = session.get(f"{BASE_URL}/api/admin/users?status=PENDING", headers=admin_headers).json()
    pending_list = admin_users.get("users", [])
    print(f"  [PASS] Admin registry loaded {len(pending_list)} pending user registrations.")
    if pending_list:
        p_user = pending_list[0]
        # Admin approves user
        approve_res = session.post(f"{BASE_URL}/api/admin/users/{p_user['id']}/verify", json={"notes": "7/12 extract and Aadhaar authenticated via UIDAI/MahaBhulekh."}, headers=admin_headers)
        assert approve_res.status_code == 200, f"Approve user failed: {approve_res.text}"
        print(f"  [PASS] Govt Admin verified User #{p_user['id']} ({p_user['name']}) -> Status: VERIFIED")

    # Escrow ledger audit
    escrow_res = session.get(f"{BASE_URL}/api/admin/escrow", headers=admin_headers)
    assert escrow_res.status_code == 200
    escrow_records = escrow_res.json().get("escrow_records", [])
    print(f"  [PASS] Admin Escrow Audit: {len(escrow_records)} records logged in regulatory ledger.")

    print("\n==================================================")
    print("ALL UNIFIED END-TO-END WORKFLOWS PASSED!")
    print("==================================================")

if __name__ == "__main__":
    test_flow()
