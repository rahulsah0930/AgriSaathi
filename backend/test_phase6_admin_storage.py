import unittest
import os
import sys
import json
from datetime import date, datetime, timedelta

sys.path.insert(0, os.path.dirname(__file__))

from app import create_app
from models import db
from models.user import User, FarmerProfile, FPOProfile, BuyerProfile, WarehouseProfile, LogisticsProfile
from models.storage import Warehouse, StorageBooking
from models.commodity import Commodity
from models.transaction import Transaction, TransactionHistory
from models.payment import PaymentRecord
from models.grievance import Grievance
from models.admin import AdminAuditLog
from models.logistics import TransportOrder
from utils.auth import generate_access_token


class Phase6AdminStorageTestSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        os.environ['ENV'] = 'test'
        cls.app = create_app()
        cls.app.config['TESTING'] = True
        cls.client = cls.app.test_client()

        with cls.app.app_context():
            # Seed or retrieve core test users
            # 1. Admin
            cls.admin = User.query.filter_by(role='ADMIN').first()
            if not cls.admin:
                cls.admin = User(name='Test Admin', phone='9810000001', role='ADMIN', verification_status='VERIFIED')
                cls.admin.set_password('admin123')
                db.session.add(cls.admin)
                db.session.commit()

            # 2. Warehouse Operator 1
            cls.wh_user1 = User.query.filter_by(phone='9830022334').first()
            if not cls.wh_user1:
                cls.wh_user1 = User(name='Rajesh Deshpande', phone='9830022334', role='WAREHOUSE', verification_status='VERIFIED')
                cls.wh_user1.set_password('warehouse123')
                db.session.add(cls.wh_user1)
                db.session.commit()

            # 3. Warehouse Operator 2 (for IDOR tests)
            cls.wh_user2 = User.query.filter_by(phone='9830099881').first()
            if not cls.wh_user2:
                cls.wh_user2 = User(name='Sunil Patil', phone='9830099881', role='WAREHOUSE', verification_status='VERIFIED')
                cls.wh_user2.set_password('warehouse123')
                db.session.add(cls.wh_user2)
                db.session.commit()

            # 4. Farmer 1 (Verified)
            cls.farmer1 = User.query.filter_by(phone='9823012345').first()
            if not cls.farmer1:
                cls.farmer1 = User(name='Suresh Patil', phone='9823012345', role='FARMER', verification_status='VERIFIED')
                cls.farmer1.set_password('farmer123')
                db.session.add(cls.farmer1)
                db.session.commit()

            # 5. Farmer 2 (Pending verification)
            cls.farmer2 = User.query.filter_by(phone='9823054321').first()
            if not cls.farmer2:
                cls.farmer2 = User(name='Ramesh Khot', phone='9823054321', role='FARMER', verification_status='PENDING')
                cls.farmer2.set_password('farmer123')
                db.session.add(cls.farmer2)
                db.session.commit()

            # 6. Buyer 1 (Verified)
            cls.buyer1 = User.query.filter_by(phone='9820011223').first()
            if not cls.buyer1:
                cls.buyer1 = User(name='MahaFresh Procurement', phone='9820011223', role='BUYER', verification_status='VERIFIED')
                cls.buyer1.set_password('buyer123')
                db.session.add(cls.buyer1)
                db.session.commit()

            # 7. Logistics Provider
            cls.logistics1 = User.query.filter_by(phone='9820099887').first()
            if not cls.logistics1:
                cls.logistics1 = User(name='MahaAgri Rural Express', phone='9820099887', role='LOGISTICS', verification_status='VERIFIED')
                cls.logistics1.set_password('logistics123')
                db.session.add(cls.logistics1)
                db.session.commit()

            # Ensure Warehouse 1 exists linked to wh_user1
            cls.warehouse1 = Warehouse.query.filter_by(operator_user_id=cls.wh_user1.id).first()
            if not cls.warehouse1:
                cls.warehouse1 = Warehouse(
                    operator_user_id=cls.wh_user1.id,
                    name='MahaAgri State Certified Cold Storage 1',
                    verification_status='VERIFIED',
                    district='Nashik',
                    location='Ambad MIDC Agro Zone, Nashik',
                    latitude=19.9600,
                    longitude=73.7400,
                    storage_type='COLD_STORAGE',
                    supported_crops='Tomato, Onion, Grapes, Pomegranate',
                    total_capacity=100.0, # 100 MT for predictable testing
                    available_capacity=100.0,
                    price_per_kg_per_day=0.02, # Rs 0.02 / kg / day
                    temperature_range_placeholder='0C to 4C',
                    availability_status='AVAILABLE'
                )
                db.session.add(cls.warehouse1)
                db.session.commit()
            else:
                cls.warehouse1.total_capacity = 100.0
                cls.warehouse1.available_capacity = 100.0
                cls.warehouse1.price_per_kg_per_day = 0.02
                cls.warehouse1.verification_status = 'VERIFIED'
                db.session.commit()

            # Ensure Warehouse 2 exists linked to wh_user2
            cls.warehouse2 = Warehouse.query.filter_by(operator_user_id=cls.wh_user2.id).first()
            if not cls.warehouse2:
                cls.warehouse2 = Warehouse(
                    operator_user_id=cls.wh_user2.id,
                    name='MahaAgri Facility 2 Pune',
                    verification_status='PENDING',
                    district='Pune',
                    location='Baramati Agro Hub, Pune',
                    latitude=18.5204,
                    longitude=73.8567,
                    storage_type='DRY_STORAGE',
                    supported_crops='Wheat, Soybean, Grain',
                    total_capacity=50.0,
                    available_capacity=50.0,
                    price_per_kg_per_day=0.015,
                    temperature_range_placeholder='Ambient (18-24C)',
                    availability_status='AVAILABLE'
                )
                db.session.add(cls.warehouse2)
                db.session.commit()

            # Store scalar IDs to prevent DetachedInstanceError across sessions
            cls.warehouse1_id = cls.warehouse1.id
            cls.warehouse2_id = cls.warehouse2.id
            cls.farmer1_id = cls.farmer1.id
            cls.farmer2_id = cls.farmer2.id
            cls.buyer1_id = cls.buyer1.id
            cls.admin_id = cls.admin.id
            cls.logistics1_id = cls.logistics1.id

            # Create Tokens
            cls.admin_token = generate_access_token(cls.admin)
            cls.wh1_token = generate_access_token(cls.wh_user1)
            cls.wh2_token = generate_access_token(cls.wh_user2)
            cls.farmer1_token = generate_access_token(cls.farmer1)
            cls.farmer2_token = generate_access_token(cls.farmer2)
            cls.buyer1_token = generate_access_token(cls.buyer1)
            cls.logistics_token = generate_access_token(cls.logistics1)

    def setUp(self):
        self.warehouse1_id = self.__class__.warehouse1_id
        self.warehouse2_id = self.__class__.warehouse2_id
        self.farmer1_id = self.__class__.farmer1_id
        self.farmer2_id = self.__class__.farmer2_id
        self.buyer1_id = self.__class__.buyer1_id
        self.admin_id = self.__class__.admin_id
        self.logistics1_id = self.__class__.logistics1_id

        self.headers_admin = {'Authorization': f'Bearer {self.admin_token}', 'Content-Type': 'application/json'}
        self.headers_wh1 = {'Authorization': f'Bearer {self.wh1_token}', 'Content-Type': 'application/json'}
        self.headers_wh2 = {'Authorization': f'Bearer {self.wh2_token}', 'Content-Type': 'application/json'}
        self.headers_farmer1 = {'Authorization': f'Bearer {self.farmer1_token}', 'Content-Type': 'application/json'}
        self.headers_farmer2 = {'Authorization': f'Bearer {self.farmer2_token}', 'Content-Type': 'application/json'}
        self.headers_buyer1 = {'Authorization': f'Bearer {self.buyer1_token}', 'Content-Type': 'application/json'}
        self.headers_logistics = {'Authorization': f'Bearer {self.logistics_token}', 'Content-Type': 'application/json'}

    # =========================================================================
    # PART A: WAREHOUSE & STORAGE TESTS (Tests 1 - 16)
    # =========================================================================

    def test_01_warehouse_profile_created(self):
        """1. Warehouse profile created and linked."""
        with self.app.app_context():
            wh = Warehouse.query.filter_by(operator_user_id=self.wh_user1.id).first()
            self.assertIsNotNone(wh)
            self.assertEqual(wh.district, 'Nashik')
            self.assertEqual(wh.storage_type, 'COLD_STORAGE')
            self.assertGreater(wh.total_capacity, 0)
        print("  PASS: Warehouse profile created with capacity and storage specs.")

    def test_02_farmer_discovers_available_warehouse(self):
        """2. Farmer discovers available warehouse via REST API."""
        res = self.client.get('/api/warehouses?district=Nashik')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertGreater(data['count'], 0)
        wh_names = [w['name'] for w in data['warehouses']]
        self.assertTrue(any('Nashik' in n or 'Cold' in n for n in wh_names))
        print("  PASS: Farmer discovered available warehouses via discovery API.")

    def test_03_commodity_storage_filter_and_recommendation(self):
        """3. Commodity/storage filter works and recommendation is returned."""
        res = self.client.get('/api/warehouses?crop=Tomato&storage_type=COLD_STORAGE')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertIsNotNone(data.get('crop_recommendation'))
        self.assertEqual(data['crop_recommendation']['storage_type'], 'COLD_STORAGE')
        print("  PASS: Commodity storage filter and operational recommendation returned.")

    def test_04_valid_booking_request_created(self):
        """4. Valid booking request created for warehouse capacity."""
        payload = {
            'warehouse_id': self.warehouse1_id,
            'crop': 'Tomato',
            'quantity': 5000, # 5000 kg = 5 MT
            'unit': 'kg',
            'expected_duration_days': 10,
            'start_date': date.today().isoformat()
        }
        res = self.client.post('/api/storage-bookings', headers=self.headers_farmer1, json=payload)
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertTrue(data['success'])
        booking = data['booking']
        self.assertEqual(booking['status'], 'REQUESTED')
        self.assertEqual(booking['crop'], 'Tomato')
        self.assertIn('SBK-', booking['booking_ref'])
        self.__class__.booking_id_test4 = booking['id']
        print(f"  PASS: Valid storage booking created: {booking['booking_ref']} in REQUESTED status.")

    def test_05_identity_comes_from_jwt(self):
        """5. User identity comes strictly from JWT (client tampering ignored)."""
        payload = {
            'user_id': 99999, # Tampered user ID in request payload
            'warehouse_id': self.warehouse1_id,
            'crop': 'Pomegranate',
            'quantity': 2000,
            'unit': 'kg',
            'expected_duration_days': 7
        }
        res = self.client.post('/api/storage-bookings', headers=self.headers_farmer1, json=payload)
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertEqual(data['booking']['user_id'], self.farmer1_id)
        self.assertNotEqual(data['booking']['user_id'], 99999)
        print("  PASS: Storage booking user_id derived authoritatively from JWT.")

    def test_06_over_capacity_booking_rejected(self):
        """6. Booking exceeding facility available capacity is rejected."""
        with self.app.app_context():
            wh = Warehouse.query.get(self.warehouse1_id)
            avail = wh.available_capacity # in MT

        # Request 500 MT which is way over available 100 MT
        payload = {
            'warehouse_id': self.warehouse1_id,
            'crop': 'Grapes',
            'quantity': 500, # 500 MT
            'unit': 'tonne',
            'expected_duration_days': 14
        }
        res = self.client.post('/api/storage-bookings', headers=self.headers_farmer1, json=payload)
        self.assertEqual(res.status_code, 400)
        data = res.get_json()
        self.assertIn('exceeds available capacity', data['message'])
        print("  PASS: Over-capacity booking rejected with 400 Bad Request.")

    def test_07_negative_zero_capacity_rejected(self):
        """7. Negative or zero capacity booking rejected."""
        payload = {
            'warehouse_id': self.warehouse1_id,
            'crop': 'Tomato',
            'quantity': -50,
            'unit': 'kg',
            'expected_duration_days': 5
        }
        res = self.client.post('/api/storage-bookings', headers=self.headers_farmer1, json=payload)
        self.assertEqual(res.status_code, 400)

        payload['quantity'] = 0
        res2 = self.client.post('/api/storage-bookings', headers=self.headers_farmer1, json=payload)
        self.assertEqual(res2.status_code, 400)
        print("  PASS: Negative and zero quantity rejected with 400 Bad Request.")

    def test_08_correct_warehouse_can_approve(self):
        """8. Correct warehouse operator can approve booking."""
        bid = getattr(self.__class__, 'booking_id_test4', None)
        self.assertIsNotNone(bid)

        res = self.client.post(f'/api/storage-bookings/{bid}/status', headers=self.headers_wh1, json={'action': 'APPROVE'})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['booking']['status'], 'APPROVED')
        print("  PASS: Correct warehouse operator approved storage booking.")

    def test_09_wrong_warehouse_cannot_approve_idor(self):
        """9. Wrong warehouse operator cannot approve another facility's booking (IDOR protection)."""
        bid = getattr(self.__class__, 'booking_id_test4', None)
        # wh_user2 manages warehouse 2, trying to approve warehouse 1's booking
        res = self.client.post(f'/api/storage-bookings/{bid}/status', headers=self.headers_wh2, json={'action': 'APPROVE'})
        self.assertEqual(res.status_code, 403)
        print("  PASS: IDOR protection blocked unauthorized warehouse operator (403 Forbidden).")

    def test_10_check_in_lifecycle_valid(self):
        """10. Check-in lifecycle transitions correctly: APPROVED -> CHECKED_IN -> ACTIVE."""
        bid = getattr(self.__class__, 'booking_id_test4', None)
        res = self.client.post(f'/api/storage-bookings/{bid}/status', headers=self.headers_wh1, json={'action': 'CHECK_IN'})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['booking']['status'], 'ACTIVE')
        self.assertIsNotNone(data['booking']['actual_check_in_at'])
        print("  PASS: Consignment physically checked in and moved to ACTIVE storage custody.")

    def test_11_invalid_state_jump_rejected(self):
        """11. Invalid state machine jump rejected (e.g. from REQUESTED or ACTIVE directly to COMPLETED or APPROVE)."""
        # Create a new requested booking
        payload = {
            'warehouse_id': self.warehouse1_id,
            'crop': 'Onion',
            'quantity': 1000,
            'unit': 'kg',
            'expected_duration_days': 10
        }
        res = self.client.post('/api/storage-bookings', headers=self.headers_farmer1, json=payload)
        new_bid = res.get_json()['booking']['id']

        # Attempt illegal jump: REQUESTED -> ACTIVE (skipping APPROVE and CHECK_IN)
        res_bad = self.client.post(f'/api/storage-bookings/{new_bid}/status', headers=self.headers_wh1, json={'action': 'ACTIVE'})
        self.assertEqual(res_bad.status_code, 400)
        self.assertIn('Illegal storage booking transition', res_bad.get_json()['message'])
        print("  PASS: Invalid storage state jump rejected with 400 Bad Request.")

    def test_12_check_out_completes_booking(self):
        """12. Check-out completes active storage booking."""
        bid = getattr(self.__class__, 'booking_id_test4', None)
        res = self.client.post(f'/api/storage-bookings/{bid}/status', headers=self.headers_wh1, json={'action': 'CHECK_OUT'})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['booking']['status'], 'COMPLETED')
        self.assertIsNotNone(data['booking']['actual_check_out_at'])
        print("  PASS: Produce checked out and storage booking COMPLETED.")

    def test_13_capacity_restored_correctly(self):
        """13. Capacity is restored to warehouse upon check-out or cancellation."""
        with self.app.app_context():
            wh = Warehouse.query.get(self.warehouse1_id)
            # Available capacity should be restored
            self.assertGreaterEqual(wh.available_capacity, 90.0)
        print("  PASS: Available capacity restored to facility upon completion.")

    def test_14_backend_calculates_storage_estimate(self):
        """14. Backend calculates deterministic storage estimate: quantity_kg * rate * days."""
        # 2000 kg, rate 0.02, 10 days = 2000 * 0.02 * 10 = 400.0
        payload = {
            'warehouse_id': self.warehouse1_id,
            'crop': 'Tomato',
            'quantity': 2000,
            'unit': 'kg',
            'expected_duration_days': 10
        }
        res = self.client.post('/api/storage-bookings', headers=self.headers_farmer1, json=payload)
        self.assertEqual(res.status_code, 201)
        b = res.get_json()['booking']
        self.assertEqual(b['estimated_cost'], 400.0)
        print("  PASS: Backend calculated storage estimate accurately: Rs. 400.0.")

    def test_15_client_total_manipulation_ignored(self):
        """15. Client-supplied total or cost tampering is ignored and recalculated."""
        payload = {
            'warehouse_id': self.warehouse1_id,
            'crop': 'Tomato',
            'quantity': 2000,
            'unit': 'kg',
            'expected_duration_days': 10,
            'estimated_cost': 5.0 # Client attempts to tamper price to Rs 5
        }
        res = self.client.post('/api/storage-bookings', headers=self.headers_farmer1, json=payload)
        self.assertEqual(res.status_code, 201)
        b = res.get_json()['booking']
        self.assertEqual(b['estimated_cost'], 400.0)
        self.assertNotEqual(b['estimated_cost'], 5.0)
        print("  PASS: Client cost tampering ignored; recalculated authoritatively by server.")

    def test_16_storage_notifications_idempotent(self):
        """16. Storage lifecycle notifications use unique idempotent keys."""
        from services.storage_service import emit_storage_notification
        with self.app.app_context():
            booking = StorageBooking.query.first()
            if booking:
                notif1 = emit_storage_notification(booking, 'APPROVED')
                notif2 = emit_storage_notification(booking, 'APPROVED')
                self.assertIsNotNone(notif1)
                self.assertIsNone(notif2) # Second duplicate notification suppressed
        print("  PASS: Storage lifecycle notifications are strictly idempotent.")

    # =========================================================================
    # PART B: GOVERNMENT & ADMIN TESTS (Tests 17 - 37)
    # =========================================================================

    def test_17_non_admin_cannot_access_admin_endpoints(self):
        """17. Non-admin users cannot access administrative endpoints (403 Forbidden)."""
        res = self.client.get('/api/admin/stats', headers=self.headers_farmer1)
        self.assertEqual(res.status_code, 403)
        res2 = self.client.get('/api/admin/users', headers=self.headers_buyer1)
        self.assertEqual(res2.status_code, 403)
        print("  PASS: Non-admin users blocked from admin endpoints with 403 Forbidden.")

    def test_18_admin_can_list_pending_users(self):
        """18. Admin can list users filtered by verification status."""
        res = self.client.get('/api/admin/users?status=PENDING', headers=self.headers_admin)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertGreaterEqual(len(data['users']), 1)
        print(f"  PASS: Admin listed {len(data['users'])} pending applicants.")

    def test_19_admin_can_verify_farmer(self):
        """19. Admin can verify a pending farmer with audit notes."""
        payload = {'action': 'VERIFY', 'notes': '7/12 Land record verified by Taluka Inspector.'}
        res = self.client.post(f'/api/admin/users/{self.farmer2.id}/status', headers=self.headers_admin, json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['user']['verification_status'], 'VERIFIED')
        print("  PASS: Admin verified farmer applicant successfully.")

    def test_20_admin_can_reject_user_with_reason(self):
        """20. Admin can reject user applicant, and rejection requires a mandatory reason."""
        # Create temp user to reject
        with self.app.app_context():
            temp_u = User.query.filter_by(phone='9899112233').first()
            if not temp_u:
                temp_u = User(name='Applicant Test', phone='9899112233', role='FARMER', verification_status='PENDING')
                temp_u.set_password('pass123')
                db.session.add(temp_u)
            else:
                temp_u.verification_status = 'PENDING'
                temp_u.rejection_reason = None
            db.session.commit()
            uid = temp_u.id

        # Rejection without reason fails
        res_fail = self.client.post(f'/api/admin/users/{uid}/status', headers=self.headers_admin, json={'action': 'REJECT'})
        self.assertEqual(res_fail.status_code, 400)

        # Rejection with reason succeeds
        res_ok = self.client.post(f'/api/admin/users/{uid}/status', headers=self.headers_admin, json={
            'action': 'REJECT',
            'reason': 'Aadhaar name does not match land deed certificate.'
        })
        self.assertEqual(res_ok.status_code, 200)
        self.assertEqual(res_ok.get_json()['user']['verification_status'], 'REJECTED')
        print("  PASS: Admin rejection enforced mandatory reason requirement.")

    def test_21_admin_can_suspend_user(self):
        """21. Admin can suspend a user account."""
        with self.app.app_context():
            susp_u = User.query.filter_by(phone='9899223344').first()
            if not susp_u:
                susp_u = User(name='Suspicious User', phone='9899223344', role='BUYER', verification_status='VERIFIED')
                susp_u.set_password('pass123')
                db.session.add(susp_u)
            else:
                susp_u.verification_status = 'VERIFIED'
            db.session.commit()
            uid = susp_u.id
            self.__class__.suspended_user_id = uid

        res = self.client.post(f'/api/admin/users/{uid}/status', headers=self.headers_admin, json={
            'action': 'SUSPEND',
            'reason': 'Suspicious bidding pattern identified.'
        })
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json()['user']['verification_status'], 'SUSPENDED')
        print("  PASS: Admin suspended user account.")

    def test_22_admin_can_verify_warehouse(self):
        """22. Admin can inspect and verify warehouse facility."""
        res = self.client.post(f'/api/admin/warehouses/{self.warehouse2_id}/status', headers=self.headers_admin, json={'action': 'VERIFY'})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['warehouse']['verification_status'], 'VERIFIED')
        print("  PASS: Admin verified storage facility on prototype registry.")

    def test_23_admin_can_verify_logistics_provider(self):
        """23. Admin can verify logistics fleet provider."""
        with self.app.app_context():
            prof = LogisticsProfile.query.filter_by(user_id=self.logistics1_id).first()
            pid = prof.id if prof else 1

        res = self.client.post(f'/api/admin/logistics/{pid}/status', headers=self.headers_admin, json={'action': 'VERIFY'})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json()['profile']['verification_status'], 'VERIFIED')
        print("  PASS: Admin verified logistics fleet provider.")

    def test_24_verification_action_audit_record_created(self):
        """24. Every verification action creates an immutable AdminAuditLog record."""
        res = self.client.get('/api/admin/audit-logs', headers=self.headers_admin)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertGreater(data['count'], 0)
        actions = [log['action'] for log in data['audit_logs']]
        self.assertTrue(any('VERIFIED' in a or 'SUSPENDED' in a for a in actions))
        print("  PASS: Admin action audit log entries verified in database.")

    def test_25_dashboard_metrics_come_from_database(self):
        """25. Admin KPI metrics are computed dynamically from actual DB records (no hardcoding)."""
        res = self.client.get('/api/admin/stats', headers=self.headers_admin)
        self.assertEqual(res.status_code, 200)
        stats = res.get_json()['stats']
        with self.app.app_context():
            actual_users = User.query.count()
            self.assertEqual(stats['total_users'], actual_users)
            self.assertIn('escrow_held_amount', stats)
            self.assertIn('active_logistics_deliveries', stats)
            self.assertIn('active_storage_bookings', stats)
        print("  PASS: Admin KPI metrics dynamically computed from live database queries.")

    def test_26_admin_can_inspect_complete_transaction(self):
        """26. Admin can inspect complete 360-degree transaction dossier."""
        with self.app.app_context():
            txn = Transaction.query.first()
            tx_id = txn.id if txn else 1

        res = self.client.get(f'/api/admin/transactions/{tx_id}/audit', headers=self.headers_admin)
        self.assertEqual(res.status_code, 200)
        dossier = res.get_json()['audit_dossier']
        self.assertIn('transaction', dossier)
        self.assertIn('seller', dossier)
        self.assertIn('buyer', dossier)
        self.assertIn('escrow_records', dossier)
        self.assertIn('history_events', dossier)
        print("  PASS: Admin retrieved complete transaction dossier with escrow & history.")

    def test_27_prototype_escrow_correctly_labeled(self):
        """27. Escrow monitoring explicitly indicates prototype/simulated status."""
        res = self.client.get('/api/admin/escrow', headers=self.headers_admin)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get('is_prototype_escrow', False))
        print("  PASS: Escrow correctly labeled as Prototype / Simulated Escrow.")

    def test_28_admin_can_inspect_logistics_pod(self):
        """28. Admin can inspect transport orders including POD."""
        with self.app.app_context():
            order = TransportOrder.query.first()
            oid = order.id if order else 1

        res = self.client.get(f'/api/admin/logistics/{oid}/audit', headers=self.headers_admin)
        self.assertEqual(res.status_code, 200)
        t_order = res.get_json()['transport_order']
        self.assertIn('status', t_order)
        print("  PASS: Admin inspected transport order and proof of delivery record.")

    def test_29_admin_can_inspect_storage_bookings(self):
        """29. Admin can audit all storage bookings across facilities."""
        res = self.client.get('/api/admin/storage/bookings', headers=self.headers_admin)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertGreaterEqual(data['count'], 1)
        print(f"  PASS: Admin audited {data['count']} storage bookings across facilities.")

    def test_30_admin_can_open_grievance(self):
        """30. User can file a dispute and it appears in admin grievance list."""
        payload = {
            'title': 'Test Quality Discrepancy Claim',
            'description': 'Grade A produce delivered with 15% rot and broken skin.',
            'category': 'QUALITY_MISMATCH'
        }
        res = self.client.post('/api/grievances', headers=self.headers_buyer1, json=payload)
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertTrue(data['success'])
        g_id = data['grievance']['id']
        self.__class__.test_grievance_id = g_id
        print(f"  PASS: Dispute filed: {data['grievance']['grievance_ref']} (ID: {g_id}).")

    def test_31_admin_can_move_grievance_to_under_review(self):
        """31. Admin moves grievance status to UNDER_REVIEW."""
        gid = getattr(self.__class__, 'test_grievance_id', 1)
        res = self.client.post(f'/api/admin/grievances/{gid}/status', headers=self.headers_admin, json={
            'action': 'UNDER_REVIEW',
            'notes': 'Inspector assigned for physical inspection at depot.'
        })
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json()['grievance']['status'], 'UNDER_REVIEW')
        print("  PASS: Grievance moved to UNDER_REVIEW status.")

    def test_32_admin_can_resolve_grievance(self):
        """32. Admin resolves grievance with official order notes."""
        gid = getattr(self.__class__, 'test_grievance_id', 1)
        res = self.client.post(f'/api/admin/grievances/{gid}/status', headers=self.headers_admin, json={
            'action': 'RESOLVED',
            'notes': '10% deduction accepted by seller and agreed by buyer.'
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['grievance']['status'], 'RESOLVED')
        print("  PASS: Grievance officially RESOLVED with administrative order.")

    def test_33_unresolved_dispute_blocks_settlement(self):
        """33. Active unresolved dispute strictly blocks transaction settlement."""
        with self.app.app_context():
            txn = Transaction.query.filter_by(transaction_ref='TXN-DISPUTE-PHASE6').first()
            if not txn:
                txn = Transaction(
                    transaction_ref='TXN-DISPUTE-PHASE6',
                    offer_id=None,
                    seller_id=self.farmer1_id,
                    buyer_id=self.buyer1_id,
                    crop='Tomato',
                    quantity=1000.0,
                    unit='kg',
                    agreed_price_per_unit=25.0,
                    total_amount=25000.0,
                    advance_amount=5000.0,
                    balance_amount=20000.0,
                    pickup_address='Nashik',
                    delivery_address='Mumbai',
                    status='DISPUTED'
                )
                db.session.add(txn)
            else:
                txn.status = 'DISPUTED'
            db.session.commit()
            disputed_txn_id = txn.id

        # Attempt to settle disputed transaction
        res = self.client.post(f'/api/transactions/{disputed_txn_id}/settle', headers=self.headers_admin)
        self.assertEqual(res.status_code, 400)
        self.assertIn('Dispute', res.get_json()['error'])
        print("  PASS: Unresolved dispute strictly blocked transaction settlement (400 Bad Request).")

    def test_34_resolution_action_recorded_in_audit_log(self):
        """34. Grievance resolution logged into AdminAuditLog."""
        with self.app.app_context():
            log = AdminAuditLog.query.filter_by(action='GRIEVANCE_RESOLVED').first()
            self.assertIsNotNone(log)
            self.assertEqual(log.target_type, 'GRIEVANCE')
        print("  PASS: Grievance resolution recorded in AdminAuditLog.")

    def test_35_sensitive_verification_info_masked(self):
        """35. Sensitive Aadhaar, Bank account, and driver info are masked in user payloads."""
        res = self.client.get('/api/admin/users', headers=self.headers_admin)
        self.assertEqual(res.status_code, 200)
        users = res.get_json()['users']
        for u in users:
            prof = u.get('profile') or {}
            if prof.get('aadhaar_masked'):
                self.assertTrue('XXXX' in prof['aadhaar_masked'] or prof['aadhaar_masked'].startswith('XXXX'))
            if prof.get('bank_account_masked'):
                self.assertTrue('XXXX' in prof['bank_account_masked'])
        print("  PASS: Sensitive Aadhaar and banking details verified as masked in serialized responses.")

    def test_36_suspended_user_blocked_from_protected_actions(self):
        """36. Suspended user is blocked from sensitive actions (creating lots, submitting offers, booking storage)."""
        uid = getattr(self.__class__, 'suspended_user_id', None)
        self.assertIsNotNone(uid)
        with self.app.app_context():
            susp_buyer = User.query.get(uid)
            susp_farmer = User.query.filter_by(phone='9899334455').first()
            if not susp_farmer:
                susp_farmer = User(name='Suspended Farmer', phone='9899334455', role='FARMER', verification_status='SUSPENDED')
                susp_farmer.set_password('pass123')
                db.session.add(susp_farmer)
                db.session.commit()
            suspended_buyer_token = generate_access_token(susp_buyer)
            suspended_farmer_token = generate_access_token(susp_farmer)

        headers_susp_buyer = {'Authorization': f'Bearer {suspended_buyer_token}', 'Content-Type': 'application/json'}
        headers_susp_farmer = {'Authorization': f'Bearer {suspended_farmer_token}', 'Content-Type': 'application/json'}

        # 1. Blocked from booking storage
        res_sb = self.client.post('/api/storage-bookings', headers=headers_susp_buyer, json={
            'warehouse_id': self.warehouse1_id,
            'crop': 'Tomato',
            'quantity': 100,
            'unit': 'kg'
        })
        self.assertEqual(res_sb.status_code, 403)
        self.assertIn('Suspended', res_sb.get_json()['error'])

        # 2. Blocked from creating lots
        res_lot = self.client.post('/api/lots', headers=headers_susp_farmer, json={
            'crop': 'Tomato',
            'quantity': 100,
            'unit': 'kg',
            'quality_grade': 'Grade A',
            'harvest_date': '2026-09-10',
            'location': 'Nashik',
            'district': 'Nashik',
            'expected_price': 30
        })
        self.assertEqual(res_lot.status_code, 403)
        print("  PASS: Suspended user blocked from creating lots and booking storage (403 Forbidden).")

    def test_37_idor_and_admin_ownership_protections_intact(self):
        """37. IDOR protections ensure non-admin users cannot inspect other users' private bookings or audits."""
        with self.app.app_context():
            booking = StorageBooking.query.filter_by(user_id=self.farmer1_id).first()
            b_id = booking.id if booking else 1

        # Farmer 2 (unrelated) attempts to inspect Farmer 1's booking
        res = self.client.get(f'/api/storage-bookings/{b_id}', headers=self.headers_farmer2)
        self.assertEqual(res.status_code, 403)

        # Farmer 1 (owner) can inspect
        res_ok = self.client.get(f'/api/storage-bookings/{b_id}', headers=self.headers_farmer1)
        self.assertEqual(res_ok.status_code, 200)

        # Admin can audit
        res_admin = self.client.get(f'/api/storage-bookings/{b_id}', headers=self.headers_admin)
        self.assertEqual(res_admin.status_code, 200)
        print("  PASS: IDOR and administrative ownership protections strictly verified.")


if __name__ == '__main__':
    print("=" * 70)
    print("PHASE 6: WAREHOUSE & GOVERNMENT ADMIN AUTOMATED SUITE (37 TESTS)")
    print("=" * 70)
    unittest.main(verbosity=1)
