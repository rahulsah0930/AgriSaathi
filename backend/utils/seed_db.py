from models import db
from models.user import User, FarmerProfile, FPOProfile, BuyerProfile, WarehouseProfile
from models.lot import CropLot, CropLotImage, QualityReport, FPOLotMember
from models.market import MarketPrice
from models.storage import Warehouse, StorageBooking
from models.offer import Offer, NegotiationHistory
from models.transaction import Transaction
from models.payment import PaymentRecord
from models.grievance import Grievance
from models.notification import Notification
from datetime import date, datetime, timedelta

def seed_demo_accounts():
    """Seeds initial demonstration accounts for all 5 roles if not present."""
    print("[AgriSaathi] Verifying and seeding unified prototype demo accounts...")

    # 1. Verified Farmer (Suresh Patil)
    farmer1 = User.query.filter_by(phone='9823012345').first()
    if not farmer1:
        farmer1 = User(
            name='Suresh Patil',
            phone='9823012345',
            email='suresh.patil@agrisaathi.demo',
            role='FARMER',
            verification_status='VERIFIED',
            verification_notes='7/12 Land Record & Aadhaar verified by Taluka Agriculture Officer.'
        )
        farmer1.set_password('farmer123')
        db.session.add(farmer1)
        db.session.flush()

        fp1 = FarmerProfile(
            user_id=farmer1.id,
            full_name='Suresh Patil',
            aadhaar_masked='XXXX XXXX 4589',
            village='Dindori',
            taluka='Dindori',
            district='Nashik',
            state='Maharashtra',
            farm_size_acres=4.5,
            main_crops='Tomato, Onion, Grapes',
            bank_account_masked='XXXXXX8812',
            ifsc_code_masked='SBIN0001234'
        )
        db.session.add(fp1)
    else:
        farmer1.name = 'Suresh Patil'
        farmer1.verification_status = 'VERIFIED'
        farmer1.set_password('farmer123')

    # 2. Pending Verification Farmer (Ramesh Khot)
    farmer2 = User.query.filter_by(phone='9823054321').first()
    if not farmer2:
        farmer2 = User(
            name='Ramesh Khot',
            phone='9823054321',
            email='ramesh.khot@agrisaathi.demo',
            role='FARMER',
            verification_status='PENDING',
            verification_notes='Uploaded documents awaiting scrutiny by Government Nodal Officer.'
        )
        farmer2.set_password('farmer123')
        db.session.add(farmer2)
        db.session.flush()

        fp2 = FarmerProfile(
            user_id=farmer2.id,
            full_name='Ramesh Khot',
            aadhaar_masked='XXXX XXXX 9123',
            village='Baramati',
            taluka='Baramati',
            district='Pune',
            state='Maharashtra',
            farm_size_acres=3.0,
            main_crops='Sugarcane, Tomato, Wheat',
            bank_account_masked='XXXXXX3490',
            ifsc_code_masked='MAHB0000456'
        )
        db.session.add(fp2)
    else:
        farmer2.name = 'Ramesh Khot'
        farmer2.set_password('farmer123')

    # 3. Verified FPO (Sahyadri Farmers Producer Co.)
    fpo1 = User.query.filter_by(phone='9823099999').first()
    if not fpo1:
        fpo1 = User(
            name='Sahyadri Farmers Producer Co. Ltd.',
            phone='9823099999',
            email='contact@sahyadrifpo.demo',
            role='FPO',
            verification_status='VERIFIED',
            verification_notes='State FPO Federation Certificate & Executive Audit verified.'
        )
        fpo1.set_password('fpo123')
        db.session.add(fpo1)
        db.session.flush()

        fpop1 = FPOProfile(
            user_id=fpo1.id,
            fpo_name='Sahyadri Farmers Producer Co. Ltd.',
            registration_number='FPO-MH-NSK-2023-089',
            contact_person='Anand Rao Deshmukh',
            district='Nashik',
            state='Maharashtra',
            member_count=450,
            primary_crops='Tomato, Grapes, Onion, Pomegranate',
            bank_account_masked='XXXXXX9901',
            ifsc_code_masked='HDFC0001890'
        )
        db.session.add(fpop1)
    else:
        fpo1.name = 'Sahyadri Farmers Producer Co. Ltd.'
        fpo1.verification_status = 'VERIFIED'
        fpo1.set_password('fpo123')

    # 4. Pending FPO (Godavari Krushi Producer Co.)
    fpo2 = User.query.filter_by(phone='9823088888').first()
    if not fpo2:
        fpo2 = User(
            name='Godavari Krushi Agro Producer Co.',
            phone='9823088888',
            email='admin@godavarikrushi.demo',
            role='FPO',
            verification_status='PENDING',
            verification_notes='Member registry and board resolution submitted for nodal verification.'
        )
        fpo2.set_password('fpo123')
        db.session.add(fpo2)
        db.session.flush()

        fpop2 = FPOProfile(
            user_id=fpo2.id,
            fpo_name='Godavari Krushi Agro Producer Co.',
            registration_number='FPO-MH-AHM-2024-034',
            contact_person='Sunil Shinde',
            district='Ahmednagar',
            state='Maharashtra',
            member_count=120,
            primary_crops='Soybean, Onion, Cotton',
            bank_account_masked='XXXXXX4512',
            ifsc_code_masked='BARB0AHMEDN'
        )
        db.session.add(fpop2)
    else:
        fpo2.name = 'Godavari Krushi Agro Producer Co.'
        fpo2.set_password('fpo123')

    # 5. Verified Buyer (MahaFresh Wholesale & Retail Ltd.)
    buyer1 = User.query.filter_by(phone='9820011223').first()
    if not buyer1:
        buyer1 = User(
            name='MahaFresh Wholesale & Retail Ltd.',
            phone='9820011223',
            email='procurement@mahafresh.demo',
            role='BUYER',
            verification_status='VERIFIED',
            verification_notes='GSTIN, FSSAI Central Wholesale License and Corporate Bank account verified.'
        )
        buyer1.set_password('buyer123')
        db.session.add(buyer1)
        db.session.flush()

        bp1 = BuyerProfile(
            user_id=buyer1.id,
            company_name='MahaFresh Wholesale & Retail Ltd.',
            authorized_person='Vikram Mehta',
            business_registration='CIN: U01409MH2021PTC355201',
            gst_number='27AAACM1234F1Z5',
            procurement_categories='Tomato, Onion, Grapes, Pomegranate, Wheat',
            address='Sector 19, Turbhe Wholesale Mandi Complex',
            district='Navi Mumbai',
            state='Maharashtra',
            latitude=19.0760,
            longitude=73.0080,
            bank_account_masked='XXXXXX4481',
            ifsc_code_masked='HDFC0000240'
        )
        db.session.add(bp1)
    else:
        buyer1.name = 'MahaFresh Wholesale & Retail Ltd.'
        buyer1.verification_status = 'VERIFIED'
        buyer1.set_password('buyer123')

    # 6. Verified Warehouse (Nashik Agro Cold Storage)
    wh1 = User.query.filter_by(phone='9830022334').first()
    if not wh1:
        wh1 = User(
            name='Nashik Agro Cold Storage & Logistics',
            phone='9830022334',
            email='manager@nashikcoldchain.demo',
            role='WAREHOUSE',
            verification_status='VERIFIED',
            verification_notes='WDRA Registered Cold Storage with calibrated IoT temperature loggers.'
        )
        wh1.set_password('warehouse123')
        db.session.add(wh1)
        db.session.flush()

        whp1 = WarehouseProfile(
            user_id=wh1.id,
            warehouse_name='Nashik Agro Cold Storage & Logistics',
            operator_name='Rajesh Deshpande',
            license_number='WDRA-MH-NSK-2023-441',
            storage_type='Cold Storage (Multi-Chamber)',
            capacity_mt=3500.0,
            available_capacity_mt=1420.0,
            supported_crops='Tomato, Onion, Grapes, Pomegranate',
            tariff_per_quintal_month=60.0,
            temperature_celsius=2.8,
            humidity_percentage=88.5,
            address='Gat No. 112, MIDC Ambad',
            district='Nashik',
            state='Maharashtra',
            latitude=19.9520,
            longitude=73.7480,
            phone='9830022334',
            email='manager@nashikcoldchain.demo'
        )
        db.session.add(whp1)
    else:
        wh1.name = 'Nashik Agro Cold Storage & Logistics'
        wh1.verification_status = 'VERIFIED'
        wh1.set_password('warehouse123')

    # 7. Government Administrator (MahaAgri State Nodal Officer)
    admin1 = User.query.filter_by(phone='9810000001').first()
    if not admin1:
        admin1 = User(
            name='MahaAgri State Nodal Officer',
            phone='9810000001',
            email='admin@mahaagri.gov.demo',
            role='ADMIN',
            verification_status='VERIFIED',
            verification_notes='Government of Maharashtra Agriculture Department Administrator.'
        )
        admin1.set_password('admin123')
        db.session.add(admin1)
    else:
        admin1.name = 'MahaAgri State Nodal Officer'
        admin1.verification_status = 'VERIFIED'
        admin1.set_password('admin123')

    db.session.commit()
    print("[AgriSaathi] Successfully verified demo accounts for all 5 roles.")

    # Seed related domain data
    _seed_demo_lots(farmer1.id, fpo1.id)
    _seed_demo_market_prices()
    _seed_demo_warehouses()
    _seed_demo_offers(farmer1.id, buyer1.id)
    _seed_demo_fpo_members()
    _seed_demo_transactions(farmer1.id, fpo1.id, buyer1.id)
    _seed_demo_grievances(buyer1.id, farmer1.id, admin1.id)
    _seed_demo_notifications(farmer1.id, fpo1.id, buyer1.id, wh1.id, admin1.id)


