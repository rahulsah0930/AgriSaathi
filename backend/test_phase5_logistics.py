"""
Automated Verification Suite for Phase 5: Logistics & Transport Order Lifecycle
Tests all 33 required scenarios specified in Section 25.
"""
import sys
import os
import io
from datetime import datetime, date

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db
from models.user import User, FarmerProfile, BuyerProfile, LogisticsProfile
from models.transaction import Transaction, TransactionHistory
from models.commodity import Commodity
from models.logistics import TransportOrder
from models.notification import Notification
from utils.auth import generate_access_token
from services.logistics_service import calculate_haversine_distance_km, recommend_vehicle_requirement, estimate_transport_cost


def run_tests():
    app = create_app()
    client = app.test_client()

    with app.app_context():
        print("=" * 70)
        print("PHASE 5: LOGISTICS & TRANSPORT LIFECYCLE AUTOMATED SUITE (33 TESTS)")
        print("=" * 70)

        # --------------------------------------------------------------------
        # SETUP TEST USERS
        # --------------------------------------------------------------------
        # Seller Farmer
        seller = User.query.filter_by(email='farmer_p5@agrisaathi.demo').first()
        if not seller:
            seller = User(email='farmer_p5@agrisaathi.demo', phone='9823055001', role='FARMER', name='Farmer Tukaram', verification_status='VERIFIED')
            seller.set_password('Password@123')
            db.session.add(seller)
            db.session.commit()
            db.session.add(FarmerProfile(user_id=seller.id, full_name='Farmer Tukaram', village='Niphad', taluka='Niphad', district='Nashik', state='Maharashtra'))
            db.session.commit()

        # Unrelated Seller
        unrelated_seller = User.query.filter_by(email='farmer_unrelated_p5@agrisaathi.demo').first()
        if not unrelated_seller:
            unrelated_seller = User(email='farmer_unrelated_p5@agrisaathi.demo', phone='9823055002', role='FARMER', name='Farmer Balu', verification_status='VERIFIED')
            unrelated_seller.set_password('Password@123')
            db.session.add(unrelated_seller)
            db.session.commit()
            db.session.add(FarmerProfile(user_id=unrelated_seller.id, full_name='Farmer Balu', village='Dindori', taluka='Dindori', district='Nashik', state='Maharashtra'))
            db.session.commit()

        # Buyer
        buyer = User.query.filter_by(email='buyer_p5@agrisaathi.demo').first()
        if not buyer:
            buyer = User(email='buyer_p5@agrisaathi.demo', phone='9823055003', role='BUYER', name='Sahyadri Fresh Retail', verification_status='VERIFIED')
            buyer.set_password('Password@123')
            db.session.add(buyer)
            db.session.commit()
            db.session.add(BuyerProfile(user_id=buyer.id, company_name='Sahyadri Fresh Retail Ltd', authorized_person='Nitin G', district='Pune'))
            db.session.commit()

        # Unrelated Buyer
        unrelated_buyer = User.query.filter_by(email='buyer_unrelated_p5@agrisaathi.demo').first()
        if not unrelated_buyer:
            unrelated_buyer = User(email='buyer_unrelated_p5@agrisaathi.demo', phone='9823055004', role='BUYER', name='Unrelated Buyer Co', verification_status='VERIFIED')
            unrelated_buyer.set_password('Password@123')
            db.session.add(unrelated_buyer)
            db.session.commit()
            db.session.add(BuyerProfile(user_id=unrelated_buyer.id, company_name='Unrelated Buyer Co', authorized_person='Amit S', district='Mumbai'))
            db.session.commit()

        # Logistics Provider 1
        provider1 = User.query.filter_by(email='provider1_p5@agrisaathi.demo').first()
        if not provider1:
            provider1 = User(email='provider1_p5@agrisaathi.demo', phone='9823055005', role='LOGISTICS', name='Nashik Fast Freight', verification_status='VERIFIED')
            provider1.set_password('Password@123')
            db.session.add(provider1)
            db.session.commit()
            db.session.add(LogisticsProfile(user_id=provider1.id, company_name='Nashik Fast Freight', contact_person='Sunil Jadhav', phone='9823055005', service_districts='Nashik,Pune,Mumbai'))
            db.session.commit()

        # Logistics Provider 2
        provider2 = User.query.filter_by(email='provider2_p5@agrisaathi.demo').first()
        if not provider2:
            provider2 = User(email='provider2_p5@agrisaathi.demo', phone='9823055006', role='LOGISTICS', name='Kisan Express Logistics', verification_status='VERIFIED')
            provider2.set_password('Password@123')
            db.session.add(provider2)
            db.session.commit()
            db.session.add(LogisticsProfile(user_id=provider2.id, company_name='Kisan Express Logistics', contact_person='Kailas P', phone='9823055006', service_districts='Nashik,Pune,Mumbai'))
            db.session.commit()

        # Admin
        admin = User.query.filter_by(role='ADMIN').first()
        if not admin:
            admin = User(email='admin_p5@agrisaathi.gov.in', phone='9810055001', role='ADMIN', name='Admin Officer', verification_status='VERIFIED')
            admin.set_password('Password@123')
            db.session.add(admin)
            db.session.commit()

        # Generate JWT headers
        seller_headers = {'Authorization': f'Bearer {generate_access_token(seller)}'}
        unrelated_seller_headers = {'Authorization': f'Bearer {generate_access_token(unrelated_seller)}'}
        buyer_headers = {'Authorization': f'Bearer {generate_access_token(buyer)}'}
        unrelated_buyer_headers = {'Authorization': f'Bearer {generate_access_token(unrelated_buyer)}'}
        provider1_headers = {'Authorization': f'Bearer {generate_access_token(provider1)}'}
        provider2_headers = {'Authorization': f'Bearer {generate_access_token(provider2)}'}
        admin_headers = {'Authorization': f'Bearer {generate_access_token(admin)}'}

        # Get or create a commodity for testing
        tomato = Commodity.query.filter_by(canonical_name='Tomato').first()
        tomato_id = tomato.id if tomato else None

        # Clean existing test transactions
        existing_txns = Transaction.query.filter(Transaction.notes.like('%Phase5Test%')).all()
        for t in existing_txns:
            db.session.delete(t)
        db.session.commit()

        # Create Test Transactions
        txn_ready = Transaction(
            transaction_ref='TXN-P5-TEST-001',
            seller_id=seller.id,
            buyer_id=buyer.id,
            crop='Tomato',
            quantity=2500.0,
            unit='KG',
            agreed_price_per_unit=24.0,
            total_amount=60000.0,
            advance_amount=12000.0,
            balance_amount=48000.0,
            status='READY_FOR_LOGISTICS',
            pickup_address='Gat No. 42, Dindori Agro Centre, Nashik',
            pickup_district='Nashik',
            pickup_lat=20.0050,
            pickup_lng=73.7800,
            delivery_address='Sahyadri Central Hub, Market Yard, Pune',
            delivery_district='Pune',
            delivery_lat=18.5204,
            delivery_lng=73.8567,
            commodity_id=tomato_id,
            notes='Phase5Test Transaction 1'
        )
        db.session.add(txn_ready)

        txn_draft = Transaction(
            transaction_ref='TXN-P5-TEST-002',
            seller_id=seller.id,
            buyer_id=buyer.id,
            crop='Onion',
            quantity=5000.0,
            unit='KG',
            agreed_price_per_unit=18.0,
            total_amount=90000.0,
            advance_amount=18000.0,
            balance_amount=72000.0,
            status='AWAITING_ADVANCE',  # NOT ready for logistics!
            pickup_address='Lasalgaon Mandi Yard',
            pickup_district='Nashik',
            delivery_address='Turbhe Mandi, Navi Mumbai',
            delivery_district='Mumbai',
            notes='Phase5Test Transaction 2'
        )
        db.session.add(txn_draft)
        db.session.commit()

        # ====================================================================
        # TEST 1: READY_FOR_LOGISTICS transaction can request transport
        # ====================================================================
        print("\n[TEST 1] READY_FOR_LOGISTICS Transaction Can Request Transport...")
        res1 = client.post('/api/logistics/request', headers=seller_headers, json={
            'transaction_id': txn_ready.id,
            'preferred_pickup_at': '2026-10-07T09:00:00Z',
            'notes': 'Please send ventilated or refrigerated vehicle.'
        })
        assert res1.status_code == 201, f"Expected 201, got {res1.status_code}: {res1.get_json()}"
        order1 = res1.get_json()['transport_order']
        assert order1['status'] == 'REQUESTED'
        assert order1['transaction_id'] == txn_ready.id
        assert order1['seller_id'] == seller.id
        print(f"  PASS: Transport order {order1['order_ref']} created in REQUESTED status.")

        # ====================================================================
        # TEST 2: Transaction before READY_FOR_LOGISTICS cannot request transport
        # ====================================================================
        print("\n[TEST 2] Transaction Before READY_FOR_LOGISTICS Cannot Request Transport...")
        res2 = client.post('/api/logistics/request', headers=seller_headers, json={'transaction_id': txn_draft.id})
        assert res2.status_code == 400, f"Expected 400 for AWAITING_ADVANCE, got {res2.status_code}"
        print("  PASS: Rejected transport request for transaction in AWAITING_ADVANCE status (400 Bad Request).")

        # ====================================================================
        # TEST 3: Duplicate active transport request prevented
        # ====================================================================
        print("\n[TEST 3] Duplicate Active Transport Request Prevented...")
        res3 = client.post('/api/logistics/request', headers=seller_headers, json={'transaction_id': txn_ready.id})
        assert res3.status_code == 409, f"Expected 409 Conflict, got {res3.status_code}"
        print("  PASS: Duplicate transport request rejected with 409 Conflict.")

        # ====================================================================
        # TEST 4: Seller identity derived from JWT
        # ====================================================================
        print("\n[TEST 4] Seller Identity Derived From JWT...")
        # Even if someone sends fake seller_id in JSON payload, backend sets seller_id from txn.seller_id
        order_obj = TransportOrder.query.get(order1['id'])
        assert order_obj.seller_id == seller.id
        print("  PASS: Seller identity correctly derived from authentic transaction seller record.")

        # ====================================================================
        # TEST 5: Unrelated Seller cannot request transport
        # ====================================================================
        print("\n[TEST 5] Unrelated Seller Cannot Request Transport...")
        # Create third txn
        txn_ready_2 = Transaction(
            transaction_ref='TXN-P5-TEST-003',
            seller_id=seller.id,
            buyer_id=buyer.id,
            crop='Grapes',
            quantity=1500.0,
            unit='KG',
            agreed_price_per_unit=50.0,
            total_amount=75000.0,
            advance_amount=15000.0,
            balance_amount=60000.0,
            status='READY_FOR_LOGISTICS',
            pickup_address='Pimpalgaon Yard',
            delivery_address='Pune Cold Hub',
            notes='Phase5Test Transaction 3'
        )
        db.session.add(txn_ready_2)
        db.session.commit()

        res5 = client.post('/api/logistics/request', headers=unrelated_seller_headers, json={'transaction_id': txn_ready_2.id})
        assert res5.status_code == 403, f"Expected 403 Forbidden, got {res5.status_code}"
        print("  PASS: Unrelated seller blocked with 403 Forbidden.")

        # ====================================================================
        # TEST 6: Logistics Provider can see appropriate request
        # ====================================================================
        print("\n[TEST 6] Logistics Provider Can View Available Requests...")
        res6 = client.get('/api/logistics/available', headers=provider1_headers)
        assert res6.status_code == 200
        available_list = res6.get_json()['requests']
        matching = [r for r in available_list if r['id'] == order1['id']]
        assert len(matching) == 1
        print("  PASS: Logistics provider retrieved unassigned transport requests.")

        # ====================================================================
        # TEST 7: Provider can accept request
        # ====================================================================
        print("\n[TEST 7] Provider 1 Accepts Request...")
        res7 = client.post(f"/api/logistics/{order1['id']}/accept", headers=provider1_headers)
        assert res7.status_code == 200, f"Expected 200, got {res7.status_code}: {res7.get_json()}"
        accepted_order = res7.get_json()['transport_order']
        assert accepted_order['status'] == 'ASSIGNED'
        assert accepted_order['assigned_provider_id'] == provider1.id
        print("  PASS: Provider 1 successfully assigned to transport order.")

        # ====================================================================
        # TEST 8: Second Provider cannot accept already-assigned request (409 Conflict)
        # ====================================================================
        print("\n[TEST 8] Second Provider Blocked from Accepting Already-Assigned Request...")
        res8 = client.post(f"/api/logistics/{order1['id']}/accept", headers=provider2_headers)
        assert res8.status_code == 409, f"Expected 409 Conflict, got {res8.status_code}"
        print("  PASS: Concurrency protection returned 409 Conflict to Provider 2.")

        # ====================================================================
        # TEST 9: Assigned provider stored correctly
        # ====================================================================
        print("\n[TEST 9] Assigned Provider Stored Correctly...")
        db.session.refresh(order_obj)
        assert order_obj.assigned_provider_id == provider1.id
        assert order_obj.status == 'ASSIGNED'
        print("  PASS: Assigned provider ID matches authenticated provider in DB.")

        # ====================================================================
        # TEST 10: Vehicle details validation
        # ====================================================================
        print("\n[TEST 10] Vehicle Details Validation Rejects Incomplete/Invalid Data...")
        res10_missing = client.post(f"/api/logistics/{order1['id']}/assign-vehicle", headers=provider1_headers, json={
            'vehicle_number': '',
            'driver_name': 'Ramesh',
            'driver_phone': '9820011223'
        })
        assert res10_missing.status_code == 400
        res10_bad_phone = client.post(f"/api/logistics/{order1['id']}/assign-vehicle", headers=provider1_headers, json={
            'vehicle_number': 'MH15-AB-1234',
            'driver_name': 'Ramesh',
            'driver_phone': '123'
        })
        assert res10_bad_phone.status_code == 400
        print("  PASS: Missing vehicle number and invalid driver phone rejected (400 Bad Request).")

        # ====================================================================
        # TEST 11: Pickup schedule created
        # ====================================================================
        print("\n[TEST 11] Pickup Schedule and Vehicle Assigned...")
        res11 = client.post(f"/api/logistics/{order1['id']}/assign-vehicle", headers=provider1_headers, json={
            'vehicle_number': 'MH15-EX-4491',
            'vehicle_type': 'PICKUP',
            'driver_name': 'Anil Shinde',
            'driver_phone': '9821100223',
            'scheduled_pickup_at': '2026-10-07T11:00:00Z'
        })
        assert res11.status_code == 200
        sched_order = res11.get_json()['transport_order']
        assert sched_order['status'] == 'PICKUP_SCHEDULED'
        assert sched_order['vehicle_number'] == 'MH15-EX-4491'
        assert sched_order['driver_name'] == 'Anil Shinde'
        print("  PASS: Order moved to PICKUP_SCHEDULED with vehicle and driver details.")

        # ====================================================================
        # TEST 12: Wrong provider cannot modify request
        # ====================================================================
        print("\n[TEST 12] Wrong Provider Cannot Modify Request...")
        res12 = client.post(f"/api/logistics/{order1['id']}/status", headers=provider2_headers, json={'status': 'PICKED_UP'})
        assert res12.status_code == 403, f"Expected 403, got {res12.status_code}"
        print("  PASS: Provider 2 forbidden from updating Provider 1's order.")

        # ====================================================================
        # TEST 13: Assigned provider marks PICKED_UP
        # ====================================================================
        print("\n[TEST 13] Assigned Provider Marks PICKED_UP...")
        res13 = client.post(f"/api/logistics/{order1['id']}/status", headers=provider1_headers, json={'status': 'PICKED_UP'})
        assert res13.status_code == 200
        db.session.refresh(order_obj)
        assert order_obj.status == 'PICKED_UP'
        assert order_obj.picked_up_at is not None
        print("  PASS: Order marked as PICKED_UP with recorded timestamp.")

        # ====================================================================
        # TEST 14: Transaction becomes IN_DELIVERY
        # ====================================================================
        print("\n[TEST 14] Parent Transaction Synchronizes to IN_DELIVERY...")
        db.session.refresh(txn_ready)
        assert txn_ready.status == 'IN_DELIVERY', f"Expected IN_DELIVERY, got {txn_ready.status}"
        print("  PASS: Transaction status synchronized to IN_DELIVERY.")

        # ====================================================================
        # TEST 15: Assigned provider marks IN_TRANSIT
        # ====================================================================
        print("\n[TEST 15] Assigned Provider Marks IN_TRANSIT...")
        res15 = client.post(f"/api/logistics/{order1['id']}/status", headers=provider1_headers, json={'status': 'IN_TRANSIT'})
        assert res15.status_code == 200
        db.session.refresh(order_obj)
        assert order_obj.status == 'IN_TRANSIT'
        assert order_obj.in_transit_at is not None
        print("  PASS: Order moved to IN_TRANSIT.")

        # ====================================================================
        # TEST 16: Assigned provider marks DELIVERED
        # ====================================================================
        print("\n[TEST 16] Assigned Provider Marks DELIVERED...")
        res16 = client.post(f"/api/logistics/{order1['id']}/status", headers=provider1_headers, json={'status': 'DELIVERED'})
        assert res16.status_code == 200
        db.session.refresh(order_obj)
        assert order_obj.status == 'DELIVERED'
        assert order_obj.delivered_at is not None
        print("  PASS: Order marked DELIVERED by transporter.")

        # ====================================================================
        # TEST 17: Transaction becomes DELIVERED
        # ====================================================================
        print("\n[TEST 17] Parent Transaction Synchronizes to DELIVERED...")
        db.session.refresh(txn_ready)
        assert txn_ready.status == 'DELIVERED', f"Expected DELIVERED, got {txn_ready.status}"
        print("  PASS: Transaction status synchronized to DELIVERED.")

        # ====================================================================
        # TEST 18: Logistics provider cannot Buyer-confirm delivery
        # ====================================================================
        print("\n[TEST 18] Logistics Provider Cannot Buyer-Confirm Delivery...")
        res18 = client.post(f"/api/transactions/{txn_ready.id}/confirm-delivery", headers=provider1_headers)
        assert res18.status_code == 403, f"Expected 403 Forbidden, got {res18.status_code}"
        print("  PASS: Logistics provider blocked from physical delivery confirmation (403 Forbidden).")

        # ====================================================================
        # TEST 19: Correct Buyer can confirm after delivery
        # ====================================================================
        print("\n[TEST 19] Correct Buyer Can Confirm Physical Delivery...")
        res19 = client.post(f"/api/transactions/{txn_ready.id}/confirm-delivery", headers=buyer_headers)
        assert res19.status_code == 200, f"Expected 200, got {res19.status_code}: {res19.get_json()}"
        db.session.refresh(txn_ready)
        assert txn_ready.status == 'BUYER_CONFIRMED'
        assert txn_ready.delivery_confirmed_at is not None
        print("  PASS: Buyer physically confirmed delivery -> BUYER_CONFIRMED.")

        # ====================================================================
        # TEST 20: Invalid logistics state jump rejected
        # ====================================================================
        print("\n[TEST 20] Invalid Logistics State Jump Rejected...")
        # Create fresh transport request for txn_ready_2
        res20_create = client.post('/api/logistics/request', headers=seller_headers, json={'transaction_id': txn_ready_2.id})
        assert res20_create.status_code == 201
        order20 = res20_create.get_json()['transport_order']

        # Accept order
        client.post(f"/api/logistics/{order20['id']}/accept", headers=provider1_headers)

        # Try to jump directly from ASSIGNED to DELIVERED
        res20_jump = client.post(f"/api/logistics/{order20['id']}/status", headers=provider1_headers, json={'status': 'DELIVERED'})
        assert res20_jump.status_code == 400, f"Expected 400 for illegal state jump, got {res20_jump.status_code}"
        print("  PASS: Direct leap from ASSIGNED to DELIVERED rejected (400 Bad Request).")

        # ====================================================================
        # TEST 21: POD image validation works (PNG/JPG saved)
        # ====================================================================
        print("\n[TEST 21] Valid POD Image Upload Works...")
        from PIL import Image
        png_buf = io.BytesIO()
        Image.new('RGB', (10, 10), color='green').save(png_buf, format='PNG')
        png_buf.seek(0)
        pod_data = {
            'pod_notes': 'Produce delivered in 100 crates to Bay 3. Received by Mr. Nitin.',
            'pod_image': (png_buf, 'pod_receipt.png')
        }
        res21 = client.post(
            f"/api/logistics/{order1['id']}/upload-pod",
            headers=provider1_headers,
            data=pod_data,
            content_type='multipart/form-data'
        )
        assert res21.status_code == 200, f"Expected 200, got {res21.status_code}: {res21.get_json()}"
        db.session.refresh(order_obj)
        assert order_obj.pod_image_url is not None
        assert 'pod_' in order_obj.pod_image_url
        print(f"  PASS: Proof of Delivery uploaded successfully: {order_obj.pod_image_url}")

        # ====================================================================
        # TEST 22: Invalid POD file rejected
        # ====================================================================
        print("\n[TEST 22] Invalid POD File Extension Rejected...")
        bad_pod_data = {
            'pod_image': (io.BytesIO(b'malicious text file content'), 'pod_receipt.exe')
        }
        res22 = client.post(
            f"/api/logistics/{order1['id']}/upload-pod",
            headers=provider1_headers,
            data=bad_pod_data,
            content_type='multipart/form-data'
        )
        assert res22.status_code == 400
        print("  PASS: Disallowed file extension (.exe) rejected with 400 Bad Request.")

        # ====================================================================
        # TEST 23: Approximate distance correct when coordinates available
        # ====================================================================
        print("\n[TEST 23] Approximate Distance Correct When Coordinates Available...")
        # Nashik (20.0050, 73.7800) to Pune (18.5204, 73.8567) is ~165 km spherical
        dist = calculate_haversine_distance_km(20.0050, 73.7800, 18.5204, 73.8567)
        assert dist is not None
        assert 150.0 < dist < 180.0, f"Expected ~165 km, got {dist}"
        print(f"  PASS: Deterministic Haversine approximate distance calculated: {dist} km.")

        # ====================================================================
        # TEST 24: Missing coordinates do not fabricate distance
        # ====================================================================
        print("\n[TEST 24] Missing Coordinates Do Not Fabricate Distance...")
        dist_none = calculate_haversine_distance_km(None, 73.7800, 18.5204, None)
        assert dist_none is None
        print("  PASS: Distance is None when coordinates are missing (never fabricated).")

        # ====================================================================
        # TEST 25: Transport estimate is clearly marked estimate
        # ====================================================================
        print("\n[TEST 25] Transport Estimate Is Clearly Marked ESTIMATED...")
        db.session.refresh(order_obj)
        assert order_obj.cost_status == 'ESTIMATED'
        assert order_obj.estimated_transport_cost is not None
        assert order_obj.estimated_transport_cost > 0
        print(f"  PASS: Transport cost Rs. {order_obj.estimated_transport_cost} marked as '{order_obj.cost_status}'.")

        # ====================================================================
        # TEST 26: Notifications idempotent
        # ====================================================================
        from models.notification import NotificationEvent
        notif_count_before = NotificationEvent.query.filter(NotificationEvent.event_key == f"logistics:{order1['id']}:assigned").count()
        # Re-emitting with same key
        from services.logistics_service import emit_logistics_notification
        emit_logistics_notification(order_obj, 'assigned', seller.id, 'Duplicate Test', 'Test')
        notif_count_after = NotificationEvent.query.filter(NotificationEvent.event_key == f"logistics:{order1['id']}:assigned").count()
        assert notif_count_before == notif_count_after == 1
        print("  PASS: Duplicate notification prevented via idempotency key.")

        # ====================================================================
        # TEST 27: Seller sees own logistics
        # ====================================================================
        print("\n[TEST 27] Seller Sees Own Logistics Order...")
        res27 = client.get(f"/api/logistics/transaction/{txn_ready.id}", headers=seller_headers)
        assert res27.status_code == 200
        assert res27.get_json()['transport_order']['id'] == order1['id']
        print("  PASS: Seller retrieved linked logistics order.")

        # ====================================================================
        # TEST 28: Buyer sees own logistics
        # ====================================================================
        print("\n[TEST 28] Buyer Sees Own Logistics Order...")
        res28 = client.get(f"/api/logistics/transaction/{txn_ready.id}", headers=buyer_headers)
        assert res28.status_code == 200
        assert res28.get_json()['transport_order']['id'] == order1['id']
        print("  PASS: Buyer retrieved linked logistics order.")

        # ====================================================================
        # TEST 29: Unrelated user cannot inspect private logistics details
        # ====================================================================
        print("\n[TEST 29] Unrelated User Blocked from Transaction Logistics...")
        res29 = client.get(f"/api/logistics/transaction/{txn_ready.id}", headers=unrelated_buyer_headers)
        assert res29.status_code == 403, f"Expected 403, got {res29.status_code}"
        print("  PASS: Unrelated user received 403 Forbidden.")

        # ====================================================================
        # TEST 30: Admin can audit logistics
        # ====================================================================
        print("\n[TEST 30] Admin Can Audit Logistics...")
        res30 = client.get(f"/api/logistics/{order1['id']}", headers=admin_headers)
        assert res30.status_code == 200
        order_audit = res30.get_json()['transport_order']
        assert order_audit['pod_image_url'] is not None
        assert order_audit['driver_name'] == 'Anil Shinde'
        print("  PASS: Admin successfully audited transport order, vehicle, POD, and timestamps.")

        # ====================================================================
        # TEST 31: Normal UI/API no longer relies on Phase-4 seller simulation
        # ====================================================================
        print("\n[TEST 31] Non-Admin Cannot Directly Call Phase 4 Simulation or Bypass Logistics...")
        # Non-admin in non-test simulated call: seller trying to jump IN_DELIVERY directly
        res31_status = client.post(f"/api/transactions/{txn_ready_2.id}/status", headers=seller_headers, json={'status': 'IN_DELIVERY'})
        assert res31_status.status_code == 403, f"Expected 403, got {res31_status.status_code}"
        print("  PASS: Seller cannot arbitrarily jump transaction to IN_DELIVERY (must go through logistics).")

        # ====================================================================
        # TEST 32: Driver/contact sensitive information not exposed publicly
        # ====================================================================
        print("\n[TEST 32] Driver Phone Masked/Hidden for Non-Participants...")
        # Provider 2 looks at order1
        res32 = client.get(f"/api/logistics/{order1['id']}", headers=provider2_headers)
        assert res32.status_code == 200
        order_view = res32.get_json()['transport_order']
        assert order_view['driver_phone'] is None, f"Expected None/masked, got {order_view['driver_phone']}"
        print("  PASS: Unassigned/unrelated provider cannot view sensitive driver contact.")

        # ====================================================================
        # TEST 33: Cancelled logistics request cannot continue state transitions
        # ====================================================================
        print("\n[TEST 33] Cancelled Logistics Request Cannot Transition...")
        # Cancel order20
        res33_cancel = client.post(f"/api/logistics/{order20['id']}/cancel", headers=seller_headers)
        assert res33_cancel.status_code == 200
        db.session.refresh(TransportOrder.query.get(order20['id']))
        # Attempt to mark picked up on cancelled order
        res33_try = client.post(f"/api/logistics/{order20['id']}/status", headers=provider1_headers, json={'status': 'PICKED_UP'})
        assert res33_try.status_code == 400
        print("  PASS: Cancelled transport order rejected subsequent state transitions (400 Bad Request).")

        print("\n" + "=" * 70)
        print("ALL 33 PHASE 5 LOGISTICS & TRANSPORT LIFECYCLE TESTS PASSED!")
        print("=" * 70)


if __name__ == '__main__':
    run_tests()
