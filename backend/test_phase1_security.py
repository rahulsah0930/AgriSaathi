import unittest
import json
import time
import jwt
from datetime import datetime, timezone, timedelta
from app import create_app
from models import db
from models.user import User
from config import Config

class Phase1SecurityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.app.config['TESTING'] = True
        cls.client = cls.app.test_client()

        with cls.app.app_context():
            # Verify database has seed users
            farmer = User.query.filter_by(phone='9823012345').first()
            buyer = User.query.filter_by(phone='9820011223').first()
            admin = User.query.filter_by(phone='9810000001').first()
            assert farmer is not None, "Farmer seed user missing"
            assert buyer is not None, "Buyer seed user missing"
            assert admin is not None, "Admin seed user missing"

    def get_jwt_token(self, phone, password, role):
        res = self.client.post('/api/auth/login', json={
            'phone': phone,
            'password': password,
            'role': role
        })
        self.assertEqual(res.status_code, 200, f"Login failed for {phone}: {res.get_json()}")
        data = res.get_json()
        self.assertIn('token', data)
        return data['token'], data['user']

    def test_01_correct_login(self):
        """Test correct credentials return a valid JWT token and user info"""
        token, user = self.get_jwt_token('9823012345', 'farmer123', 'FARMER')
        self.assertIsNotNone(token)
        self.assertEqual(user['role'], 'FARMER')
        self.assertEqual(user['phone'], '9823012345')

        # Verify decoded JWT structure
        secret = Config.JWT_SECRET_KEY
        payload = jwt.decode(token, secret, algorithms=['HS256'])
        self.assertEqual(payload['user_id'], user['id'])
        self.assertEqual(payload['role'], 'FARMER')
        self.assertIn('exp', payload)

    def test_02_incorrect_password(self):
        """Test incorrect credentials return 401 Unauthorized"""
        res = self.client.post('/api/auth/login', json={
            'phone': '9823012345',
            'password': 'completely_wrong_password',
            'role': 'FARMER'
        })
        self.assertEqual(res.status_code, 401)
        data = res.get_json()
        self.assertFalse(data.get('success', True))
        self.assertIn('Invalid', data.get('message', ''))

    def test_03_invalid_token(self):
        """Test tampered or garbage token returns 401 Unauthorized"""
        headers = {'Authorization': 'Bearer invalid.tampered.jwttoken'}
        res = self.client.get('/api/auth/me', headers=headers)
        self.assertEqual(res.status_code, 401)
        data = res.get_json()
        self.assertIn('Invalid token', data.get('message', ''))

    def test_04_expired_token(self):
        """Test expired JWT token returns 401 Unauthorized"""
        # Craft an expired token
        expired_payload = {
            'sub': '1',
            'user_id': 1,
            'role': 'FARMER',
            'phone': '9823012345',
            'exp': datetime.now(timezone.utc) - timedelta(hours=1),
            'iat': datetime.now(timezone.utc) - timedelta(hours=2)
        }
        expired_token = jwt.encode(expired_payload, Config.JWT_SECRET_KEY, algorithm='HS256')

        headers = {'Authorization': f'Bearer {expired_token}'}
        res = self.client.get('/api/auth/me', headers=headers)
        self.assertEqual(res.status_code, 401)
        data = res.get_json()
        self.assertIn('expired', data.get('message', '').lower())

    def test_05_missing_token_on_protected_endpoints(self):
        """Test accessing protected endpoints without token returns 401"""
        # Protected user endpoint
        res = self.client.get('/api/auth/me')
        self.assertEqual(res.status_code, 401)

        # Protected admin endpoint
        res_admin = self.client.get('/api/admin/stats')
        self.assertEqual(res_admin.status_code, 401)

        # Protected creation endpoint
        res_lot = self.client.post('/api/lots', json={'commodity': 'Tomato'})
        self.assertEqual(res_lot.status_code, 401)

    def test_06_farmer_accessing_farmer_api(self):
        """Test Farmer can access authorized Farmer APIs"""
        farmer_token, farmer_user = self.get_jwt_token('9823012345', 'farmer123', 'FARMER')
        headers = {'Authorization': f'Bearer {farmer_token}'}

        res = self.client.post('/api/lots', headers=headers, json={
            'crop': 'Onion',
            'quantity': 50,
            'unit': 'Quintal',
            'quality_grade': 'Grade A',
            'harvest_date': '2026-03-25',
            'location': 'Lasalgaon APMC',
            'district': 'Nashik',
            'expected_price': 1800,
            'images': ['/uploads/crop_lots/sample_onion.jpg']
        })
        self.assertEqual(res.status_code, 201, f"Create lot failed: {res.get_json()}")
        lot = res.get_json().get('lot', {})
        # Verify seller_id was automatically bound to current user, not arbitrary client input
        self.assertEqual(lot['seller_id'], farmer_user['id'])

    def test_07_farmer_attempting_government_api(self):
        """Test Farmer cannot access Government/Admin APIs (403 Forbidden)"""
        farmer_token, _ = self.get_jwt_token('9823012345', 'farmer123', 'FARMER')
        headers = {'Authorization': f'Bearer {farmer_token}'}

        # Attempt to access government stats
        res = self.client.get('/api/admin/stats', headers=headers)
        self.assertEqual(res.status_code, 403)
        data = res.get_json()
        self.assertIn('Access denied', data.get('message', ''))

        # Attempt to access government user management
        res_users = self.client.get('/api/admin/users', headers=headers)
        self.assertEqual(res_users.status_code, 403)

    def test_08_buyer_attempting_farmer_owned_private_resource(self):
        """Test Buyer cannot modify or delete Farmer-owned produce lots (403 Forbidden)"""
        buyer_token, _ = self.get_jwt_token('9820011223', 'buyer123', 'BUYER')
        headers = {'Authorization': f'Bearer {buyer_token}'}

        # Attempt to modify Lot 1 (owned by Farmer 1)
        res = self.client.put('/api/lots/1', headers=headers, json={
            'expected_price': 100
        })
        self.assertEqual(res.status_code, 403)

        # Attempt to delete Lot 1
        res_del = self.client.delete('/api/lots/1', headers=headers)
        self.assertEqual(res_del.status_code, 403)

    def test_09_idor_defense_ignore_client_seller_id(self):
        """Test IDOR defense: backend derives identity from JWT, ignoring client body IDs"""
        farmer_token, farmer_user = self.get_jwt_token('9823012345', 'farmer123', 'FARMER')
        headers = {'Authorization': f'Bearer {farmer_token}'}

        # Farmer 1 passes seller_id=999 in payload trying to impersonate another seller
        res = self.client.post('/api/lots', headers=headers, json={
            'seller_id': 999,
            'crop': 'Soybean',
            'quantity': 30,
            'unit': 'Quintal',
            'quality_grade': 'Grade A',
            'harvest_date': '2026-03-25',
            'location': 'Dindori',
            'district': 'Nashik',
            'expected_price': 4200,
            'images': ['/uploads/crop_lots/sample_soybean.jpg']
        })
        self.assertEqual(res.status_code, 201)
        lot = res.get_json().get('lot', {})
        # Must be bound to authenticated farmer, NOT 999
        self.assertEqual(lot['seller_id'], farmer_user['id'])
        self.assertNotEqual(lot['seller_id'], 999)

    def test_10_government_accessing_government_api(self):
        """Test Government Admin can successfully access Government APIs (200 OK)"""
        admin_token, admin_user = self.get_jwt_token('9810000001', 'admin123', 'ADMIN')
        headers = {'Authorization': f'Bearer {admin_token}'}

        res = self.client.get('/api/admin/stats', headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get('success', False))
        self.assertIn('stats', data)

    def test_11_login_rate_limiting(self):
        """Test basic rate limiting on repeated failed login attempts (429 Too Many Requests)"""
        test_phone = '9999999999'
        # Trigger 5 failed attempts
        for _ in range(5):
            res = self.client.post('/api/auth/login', json={
                'phone': test_phone,
                'password': 'wrong_password',
                'role': 'FARMER'
            })
            self.assertEqual(res.status_code, 401)

        # 6th attempt should be blocked by rate limiter
        res_blocked = self.client.post('/api/auth/login', json={
            'phone': test_phone,
            'password': 'wrong_password',
            'role': 'FARMER'
        })
        self.assertEqual(res_blocked.status_code, 429)
        data = res_blocked.get_json()
        self.assertIn('Too many failed login attempts', data.get('message', ''))

    def test_12_logout_and_relogin(self):
        """Test logout and subsequent successful login"""
        farmer_token, _ = self.get_jwt_token('9823012345', 'farmer123', 'FARMER')
        headers = {'Authorization': f'Bearer {farmer_token}'}

        # Logout
        res_logout = self.client.post('/api/auth/logout', headers=headers)
        self.assertEqual(res_logout.status_code, 200)

        # Login again succeeds and provides a valid new token
        new_token, new_user = self.get_jwt_token('9823012345', 'farmer123', 'FARMER')
        self.assertIsNotNone(new_token)
        self.assertEqual(new_user['phone'], '9823012345')

if __name__ == '__main__':
    unittest.main()