def _seed_demo_lots(farmer_id, fpo_id):
    """Seeds demonstration crop lots with image records and AI quality assessments."""
    if CropLot.query.first():
        return

    print("[AgriSaathi] Seeding demo crop lots with AI quality verification...")

    lots_data = [
        {
            'seller_id': farmer_id, 'seller_type': 'FARMER', 'seller_name': 'Suresh Patil',
            'seller_verification_status': 'VERIFIED',
            'crop': 'Tomato', 'variety': 'Hybrid Cherry',
            'quantity': 450, 'unit': 'kg', 'quality_grade': 'Grade A',
            'harvest_date': '2026-09-05', 'location': 'Dindori, Nashik', 'district': 'Nashik',
            'latitude': 20.1983, 'longitude': 73.8344,
            'address': 'Gat No. 45, Dindori Shivhar Road', 'village': 'Dindori', 'taluka': 'Dindori', 'pincode': '422202',
            'expected_price': 24.0, 'storage_status': 'NOT_STORED', 'status': 'ACTIVE',
            'image_url': '/uploads/crop_lots/tomato_lot1_primary.jpg',
            'secondary_img': '/uploads/crop_lots/tomato_lot1_closeup.jpg',
            'ai_status': 'PASSED', 'ai_score': 0.95,
            'signals': 'AI Visual Check: Bright crimson coloration, intact calyxes, uniform 45-50mm sizing. Zero rot or skin cracks.'
        },
        {
            'seller_id': farmer_id, 'seller_type': 'FARMER', 'seller_name': 'Suresh Patil',
            'seller_verification_status': 'VERIFIED',
            'crop': 'Onion', 'variety': 'Red Nashik',
            'quantity': 12, 'unit': 'quintal', 'quality_grade': 'Grade A',
            'harvest_date': '2026-08-28', 'location': 'Dindori, Nashik', 'district': 'Nashik',
            'latitude': 20.2100, 'longitude': 73.8400,
            'address': 'Farm Gate Plot 12, Dindori Road', 'village': 'Dindori', 'taluka': 'Dindori', 'pincode': '422202',
            'expected_price': 1850.0, 'storage_status': 'IN_STORAGE', 'status': 'ACTIVE',
            'image_url': '/uploads/crop_lots/onion_lot2_primary.jpg',
            'ai_status': 'PASSED', 'ai_score': 0.92,
            'signals': 'AI Visual Check: Well-cured outer paper skin, tight neck closure, consistent Nashik Red hue. No sprouting.'
        },
        {
            'seller_id': farmer_id, 'seller_type': 'FARMER', 'seller_name': 'Suresh Patil',
            'seller_verification_status': 'VERIFIED',
            'crop': 'Grapes', 'variety': 'Thompson Seedless',
            'quantity': 800, 'unit': 'kg', 'quality_grade': 'Grade B',
            'harvest_date': '2026-09-02', 'location': 'Dindori, Nashik', 'district': 'Nashik',
            'latitude': 20.2050, 'longitude': 73.8250,
            'address': 'Vineyard Sector 3, Dindori', 'village': 'Dindori', 'taluka': 'Dindori', 'pincode': '422202',
            'expected_price': 55.0, 'storage_status': 'NOT_STORED', 'status': 'RESERVED',
            'image_url': '/uploads/crop_lots/grapes_lot3_primary.jpg',
            'ai_status': 'PASSED', 'ai_score': 0.89,
            'signals': 'AI Visual Check: Berry size 16-18mm, natural powdery bloom intact. Minor berry sunburn on 2% of bunch.'
        },
        {
            'seller_id': fpo_id, 'seller_type': 'FPO', 'seller_name': 'Sahyadri Farmers Producer Co. Ltd.',
            'seller_verification_status': 'VERIFIED',
            'crop': 'Pomegranate', 'variety': 'Bhagwa',
            'quantity': 5, 'unit': 'tonne', 'quality_grade': 'Grade A',
            'harvest_date': '2026-09-01', 'location': 'Nashik APMC, Nashik', 'district': 'Nashik',
            'latitude': 20.0050, 'longitude': 73.7900,
            'address': 'Sahyadri Aggregation Center, Dindori Road', 'village': 'Mohadi', 'taluka': 'Dindori', 'pincode': '422207',
            'expected_price': 85.0, 'storage_status': 'IN_STORAGE', 'status': 'ACTIVE',
            'image_url': '/uploads/crop_lots/pomegranate_lot4_primary.jpg',
            'ai_status': 'PASSED', 'ai_score': 0.96,
            'signals': 'AI Visual Check: Deep ruby red skin, aril firmness optimal, export grade size (250g+ per fruit).'
        },
        {
            'seller_id': farmer_id, 'seller_type': 'FARMER', 'seller_name': 'Suresh Patil',
            'seller_verification_status': 'VERIFIED',
            'crop': 'Wheat', 'variety': 'Lok-1',
            'quantity': 20, 'unit': 'quintal', 'quality_grade': 'Grade A',
            'harvest_date': '2026-08-20', 'location': 'Dindori, Nashik', 'district': 'Nashik',
            'latitude': 20.1983, 'longitude': 73.8344,
            'address': 'Gat No. 45, Dindori', 'village': 'Dindori', 'taluka': 'Dindori', 'pincode': '422202',
            'expected_price': 2200.0, 'storage_status': 'NOT_STORED', 'status': 'SOLD',
            'image_url': '/uploads/crop_lots/tomato_lot1_primary.jpg',
            'ai_status': 'PASSED', 'ai_score': 0.91,
            'signals': 'AI Visual Check: Grain luster golden, low broken grain percentage.'
        },
    ]

    for item in lots_data:
        lot = CropLot(
            seller_id=item['seller_id'],
            seller_type=item['seller_type'],
            seller_name=item['seller_name'],
            seller_verification_status=item['seller_verification_status'],
            crop=item['crop'],
            variety=item['variety'],
            quantity=item['quantity'],
            unit=item['unit'],
            quality_grade=item['quality_grade'],
            harvest_date=item['harvest_date'],
            location=item['location'],
            district=item['district'],
            latitude=item['latitude'],
            longitude=item['longitude'],
            address=item['address'],
            village=item['village'],
            taluka=item['taluka'],
            pincode=item['pincode'],
            expected_price=item['expected_price'],
            storage_status=item['storage_status'],
            image_url=item['image_url'],
            status=item['status']
        )
        db.session.add(lot)
        db.session.flush()

        # Add CropLotImage records
        img1 = CropLotImage(crop_lot_id=lot.id, image_url=item['image_url'], is_primary=True)
        db.session.add(img1)
        if item.get('secondary_img'):
            img2 = CropLotImage(crop_lot_id=lot.id, image_url=item['secondary_img'], is_primary=False)
            db.session.add(img2)

        # Add QualityReport with AI-Assisted Visual Quality Check
        qr = QualityReport(
            crop_lot_id=lot.id,
            seller_declared_grade=item['quality_grade'],
            verified_grade=item['quality_grade'],
            condition_summary='Freshly Harvested',
            moisture_percentage=11.5,
            damage_percentage=1.8,
            freshness_status='FRESH',
            verification_status='VERIFIED',
            ai_verification_status=item['ai_status'],
            ai_score=item['ai_score'],
            ai_crop_consistency=True,
            ai_quality_assessment='SUFFICIENT',
            ai_signals=item['signals'],
            verified_by='Taluka Agriculture Inspector (AI-Assisted)',
            verifier_role='AUTHORIZED_OFFICER',
            verification_date='2026-09-06'
        )
        db.session.add(qr)

    db.session.commit()
    print(f"[AgriSaathi] Successfully seeded demo crop lots with images and AI reports.")


