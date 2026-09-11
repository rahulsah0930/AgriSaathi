from flask import Blueprint, request, jsonify
from models import db
from models.user import User, FarmerProfile, FPOProfile, BuyerProfile, WarehouseProfile
from models.storage import Warehouse
from utils.security import mask_aadhaar, mask_bank_account, mask_ifsc

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register/farmer', methods=['POST'])
def register_farmer():
    data = request.get_json() or {}

    required_fields = ['full_name', 'phone', 'password', 'confirm_password', 'village', 'taluka', 'district']
    for field in required_fields:
        if not data.get(field) or not str(data.get(field)).strip():
            return jsonify({
                'success': False,
                'error': 'Validation Error',
                'message': f"Field '{field}' is required."
            }), 400

    if data['password'] != data['confirm_password']:
        return jsonify({
            'success': False,
            'error': 'Validation Error',
            'message': 'Passwords do not match.'
        }), 400

    phone = str(data['phone']).strip()
    email = str(data.get('email', '')).strip() or None

    if User.query.filter_by(phone=phone).first():
        return jsonify({
            'success': False,
            'error': 'Conflict',
            'message': f'A user with phone number {phone} is already registered.'
        }), 409

    if email and User.query.filter_by(email=email).first():
        return jsonify({
            'success': False,
            'error': 'Conflict',
            'message': f'A user with email {email} is already registered.'
        }), 409

    try:
        user = User(
            name=data['full_name'].strip(),
            phone=phone,
            email=email,
            role='FARMER',
            verification_status='VERIFIED'
        )
        user.set_password(data['password'])
        db.session.add(user)
        db.session.flush()

        farmer_profile = FarmerProfile(
            user_id=user.id,
            full_name=data['full_name'].strip(),
            aadhaar_masked=mask_aadhaar(data.get('aadhaar')),
            village=data['village'].strip(),
            taluka=data['taluka'].strip(),
            district=data['district'].strip(),
            state=data.get('state', 'Maharashtra'),
            farm_size_acres=float(data.get('farm_size_acres')) if data.get('farm_size_acres') else None,
            main_crops=data.get('main_crops', 'Tomato, Onion'),
            bank_name=data.get('bank_name', 'State Bank of India'),
            bank_account_masked=mask_bank_account(data.get('bank_account') or data.get('bank_account_no')),
            ifsc_code_masked=mask_ifsc(data.get('ifsc_code')),
            account_holder_name=data.get('account_holder_name') or data.get('full_name')
        )
        db.session.add(farmer_profile)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Registration successful. Your farmer profile is pending Government Verification.',
            'user': user.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': 'Internal Server Error',
            'message': f'Unable to complete farmer registration: {str(e)}'
        }), 500


@auth_bp.route('/register/fpo', methods=['POST'])
def register_fpo():
    data = request.get_json() or {}

    required_fields = ['fpo_name', 'registration_number', 'contact_person', 'phone', 'password', 'confirm_password', 'district']
    for field in required_fields:
        if not data.get(field) or not str(data.get(field)).strip():
            return jsonify({
                'success': False,
                'error': 'Validation Error',
                'message': f"Field '{field}' is required."
            }), 400

    if data['password'] != data['confirm_password']:
        return jsonify({
            'success': False,
            'error': 'Validation Error',
            'message': 'Passwords do not match.'
        }), 400

    phone = str(data['phone']).strip()
    email = str(data.get('email', '')).strip() or None

    if User.query.filter_by(phone=phone).first():
        return jsonify({
            'success': False,
            'error': 'Conflict',
            'message': f'A user with phone number {phone} is already registered.'
        }), 409

    try:
        user = User(
            name=data['fpo_name'].strip(),
            phone=phone,
            email=email,
            role='FPO',
            verification_status='VERIFIED'
        )
        user.set_password(data['password'])
        db.session.add(user)
        db.session.flush()

        fpo_profile = FPOProfile(
            user_id=user.id,
            fpo_name=data['fpo_name'].strip(),
            registration_number=data['registration_number'].strip(),
            contact_person=data['contact_person'].strip(),
            district=data['district'].strip(),
            state=data.get('state', 'Maharashtra'),
            member_count=int(data.get('member_count', 0)) if str(data.get('member_count', '')).isdigit() else 0,
            primary_crops=data.get('primary_crops', 'Onion, Soybean, Grapes'),
            aadhaar_masked=mask_aadhaar(data.get('aadhaar')),
            bank_name=data.get('bank_name', 'State Bank of India'),
            bank_account_masked=mask_bank_account(data.get('bank_account') or data.get('bank_account_no')),
            ifsc_code_masked=mask_ifsc(data.get('ifsc_code')),
            account_holder_name=data.get('account_holder_name') or data.get('full_name')
        )
        db.session.add(fpo_profile)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'FPO registration submitted for Government Verification.',
            'user': user.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': 'Internal Server Error',
            'message': f'Unable to complete FPO registration: {str(e)}'
        }), 500


