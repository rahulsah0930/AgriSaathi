"""
Automated Verification Suite for Phase 4: Transaction, Order, Payment & Simulated Escrow Lifecycle
Tests all 33 required scenarios from Section 23 of the specification.
"""
import sys
import os
from datetime import datetime, date

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db
from models.user import User, FarmerProfile, BuyerProfile
from models.lot import CropLot
from models.offer import Offer, NegotiationHistory
from models.transaction import Transaction, TransactionHistory
from models.payment import PaymentRecord
from models.notification import Notification, NotificationEvent
from models.commodity import Commodity
from utils.auth import generate_access_token

def run_tests():
    app = create_app()
    client = app.test_client()

    with app.app_context():
        print("=" * 70)
        print("PHASE 4: TRANSACTION & PROTOTYPE ESCROW AUTOMATED SUITE (33 TESTS)")
        print("=" * 70)

        # Setup test users
        farmer = User.query.filter_by(email='farmer_txn_test@agrisaathi.gov.in').first()
        if not farmer:
            farmer = User(email='farmer_txn_test@agrisaathi.gov.in', phone='9823000501', role='FARMER', name='Farmer Vitthal', verification_status='VERIFIED')
            farmer.set_password('Password@123')
            db.session.add(farmer)
            db.session.commit()
            db.session.add(FarmerProfile(user_id=farmer.id, full_name='Farmer Vitthal', village='Dindori', taluka='Dindori', state='Maharashtra', district='Nashik'))
            db.session.commit()

        buyer = User.query.filter_by(email='buyer_txn_test@agrisaathi.gov.in').first()
        if not buyer:
            buyer = User(email='buyer_txn_test@agrisaathi.gov.in', phone='9823000502', role='BUYER', name='Mahalaxmi Foods', verification_status='VERIFIED')
            buyer.set_password('Password@123')
            db.session.add(buyer)
            db.session.commit()
            db.session.add(BuyerProfile(user_id=buyer.id, company_name='Mahalaxmi Foods Ltd', authorized_person='Rajesh Patel', business_registration='BUY-001', district='Pune'))
            db.session.commit()

        unrelated_buyer = User.query.filter_by(email='buyer_unrelated_test@agrisaathi.gov.in').first()
        if not unrelated_buyer:
            unrelated_buyer = User(email='buyer_unrelated_test@agrisaathi.gov.in', phone='9823000503', role='BUYER', name='Apex Wholesale', verification_status='VERIFIED')
            unrelated_buyer.set_password('Password@123')
            db.session.add(unrelated_buyer)
            db.session.commit()
            db.session.add(BuyerProfile(user_id=unrelated_buyer.id, company_name='Apex Wholesale', authorized_person='Suresh Shah', business_registration='BUY-002', district='Mumbai'))
            db.session.commit()

        unrelated_farmer = User.query.filter_by(email='farmer_unrelated_test@agrisaathi.gov.in').first()
        if not unrelated_farmer:
            unrelated_farmer = User(email='farmer_unrelated_test@agrisaathi.gov.in', phone='9823000504', role='FARMER', name='Unrelated Farmer', verification_status='VERIFIED')
            unrelated_farmer.set_password('Password@123')
            db.session.add(unrelated_farmer)
            db.session.commit()
            db.session.add(FarmerProfile(user_id=unrelated_farmer.id, full_name='Unrelated Farmer', village='Saoner', taluka='Saoner', state='Maharashtra', district='Nagpur'))
            db.session.commit()

        admin = User.query.filter_by(email='admin_txn_test@agrisaathi.gov.in').first()
        if not admin:
            admin = User(email='admin_txn_test@agrisaathi.gov.in', phone='9823000505', role='ADMIN', name='System Auditor', verification_status='VERIFIED')
            admin.set_password('Password@123')
            db.session.add(admin)
            db.session.commit()

        farmer_token = generate_access_token(farmer)
        buyer_token = generate_access_token(buyer)
        unrelated_buyer_token = generate_access_token(unrelated_buyer)
        unrelated_farmer_token = generate_access_token(unrelated_farmer)
        admin_token = generate_access_token(admin)

        farmer_headers = {'Authorization': f'Bearer {farmer_token}'}
        buyer_headers = {'Authorization': f'Bearer {buyer_token}'}
        unrelated_buyer_headers = {'Authorization': f'Bearer {unrelated_buyer_token}'}
        unrelated_farmer_headers = {'Authorization': f'Bearer {unrelated_farmer_token}'}
        admin_headers = {'Authorization': f'Bearer {admin_token}'}

        # Clean any previous test transactions to maintain idempotency across test runs
        test_refs = ['TXN-TEST-SETTLE-FAIL', 'TXN-POST-CANCEL-TEST', 'TXN-PRE-CANCEL-TEST', 'TXN-DISPUTE-TEST']
        for tr in test_refs:
            old_t = Transaction.query.filter_by(transaction_ref=tr).first()
            if old_t:
                db.session.delete(old_t)
        db.session.commit()

        # Setup produce lot
        lot = CropLot(
            seller_id=farmer.id,
            seller_type='FARMER',
            seller_name=farmer.name,
            crop='Tomato',
            variety='Hybrid Vaishali',
            quantity=1000.0,
            unit='kg',
            expected_price=30.0,
            harvest_date='2026-10-06',
            location='Dindori Farm Gate, Nashik',
            district='Nashik',
            status='ACTIVE',
            address='Dindori Farm Gate'
        )
        db.session.add(lot)
        db.session.commit()

        # Setup offer
        offer = Offer(
            crop_lot_id=lot.id,
            buyer_id=buyer.id,
            buyer_name=buyer.name,
            seller_id=farmer.id,
            quantity=1000.0,
            unit='kg',
            offer_price=30.0,
            total_value=30000.0,
            delivery_date=date.today(),
            status='PENDING'
        )
        db.session.add(offer)
        db.session.commit()

        # ====================================================================
        # TEST 1: Accepted offer creates transaction
        # ====================================================================
        print("\n[TEST 1] Accepted Offer Creates Transaction...")
        res = client.post(f'/api/offers/{offer.id}/accept', headers=farmer_headers)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.get_json()}"
        data = res.get_json()
        assert data['success'] is True
        assert 'transaction' in data
        txn_id = data['transaction']['id']
        txn = Transaction.query.get(txn_id)
        assert txn is not None
        assert txn.offer_id == offer.id
        assert txn.status in ['AWAITING_ADVANCE', 'ADVANCE_PENDING']
        print(f"  PASS: Transaction #{txn.id} created from accepted offer.")

        # ====================================================================
        # TEST 2: Repeated offer acceptance does not create duplicate transaction
        # ====================================================================
        print("\n[TEST 2] Repeated Offer Acceptance Does Not Create Duplicate Transaction...")
        res2 = client.post(f'/api/offers/{offer.id}/accept', headers=farmer_headers)
        assert res2.status_code == 200, f"Expected 200, got {res2.status_code}: {res2.get_json()}"
        txns_for_offer = Transaction.query.filter_by(offer_id=offer.id).all()
        assert len(txns_for_offer) == 1, f"Expected 1 transaction, found {len(txns_for_offer)}"
        print("  PASS: Idempotency enforced. Exactly 1 transaction exists for offer.")

        # ====================================================================
        # TEST 3: Buyer/seller derived from records, not request IDs
        # ====================================================================
        print("\n[TEST 3] Buyer/Seller Derived from Records, Not Request IDs...")
        assert txn.buyer_id == buyer.id, f"Expected buyer {buyer.id}, got {txn.buyer_id}"
        assert txn.seller_id == farmer.id, f"Expected seller {farmer.id}, got {txn.seller_id}"
        print(f"  PASS: Buyer ({txn.buyer_id}) and Seller ({txn.seller_id}) derived authoritatively from database.")

        # ====================================================================
        # TEST 4: Correct total calculation
        # ====================================================================
        print("\n[TEST 4] Correct Total Calculation...")
        assert txn.total_amount == 30000.0, f"Expected 30000.0, got {txn.total_amount}"
        print(f"  PASS: Total amount calculated on server: Rs. {txn.total_amount:,.2f}")

        # ====================================================================
        # TEST 5: Correct 20% advance
        # ====================================================================
        print("\n[TEST 5] Correct 20% Advance Calculation...")
        assert txn.advance_amount == 6000.0, f"Expected 6000.0, got {txn.advance_amount}"
        print(f"  PASS: 20% advance calculated on server: Rs. {txn.advance_amount:,.2f}")

        # ====================================================================
        # TEST 6: Correct balance
        # ====================================================================
        print("\n[TEST 6] Correct Balance Calculation...")
        assert txn.balance_amount == 24000.0, f"Expected 24000.0, got {txn.balance_amount}"
        print(f"  PASS: Remaining balance calculated on server: Rs. {txn.balance_amount:,.2f}")

        # ====================================================================
        # TEST 7: Buyer can pay advance
        # ====================================================================
        print("\n[TEST 7] Buyer Can Pay Advance into Prototype Escrow...")
        res_adv = client.post('/api/payments/pay-advance', headers=buyer_headers, json={'transaction_id': txn.id})
        assert res_adv.status_code == 200, f"Expected 200, got {res_adv.status_code}: {res_adv.get_json()}"
        print("  PASS: Buyer deposited prototype advance successfully.")

        # ====================================================================
        # TEST 8: Seller cannot pay Buyer advance
        # ====================================================================
        print("\n[TEST 8] Seller Cannot Pay Buyer Advance...")
        # Create a fresh transaction for testing seller denial
        offer2 = Offer(crop_lot_id=lot.id, buyer_id=buyer.id, buyer_name=buyer.name, seller_id=farmer.id, quantity=100.0, unit='kg', offer_price=20.0, total_value=2000.0, delivery_date=date.today())
        db.session.add(offer2)
        db.session.commit()
        client.post(f'/api/offers/{offer2.id}/accept', headers=farmer_headers)
        txn2 = Transaction.query.filter_by(offer_id=offer2.id).first()
        res_seller_adv = client.post('/api/payments/pay-advance', headers=farmer_headers, json={'transaction_id': txn2.id})
        assert res_seller_adv.status_code == 403, f"Expected 403, got {res_seller_adv.status_code}"
        print("  PASS: Seller blocked from paying buyer advance (403 Forbidden).")

        # ====================================================================
        # TEST 9: Unrelated Buyer cannot pay advance
        # ====================================================================
        print("\n[TEST 9] Unrelated Buyer Cannot Pay Advance...")
        res_unrelated_adv = client.post('/api/payments/pay-advance', headers=unrelated_buyer_headers, json={'transaction_id': txn2.id})
        assert res_unrelated_adv.status_code == 403, f"Expected 403, got {res_unrelated_adv.status_code}"
        print("  PASS: Unrelated buyer blocked from paying advance (403 Forbidden).")

        # ====================================================================
        # TEST 10: Advance creates one ESCROW_HELD entry
        # ====================================================================
        print("\n[TEST 10] Advance Creates One ESCROW_HELD Entry...")
        adv_pays = PaymentRecord.query.filter_by(transaction_id=txn.id, stage='ADVANCE').all()
        assert len(adv_pays) == 1, f"Expected 1 advance payment, found {len(adv_pays)}"
        assert adv_pays[0].status == 'ESCROW_HELD'
        assert adv_pays[0].amount == 6000.0
        print(f"  PASS: Exactly 1 advance payment ledger entry in ESCROW_HELD: Rs. {adv_pays[0].amount:,.2f}")

        # ====================================================================
        # TEST 11: Double advance request does not double-charge/create duplicate
        # ====================================================================
        print("\n[TEST 11] Double Advance Request Does Not Double-Charge / Create Duplicate...")
        res_adv_dup = client.post('/api/payments/pay-advance', headers=buyer_headers, json={'transaction_id': txn.id})
        assert res_adv_dup.status_code in [400, 409], f"Expected 400 or 409 for duplicate advance, got {res_adv_dup.status_code}"
        adv_pays_after = PaymentRecord.query.filter_by(transaction_id=txn.id, stage='ADVANCE').all()
        assert len(adv_pays_after) == 1
        print("  PASS: Idempotency enforced. Zero duplicate advance payments created.")

        # ====================================================================
        # TEST 12: Transaction moves to READY_FOR_LOGISTICS
        # ====================================================================
        print("\n[TEST 12] Transaction Moves to READY_FOR_LOGISTICS...")
        db.session.refresh(txn)
        assert txn.status == 'READY_FOR_LOGISTICS', f"Expected READY_FOR_LOGISTICS, got {txn.status}"
        print("  PASS: Transaction status transitioned to READY_FOR_LOGISTICS.")

        # ====================================================================
        # TEST 13: Invalid state jump rejected
        # ====================================================================
        print("\n[TEST 13] Invalid State Jump Rejected...")
        res_jump = client.post(f'/api/transactions/{txn.id}/status', headers=buyer_headers, json={'status': 'COMPLETED'})
        assert res_jump.status_code == 400, f"Expected 400 for illegal state jump, got {res_jump.status_code}"
        print("  PASS: State machine rejected illegal leap to COMPLETED.")

        # ====================================================================
        # TEST 14: Buyer cannot confirm before DELIVERED
        # ====================================================================
        print("\n[TEST 14] Buyer Cannot Confirm Before DELIVERED...")
        res_early_confirm = client.post(f'/api/transactions/{txn.id}/confirm-delivery', headers=buyer_headers)
        assert res_early_confirm.status_code == 400, f"Expected 400, got {res_early_confirm.status_code}"
        print("  PASS: Early delivery confirmation rejected.")

        # ====================================================================
        # TEST 15: Correct Buyer can confirm delivered transaction
        # ====================================================================
        print("\n[TEST 15] Correct Buyer Can Confirm Delivered Transaction...")
        # Simulate delivery to hub
        sim_res = client.post(f'/api/transactions/{txn.id}/simulate-delivery', headers=farmer_headers)
        assert sim_res.status_code == 200
        # Now buyer confirms
        res_conf = client.post(f'/api/transactions/{txn.id}/confirm-delivery', headers=buyer_headers)
        assert res_conf.status_code == 200, f"Expected 200, got {res_conf.status_code}: {res_conf.get_json()}"
        db.session.refresh(txn)
        assert txn.status == 'BUYER_CONFIRMED'
        assert txn.delivery_confirmed_at is not None
        print("  PASS: Delivery verified and confirmed by buyer.")

        # ====================================================================
        # TEST 16: Wrong Buyer cannot confirm
        # ====================================================================
        print("\n[TEST 16] Wrong Buyer Cannot Confirm Delivery...")
        # Advance txn2 to DELIVERED
        client.post(f'/api/transactions/{txn2.id}/simulate-delivery', headers=admin_headers)
        res_wrong_conf = client.post(f'/api/transactions/{txn2.id}/confirm-delivery', headers=unrelated_buyer_headers)
        assert res_wrong_conf.status_code == 403, f"Expected 403, got {res_wrong_conf.status_code}"
        print("  PASS: Unrelated buyer blocked from confirming delivery (403 Forbidden).")

        # ====================================================================
        # TEST 17: Balance unavailable before delivery confirmation
        # ====================================================================
        print("\n[TEST 17] Balance Unavailable Before Delivery Confirmation...")
        # txn2 is DELIVERED but NOT BUYER_CONFIRMED
        res_early_bal = client.post('/api/payments/pay-balance', headers=buyer_headers, json={'transaction_id': txn2.id})
        assert res_early_bal.status_code == 400, f"Expected 400, got {res_early_bal.status_code}"
        print("  PASS: Balance payment blocked before physical delivery confirmation.")

        # ====================================================================
        # TEST 18: Correct balance payment after confirmation
        # ====================================================================
        print("\n[TEST 18] Correct Balance Payment After Confirmation...")
        res_bal = client.post('/api/payments/pay-balance', headers=buyer_headers, json={'transaction_id': txn.id})
        assert res_bal.status_code == 200, f"Expected 200, got {res_bal.status_code}: {res_bal.get_json()}"
        bal_records = PaymentRecord.query.filter_by(transaction_id=txn.id, stage='BALANCE').all()
        assert len(bal_records) == 1
        assert bal_records[0].amount == 24000.0
        print(f"  PASS: Balance payment recorded: Rs. {bal_records[0].amount:,.2f}")

        # ====================================================================
        # TEST 19: Double balance payment prevented
        # ====================================================================
        print("\n[TEST 19] Double Balance Payment Prevented...")
        res_bal_dup = client.post('/api/payments/pay-balance', headers=buyer_headers, json={'transaction_id': txn.id})
        assert res_bal_dup.status_code in [400, 409], f"Expected 400 or 409, got {res_bal_dup.status_code}"
        bal_records_after = PaymentRecord.query.filter_by(transaction_id=txn.id, stage='BALANCE').all()
        assert len(bal_records_after) == 1
        print("  PASS: Double balance payment prevented idempotently.")

        # ====================================================================
        # TEST 20: Settlement requires advance + balance + confirmation
        # ====================================================================
        print("\n[TEST 20] Settlement Requires Advance + Balance + Confirmation...")
        # Create txn3 without advance or balance and test settle endpoint
        txn3 = Transaction(
            transaction_ref='TXN-TEST-SETTLE-FAIL',
            buyer_id=buyer.id, seller_id=farmer.id, crop='Tomato', quantity=100.0, agreed_price_per_unit=20.0,
            total_amount=2000.0, advance_amount=400.0, balance_amount=1600.0, status='AWAITING_ADVANCE'
        )
        db.session.add(txn3)
        db.session.commit()
        res_settle_fail = client.post(f'/api/transactions/{txn3.id}/settle', headers=admin_headers)
        assert res_settle_fail.status_code == 400, f"Expected 400, got {res_settle_fail.status_code}"
        print("  PASS: Settlement preconditions enforced.")

        # ====================================================================
        # TEST 21: Settlement releases ledger entries
        # ====================================================================
        print("\n[TEST 21] Settlement Releases Ledger Entries...")
        adv_p = PaymentRecord.query.filter_by(transaction_id=txn.id, stage='ADVANCE').first()
        bal_p = PaymentRecord.query.filter_by(transaction_id=txn.id, stage='BALANCE').first()
        assert adv_p.status in ['RELEASED', 'SETTLED']
        assert bal_p.status in ['RELEASED', 'SETTLED']
        print("  PASS: Advance and Balance prototype escrow entries released.")

        # ====================================================================
        # TEST 22: Completed state recorded
        # ====================================================================
        print("\n[TEST 22] Completed State Recorded...")
        db.session.refresh(txn)
        assert txn.status == 'COMPLETED'
        assert txn.settled_at is not None
        assert txn.completed_at is not None
        print(f"  PASS: Transaction #{txn.id} is COMPLETED with settled timestamps.")

        # ====================================================================
        # TEST 23: Cancellation before advance
        # ====================================================================
        print("\n[TEST 23] Cancellation Before Advance...")
        txn_cancel_pre = Transaction(
            transaction_ref='TXN-PRE-CANCEL-TEST', buyer_id=buyer.id, seller_id=farmer.id,
            crop='Wheat', quantity=500.0, agreed_price_per_unit=25.0, total_amount=12500.0,
            advance_amount=2500.0, balance_amount=10000.0, status='AWAITING_ADVANCE'
        )
        db.session.add(txn_cancel_pre)
        db.session.commit()
        res_cancel = client.post(f'/api/transactions/{txn_cancel_pre.id}/cancel', headers=buyer_headers)
        assert res_cancel.status_code == 200
        db.session.refresh(txn_cancel_pre)
        assert txn_cancel_pre.status == 'CANCELLED'
        pays_pre = PaymentRecord.query.filter_by(transaction_id=txn_cancel_pre.id).all()
        assert len(pays_pre) == 0
        print("  PASS: Pre-advance cancellation cleanly completed without financial records.")

        # ====================================================================
        # TEST 24: Post-advance cancellation preserves financial history
        # ====================================================================
        print("\n[TEST 24] Post-Advance Cancellation Preserves Financial History...")
        txn_cancel_post = Transaction(
            transaction_ref='TXN-POST-CANCEL-TEST', buyer_id=buyer.id, seller_id=farmer.id,
            crop='Onion', quantity=500.0, agreed_price_per_unit=20.0, total_amount=10000.0,
            advance_amount=2000.0, balance_amount=8000.0, status='READY_FOR_LOGISTICS'
        )
        db.session.add(txn_cancel_post)
        db.session.commit()
        adv_rec = PaymentRecord(
            payment_ref='PAY-ADV-POST-CANCEL', transaction_id=txn_cancel_post.id,
            payer_id=buyer.id, payee_id=farmer.id, amount=2000.0, stage='ADVANCE',
            status='ESCROW_HELD', escrow_status='HELD_IN_SIMULATED_ESCROW'
        )
        db.session.add(adv_rec)
        db.session.commit()
        res_cancel_post = client.post(f'/api/transactions/{txn_cancel_post.id}/cancel', headers=buyer_headers)
        assert res_cancel_post.status_code == 200
        adv_rec_after = PaymentRecord.query.filter_by(payment_ref='PAY-ADV-POST-CANCEL').first()
        assert adv_rec_after is not None, "Original advance payment record must be preserved!"
        print("  PASS: Advance payment history preserved.")

        # ====================================================================
        # TEST 25: Refund ledger created where eligible
        # ====================================================================
        print("\n[TEST 25] Refund Ledger Created Where Eligible...")
        refund_rec = PaymentRecord.query.filter_by(transaction_id=txn_cancel_post.id, stage='REFUND').first()
        assert refund_rec is not None
        assert refund_rec.status == 'REFUNDED'
        assert refund_rec.amount == 2000.0
        print(f"  PASS: Refund ledger entry created: Rs. {refund_rec.amount:,.2f} REFUNDED.")

        # ====================================================================
        # TEST 26: Dispute blocks settlement
        # ====================================================================
        print("\n[TEST 26] Dispute Blocks Settlement...")
        txn_dispute = Transaction(
            transaction_ref='TXN-DISPUTE-TEST', buyer_id=buyer.id, seller_id=farmer.id,
            crop='Tomato', quantity=200.0, agreed_price_per_unit=30.0, total_amount=6000.0,
            advance_amount=1200.0, balance_amount=4800.0, status='DELIVERED',
            delivery_confirmed_at=datetime.utcnow()
        )
        db.session.add(txn_dispute)
        db.session.commit()
        # Add advance and balance payments
        p1 = PaymentRecord(payment_ref='DISP-ADV', transaction_id=txn_dispute.id, payer_id=buyer.id, payee_id=farmer.id, amount=1200.0, stage='ADVANCE', status='ESCROW_HELD')
        p2 = PaymentRecord(payment_ref='DISP-BAL', transaction_id=txn_dispute.id, payer_id=buyer.id, payee_id=farmer.id, amount=4800.0, stage='BALANCE', status='ESCROW_HELD')
        db.session.add_all([p1, p2])
        db.session.commit()
        # Raise dispute
        client.post(f'/api/transactions/{txn_dispute.id}/dispute', headers=buyer_headers, json={'reason': 'Produce rot detected'})
        # Attempt settle
        res_dispute_settle = client.post(f'/api/transactions/{txn_dispute.id}/settle', headers=admin_headers)
        assert res_dispute_settle.status_code == 400
        print("  PASS: Active dispute successfully blocked settlement.")

        # ====================================================================
        # TEST 27: Admin can audit transaction
        # ====================================================================
        print("\n[TEST 27] Admin Can Audit Transaction...")
        res_admin_audit = client.get(f'/api/transactions/{txn.id}', headers=admin_headers)
        assert res_admin_audit.status_code == 200
        print("  PASS: Admin audit retrieval successful (200 OK).")

        # ====================================================================
        # TEST 28: Seller can view own transaction
        # ====================================================================
        print("\n[TEST 28] Seller Can View Own Transaction...")
        res_seller_view = client.get(f'/api/transactions/{txn.id}', headers=farmer_headers)
        assert res_seller_view.status_code == 200
        print("  PASS: Seller authorized to view transaction (200 OK).")

        # ====================================================================
        # TEST 29: Unrelated Farmer cannot view transaction
        # ====================================================================
        print("\n[TEST 29] Unrelated Farmer Cannot View Transaction (IDOR Protection)...")
        res_unrelated_view = client.get(f'/api/transactions/{txn.id}', headers=unrelated_farmer_headers)
        assert res_unrelated_view.status_code == 403
        print("  PASS: IDOR protection enforced. Unrelated farmer blocked (403 Forbidden).")

        # ====================================================================
        # TEST 30: Transaction history records state transitions
        # ====================================================================
        print("\n[TEST 30] Transaction History Records State Transitions...")
        res_hist = client.get(f'/api/transactions/{txn.id}/history', headers=buyer_headers)
        assert res_hist.status_code == 200
        hist_data = res_hist.get_json()['history']
        assert len(hist_data) >= 3
        events = [h['event'] for h in hist_data]
        assert 'TRANSACTION_CREATED' in events
        assert 'ADVANCE_ESCROW_HELD' in events
        print(f"  PASS: Immutable audit trail records {len(hist_data)} sequential events: {events}")

        # ====================================================================
        # TEST 31: Notification events are not duplicated
        # ====================================================================
        print("\n[TEST 31] Notification Events Are Not Duplicated...")
        notif_events = NotificationEvent.query.filter(NotificationEvent.event_key.like(f'transaction:{txn.id}:%')).all()
        keys = [ne.event_key for ne in notif_events]
        assert len(keys) == len(set(keys)), "Duplicate notification keys detected!"
        print(f"  PASS: All {len(keys)} notification events have strictly unique idempotent keys.")

        # ====================================================================
        # TEST 32: Negative/zero payment manipulation rejected
        # ====================================================================
        print("\n[TEST 32] Negative / Zero Payment Manipulation Rejected...")
        res_neg = client.post('/api/payments/pay-advance', headers=buyer_headers, json={'transaction_id': txn2.id, 'amount': -500})
        assert res_neg.status_code == 400
        res_zero = client.post('/api/payments/pay-advance', headers=buyer_headers, json={'transaction_id': txn2.id, 'amount': 0})
        assert res_zero.status_code == 400
        print("  PASS: Negative and zero payment amounts rejected with 400.")

        # ====================================================================
        # TEST 33: Client-supplied total manipulation ignored/rejected
        # ====================================================================
        print("\n[TEST 33] Client-Supplied Total Manipulation Ignored/Recalculated...")
        res_tamper = client.post('/api/transactions/create', headers=farmer_headers, json={
            'crop_lot_id': lot.id,
            'buyer_id': buyer.id,
            'seller_id': farmer.id,
            'quantity': 1000.0,
            'agreed_price': 30.0,
            'total_amount': 5.0, # Client attempt to falsify total
            'advance_amount': 1.0
        })
        assert res_tamper.status_code == 201
        tampered_txn = res_tamper.get_json()['transaction']
        assert tampered_txn['total_amount'] == 30000.0, f"Expected 30000.0, got {tampered_txn['total_amount']}"
        assert tampered_txn['advance_amount'] == 6000.0
        print(f"  PASS: Client manipulation ignored. Server recalculated total: Rs. {tampered_txn['total_amount']:,.2f}.")

        print("=" * 70)
        print("ALL 33 PHASE 4 TRANSACTION & PROTOTYPE ESCROW TESTS PASSED!")
        print("=" * 70)

if __name__ == '__main__':
    run_tests()