def _seed_demo_market_prices():
    """Seeds current and historical market prices across major Maharashtra APMC Mandis."""
    if MarketPrice.query.first():
        return

    print("[AgriSaathi] Seeding Maharashtra APMC market prices...")
    today = date.today()

    current_prices = [
        MarketPrice(
            crop='Tomato', variety='Hybrid Cherry', market_name='Pimpalgaon APMC', district='Nashik',
            price_date=today, min_price=18.0, max_price=26.0, average_price=22.5,
            arrival_volume=1450.0, unit='kg', source_type='LIVE', trend='UP'
        ),
        MarketPrice(
            crop='Tomato', variety='Abhinav', market_name='Lasalgaon APMC', district='Nashik',
            price_date=today, min_price=17.5, max_price=24.0, average_price=21.0,
            arrival_volume=820.0, unit='kg', source_type='LIVE', trend='STABLE'
        ),
        MarketPrice(
            crop='Tomato', variety='Hybrid', market_name='Pune APMC (Gultekdi)', district='Pune',
            price_date=today, min_price=21.0, max_price=29.0, average_price=25.5,
            arrival_volume=2300.0, unit='kg', source_type='LIVE', trend='UP'
        ),
        MarketPrice(
            crop='Tomato', variety='Hybrid', market_name='Vashi APMC (Navi Mumbai)', district='Mumbai',
            price_date=today, min_price=24.0, max_price=32.0, average_price=28.0,
            arrival_volume=3100.0, unit='kg', source_type='LIVE', trend='UP'
        ),
        MarketPrice(
            crop='Onion', variety='Red Nashik', market_name='Lasalgaon APMC', district='Nashik',
            price_date=today, min_price=1650.0, max_price=2150.0, average_price=1920.0,
            arrival_volume=8500.0, unit='quintal', source_type='LIVE', trend='UP'
        ),
        MarketPrice(
            crop='Grapes', variety='Thompson Seedless', market_name='Nashik APMC', district='Nashik',
            price_date=today, min_price=48.0, max_price=64.0, average_price=56.0,
            arrival_volume=950.0, unit='kg', source_type='LIVE', trend='STABLE'
        ),
        MarketPrice(
            crop='Pomegranate', variety='Bhagwa', market_name='Solapur APMC', district='Solapur',
            price_date=today, min_price=75.0, max_price=110.0, average_price=92.0,
            arrival_volume=1800.0, unit='kg', source_type='LIVE', trend='UP'
        ),
    ]

    for p in current_prices:
        db.session.add(p)

    db.session.commit()
    print("[AgriSaathi] Successfully seeded APMC market prices.")


