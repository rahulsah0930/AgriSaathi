"""
Automated Verification Suite for Phase 3 FPO Aggregation Enhancement
Tests all 27 required scenarios from Section 21 of the specification.
"""
import sys
import os
from datetime import datetime, timedelta

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db
from models.lot import CropLot, FPOLotMember
from models.user import User, FarmerProfile, FPOProfile
from models.notification import Notification, NotificationEvent
from models.commodity import Commodity
from utils.auth import generate_access_token

def run_tests():
    app = create_app()
    client = app.test_client()

    with app.app_context():
        print("=" * 70)
        print("PHASE 3: FPO AGGREGATION AUTOMATED VERIFICATION SUITE (27 TESTS)")
        print("=" * 70)

        # 0. Setup test users: FPO A, FPO B, Farmer A, Farmer B
        fpo_a = User.query.filter_by(email='fpo_a_test@agrisaathi.gov.in').first()
        if not fpo_a:
            fpo_a = User(
                email='fpo_a_test@agrisaathi.gov.in',
                phone='9823000101',
                role='FPO',
                name='Sahyadri Farmer Producer Co.',
                verification_status='VERIFIED'
            )
            fpo_a.set_password('Password@123')
            db.session.add(fpo_a)
            db.session.commit()
            fpo_profile_a = FPOProfile(user_id=fpo_a.id, fpo_name='Sahyadri Farmer Producer Co.', registration_number='FPO-MH-001', contact_person='Sahyadri Representative', district='Nashik')
            db.session.add(fpo_profile_a)
            db.session.commit()

        fpo_b = User.query.filter_by(email='fpo_b_test@agrisaathi.gov.in').first()
        if not fpo_b:
            fpo_b = User(
                email='fpo_b_test@agrisaathi.gov.in',
                phone='9823000102',
                role='FPO',
                name='MahaAgri Farmer Producer Co.',
                verification_status='VERIFIED'
            )
            fpo_b.set_password('Password@123')
            db.session.add(fpo_b)
            db.session.commit()
            fpo_profile_b = FPOProfile(user_id=fpo_b.id, fpo_name='MahaAgri Farmer Producer Co.', registration_number='FPO-MH-002', contact_person='MahaAgri Representative', district='Pune')
            db.session.add(fpo_profile_b)
            db.session.commit()

        farmer_a = User.query.filter_by(email='farmer_a_test@agrisaathi.gov.in').first()
        if not farmer_a:
            farmer_a = User(
                email='farmer_a_test@agrisaathi.gov.in',
                phone='9823000201',
                role='FARMER',
                name='Ramesh Shinde',
                verification_status='VERIFIED'
            )
            farmer_a.set_password('Password@123')
            db.session.add(farmer_a)
            db.session.commit()
            f_prof_a = FarmerProfile(user_id=farmer_a.id, full_name='Ramesh Shinde', village='Dindori', taluka='Dindori', district='Nashik', state='Maharashtra')
            db.session.add(f_prof_a)
            db.session.commit()

        farmer_b = User.query.filter_by(email='farmer_b_test@agrisaathi.gov.in').first()
        if not farmer_b:
            farmer_b = User(
                email='farmer_b_test@agrisaathi.gov.in',
                phone='9823000202',
                role='FARMER',
                name='Suresh Patil',
                verification_status='VERIFIED'
            )
            farmer_b.set_password('Password@123')
            db.session.add(farmer_b)
            db.session.commit()
            f_prof_b = FarmerProfile(user_id=farmer_b.id, full_name='Suresh Patil', village='Niphad', taluka='Niphad', district='Nashik', state='Maharashtra')
            db.session.add(f_prof_b)
            db.session.commit()

        token_fpo_a = generate_access_token(fpo_a)
        token_fpo_b = generate_access_token(fpo_b)
        token_farmer_a = generate_access_token(farmer_a)
        token_farmer_b = generate_access_token(farmer_b)

        headers_fpo_a = {'Authorization': f'Bearer {token_fpo_a}'}
        headers_fpo_b = {'Authorization': f'Bearer {token_fpo_b}'}
        headers_farmer_a = {'Authorization': f'Bearer {token_farmer_a}'}
        headers_farmer_b = {'Authorization': f'Bearer {token_farmer_b}'}

        # -----------------------------------------------------------
        # TEST 1: Create Tomato requirement
        # -----------------------------------------------------------
        print("\n[TEST 1] Create Tomato Requirement...")
        res_t1 = client.post('/api/fpo/lots', headers=headers_fpo_a, json={
            'crop': 'Tomato',
            'target_quantity': 1000.0,
            'expected_price': 25.0,
            'district': 'Nashik',
            'location': 'Dindori Hub'
        })
        assert res_t1.status_code == 201, f"Failed: {res_t1.get_json()}"
        lot_tomato = res_t1.get_json()['lot']
        tomato_lot_id = lot_tomato['id']
        print(f"  PASS: Tomato requirement created (Lot #{tomato_lot_id})")

        # -----------------------------------------------------------
        # TEST 2: Tomato default collection window retrieved from Commodity (12h)
        # -----------------------------------------------------------
        print("\n[TEST 2] Tomato Default Collection Window Retrieved from Commodity...")
        tomato_comm = Commodity.query.filter_by(canonical_name='Tomato').first()
        assert tomato_comm is not None, "Tomato commodity not found"
        assert tomato_comm.default_collection_window_hours == 12.0, f"Expected 12.0, got {tomato_comm.default_collection_window_hours}"
        assert lot_tomato['collection_window_hours'] == 12.0, f"Expected 12.0, got {lot_tomato['collection_window_hours']}"
        print(f"  PASS: Tomato received default window of {lot_tomato['collection_window_hours']} hours from Commodity catalog.")

        # -----------------------------------------------------------
        # TEST 3: Create Wheat requirement
        # -----------------------------------------------------------
        print("\n[TEST 3] Create Wheat Requirement...")
        res_t3 = client.post('/api/fpo/lots', headers=headers_fpo_a, json={
            'crop': 'Wheat',
            'target_quantity': 5000.0,
            'expected_price': 28.0,
            'district': 'Nashik',
            'location': 'Niphad Mandi'
        })
        assert res_t3.status_code == 201, f"Failed: {res_t3.get_json()}"
        lot_wheat = res_t3.get_json()['lot']
        print(f"  PASS: Wheat requirement created (Lot #{lot_wheat['id']})")

        # -----------------------------------------------------------
        # TEST 4: Wheat receives longer default than Tomato (72h > 12h)
        # -----------------------------------------------------------
        print("\n[TEST 4] Wheat Receives Longer Default Than Tomato...")
        wheat_comm = Commodity.query.filter_by(canonical_name='Wheat').first()
        assert wheat_comm.default_collection_window_hours == 72.0, f"Expected 72.0, got {wheat_comm.default_collection_window_hours}"
        assert lot_wheat['collection_window_hours'] == 72.0, f"Expected 72.0, got {lot_wheat['collection_window_hours']}"
        assert lot_wheat['collection_window_hours'] > lot_tomato['collection_window_hours']
        print(f"  PASS: Wheat window ({lot_wheat['collection_window_hours']}h) is longer than Tomato ({lot_tomato['collection_window_hours']}h).")

        # -----------------------------------------------------------
        # TEST 5: FPO custom allowed deadline
        # -----------------------------------------------------------
        print("\n[TEST 5] FPO Custom Allowed Deadline...")
        res_t5 = client.post('/api/fpo/lots', headers=headers_fpo_a, json={
            'crop': 'Tomato',
            'target_quantity': 1000.0,
            'duration_hours': 18.0,
            'expected_price': 25.0,
            'district': 'Nashik',
            'location': 'Dindori Hub'
        })
        assert res_t5.status_code == 201
        lot_custom = res_t5.get_json()['lot']
        assert lot_custom['collection_window_hours'] == 18.0
        print(f"  PASS: FPO customized deadline to {lot_custom['collection_window_hours']} hours successfully.")

        # -----------------------------------------------------------
        # TEST 6: Farmer contribution
        # -----------------------------------------------------------
        print("\n[TEST 6] Farmer Contribution...")
        res_t6 = client.post(f'/api/fpo/lots/{tomato_lot_id}/members', headers=headers_farmer_a, json={
            'quantity': 200.0,
            'quality_grade': 'Grade A'
        })
        assert res_t6.status_code == 201, f"Failed: {res_t6.get_json()}"
        lot_state = res_t6.get_json()['lot']
        print(f"  PASS: Farmer contribution accepted for {res_t6.get_json()['member']['quantity']} kg.")

        # -----------------------------------------------------------
        # TEST 7: Correct collected quantity (200 kg)
        # -----------------------------------------------------------
        print("\n[TEST 7] Correct Collected Quantity...")
        assert lot_state['collected_quantity'] == 200.0, f"Expected 200.0, got {lot_state['collected_quantity']}"
        assert lot_state['committed_quantity'] == 200.0
        print(f"  PASS: Collected quantity = {lot_state['collected_quantity']} kg.")

        # -----------------------------------------------------------
        # TEST 8: Correct remaining quantity (800 kg)
        # -----------------------------------------------------------
        print("\n[TEST 8] Correct Remaining Quantity...")
        assert lot_state['remaining_quantity'] == 800.0, f"Expected 800.0, got {lot_state['remaining_quantity']}"
        assert lot_state['remaining_capacity'] == 800.0
        print(f"  PASS: Remaining quantity = {lot_state['remaining_quantity']} kg.")

        # -----------------------------------------------------------
        # TEST 9: Correct percentage (20%)
        # -----------------------------------------------------------
        print("\n[TEST 9] Correct Percentage...")
        assert lot_state['percentage_filled'] == 20.0, f"Expected 20.0, got {lot_state['percentage_filled']}"
        print(f"  PASS: Percentage filled = {lot_state['percentage_filled']}%.")

        # -----------------------------------------------------------
        # TEST 10: Cross 90% threshold (add 700 kg -> 900 kg / 1000 kg)
        # -----------------------------------------------------------
        print("\n[TEST 10] Cross 90% Threshold...")
        res_t10 = client.post(f'/api/fpo/lots/{tomato_lot_id}/members', headers=headers_farmer_b, json={
            'quantity': 700.0,
            'quality_grade': 'Grade A'
        })
        assert res_t10.status_code == 201
        lot_90 = res_t10.get_json()['lot']
        assert lot_90['collected_quantity'] == 900.0
        assert lot_90['percentage_filled'] == 90.0
        print(f"  PASS: Reached 900/1000 kg (90% capacity).")

        # -----------------------------------------------------------
        # TEST 11: Status becomes NEAR_CAPACITY
        # -----------------------------------------------------------
        print("\n[TEST 11] Status Becomes NEAR_CAPACITY...")
        assert lot_90['aggregation_status'] == 'NEAR_CAPACITY', f"Expected NEAR_CAPACITY, got {lot_90['aggregation_status']}"
        print(f"  PASS: Aggregation status authoritatively transitioned to '{lot_90['aggregation_status']}'.")

        # -----------------------------------------------------------
        # TEST 12: Exactly one near-capacity notification
        # -----------------------------------------------------------
        print("\n[TEST 12] Exactly One Near-Capacity Notification...")
        notif_events_90 = NotificationEvent.query.filter_by(event_key=f'aggregation:{tomato_lot_id}:near_capacity').all()
        assert len(notif_events_90) == 1, f"Expected 1 event, got {len(notif_events_90)}"
        notif_90 = db.session.get(Notification, notif_events_90[0].notification_id)
        assert notif_90 is not None, "Notification record missing"
        assert notif_90.user_id == fpo_a.id
        print(f"  PASS: Exactly 1 near-capacity notification recorded: '{notif_90.message}'")

        # -----------------------------------------------------------
        # TEST 13: Additional contribution at 95% does NOT create duplicate 90% notification
        # -----------------------------------------------------------
        print("\n[TEST 13] Additional Contribution At 95% Does Not Duplicate Notification...")
        res_t13 = client.post(f'/api/fpo/lots/{tomato_lot_id}/members', headers=headers_farmer_a, json={
            'quantity': 50.0
        })
        assert res_t13.status_code == 201
        lot_95 = res_t13.get_json()['lot']
        assert lot_95['percentage_filled'] == 95.0
        assert lot_95['aggregation_status'] == 'NEAR_CAPACITY'

        notif_events_95 = NotificationEvent.query.filter_by(event_key=f'aggregation:{tomato_lot_id}:near_capacity').all()
        assert len(notif_events_95) == 1, f"Idempotency violation! Expected 1 event, got {len(notif_events_95)}"
        print("  PASS: Zero duplicate notifications emitted at 95% fill.")

        # -----------------------------------------------------------
        # TEST 14: Reach 100% (contribute remaining 50 kg)
        # -----------------------------------------------------------
        print("\n[TEST 14] Reach 100% Target...")
        res_t14 = client.post(f'/api/fpo/lots/{tomato_lot_id}/members', headers=headers_farmer_b, json={
            'quantity': 50.0
        })
        assert res_t14.status_code == 201
        lot_100 = res_t14.get_json()['lot']
        assert lot_100['collected_quantity'] == 1000.0
        assert lot_100['percentage_filled'] == 100.0
        assert lot_100['remaining_quantity'] == 0.0
        print("  PASS: Target volume reached (1000/1000 kg).")

        # -----------------------------------------------------------
        # TEST 15: Status becomes FILLED
        # -----------------------------------------------------------
        print("\n[TEST 15] Status Becomes FILLED...")
        assert lot_100['aggregation_status'] == 'FILLED', f"Expected FILLED, got {lot_100['aggregation_status']}"
        print(f"  PASS: Aggregation status authoritatively transitioned to '{lot_100['aggregation_status']}'.")

        # -----------------------------------------------------------
        # TEST 16: Exactly one filled notification
        # -----------------------------------------------------------
        print("\n[TEST 16] Exactly One Filled Notification...")
        filled_events = NotificationEvent.query.filter_by(event_key=f'aggregation:{tomato_lot_id}:filled:fpo').all()
        assert len(filled_events) == 1, f"Expected 1 filled event, got {len(filled_events)}"
        notif_filled = db.session.get(Notification, filled_events[0].notification_id)
        assert notif_filled is not None, "Notification record missing"
        assert notif_filled.user_id == fpo_a.id
        print(f"  PASS: Exactly 1 filled notification recorded: '{notif_filled.message}'")

        # -----------------------------------------------------------
        # TEST 17: Further contribution rejected on FILLED lot
        # -----------------------------------------------------------
        print("\n[TEST 17] Further Contribution Rejected on FILLED Lot...")
        res_t17 = client.post(f'/api/fpo/lots/{tomato_lot_id}/members', headers=headers_farmer_a, json={
            'quantity': 10.0
        })
        assert res_t17.status_code == 400
        assert "closed" in res_t17.get_json()['message'].lower() or "filled" in res_t17.get_json()['message'].lower()
        print(f"  PASS: Contribution correctly rejected: '{res_t17.get_json()['message']}'")

        # -----------------------------------------------------------
        # TEST 18: Overfill attempt rejected / limited
        # -----------------------------------------------------------
        print("\n[TEST 18] Overfill Attempt Rejected / Limited...")
        # Create a fresh 1000kg requirement with 950kg committed
        res_over_lot = client.post('/api/fpo/lots', headers=headers_fpo_a, json={
            'crop': 'Tomato',
            'target_quantity': 1000.0,
            'expected_price': 25.0,
            'district': 'Nashik',
            'location': 'Dindori Hub'
        })
        over_lot_id = res_over_lot.get_json()['lot']['id']
        client.post(f'/api/fpo/lots/{over_lot_id}/members', headers=headers_farmer_a, json={'quantity': 950.0})

        # Farmer tries to contribute 100 kg when only 50 kg remains
        res_over = client.post(f'/api/fpo/lots/{over_lot_id}/members', headers=headers_farmer_b, json={
            'quantity': 100.0
        })
        assert res_over.status_code == 400
        over_json = res_over.get_json()
        assert "Only 50" in over_json['message'] and "still required" in over_json['message'], f"Unexpected message: {over_json['message']}"
        assert over_json['remaining_capacity'] == 50.0
        print(f"  PASS: Overfill rejected with informative message: '{over_json['message']}'")

        # -----------------------------------------------------------
        # TEST 19: Expired requirement rejects contribution
        # -----------------------------------------------------------
        print("\n[TEST 19] Expired Requirement Rejects Contribution...")
        res_exp_lot = client.post('/api/fpo/lots', headers=headers_fpo_a, json={
            'crop': 'Tomato',
            'target_quantity': 1000.0,
            'expected_price': 25.0,
            'district': 'Nashik',
            'location': 'Niphad'
        })
        exp_lot_id = res_exp_lot.get_json()['lot']['id']
        # Add 780 kg
        client.post(f'/api/fpo/lots/{exp_lot_id}/members', headers=headers_farmer_a, json={'quantity': 780.0})

        # Force deadline into the past
        exp_lot = CropLot.query.get(exp_lot_id)
        exp_lot.collection_deadline_at = datetime.utcnow() - timedelta(minutes=30)
        db.session.commit()

        # Attempt contribution
        res_exp_contrib = client.post(f'/api/fpo/lots/{exp_lot_id}/members', headers=headers_farmer_b, json={
            'quantity': 50.0
        })
        assert res_exp_contrib.status_code == 400
        assert "expired" in res_exp_contrib.get_json()['message'].lower()
        print(f"  PASS: Expired lot rejected contribution: '{res_exp_contrib.get_json()['message']}'")

        # -----------------------------------------------------------
        # TEST 20: Expiration preserves existing contributions
        # -----------------------------------------------------------
        print("\n[TEST 20] Expiration Preserves Existing Contributions...")
        exp_lot_reloaded = CropLot.query.get(exp_lot_id)
        assert len(exp_lot_reloaded.members) == 1
        assert exp_lot_reloaded.members[0].quantity == 780.0
        assert exp_lot_reloaded.to_dict()['collected_quantity'] == 780.0
        print(f"  PASS: All {len(exp_lot_reloaded.members)} existing contributions (780 kg) intact in database.")

        # -----------------------------------------------------------
        # TEST 21: Exactly one expiration notification
        # -----------------------------------------------------------
        print("\n[TEST 21] Exactly One Expiration Notification...")
        exp_events = NotificationEvent.query.filter_by(event_key=f'aggregation:{exp_lot_id}:expired:fpo').all()
        assert len(exp_events) == 1, f"Expected 1 expiration event, got {len(exp_events)}"
        notif_exp = db.session.get(Notification, exp_events[0].notification_id)
        assert notif_exp is not None, "Notification record missing"
        assert notif_exp.user_id == fpo_a.id
        assert '780' in notif_exp.message
        print(f"  PASS: Exactly 1 expiration notification sent: '{notif_exp.message}'")

        # -----------------------------------------------------------
        # TEST 22: Repeated GET does not duplicate expiration notification
        # -----------------------------------------------------------
        print("\n[TEST 22] Repeated GET Does Not Duplicate Expiration Notification...")
        for _ in range(5):
            client.get(f'/api/fpo/lots/{exp_lot_id}', headers=headers_fpo_a)
            client.get('/api/fpo/lots', headers=headers_fpo_a)

        exp_events_after = NotificationEvent.query.filter_by(event_key=f'aggregation:{exp_lot_id}:expired:fpo').all()
        assert len(exp_events_after) == 1, f"Idempotency violation! Expected 1, got {len(exp_events_after)}"
        print("  PASS: 5 repeated GET requests caused zero duplicate notifications.")

        # -----------------------------------------------------------
        # TEST 23: Farmer cannot impersonate another Farmer
        # -----------------------------------------------------------
        print("\n[TEST 23] Farmer Cannot Impersonate Another Farmer...")
        # Create a fresh lot
        res_fresh = client.post('/api/fpo/lots', headers=headers_fpo_a, json={
            'crop': 'Tomato',
            'target_quantity': 1000.0,
            'expected_price': 25.0,
            'district': 'Nashik',
            'location': 'Dindori'
        })
        fresh_lot_id = res_fresh.get_json()['lot']['id']

        # Farmer A submits request spoofing farmer_id = farmer_b.id and farmer_name = 'Suresh Patil'
        res_spoof = client.post(f'/api/fpo/lots/{fresh_lot_id}/members', headers=headers_farmer_a, json={
            'farmer_id': farmer_b.id,
            'farmer_name': 'Suresh Patil (Spoofed)',
            'quantity': 50.0
        })
        assert res_spoof.status_code == 201
        member_data = res_spoof.get_json()['member']
        # Backend must enforce g.current_user.id
        assert member_data['farmer_id'] == farmer_a.id, f"Spoofing succeeded! Stored farmer_id: {member_data['farmer_id']}"
        assert member_data['farmer_name'] == 'Ramesh Shinde', f"Spoofed name accepted: {member_data['farmer_name']}"
        print(f"  PASS: Impersonation prevented. Identity bound to JWT subject (Farmer #{farmer_a.id}: Ramesh Shinde).")

        # -----------------------------------------------------------
        # TEST 24: FPO cannot modify another FPO's requirement
        # -----------------------------------------------------------
        print("\n[TEST 24] FPO Cannot Modify Another FPO's Requirement (IDOR Protection)...")
        # FPO B attempts to cancel FPO A's requirement
        res_cancel_idor = client.post(f'/api/fpo/lots/{fresh_lot_id}/cancel', headers=headers_fpo_b)
        assert res_cancel_idor.status_code == 403, f"IDOR vulnerability! Status: {res_cancel_idor.status_code}"

        # FPO B attempts to extend FPO A's requirement
        res_extend_idor = client.post(f'/api/fpo/lots/{fresh_lot_id}/extend', headers=headers_fpo_b, json={'extension_hours': 10.0})
        assert res_extend_idor.status_code == 403, f"IDOR vulnerability! Status: {res_extend_idor.status_code}"

        # FPO B attempts to add an offline member to FPO A's requirement
        res_member_idor = client.post(f'/api/fpo/lots/{fresh_lot_id}/members', headers=headers_fpo_b, json={
            'farmer_name': 'Third Party Farmer',
            'quantity': 50.0
        })
        assert res_member_idor.status_code == 403, f"IDOR vulnerability! Status: {res_member_idor.status_code}"
        print("  PASS: IDOR protections enforced. FPO B blocked with 403 Forbidden across all operations.")

        # -----------------------------------------------------------
        # TEST 25: Invalid quantity rejected
        # -----------------------------------------------------------
        print("\n[TEST 25] Invalid Non-Numeric Quantity Rejected...")
        res_t25 = client.post(f'/api/fpo/lots/{fresh_lot_id}/members', headers=headers_farmer_a, json={
            'quantity': 'not_a_valid_number'
        })
        assert res_t25.status_code == 400
        print(f"  PASS: Non-numeric quantity rejected with 400: '{res_t25.get_json()['message']}'")

        # -----------------------------------------------------------
        # TEST 26: Zero quantity rejected
        # -----------------------------------------------------------
        print("\n[TEST 26] Zero Quantity Rejected...")
        res_t26 = client.post(f'/api/fpo/lots/{fresh_lot_id}/members', headers=headers_farmer_a, json={
            'quantity': 0
        })
        assert res_t26.status_code == 400
        print(f"  PASS: Zero quantity rejected with 400: '{res_t26.get_json()['message']}'")

        # -----------------------------------------------------------
        # TEST 27: Negative quantity rejected
        # -----------------------------------------------------------
        print("\n[TEST 27] Negative Quantity Rejected...")
        res_t27 = client.post(f'/api/fpo/lots/{fresh_lot_id}/members', headers=headers_farmer_a, json={
            'quantity': -50.0
        })
        assert res_t27.status_code == 400
        print(f"  PASS: Negative quantity rejected with 400: '{res_t27.get_json()['message']}'")

        print("\n" + "=" * 70)
        print("ALL 27 PHASE 3 FPO AGGREGATION TESTS PASSED SUCCESSFULLY!")
        print("=" * 70)

if __name__ == '__main__':
    run_tests()