@auth_bp.route('/register/buyer', methods=['POST'])
def register_buyer():
    data = request.get_json() or {}

    required_fields = ['company_name', 'authorized_person', 'phone', 'password', 'confirm_password', 'district']
    for field in required_fields:
        if not data.get(field) or not str(data.get(field)).strip():
            return jsonify({
                'success': False,
                'error': 'Validation Error',
                'message': f"Field '{field}' is required."
            }), 400

    if data['password'] != data['confirm_password']:
        return jsonify({
            'success': False,
            'error': 'Validation Error',
            'message': 'Passwords do not match.'
        }), 400

    phone = str(data['phone']).strip()
    email = str(data.get('email', '')).strip() or None

    if User.query.filter_by(phone=phone).first():
        return jsonify({
            'success': False,
            'error': 'Conflict',
            'message': f'A user with phone number {phone} is already registered.'
        }), 409

    try:
        user = User(
            name=data['company_name'].strip(),
            phone=phone,
            email=email,
            role='BUYER',
            verification_status='PENDING'
        )
        user.set_password(data['password'])
        db.session.add(user)
        db.session.flush()

        buyer_profile = BuyerProfile(
            user_id=user.id,
            company_name=data['company_name'].strip(),
            authorized_person=data['authorized_person'].strip(),
            business_registration=data.get('business_registration', ''),
            gst_number=data.get('gst_number', ''),
            procurement_categories=data.get('procurement_categories', 'Vegetables, Grains, Fruits'),
            address=data.get('address', ''),
            district=data['district'].strip(),
            state=data.get('state', 'Maharashtra'),
            latitude=float(data.get('latitude')) if data.get('latitude') else None,
            longitude=float(data.get('longitude')) if data.get('longitude') else None,
            aadhaar_masked=mask_aadhaar(data.get('aadhaar') or data.get('aadhaar_number')),
            bank_name=data.get('bank_name', 'HDFC Bank'),
            bank_account_masked=mask_bank_account(data.get('bank_account') or data.get('bank_account_no')),
            ifsc_code_masked=mask_ifsc(data.get('ifsc_code')),
            account_holder_name=data.get('account_holder_name') or data.get('authorized_person') or data.get('company_name')
        )
        db.session.add(buyer_profile)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Buyer company registration submitted. Verification is pending with Government Nodal Officer.',
            'user': user.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': 'Internal Server Error',
            'message': f'Unable to complete Buyer registration: {str(e)}'
        }), 500