def _seed_demo_warehouses():
    """Seeds Maharashtra state certified cold storage warehouses."""
    if Warehouse.query.first():
        return

    print("[AgriSaathi] Seeding Maharashtra certified cold storage directories...")

    warehouses = [
        Warehouse(
            name='Sahyadri Farmers Cold Chain Hub',
            operator='Sahyadri Agro Retailing Ltd.',
            type='Cold Storage',
            total_capacity=5000.0,
            available_capacity=1850.0,
            unit='tonnes',
            temperature_range='0°C to 4°C',
            humidity_range='90% - 95%',
            monthly_tariff=65.0,
            tariff_unit='₹/quintal/month',
            district='Nashik',
            taluka='Dindori',
            village='Mohadi',
            state='Maharashtra',
            latitude=20.1250,
            longitude=73.8650,
            address='Sahyadri Agro Park, Gat No. 314, Dindori Road',
            contact_phone='9823099999',
            contact_email='coldchain@sahyadrifarmers.com',
            certification='WDRA / APEDA Accredited Class A',
            rating=4.8,
            distance_km=14.5
        ),
        Warehouse(
            name='Mahacold Agro Logistics Park',
            operator='Maharashtra State Warehousing Corp (MSWC)',
            type='Cold Storage',
            total_capacity=3000.0,
            available_capacity=800.0,
            unit='tonnes',
            temperature_range='2°C to 8°C',
            humidity_range='85% - 90%',
            monthly_tariff=55.0,
            tariff_unit='₹/quintal/month',
            district='Nashik',
            taluka='Nashik',
            village='Ambad',
            state='Maharashtra',
            latitude=19.9600,
            longitude=73.7400,
            address='Plot A-12, MIDC Ambad, Nashik',
            contact_phone='9823011222',
            contact_email='ambad.mswc@maharashtra.gov.in',
            certification='MSWC / WDRA Certified',
            rating=4.5,
            distance_km=22.0
        ),
    ]

    for w in warehouses:
        db.session.add(w)

    db.session.commit()
    print("[AgriSaathi] Successfully seeded cold storage warehouses.")


