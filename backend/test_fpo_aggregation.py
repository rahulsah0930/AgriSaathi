"""
Automated Verification Suite for FPO Aggregation Enhancement
Tests all 12 required scenarios from the prompt.
"""
import sys
import os
from datetime import datetime, timedelta

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db
from models.lot import CropLot, FPOLotMember
from models.user import User
from models.notification import Notification

def run_tests():
    app = create_app()
    client = app.test_client()

    with app.app_context():
        print("=" * 60)
        print("RUNNING FPO AGGREGATION & INVENTORY TEST SUITE")
        print("=" * 60)

        # Ensure demo user exists
        fpo_user = User.query.filter_by(role='FPO').first()
        if not fpo_user:
            fpo_user = User(
                email='testfpo@agrisaathi.gov.in',
                phone='9823000001',
                role='FPO',
                name='Sahyadri Farmers Producer Co. Ltd.',
                verification_status='VERIFIED'
            )
            fpo_user.set_password('Password@123')
            db.session.add(fpo_user)
            db.session.commit()

        fpo_id = fpo_user.id

        # -----------------------------------------------------------
        # TEST 1: Manual window
        # FPO creates Tomato, Target = 2000 kg, Duration = 10 hours
        # -----------------------------------------------------------
        print("\n[TEST 1] Manual Window Creation (Tomato, Target=2000kg, Duration=10h)...")
        res1 = client.post('/api/fpo/lots', json={
            'seller_id': fpo_id,
            'crop': 'Tomato',
            'variety': 'Hybrid Vaishali',
            'target_quantity': 2000.0,
            'unit': 'kg',
            'duration_hours': 10.0,
            'collection_window_source': 'MANUAL',
            'quality_grade': 'Grade A',
            'expected_price': 25.0,
            'district': 'Nashik',
            'location': 'Dindori Packhouse'
        })
        assert res1.status_code == 201, f"Failed: {res1.get_json()}"
        lot1_data = res1.get_json()['lot']
        lot1_id = lot1_data['id']
        assert lot1_data['target_quantity'] == 2000.0
        assert lot1_data['committed_quantity'] == 0.0
        assert lot1_data['aggregation_status'] == 'OPEN'
        assert lot1_data['time_remaining_seconds'] is not None and lot1_data['time_remaining_seconds'] > 35000
        print(f"  PASS: Lot #{lot1_id} created with target=2000kg, deadline stored={lot1_data['collection_deadline_at']}")

        # -----------------------------------------------------------
        # TEST 2: Contribution
        # Farmer contributes 500 kg -> Committed = 500 kg (25%). No unnecessary notification.
        # -----------------------------------------------------------
        print("\n[TEST 2] Farmer Contribution (500 kg)...")
        initial_notif_count = Notification.query.filter_by(user_id=fpo_id).count()
        res2 = client.post(f'/api/fpo/lots/{lot1_id}/members', json={
            'farmer_name': 'Ramesh Shinde',
            'quantity': 500.0,
            'quality_grade': 'Grade A',
            'contribution_status': 'PLEDGED'
        })
        assert res2.status_code == 201, f"Failed: {res2.get_json()}"
        lot1_updated = res2.get_json()['lot']
        assert lot1_updated['committed_quantity'] == 500.0
        assert lot1_updated['percentage_filled'] == 25.0
        new_notif_count = Notification.query.filter_by(user_id=fpo_id).count()
        assert new_notif_count == initial_notif_count, "Failed: Notification should NOT be sent at 25%!"
        print("  PASS: Committed=500kg (25%). Zero unnecessary notifications sent.")

        # -----------------------------------------------------------
        # TEST 3: 90% Capacity Milestone
        # Add 1300 kg -> Total 1800 kg (90%) -> CLOSING_SOON + 1 Notification
        # -----------------------------------------------------------
        print("\n[TEST 3] 90% Capacity Behavior (Committed reaches 1800/2000 kg)...")
        res3 = client.post(f'/api/fpo/lots/{lot1_id}/members', json={
            'farmer_name': 'Kailash Patil',
            'quantity': 1300.0,
            'quality_grade': 'Grade A',
            'contribution_status': 'PLEDGED'
        })
        assert res3.status_code == 201, f"Failed: {res3.get_json()}"
        lot1_updated = res3.get_json()['lot']
        assert lot1_updated['committed_quantity'] == 1800.0
        assert lot1_updated['percentage_filled'] == 90.0
        assert lot1_updated['aggregation_status'] == 'CLOSING_SOON'

        notifs_90 = Notification.query.filter(
            Notification.user_id == fpo_id,
            Notification.message.like(f'%Lot #{lot1_id}%'),
            Notification.title.like('%90% Full%')
        ).all()
        assert len(notifs_90) == 1, f"Expected exactly 1 notification for 90%, found {len(notifs_90)}"
        print(f"  PASS: Status changed to CLOSING_SOON. Exactly 1 notification generated: '{notifs_90[0].message}'")

        # -----------------------------------------------------------
        # TEST 11: Idempotency / No Duplicate Notifications on re-fetch
        # -----------------------------------------------------------
        print("\n[TEST 11] Duplicate Notification Prevention (Repeatedly re-fetching 90% lot)...")
        for _ in range(3):
            client.get(f'/api/fpo/lots/{lot1_id}')
            client.get('/api/fpo/lots')
        notifs_90_after = Notification.query.filter(
            Notification.user_id == fpo_id,
            Notification.message.like(f'%Lot #{lot1_id}%'),
            Notification.title.like('%90% Full%')
        ).all()
        assert len(notifs_90_after) == 1, f"Failed idempotency! Expected 1 notification, found {len(notifs_90_after)}"
        print("  PASS: Re-fetching lot 3 times generated zero duplicate notifications.")

        # -----------------------------------------------------------
        # TEST 4: Remaining Capacity / Prevent Overbooking
        # Add 100 kg to reach 1900 kg. Then farmer attempts 300 kg.
        # Expected: Backend rejects with 'Only 100 kg capacity remains'
        # -----------------------------------------------------------
        print("\n[TEST 4] Overbooking Prevention (Committed=1900kg, Attempting 300kg)...")
        res_add100 = client.post(f'/api/fpo/lots/{lot1_id}/members', json={
            'farmer_name': 'Sunil More',
            'quantity': 100.0
        })
        assert res_add100.status_code == 201
        lot_obj = CropLot.query.get(lot1_id)
        assert lot_obj.to_dict()['committed_quantity'] == 1900.0
        assert lot_obj.to_dict()['remaining_capacity'] == 100.0

        res_overbook = client.post(f'/api/fpo/lots/{lot1_id}/members', json={
            'farmer_name': 'Eknath Shinde',
            'quantity': 300.0
        })
        assert res_overbook.status_code == 400, "Failed: Overbooking should be rejected with 400"
        err_json = res_overbook.get_json()
        assert "Only 100" in err_json['message'] and "capacity remains" in err_json['message'], f"Unexpected message: {err_json['message']}"
        print(f"  PASS: Backend rejected overbooking with message: '{err_json['message']}'")

        # -----------------------------------------------------------
        # TEST 5: 100% Full / Automatic Closure
        # Farmer contributes remaining 100 kg -> 2000 kg -> FILLED, 1 Notification
        # -----------------------------------------------------------
        print("\n[TEST 5] 100% Automatic Closure (Committed reaches exactly 2000 kg)...")
        res5 = client.post(f'/api/fpo/lots/{lot1_id}/members', json={
            'farmer_name': 'Eknath Shinde',
            'quantity': 100.0
        })
        assert res5.status_code == 201
        lot1_filled = res5.get_json()['lot']
        assert lot1_filled['committed_quantity'] == 2000.0
        assert lot1_filled['percentage_filled'] == 100.0
        assert lot1_filled['aggregation_status'] == 'FILLED'

        notifs_100 = Notification.query.filter(
            Notification.user_id == fpo_id,
            Notification.message.like(f'%Lot #{lot1_id}%'),
            Notification.title.like('%Target Reached%')
        ).all()
        assert len(notifs_100) == 1, f"Expected 1 filled notification, found {len(notifs_100)}"
        print(f"  PASS: Status changed to FILLED. Exactly 1 notification generated: '{notifs_100[0].message}'")

        # -----------------------------------------------------------
        # TEST 12: Direct API after closure
        # Attempt POST to /members on FILLED lot
        # -----------------------------------------------------------
        print("\n[TEST 12] Direct API Call Rejection on FILLED Lot...")
        res12 = client.post(f'/api/fpo/lots/{lot1_id}/members', json={
            'farmer_name': 'Late Farmer',
            'quantity': 50.0
        })
        assert res12.status_code == 400, "Failed: Direct API on FILLED lot should return 400"
        print(f"  PASS: Direct API rejected with: '{res12.get_json()['message']}'")

        # -----------------------------------------------------------
        # TEST 6: Deadline Automatic Closure
        # Target = 2000 kg, Committed = 1760 kg. Simulate deadline passing.
        # Expected: EXPIRED, 1 deadline notification, blocked contributions.
        # -----------------------------------------------------------
        print("\n[TEST 6] Deadline Automatic Closure (Simulating expired collection window)...")
        res_expired_lot = client.post('/api/fpo/lots', json={
            'seller_id': fpo_id,
            'crop': 'Tomato',
            'target_quantity': 2000.0,
            'duration_hours': 1.0,
            'expected_price': 24.0,
            'district': 'Nashik',
            'location': 'Niphad Hub'
        })
        lot_exp_id = res_expired_lot.get_json()['lot']['id']
        # Add 1760 kg
        client.post(f'/api/fpo/lots/{lot_exp_id}/members', json={
            'farmer_name': 'Govind Rao',
            'quantity': 1760.0
        })

        # Artificially set deadline in the past
        lot_exp = CropLot.query.get(lot_exp_id)
        lot_exp.collection_deadline_at = datetime.utcnow() - timedelta(minutes=15)
        db.session.commit()

        # Now trigger fetch
        res_fetch = client.get(f'/api/fpo/lots/{lot_exp_id}')
        lot_exp_dict = res_fetch.get_json()['lot']
        assert lot_exp_dict['aggregation_status'] == 'EXPIRED'
        assert lot_exp_dict['is_expired'] is True

        notifs_exp = Notification.query.filter(
            Notification.user_id == fpo_id,
            Notification.message.like(f'%Lot #{lot_exp_id}%'),
            Notification.title.like('%Collection Window Ended%')
        ).all()
        assert len(notifs_exp) == 1, f"Expected 1 deadline notification, found {len(notifs_exp)}"

        # Direct contribution attempt on expired lot
        res_exp_contrib = client.post(f'/api/fpo/lots/{lot_exp_id}/members', json={
            'farmer_name': 'Attempt Farmer',
            'quantity': 50.0
        })
        assert res_exp_contrib.status_code == 400
        assert "expired" in res_exp_contrib.get_json()['message'].lower()
        print(f"  PASS: Aggregation became EXPIRED. Notification generated. Contributions blocked.")

        # -----------------------------------------------------------
        # TEST 7: Extension by FPO
        # FPO extends expired aggregation by 10 hours
        # Expected: New deadline, reopens, extension count increments
        # -----------------------------------------------------------
        print("\n[TEST 7] FPO Extension of Expired Window...")
        res7 = client.post(f'/api/fpo/lots/{lot_exp_id}/extend', json={
            'extension_hours': 10.0
        })
        assert res7.status_code == 200
        lot_extended = res7.get_json()['lot']
        assert lot_extended['deadline_extension_count'] == 1
        assert lot_extended['aggregation_status'] == 'OPEN' # 1760 / 2000 = 88% (< 90% threshold, so OPEN)
        assert lot_extended['is_expired'] is False
        assert lot_extended['time_remaining_seconds'] > 35000
        print(f"  PASS: Lot reopened with 10h extension. Extension count={lot_extended['deadline_extension_count']}.")

        # -----------------------------------------------------------
        # TEST 8 & 9: Physical Receipt & Verification Lifecycle
        # 2,000 kg committed. 1,850 kg marked RECEIVED. 1,800 kg marked VERIFIED.
        # Expected: Available for sale reflects ONLY verified quantity (1,800 kg).
        # -----------------------------------------------------------
        print("\n[TEST 8 & 9] Physical Receipt vs Quality Verification Quantity Tracking...")
        # Create a fresh lot for testing receipt and verification
        res_lot3 = client.post('/api/fpo/lots', json={
            'seller_id': fpo_id,
            'crop': 'Tomato',
            'target_quantity': 2000.0,
            'duration_hours': 24.0,
            'expected_price': 25.0,
            'district': 'Nashik',
            'location': 'Mohadi'
        })
        lot3_id = res_lot3.get_json()['lot']['id']
        m1_res = client.post(f'/api/fpo/lots/{lot3_id}/members', json={
            'farmer_name': 'Farmer A',
            'quantity': 1000.0,
            'contribution_status': 'PLEDGED'
        })
        m2_res = client.post(f'/api/fpo/lots/{lot3_id}/members', json={
            'farmer_name': 'Farmer B',
            'quantity': 1000.0,
            'contribution_status': 'PLEDGED'
        })
        m1_id = m1_res.get_json()['member']['id']
        m2_id = m2_res.get_json()['member']['id']

        # Check committed=2000, received=0, verified=0, available=0
        lot3_state1 = client.get(f'/api/fpo/lots/{lot3_id}').get_json()['lot']
        assert lot3_state1['committed_quantity'] == 2000.0
        assert lot3_state1['received_quantity'] == 0.0
        assert lot3_state1['verified_quantity'] == 0.0
        assert lot3_state1['available_for_sale'] == 0.0

        # Mark Farmer A as RECEIVED (1000 kg)
        client.put(f'/api/fpo/lots/{lot3_id}/members/{m1_id}/status', json={'status': 'RECEIVED'})
        # Mark Farmer B with 850 kg received (simulated: update quantity and status)
        m2 = FPOLotMember.query.get(m2_id)
        m2.quantity = 850.0
        m2.contribution_status = 'RECEIVED'
        db.session.commit()

        lot3_state2 = client.get(f'/api/fpo/lots/{lot3_id}').get_json()['lot']
        assert lot3_state2['received_quantity'] == 1850.0
        assert lot3_state2['available_for_sale'] == 0.0, "TEST 8 PASS: 1850kg received is NOT yet available for sale before verification!"
        print("  PASS (TEST 8): 2,000 kg committed, 1,850 kg received -> Available for sale is 0 kg.")

        # Now verify: Farmer A 1000 kg verified, Farmer B 800 kg verified (50 kg defect/rejection)
        client.put(f'/api/fpo/lots/{lot3_id}/members/{m1_id}/status', json={'status': 'VERIFIED'})
        m2.quantity = 800.0
        m2.contribution_status = 'VERIFIED'
        db.session.commit()

        lot3_state3 = client.get(f'/api/fpo/lots/{lot3_id}').get_json()['lot']
        assert lot3_state3['verified_quantity'] == 1800.0
        assert lot3_state3['available_for_sale'] == 1800.0, "TEST 9 PASS: Available quantity reflects verified amount."
        print("  PASS (TEST 9): 1,800 kg verified -> Available for sale is exactly 1,800 kg.")

        # -----------------------------------------------------------
        # TEST 10: Consolidated FPO Inventory & Traceability
        # Multiple crop aggregations. FPO sees crop-wise consolidated quantities with farmer traceability.
        # -----------------------------------------------------------
        print("\n[TEST 10] Consolidated FPO Produce Inventory & Farmer Traceability...")
        # Add another crop (Onion)
        res_onion = client.post('/api/fpo/lots', json={
            'seller_id': fpo_id,
            'crop': 'Onion',
            'target_quantity': 5000.0,
            'duration_hours': 72.0,
            'expected_price': 28.0,
            'district': 'Nashik',
            'location': 'Lasalgaon Yard'
        })
        onion_id = res_onion.get_json()['lot']['id']
        client.post(f'/api/fpo/lots/{onion_id}/members', json={
            'farmer_name': 'Pandurang Dagle',
            'quantity': 2500.0,
            'contribution_status': 'VERIFIED'
        })

        inv_res = client.get(f'/api/fpo/inventory?seller_id={fpo_id}')
        assert inv_res.status_code == 200
        inv_data = inv_res.get_json()['inventory']
        crops_in_inv = {item['crop']: item for item in inv_data}
        assert 'Tomato' in crops_in_inv, "Expected Tomato in consolidated inventory"
        assert 'Onion' in crops_in_inv, "Expected Onion in consolidated inventory"

        tomato_inv = crops_in_inv['Tomato']
        assert tomato_inv['available_for_sale'] >= 1800.0
        assert tomato_inv['urgency'] in ('SELL URGENTLY', 'SELL SOON')
        assert len(tomato_inv['batches']) >= 1

        # Check farmer traceability in batches
        all_farmers = []
        for b in tomato_inv['batches']:
            all_farmers.extend([f['farmer_name'] for f in b['contributing_farmers']])

        assert len(all_farmers) > 0, "Failed: Farmer traceability missing from inventory batches!"
        assert 'Farmer A' in all_farmers or 'Ramesh Shinde' in all_farmers
        print(f"  PASS (TEST 10): Consolidated inventory reports {len(inv_data)} crops with {len(all_farmers)} traced farmer contributions and urgency indicators.")

        print("\n" + "=" * 60)
        print("ALL 12 BACKEND TESTS PASSED SUCCESSFULLY!")
        print("=" * 60)

if __name__ == '__main__':
    run_tests()