@auth_bp.route('/register/warehouse', methods=['POST'])
def register_warehouse():
    data = request.get_json() or {}

    required_fields = ['warehouse_name', 'operator_name', 'phone', 'password', 'confirm_password', 'district', 'storage_type']
    for field in required_fields:
        if not data.get(field) or not str(data.get(field)).strip():
            return jsonify({
                'success': False,
                'error': 'Validation Error',
                'message': f"Field '{field}' is required."
            }), 400

    if data['password'] != data['confirm_password']:
        return jsonify({
            'success': False,
            'error': 'Validation Error',
            'message': 'Passwords do not match.'
        }), 400

    phone = str(data['phone']).strip()
    email = str(data.get('email', '')).strip() or None

    if User.query.filter_by(phone=phone).first():
        return jsonify({
            'success': False,
            'error': 'Conflict',
            'message': f'A user with phone number {phone} is already registered.'
        }), 409

    try:
        user = User(
            name=data['warehouse_name'].strip(),
            phone=phone,
            email=email,
            role='WAREHOUSE',
            verification_status='VERIFIED'
        )
        user.set_password(data['password'])
        db.session.add(user)
        db.session.flush()

        st_type = data.get('storage_type', 'Cold Storage (Multi-Chamber)')
        mapped_storage_type = 'COLD_STORAGE'
        if 'controlled' in st_type.lower() or 'atmosphere' in st_type.lower():
            mapped_storage_type = 'CONTROLLED'
        elif 'dry' in st_type.lower() or 'normal' in st_type.lower() or 'ambient' in st_type.lower():
            mapped_storage_type = 'NORMAL'

        capacity = float(data.get('capacity_mt', 2500.0))
        tariff_monthly = float(data.get('tariff_per_quintal_month', 55.0))
        price_per_kg_day = round(tariff_monthly / (100.0 * 30.0), 4)

        wh_profile = WarehouseProfile(
            user_id=user.id,
            warehouse_name=data['warehouse_name'].strip(),
            operator_name=data['operator_name'].strip(),
            license_number=data.get('license_number', ''),
            storage_type=st_type,
            capacity_mt=capacity,
            available_capacity_mt=capacity,
            supported_crops=data.get('supported_crops', 'Tomato, Onion, Grapes, Pomegranate'),
            tariff_per_quintal_month=tariff_monthly,
            address=data.get('address', ''),
            district=data['district'].strip(),
            state=data.get('state', 'Maharashtra'),
            latitude=float(data.get('latitude')) if data.get('latitude') else None,
            longitude=float(data.get('longitude')) if data.get('longitude') else None,
            phone=phone,
            email=email,
            aadhaar_masked=mask_aadhaar(data.get('aadhaar') or data.get('aadhaar_number')),
            bank_name=data.get('bank_name', 'Bank of Maharashtra'),
            bank_account_masked=mask_bank_account(data.get('bank_account') or data.get('bank_account_no')),
            ifsc_code_masked=mask_ifsc(data.get('ifsc_code')),
            account_holder_name=data.get('account_holder_name') or data.get('operator_name') or data.get('warehouse_name')
        )
        db.session.add(wh_profile)

        # Also insert directly into Warehouse table for immediate Discovery by Farmers and FPOs
        warehouse_entry = Warehouse(
            name=data['warehouse_name'].strip(),
            verification_status='VERIFIED',
            district=data['district'].strip(),
            location=data.get('address') or f"{data['district'].strip()} Agro Logistics Hub",
            storage_type=mapped_storage_type,
            supported_crops=data.get('supported_crops', 'Tomato, Onion, Grapes, Pomegranate'),
            total_capacity=capacity,
            available_capacity=capacity,
            price_per_kg_per_day=price_per_kg_day if price_per_kg_day > 0 else 0.018,
            temperature_range_placeholder='0°C to 4°C' if mapped_storage_type == 'COLD_STORAGE' else ('1°C to 8°C' if mapped_storage_type == 'CONTROLLED' else 'Ambient (18-24°C)'),
            availability_status='AVAILABLE'
        )
        db.session.add(warehouse_entry)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Warehouse facility registered and active for farmer/FPO cold storage discovery.',
            'user': user.to_dict(),
            'warehouse': warehouse_entry.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': 'Internal Server Error',
            'message': f'Unable to complete Warehouse registration: {str(e)}'
        }), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    identifier = str(data.get('identifier') or data.get('phone') or data.get('email') or '').strip()
    password = str(data.get('password', ''))
    expected_role = data.get('role')

    if not identifier or not password:
        return jsonify({
            'success': False,
            'error': 'Validation Error',
            'message': 'Phone/Email and password are required.'
        }), 400

    # Look up user by phone or email
    user = User.query.filter((User.phone == identifier) | (User.email == identifier)).first()

    if not user or not user.check_password(password):
        return jsonify({
            'success': False,
            'error': 'Invalid Credentials',
            'message': 'Invalid phone/email or password.'
        }), 401

    if expected_role and user.role != expected_role:
        return jsonify({
            'success': False,
            'error': 'Role Mismatch',
            'message': f'This account is registered as {user.role}, not {expected_role}. Please switch to the {user.role} login option.'
        }), 403

    return jsonify({
        'success': True,
        'message': f'Login successful. Welcome back, {user.name or user.role}!',
        'user': user.to_dict(),
        'token': f'session_token_{user.id}_{user.role.lower()}',
        'access_token': f'session_token_{user.id}_{user.role.lower()}'
    }), 200