def _seed_demo_offers(farmer_id, buyer_id):
    """Seeds inbound buyer offers with two-way negotiation history."""
    if Offer.query.first():
        return

    print("[AgriSaathi] Seeding inbound buyer procurement offers with negotiation trails...")
    today = date.today()

    o1 = Offer(
        crop_lot_id=1,
        buyer_id=buyer_id,
        buyer_name='MahaFresh Wholesale & Retail Ltd.',
        buyer_verification_status='VERIFIED',
        seller_id=farmer_id,
        quantity=450.0,
        unit='kg',
        offer_price=23.5,
        total_value=10575.0,
        delivery_date=today + timedelta(days=5),
        message='Direct hypermarket procurement. 20% advance secured by Govt Escrow upon agreement.',
        counter_price=24.0,
        counter_message='Can supply fully graded Cherry Tomatoes at ₹24.00/kg loaded at farm gate.',
        status='COUNTERED'
    )
    db.session.add(o1)
    db.session.flush()

    # Negotiation history entries for offer 1
    h1 = NegotiationHistory(
        offer_id=o1.id,
        actor_id=buyer_id,
        actor_role='BUYER',
        actor_name='MahaFresh Wholesale & Retail Ltd.',
        action='INITIAL_OFFER',
        price=23.5,
        quantity=450.0,
        message='Initial procurement bid for 450 kg Tomato at ₹23.50/kg.'
    )
    h2 = NegotiationHistory(
        offer_id=o1.id,
        actor_id=farmer_id,
        actor_role='SELLER',
        actor_name='Suresh Patil',
        action='COUNTER_OFFER',
        price=24.0,
        quantity=450.0,
        message='Counter-offer: Willing to confirm at ₹24.00/kg with farm-gate inspection.'
    )
    db.session.add(h1)
    db.session.add(h2)

    o2 = Offer(
        crop_lot_id=2,
        buyer_id=buyer_id,
        buyer_name='MahaFresh Wholesale & Retail Ltd.',
        buyer_verification_status='VERIFIED',
        seller_id=farmer_id,
        quantity=12.0,
        unit='quintal',
        offer_price=1900.0,
        total_value=22800.0,
        delivery_date=today + timedelta(days=8),
        message='Export consignment batch. High quality Garwa onion required.',
        status='PENDING'
    )
    db.session.add(o2)

    db.session.commit()
    print("[AgriSaathi] Successfully seeded offers and negotiation history.")


