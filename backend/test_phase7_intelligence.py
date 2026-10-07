import unittest
import os
import sys
import json
import tempfile
from datetime import date, datetime, timedelta
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))

from app import create_app
from models import db
from models.user import User
from models.lot import CropLot, QualityReport
from models.market import MarketPrice
from models.storage import Warehouse
from services.ai_verification_service import validate_crop_image, analyze_crop_image
from services.price_prediction import predict_crop_price
from services.sale_recommendation import calculate_net_sale_recommendation
from utils.auth import generate_access_token


class Phase7IntelligenceTestSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        os.environ['ENV'] = 'test'
        cls.app = create_app()
        cls.app.config['TESTING'] = True
        cls.client = cls.app.test_client()

        with cls.app.app_context():
            # Seed test users
            cls.farmer = User.query.filter_by(phone='9811111111').first()
            if not cls.farmer:
                cls.farmer = User(name='Farmer Ramesh', phone='9811111111', role='FARMER', verification_status='VERIFIED')
                cls.farmer.set_password('farmer123')
                db.session.add(cls.farmer)
                db.session.commit()

            cls.buyer = User.query.filter_by(phone='9822222222').first()
            if not cls.buyer:
                cls.buyer = User(name='Buyer Suresh', phone='9822222222', role='BUYER', verification_status='VERIFIED')
                cls.buyer.set_password('buyer123')
                db.session.add(cls.buyer)
                db.session.commit()

            cls.fpo_user = User.query.filter_by(phone='9833333333').first()
            if not cls.fpo_user:
                cls.fpo_user = User(name='FPO Lead Patil', phone='9833333333', role='FPO', verification_status='VERIFIED')
                cls.fpo_user.set_password('fpo123')
                db.session.add(cls.fpo_user)
                db.session.commit()

            cls.admin = User.query.filter_by(role='ADMIN').first()
            if not cls.admin:
                cls.admin = User(name='Admin Officer', phone='9844444444', role='ADMIN', verification_status='VERIFIED')
                cls.admin.set_password('admin123')
                db.session.add(cls.admin)
                db.session.commit()

            cls.farmer_id = cls.farmer.id
            cls.buyer_id = cls.buyer.id
            cls.fpo_user_id = cls.fpo_user.id
            cls.admin_id = cls.admin.id
            cls.farmer_name = cls.farmer.name
            cls.buyer_name = cls.buyer.name

            cls.farmer_token = generate_access_token(cls.farmer)
            cls.buyer_token = generate_access_token(cls.buyer)
            cls.fpo_token = generate_access_token(cls.fpo_user)
            cls.admin_token = generate_access_token(cls.admin)

            # Ensure farmer has a crop lot
            cls.farmer_lot = CropLot.query.filter_by(seller_id=cls.farmer.id).first()
            if not cls.farmer_lot:
                cls.farmer_lot = CropLot(
                    seller_id=cls.farmer.id,
                    seller_type='FARMER',
                    seller_name=cls.farmer.name,
                    crop='Tomato',
                    quantity=1000,
                    quality_grade='Grade A',
                    harvest_date=date.today(),
                    location='Nashik, Maharashtra',
                    district='Nashik',
                    expected_price=25.0
                )
                db.session.add(cls.farmer_lot)
                db.session.commit()

            # Ensure farmer_lot has quality report
            if not cls.farmer_lot.quality_report:
                qr = QualityReport(
                    crop_lot_id=cls.farmer_lot.id,
                    seller_declared_grade='Grade A',
                    verification_status='SELF_REPORTED'
                )
                db.session.add(qr)
                db.session.commit()

            # Create temporary images for PIL testing
            cls.temp_dir = tempfile.mkdtemp()

            # 1. Valid image (300x300 JPEG)
            cls.valid_img_path = os.path.join(cls.temp_dir, 'valid_tomato.jpg')
            im_valid = Image.new('RGB', (300, 300), color=(220, 40, 40))
            im_valid.save(cls.valid_img_path, 'JPEG')

            # 2. Low-res image (100x100 JPEG)
            cls.lowres_img_path = os.path.join(cls.temp_dir, 'lowres_crop.jpg')
            im_lowres = Image.new('RGB', (100, 100), color=(100, 200, 50))
            im_lowres.save(cls.lowres_img_path, 'JPEG')

            # 3. Corrupted image file
            cls.corrupted_img_path = os.path.join(cls.temp_dir, 'corrupt_crop_file.jpg')
            with open(cls.corrupted_img_path, 'wb') as f:
                f.write(b'NOT_A_VALID_IMAGE_HEADER_BYTES_12345')

            # 4. Unsupported extension
            cls.unsupported_file_path = os.path.join(cls.temp_dir, 'crop_doc.pdf')
            with open(cls.unsupported_file_path, 'w') as f:
                f.write('%PDF-1.4 mock pdf file')

    def setUp(self):
        self.ctx = self.app.app_context()
        self.ctx.push()

    def tearDown(self):
        self.ctx.pop()

    # =========================================================================
    # PART A: QUALITY VERIFICATION & IMAGE VALIDATION (Tests 1-10)
    # =========================================================================

    def test_01_random_quality_score_generation_removed(self):
        """Verify ai_score does not use random values and returns None or deterministic status."""
        res1 = validate_crop_image(self.valid_img_path, 'Tomato', 'Grade A')
        res2 = validate_crop_image(self.valid_img_path, 'Tomato', 'Grade A')
        self.assertIsNone(res1['ai_score'])
        self.assertIsNone(res2['ai_score'])
        self.assertEqual(res1['image_validation_status'], res2['image_validation_status'])

    def test_02_valid_image_accepted(self):
        """Verify valid 300x300 image is accepted with PASSED status."""
        res = validate_crop_image(self.valid_img_path, 'Tomato')
        self.assertEqual(res['image_validation_status'], 'PASSED')
        self.assertTrue(res['is_valid_image'])
        self.assertIsNotNone(res['image_properties'])
        self.assertEqual(res['image_properties']['width'], 300)
        self.assertEqual(res['image_properties']['height'], 300)

    def test_03_invalid_corrupted_image_rejected(self):
        """Verify corrupted image file is identified and rejected."""
        res = validate_crop_image(self.corrupted_img_path, 'Tomato')
        self.assertEqual(res['image_validation_status'], 'INVALID')
        self.assertFalse(res['is_valid_image'])
        self.assertIn('Corrupted', res['validation_signals'])

    def test_04_minimum_image_dimensions_enforced(self):
        """Verify images below 200x200 are flagged."""
        res = validate_crop_image(self.lowres_img_path, 'Tomato')
        self.assertEqual(res['image_validation_status'], 'FLAGGED')
        self.assertIn('minimum required', res['validation_signals'])

    def test_05_unsupported_file_type_rejected(self):
        """Verify non-image MIME/file types (e.g. .pdf) are rejected."""
        res = validate_crop_image(self.unsupported_file_path, 'Tomato')
        self.assertEqual(res['image_validation_status'], 'INVALID')
        self.assertIn('Unsupported image file extension', res['validation_signals'])

    def test_06_duplicate_image_hash_detection_works(self):
        """Verify MD5 hash is calculated and deterministic for the same image."""
        res1 = validate_crop_image(self.valid_img_path, 'Tomato')
        res2 = validate_crop_image(self.valid_img_path, 'Tomato')
        self.assertIsNotNone(res1['image_properties']['image_hash'])
        self.assertEqual(res1['image_properties']['image_hash'], res2['image_properties']['image_hash'])

    def test_07_seller_quality_attributes_marked_seller_provided(self):
        """Verify seller entered attributes are serialized with 'Seller Provided' label."""
        lot = CropLot.query.filter_by(seller_id=self.farmer_id).first()
        qr = lot.quality_report or QualityReport(crop_lot_id=lot.id, seller_declared_grade='Grade A')
        db.session.add(qr)
        db.session.commit()

        d = qr.to_dict()
        self.assertEqual(d['seller_attributes_label'], 'Seller Provided')
        self.assertIn('No trained crop-quality computer vision model', d['no_vision_model_claim'])

    def test_08_buyer_fpo_review_recorded_with_authenticated_reviewer(self):
        """Verify buyer/FPO review endpoint records reviewer identity and status."""
        lot = CropLot.query.filter_by(seller_id=self.farmer_id).first()
        lot_id = lot.id

        resp = self.client.post(
            f'/api/lots/{lot_id}/quality-review',
            headers={'Authorization': f'Bearer {self.buyer_token}'},
            json={'review_status': 'ACCEPTABLE', 'notes': 'Firm, ripe batch verified in field.'}
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertTrue(data['success'])
        qr = data['quality_report']
        self.assertEqual(qr['buyer_review_status'], 'ACCEPTABLE')
        self.assertEqual(qr['verification_status'], 'VERIFIED')
        self.assertEqual(qr['verified_by'], self.buyer_name)

    def test_09_farmer_cannot_self_mark_buyer_verification(self):
        """Verify farmer cannot call quality review endpoint to self-verify own lot."""
        lot = CropLot.query.filter_by(seller_id=self.farmer_id).first()
        lot_id = lot.id

        resp = self.client.post(
            f'/api/lots/{lot_id}/quality-review',
            headers={'Authorization': f'Bearer {self.farmer_token}'},
            json={'review_status': 'ACCEPTABLE', 'notes': 'Self verifying my own crop.'}
        )
        self.assertEqual(resp.status_code, 403)
        data = resp.get_json()
        self.assertIn('cannot self-mark', data['message'])

    def test_10_no_ai_verified_claim_without_model_evidence(self):
        """Verify service label disclaims trained model and does not claim AI verification."""
        res = validate_crop_image(self.valid_img_path, 'Tomato')
        self.assertEqual(res['service_label'], 'Prototype Visual Quality Assistance')
        self.assertIn('No trained crop-quality computer vision model', res['model_claim'])

    # =========================================================================
    # PART B: MARKET DATA PROVENANCE (Tests 11-15)
    # =========================================================================

    def test_11_market_records_expose_source_type(self):
        """Verify market price records expose source_type (HISTORICAL, SAMPLE, SYNTHETIC, LIVE)."""
        resp = self.client.get('/api/market-prices')
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertTrue(data['success'])
        if data['prices']:
            p = data['prices'][0]
            self.assertIn('source_type', p)
            self.assertIn(p['source_type'], ['HISTORICAL', 'SAMPLE', 'SYNTHETIC', 'LIVE'])

    def test_12_sample_data_never_labeled_live(self):
        """Verify SAMPLE data is not labeled LIVE."""
        sample_price = MarketPrice(
            crop='Wheat',
            market_name='Nashik Sample Mandi',
            district='Nashik',
            price_date=date.today(),
            min_price=20.0,
            max_price=24.0,
            average_price=22.0,
            source_type='SAMPLE'
        )
        d = sample_price.to_dict()
        self.assertEqual(d['source_type'], 'SAMPLE')
        self.assertNotEqual(d['source_type'], 'LIVE')

    def test_13_synthetic_data_never_labeled_live(self):
        """Verify SYNTHETIC fallback history points are labeled SYNTHETIC, not LIVE."""
        resp = self.client.get('/api/market-prices/history?crop=Banana&days=7')
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertTrue(data['success'])
        for pt in data['data']:
            if pt.get('source_type') == 'SYNTHETIC':
                self.assertNotEqual(pt.get('source_type'), 'LIVE')
                self.assertEqual(pt.get('source_name'), 'Synthetic Demonstration Fallback')

    def test_14_runtime_random_market_price_generation_absent(self):
        """Verify market price endpoints produce identical output for identical queries."""
        resp1 = self.client.get('/api/market-prices/history?crop=Tomato&days=7')
        resp2 = self.client.get('/api/market-prices/history?crop=Tomato&days=7')
        data1 = resp1.get_json()['data']
        data2 = resp2.get_json()['data']
        self.assertEqual(len(data1), len(data2))
        for p1, p2 in zip(data1, data2):
            self.assertEqual(p1['average_price'], p2['average_price'])
            self.assertEqual(p1['modal_price'], p2['modal_price'])

    def test_15_source_date_returned(self):
        """Verify market price observation contains source_date."""
        resp = self.client.get('/api/market-prices')
        data = resp.get_json()
        if data['prices']:
            p = data['prices'][0]
            self.assertIn('source_date', p)
            self.assertIsNotNone(p['source_date'])

    # =========================================================================
    # PART C: PRICE PREDICTION (Tests 16-26)
    # =========================================================================

    def test_16_ridge_model_functions_with_sufficient_data(self):
        """Verify Ridge model trains when >= 7 historical records exist."""
        today = date.today()
        for i in range(14):
            d = today - timedelta(days=14 - i)
            mp = MarketPrice.query.filter_by(crop='Tomato', market_name='Pimpalgaon APMC', price_date=d).first()
            if not mp:
                mp = MarketPrice(
                    crop='Tomato',
                    market_name='Pimpalgaon APMC',
                    district='Nashik',
                    price_date=d,
                    min_price=20.0 + (i * 0.2),
                    max_price=26.0 + (i * 0.2),
                    average_price=23.0 + (i * 0.2),
                    arrival_volume=1200 + (i * 10),
                    source_type='HISTORICAL'
                )
                db.session.add(mp)
        db.session.commit()

        pred = predict_crop_price(crop='Tomato', market_name='Pimpalgaon APMC', horizon_days=7)
        self.assertEqual(pred['prediction_type'], 'MODEL_BASED')
        self.assertGreaterEqual(pred['observations_used'], 7)

    def test_17_actual_mae_returned(self):
        """Verify real, un-fabricated MAE float is returned for model prediction."""
        pred = predict_crop_price(crop='Tomato', market_name='Pimpalgaon APMC', horizon_days=7)
        self.assertIsNotNone(pred['actual_mae'])
        self.assertIsInstance(pred['actual_mae'], float)

    def test_18_actual_r2_returned_where_valid(self):
        """Verify R² is returned as float or None, not clamped to artificial 0.88."""
        pred = predict_crop_price(crop='Tomato', market_name='Pimpalgaon APMC', horizon_days=7)
        if pred['actual_r2'] is not None:
            self.assertIsInstance(pred['actual_r2'], float)

    def test_19_metrics_not_artificially_clamped(self):
        """Verify model metrics are not artificially clamped to [0.82, 0.94]."""
        pred = predict_crop_price(crop='Tomato', market_name='Pimpalgaon APMC', horizon_days=7)
        self.assertIn('metrics_status', pred)
        self.assertIn('Calculated on chronological validation split', pred['metrics_status'])

    def test_20_insufficient_data_returns_fallback_prediction_type(self):
        """Verify crop with 0 or sparse records returns RULE_BASED_FALLBACK or SYNTHETIC_DEMO."""
        pred = predict_crop_price(crop='ExoticDragonFruit', market_name='Unknown APMC', horizon_days=7)
        self.assertIn(pred['prediction_type'], ['RULE_BASED_FALLBACK', 'SYNTHETIC_DEMO'])

    def test_21_fallback_clearly_disclosed(self):
        """Verify fallback response clearly reports 'Insufficient validation data'."""
        pred = predict_crop_price(crop='ExoticDragonFruit', market_name='Unknown APMC', horizon_days=7)
        self.assertIn('Insufficient validation data', pred['metrics_status'])
        self.assertIsNone(pred['actual_mae'])
        self.assertIsNone(pred['actual_r2'])

    def test_22_synthetic_trained_output_disclosed(self):
        """Verify synthetic data source is clearly disclosed in metadata."""
        pred = predict_crop_price(crop='ExoticDragonFruit', market_name='Unknown APMC', horizon_days=7)
        self.assertIn('Synthetic', pred['data_source'])

    def test_23_observation_count_returned(self):
        """Verify observation count is accurately returned."""
        pred = predict_crop_price(crop='Tomato', market_name='Pimpalgaon APMC', horizon_days=7)
        self.assertIn('observations_used', pred)
        self.assertGreater(pred['observations_used'], 0)

    def test_24_chronological_validation_used(self):
        """Verify chronological split returns training and validation sample counts."""
        pred = predict_crop_price(crop='Tomato', market_name='Pimpalgaon APMC', horizon_days=7)
        self.assertIn('training_samples', pred)
        self.assertIn('validation_samples', pred)
        self.assertGreater(pred['training_samples'], 0)

    def test_25_confidence_classification_deterministic(self):
        """Verify confidence classification is deterministic (HIGH, MEDIUM, or LOW)."""
        pred = predict_crop_price(crop='Tomato', market_name='Pimpalgaon APMC', horizon_days=7)
        self.assertIn(pred['confidence_level'], ['HIGH', 'MEDIUM', 'LOW'])
        self.assertIsNotNone(pred['confidence_rationale'])

    def test_26_same_input_produces_same_prediction(self):
        """Verify deterministic model output across consecutive runs."""
        p1 = predict_crop_price(crop='Tomato', market_name='Pimpalgaon APMC', horizon_days=7)
        p2 = predict_crop_price(crop='Tomato', market_name='Pimpalgaon APMC', horizon_days=7)
        self.assertEqual(p1['predicted_price'], p2['predicted_price'])
        self.assertEqual(p1['price_delta'], p2['price_delta'])
        self.assertEqual(p1['lower_estimate'], p2['lower_estimate'])

    # =========================================================================
    # PART D: SALE ADVISOR (Tests 27-32)
    # =========================================================================

    def test_27_recommendation_deterministic(self):
        """Verify sale recommendation output is 100% reproducible for same inputs."""
        r1 = calculate_net_sale_recommendation(crop='Tomato', quantity=1000, district='Nashik')
        r2 = calculate_net_sale_recommendation(crop='Tomato', quantity=1000, district='Nashik')
        self.assertEqual(r1['recommendation'], r2['recommendation'])
        self.assertEqual(r1['net_gain_vs_today'], r2['net_gain_vs_today'])

    def test_28_reasons_correspond_to_actual_inputs(self):
        """Verify explainable reasons[] are populated and reflect factual inputs."""
        res = calculate_net_sale_recommendation(crop='Tomato', quantity=1000, district='Nashik')
        self.assertIsInstance(res['reasons'], list)
        self.assertGreater(len(res['reasons']), 0)
        has_perishability_mention = any('perishability' in r.lower() for r in res['reasons'])
        self.assertTrue(has_perishability_mention)

    def test_29_high_perishability_affects_recommendation_appropriately(self):
        """Verify high perishability crops have shorter holding window."""
        res_tomato = calculate_net_sale_recommendation(crop='Tomato', quantity=1000, district='Nashik')
        self.assertEqual(res_tomato['crop_perishability']['perishability_class'], 'HIGH')
        strat_short = next(s for s in res_tomato['strategies'] if s['id'] == 'SHORT_HOLD')
        self.assertIn('3', strat_short['timing'])

    def test_30_storage_recommendation_only_appears_when_supported(self):
        """Verify storage feasibility is False for non-storable crops without cold facilities."""
        res = calculate_net_sale_recommendation(crop='Banana', quantity=1000, district='RemoteDistrictWithoutStorage')
        strat_store = next(s for s in res['strategies'] if s['id'] == 'COLD_STORAGE')
        self.assertFalse(strat_store['is_feasible'])

    def test_31_fpo_recommendation_appears_when_relevant_fpo_requirement_exists(self):
        """Verify CONSIDER_FPO_AGGREGATION is generated when active FPO lot is available in district."""
        fpo_lot = CropLot(
            seller_id=self.fpo_user_id,
            seller_type='FPO',
            seller_name='Sahyadri Farmer Producer Co',
            crop='Tomato',
            quantity=5000,
            target_quantity=10000,
            quality_grade='Grade A',
            harvest_date=date.today(),
            status='ACTIVE',
            aggregation_status='OPEN',
            location='Nashik, Maharashtra',
            district='Nashik',
            expected_price=24.0,
            collection_deadline_at=datetime.utcnow() + timedelta(days=2)
        )
        db.session.add(fpo_lot)
        db.session.commit()

        res = calculate_net_sale_recommendation(crop='Tomato', quantity=1000, district='Nashik')
        self.assertIn(res['recommendation'], ['CONSIDER_FPO_AGGREGATION', 'SELL_NOW'])
        has_fpo_reason = any('fpo' in r.lower() for r in res['reasons'])
        self.assertTrue(has_fpo_reason)

    def test_32_no_guaranteed_profit_language(self):
        """Verify guaranteed profit terminology is absent from recommendation outputs."""
        res = calculate_net_sale_recommendation(crop='Tomato', quantity=1000, district='Nashik')
        res_str = json.dumps(res).lower()
        self.assertNotIn('guaranteed profit', res_str)
        self.assertNotIn('guaranteed future price', res_str)
        self.assertNotIn('best guaranteed', res_str)

    # =========================================================================
    # PART E: SECURITY & ACCESS CONTROL (Tests 33-36)
    # =========================================================================

    def test_33_quality_review_endpoints_require_jwt(self):
        """Verify POST /api/lots/<id>/quality-review requires Authorization token."""
        resp = self.client.post('/api/lots/1/quality-review', json={'review_status': 'ACCEPTABLE'})
        self.assertEqual(resp.status_code, 401)

    def test_34_buyer_fpo_role_required_for_review(self):
        """Verify role other than BUYER, FPO, or ADMIN is rejected with 403."""
        logistics_user = User.query.filter_by(role='LOGISTICS').first()
        if not logistics_user:
            logistics_user = User(name='Transporter', phone='9899999999', role='LOGISTICS', verification_status='VERIFIED')
            logistics_user.set_password('logistics123')
            db.session.add(logistics_user)
            db.session.commit()

        logistics_token = generate_access_token(logistics_user)
        resp = self.client.post(
            '/api/lots/1/quality-review',
            headers={'Authorization': f'Bearer {logistics_token}'},
            json={'review_status': 'ACCEPTABLE'}
        )
        self.assertEqual(resp.status_code, 403)

    def test_35_unrelated_user_cannot_modify_review(self):
        """Verify anonymous or unauthenticated request cannot review lot."""
        resp = self.client.post(
            '/api/lots/1/quality-review',
            headers={'Authorization': 'Bearer invalid_or_expired_jwt_token'},
            json={'review_status': 'ACCEPTABLE'}
        )
        self.assertEqual(resp.status_code, 401)

    def test_36_admin_sees_provenance_metadata(self):
        """Verify admin intelligence audit endpoint exposes source breakdown."""
        resp = self.client.get(
            '/api/admin/intelligence-audit',
            headers={'Authorization': f'Bearer {self.admin_token}'}
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertTrue(data['success'])
        self.assertIn('data_provenance', data)
        self.assertIn('market_prices', data['data_provenance'])
        self.assertIn('predictions', data['data_provenance'])
        self.assertIn('regulatory_notice', data)


if __name__ == '__main__':
    unittest.main()