@auth_bp.route('/demo-accounts', methods=['GET'])
def get_demo_accounts():
    """Returns accessible demo accounts for one-click prototype evaluation."""
    demo_list = [
        {
            'role': 'FARMER',
            'title': 'Verified Farmer',
            'name': 'Suresh Patil',
            'phone': '9823012345',
            'password': 'farmer123',
            'district': 'Nashik (Dindori)',
            'status': 'VERIFIED',
            'features': 'Produce listings, Mandi intelligence, Price prediction, Sale advisor, Inbound offers'
        },
        {
            'role': 'FARMER',
            'title': 'Pending Farmer',
            'name': 'Ramesh Khot',
            'phone': '9823054321',
            'password': 'farmer123',
            'district': 'Pune (Baramati)',
            'status': 'PENDING',
            'features': 'Pending Government Verification demonstration view'
        },
        {
            'role': 'FPO',
            'title': 'Verified FPO',
            'name': 'Sahyadri Farmers Producer Co.',
            'phone': '9823099999',
            'password': 'fpo123',
            'district': 'Nashik',
            'status': 'VERIFIED',
            'features': 'Produce aggregation pool, Member farmer registry, Bulk contracts'
        },
        {
            'role': 'BUYER',
            'title': 'Verified Buyer',
            'name': 'MahaFresh Wholesale & Retail',
            'phone': '9820011223',
            'password': 'buyer123',
            'district': 'Navi Mumbai',
            'status': 'VERIFIED',
            'features': 'Verified seller marketplace, 2-way negotiations, Orders & Government Escrow'
        },
        {
            'role': 'WAREHOUSE',
            'title': 'Cold Storage Facility',
            'name': 'Nashik Agro Cold Storage',
            'phone': '9830022334',
            'password': 'warehouse123',
            'district': 'Nashik (MIDC Ambad)',
            'status': 'VERIFIED',
            'features': 'Facility capacity management, Storage bookings, IoT temperature logging'
        },
        {
            'role': 'ADMIN',
            'title': 'Government Administrator',
            'name': 'MahaAgri State Nodal Officer',
            'phone': '9810000001',
            'password': 'admin123',
            'district': 'State Level (Maharashtra)',
            'status': 'VERIFIED',
            'features': 'Cross-portal user verification, Escrow & payment audits, Dispute resolution'
        }
    ]
    return jsonify({
        'success': True,
        'demo_accounts': demo_list
    }), 200


@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    user = User.query.first()
    if user:
        return jsonify({
            'success': True,
            'user': user.to_dict()
        }), 200

    return jsonify({
        'success': False,
        'message': 'No active session.'
    }), 404


@auth_bp.route('/logout', methods=['POST'])
def logout():
    return jsonify({
        'success': True,
        'message': 'Logged out successfully.'
    }), 200