def _seed_demo_transactions(farmer_id, fpo_id, buyer_id):
    """Seeds active transactions and two-stage escrow payments."""
    if Transaction.query.first():
        return

    print("[AgriSaathi] Seeding demo transactions and Government Escrow records...")
    now = datetime.utcnow()

    # Transaction 1: Farmer सुरेश पाटील ↔ MahaFresh (Advance Paid in Escrow)
    t1 = Transaction(
        transaction_ref='TXN-2026-NSK-001',
        crop_lot_id=1,
        buyer_id=buyer_id,
        seller_id=farmer_id,
        crop='Tomato',
        variety='Hybrid Cherry',
        quantity=450.0,
        unit='kg',
        agreed_price_per_unit=24.0,
        total_amount=10800.0,
        advance_percentage=20.0,
        advance_amount=2160.0,
        balance_amount=8640.0,
        status='ADVANCE_PAID',
        pickup_address='Gat No. 45, Dindori Shivhar Road, Nashik',
        pickup_district='Nashik',
        pickup_lat=20.1983,
        pickup_lng=73.8344,
        delivery_address='Sector 19, Turbhe Wholesale Mandi Complex, Navi Mumbai',
        delivery_district='Navi Mumbai',
        delivery_lat=19.0760,
        delivery_lng=73.0080,
        carrier_name='MahaAgri Logistics Fleet - MH15-EF-2012',
        tracking_number='TRK-MH15-88912',
        notes='Buyer advance of ₹2,160.00 secured in Government Escrow. Seller preparing crates for pickup.',
        govt_audit_notes='Digital Escrow Lien Verified by State Nodal Gateway.'
    )
    db.session.add(t1)
    db.session.flush()

    p1 = PaymentRecord(
        payment_ref='PAY-ESCROW-2026-001',
        transaction_id=t1.id,
        payer_id=buyer_id,
        payee_id=farmer_id,
        amount=2160.0,
        stage='ADVANCE',
        status='ESCROW_HELD',
        escrow_status='HELD_BY_GOVT_ESCROW',
        payment_method='UPI_SIMULATED',
        reference_number='UPI/SIM/20260908/88921045',
        govt_audit_notes='Advance funds locked in State Agritech Escrow Vault. Release contingent on buyer delivery sign-off.',
        settled_at=now - timedelta(hours=6)
    )
    db.session.add(p1)

    # Transaction 2: Sahyadri FPO ↔ MahaFresh (In Transit)
    t2 = Transaction(
        transaction_ref='TXN-2026-NSK-002',
        crop_lot_id=4,
        buyer_id=buyer_id,
        seller_id=fpo_id,
        crop='Pomegranate',
        variety='Bhagwa',
        quantity=5.0,
        unit='tonne',
        agreed_price_per_unit=85.0,
        total_amount=425000.0,
        advance_percentage=20.0,
        advance_amount=85000.0,
        balance_amount=340000.0,
        status='IN_TRANSIT',
        pickup_address='Sahyadri Aggregation Center, Mohadi, Dindori',
        pickup_district='Nashik',
        pickup_lat=20.1250,
        pickup_lng=73.8650,
        delivery_address='MahaFresh Cold Logistics Depot, Vashi',
        delivery_district='Mumbai',
        delivery_lat=19.0760,
        delivery_lng=73.0080,
        carrier_name='Maharashtra Krushi Cold Transit - MH15-AK-4412',
        tracking_number='TRK-MH15-99034',
        notes='Shipment dispatched under temperature controlled container (4°C).'
    )
    db.session.add(t2)
    db.session.flush()

    p2 = PaymentRecord(
        payment_ref='PAY-ESCROW-2026-002',
        transaction_id=t2.id,
        payer_id=buyer_id,
        payee_id=fpo_id,
        amount=85000.0,
        stage='ADVANCE',
        status='ESCROW_HELD',
        escrow_status='HELD_BY_GOVT_ESCROW',
        payment_method='NET_BANKING_SIMULATED',
        reference_number='NEFT/SIM/20260907/11993344',
        govt_audit_notes='₹85,000 locked in Govt Escrow. Balance ₹3,40,000 due upon final delivery receipt.'
    )
    db.session.add(p2)

    db.session.commit()
    print("[AgriSaathi] Successfully seeded transactions and Escrow payments.")


def _seed_demo_grievances(buyer_id, farmer_id, admin_id):
    """Seeds sample grievance for government dispute resolution."""
    if Grievance.query.first():
        return

    print("[AgriSaathi] Seeding demo grievances for Government Admin resolution...")

    t1 = Transaction.query.first()
    g1 = Grievance(
        grievance_ref='GRV-2026-081',
        transaction_id=t1.id if t1 else None,
        complainant_id=buyer_id,
        respondent_id=farmer_id,
        category='QUALITY_MISMATCH',
        title='Moisture Level Discrepancy during Farm Gate Transit',
        description='Produce sampling in transit revealed moisture index of 14.5% versus declared 11.5%. Requesting authorized nodal inspector re-test.',
        evidence_photo_url='/uploads/crop_lots/tomato_lot1_closeup.jpg',
        location_address='APMC Gate No. 2, Turbhe',
        location_district='Navi Mumbai',
        location_lat=19.0760,
        location_lng=73.0080,
        status='OPEN',
        resolution_notes='Assigned to Taluka Agriculture Inspector for on-site inspection within 24 hours.'
    )
    db.session.add(g1)
    db.session.commit()
    print("[AgriSaathi] Successfully seeded demo grievance.")


def _seed_demo_fpo_members():
    """Seeds demo member contributions for FPO aggregated lots."""
    if FPOLotMember.query.first():
        return

    print("[AgriSaathi] Seeding FPO demo member contributions...")
    lot4 = CropLot.query.filter_by(seller_type='FPO', crop='Pomegranate').first()
    if lot4:
        members = [
            FPOLotMember(
                fpo_lot_id=lot4.id,
                farmer_name='Ramesh Kadam',
                farmer_reference_placeholder='FARMER-MEM-101',
                crop='Pomegranate',
                quantity=1.5,
                unit='tonne',
                quality_grade='Grade A',
                contribution_status='VERIFIED'
            ),
            FPOLotMember(
                fpo_lot_id=lot4.id,
                farmer_name='Vilas Jadhav',
                farmer_reference_placeholder='FARMER-MEM-102',
                crop='Pomegranate',
                quantity=2.0,
                unit='tonne',
                quality_grade='Grade A',
                contribution_status='VERIFIED'
            ),
            FPOLotMember(
                fpo_lot_id=lot4.id,
                farmer_name='Ganesh Shinde',
                farmer_reference_placeholder='FARMER-MEM-103',
                crop='Pomegranate',
                quantity=1.5,
                unit='tonne',
                quality_grade='Grade A',
                contribution_status='VERIFIED'
            ),
        ]
        for m in members:
            db.session.add(m)
        db.session.commit()


def _seed_demo_notifications(farmer_id, fpo_id, buyer_id, wh_id, admin_id):
    """Seeds realistic in-app notifications across roles."""
    if Notification.query.first():
        return

    print("[AgriSaathi] Seeding demo in-app notifications...")
    now = datetime.utcnow()

    notifs = [
        Notification(
            user_id=farmer_id,
            title='Government Escrow Payment Locked',
            message='MahaFresh Wholesale has deposited ₹2,160.00 (20% Advance) into Government Escrow for TXN-2026-NSK-001.',
            type='PAYMENT',
            is_read=False,
            created_at=now - timedelta(minutes=15)
        ),
        Notification(
            user_id=farmer_id,
            title='AI-Assisted Visual Quality Check Passed',
            message='Your 450 kg Tomato lot was analyzed by the AI visual quality engine (Confidence 95%, Grade A). Status: PASSED.',
            type='QUALITY',
            is_read=False,
            created_at=now - timedelta(hours=1)
        ),
        Notification(
            user_id=buyer_id,
            title='Seller Counter-Offer Received',
            message='Farmer Suresh Patil submitted a counter-bid of ₹24.00/kg for your 450 kg Tomato offer. Review & accept deal.',
            type='OFFER',
            is_read=False,
            created_at=now - timedelta(minutes=30)
        ),
        Notification(
            user_id=admin_id,
            title='New User Verification Pending',
            message='Ramesh Khot (Farmer, Pune) and Godavari Krushi FPO (Ahmednagar) are awaiting Government Verification.',
            type='VERIFICATION',
            is_read=False,
            created_at=now - timedelta(minutes=40)
        ),
        Notification(
            user_id=wh_id,
            title='Cold Room Sensor Calibration Normal',
            message='Chamber 2 temperature (2.8°C) and relative humidity (88.5%) within optimal ranges for Grape storage.',
            type='STORAGE',
            is_read=True,
            created_at=now - timedelta(hours=3)
        ),
    ]

    for n in notifs:
        db.session.add(n)

    db.session.commit()
    print(f"[AgriSaathi] Successfully seeded {len(notifs)} notifications.")
