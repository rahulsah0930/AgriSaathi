import os

auth_py_content = '''from flask import Blueprint, request, jsonify
from models import db, User, FarmerProfile, FPOProfile, BuyerProfile, Warehouse, Notification
from utils import success_response, error_response, mask_bank_account, mask_aadhaar
import re

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.route("/register/farmer", methods=["POST"])
def register_farmer():
    data = request.get_json() or {}

    required_fields = ["full_name", "phone", "password", "confirm_password", "village", "taluka", "district"]
    errors = {}
    for field in required_fields:
        if not data.get(field) or not str(data.get(field)).strip():
            errors[field] = f"{field.replace('_', ' ').title()} is required"

    if data.get("password") != data.get("confirm_password"):
        errors["confirm_password"] = "Passwords do not match"

    if errors:
        return error_response(message="Validation failed", status_code=422, details=errors)

    phone = str(data["phone"]).strip()
    email = str(data.get("email", "")).strip().lower() or None

    if User.query.filter_by(phone=phone).first():
        return error_response(message="A user with this phone number is already registered", status_code=409)

    if email and User.query.filter_by(email=email).first():
        return error_response(message="A user with this email address is already registered", status_code=409)

    try:
        user = User(
            name=data["full_name"].strip(),
            phone=phone,
            email=email,
            role="FARMER",
            verification_status="PENDING",
            verification_notes="Awaiting land record and identity verification by Taluka Agriculture Officer."
        )
        user.set_password(data["password"])
        db.session.add(user)
        db.session.flush()

        farmer_profile = FarmerProfile(
            user_id=user.id,
            full_name=data["full_name"].strip(),
            aadhaar_masked=mask_aadhaar(data.get("aadhaar")),
            village=data["village"].strip(),
            taluka=data["taluka"].strip(),
            district=data["district"].strip(),
            state=data.get("state", "Maharashtra"),
            farm_size_acres=float(data.get("farm_size_acres")) if data.get("farm_size_acres") else None,
            main_crops=data.get("main_crops", "Tomato, Onion"),
            bank_account_masked=mask_bank_account(data.get("bank_account")),
            ifsc_code_masked=str(data.get("ifsc_code", "SBIN0001234")).upper() if data.get("ifsc_code") else "SBIN0001234"
        )
        db.session.add(farmer_profile)

        notif = Notification(
            user_id=user.id,
            title="Welcome to AgriSaathi!",
            message=f"Welcome {user.name}! Your farmer account has been registered. Identity verification is pending.",
            type="VERIFICATION"
        )
        db.session.add(notif)
        db.session.commit()

        user_dict = user.to_dict()
        return jsonify({
            "success": True,
            "message": "Registration successful. Your farmer profile is pending Government Verification.",
            "data": {"user": user_dict},
            "user": user_dict
        }), 201

    except Exception as e:
        db.session.rollback()
        return error_response(message="Failed to complete farmer registration", status_code=500, details=str(e))


@auth_bp.route("/register/fpo", methods=["POST"])
def register_fpo():
    data = request.get_json() or {}

    required_fields = ["fpo_name", "registration_number", "contact_person", "phone", "password", "confirm_password", "district"]
    errors = {}
    for field in required_fields:
        if not data.get(field) or not str(data.get(field)).strip():
            errors[field] = f"{field.replace('_', ' ').title()} is required"

    if data.get("password") != data.get("confirm_password"):
        errors["confirm_password"] = "Passwords do not match"

    if errors:
        return error_response(message="Validation failed", status_code=422, details=errors)

    phone = str(data["phone"]).strip()
    email = str(data.get("email", "")).strip().lower() or None

    if User.query.filter_by(phone=phone).first():
        return error_response(message="A user with this phone number is already registered", status_code=409)

    if email and User.query.filter_by(email=email).first():
        return error_response(message="A user with this email address is already registered", status_code=409)

    try:
        user = User(
            name=data["fpo_name"].strip(),
            phone=phone,
            email=email,
            role="FPO",
            verification_status="PENDING",
            verification_notes="Awaiting FPO registration certificate & executive board audit."
        )
        user.set_password(data["password"])
        db.session.add(user)
        db.session.flush()

        fpo_profile = FPOProfile(
            user_id=user.id,
            fpo_name=data["fpo_name"].strip(),
            registration_number=data["registration_number"].strip(),
            contact_person=data["contact_person"].strip(),
            district=data["district"].strip(),
            state=data.get("state", "Maharashtra"),
            member_count=int(data.get("member_count", 0)) if data.get("member_count") else 0,
            primary_crops=data.get("primary_crops", "Onion, Grapes, Pomegranate"),
            bank_account_masked=mask_bank_account(data.get("bank_account")),
            ifsc_code_masked=str(data.get("ifsc_code", "MAHB0001234")).upper() if data.get("ifsc_code") else "MAHB0001234"
        )
        db.session.add(fpo_profile)

        notif = Notification(
            user_id=user.id,
            title="FPO Registered",
            message=f"FPO {user.name} registered successfully. Institutional verification pending.",
            type="VERIFICATION"
        )
        db.session.add(notif)
        db.session.commit()

        user_dict = user.to_dict()
        return jsonify({
            "success": True,
            "message": "FPO registration successful. Institutional profile is pending verification.",
            "data": {"user": user_dict},
            "user": user_dict
        }), 201

    except Exception as e:
        db.session.rollback()
        return error_response(message="Failed to complete FPO registration", status_code=500, details=str(e))


@auth_bp.route("/register/buyer", methods=["POST"])
def register_buyer():
    data = request.get_json() or {}

    company_name = data.get("company_name", "").strip()
    contact_person = data.get("contact_person", "").strip()
    phone = data.get("phone", "").strip()
    email = data.get("email", "").strip().lower() or None
    business_category = data.get("business_category", "").strip()
    address = data.get("address", "").strip()
    district = data.get("district", "").strip()
    state = data.get("state", "Maharashtra").strip()
    gst_number = data.get("gst_number", "").strip() or None
    bank_details = data.get("bank_details", "").strip()
    password = data.get("password", "")
    confirm_password = data.get("confirm_password", "")

    errors = {}
    if not company_name:
        errors["company_name"] = "Company Name is required"
    if not contact_person:
        errors["contact_person"] = "Contact Person Name is required"
    if not phone:
        errors["phone"] = "Phone number is required"
    elif len(phone) < 10:
        errors["phone"] = "Enter a valid 10-digit phone number"
    if not business_category:
        errors["business_category"] = "Business category is required"
    if not address:
        errors["address"] = "Address is required"
    if not district:
        errors["district"] = "District is required"
    if not password:
        errors["password"] = "Password is required"
    elif len(password) < 6:
        errors["password"] = "Password must be at least 6 characters"
    if password != confirm_password:
        errors["confirm_password"] = "Passwords do not match"

    if errors:
        return error_response(message="Validation failed", status_code=422, details=errors)

    if User.query.filter_by(phone=phone).first():
        return error_response(message="A user with this phone number is already registered", status_code=409)

    if email and User.query.filter_by(email=email).first():
        return error_response(message="A user with this email address is already registered", status_code=409)

    try:
        user = User(
            name=company_name,
            email=email,
            phone=phone,
            role="BUYER",
            verification_status="PENDING",
            verification_notes="Awaiting document verification by Maharashtra Agriculture Admin.",
        )
        user.set_password(password)
        db.session.add(user)
        db.session.flush()

        bp = BuyerProfile(
            user_id=user.id,
            company_name=company_name,
            contact_person=contact_person,
            gst_number=gst_number,
            business_category=business_category,
            address=address,
            district=district,
            state=state,
            bank_account_mask=mask_bank_account(bank_details),
        )
        db.session.add(bp)

        notif = Notification(
            user_id=user.id,
            title="Registration Received",
            message="Your Buyer registration has been submitted. Verification is in review.",
            type="VERIFICATION",
        )
        db.session.add(notif)
        db.session.commit()

        user_dict = user.to_dict()
        return jsonify({
            "success": True,
            "message": "Buyer registration submitted successfully. Your profile is pending Government Verification.",
            "data": {"user": user_dict, "buyer_profile": bp.to_dict()},
            "user": user_dict
        }), 201

    except Exception as e:
        db.session.rollback()
        return error_response(message="Failed to register buyer profile", status_code=500, details=str(e))


@auth_bp.route("/register/warehouse", methods=["POST"])
def register_warehouse():
    data = request.get_json() or {}

    warehouse_name = data.get("warehouse_name", "").strip()
    owner_organization = data.get("owner_organization", "").strip()
    contact_person = data.get("contact_person", "").strip()
    phone = data.get("phone", "").strip()
    email = data.get("email", "").strip().lower() or None
    address = data.get("address", "").strip()
    district = data.get("district", "").strip()
    state = data.get("state", "Maharashtra").strip()
    license_number = data.get("license_number", "").strip() or None
    total_capacity = data.get("total_capacity")
    capacity_unit = data.get("capacity_unit", "tonnes").strip()
    storage_type = data.get("storage_type", "NORMAL").strip().upper()
    price_per_kg_day = data.get("price_per_kg_day", 0.15)
    temperature_info = data.get("temperature_info", "").strip()
    supported_crops = data.get("supported_crops", [])
    password = data.get("password", "")
    confirm_password = data.get("confirm_password", "")

    errors = {}
    if not warehouse_name:
        errors["warehouse_name"] = "Warehouse Name is required"
    if not owner_organization:
        errors["owner_organization"] = "Owner / Operating Organization is required"
    if not contact_person:
        errors["contact_person"] = "Contact Person Name is required"
    if not phone or len(phone) < 10:
        errors["phone"] = "Valid 10-digit phone number is required"
    if not address:
        errors["address"] = "Facility address is required"
    if not district:
        errors["district"] = "District is required"

    if total_capacity is None:
        errors["total_capacity"] = "Total storage capacity is required"
    else:
        try:
            total_capacity = float(total_capacity)
            if total_capacity <= 0:
                errors["total_capacity"] = "Total capacity must be greater than zero"
        except ValueError:
            errors["total_capacity"] = "Total capacity must be a valid number"

    try:
        price_per_kg_day = float(price_per_kg_day)
        if price_per_kg_day < 0:
            price_per_kg_day = 0.15
    except (ValueError, TypeError):
        price_per_kg_day = 0.15

    if not password:
        errors["password"] = "Password is required"
    elif len(password) < 6:
        errors["password"] = "Password must be at least 6 characters"
    if password != confirm_password:
        errors["confirm_password"] = "Passwords do not match"

    if errors:
        return error_response(message="Validation failed", status_code=422, details=errors)

    if User.query.filter_by(phone=phone).first():
        return error_response(message="A user with this phone number is already registered", status_code=409)

    if email and User.query.filter_by(email=email).first():
        return error_response(message="A user with this email address is already registered", status_code=409)

    try:
        user = User(
            name=warehouse_name,
            email=email,
            phone=phone,
            role="WAREHOUSE",
            verification_status="PENDING",
            verification_notes="Awaiting WDRA Accreditation & physical inspection by Taluka Officer.",
        )
        user.set_password(password)
        db.session.add(user)
        db.session.flush()

        crops_str = ",".join(supported_crops) if isinstance(supported_crops, list) else str(supported_crops or "Onion,Tomato,Potato,Soybean,Wheat")

        wh = Warehouse(
            user_id=user.id,
            warehouse_name=warehouse_name,
            owner_organization=owner_organization,
            license_number=license_number or f"WDRA-MH-{user.id:04d}",
            contact_person=contact_person,
            phone=phone,
            email=email,
            address=address,
            district=district,
            state=state,
            total_capacity=total_capacity,
            occupied_capacity=0.0,
            available_capacity=total_capacity,
            capacity_unit=capacity_unit,
            storage_type=storage_type if storage_type in ("NORMAL", "COLD_STORAGE", "CONTROLLED") else "NORMAL",
            availability_status="AVAILABLE",
            supported_crops=crops_str,
            price_per_kg_day=price_per_kg_day,
            temperature_info=temperature_info or ("2°C - 8°C Cold Chain" if storage_type == "COLD_STORAGE" else "Ambient Ventilated"),
            verification_status="PENDING",
        )
        db.session.add(wh)

        notif = Notification(
            user_id=user.id,
            title="Warehouse Registered",
            message=f"{warehouse_name} registered with {total_capacity} {capacity_unit} capacity. Awaiting inspection.",
            type="VERIFICATION",
        )
        db.session.add(notif)
        db.session.commit()

        user_dict = user.to_dict()
        return jsonify({
            "success": True,
            "message": "Warehouse registration submitted successfully. Facility is pending Government Verification.",
            "data": {"user": user_dict, "warehouse": wh.to_dict()},
            "user": user_dict
        }), 201

    except Exception as e:
        db.session.rollback()
        return error_response(message="Failed to register warehouse facility", status_code=500, details=str(e))


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    identifier = (data.get("identifier") or data.get("phone") or data.get("email") or "").strip()
    password = data.get("password", "")
    requested_role = (data.get("role") or "").strip().upper()

    if not identifier:
        return error_response("Phone number or Email is required", status_code=400)
    if not password:
        return error_response("Password is required", status_code=400)

    # Search user by phone, email, or name
    user = User.query.filter(
        (User.phone == identifier) |
        (User.email == identifier.lower()) |
        (User.name == identifier)
    ).first()

    if not user:
        return error_response("Invalid credentials. Account not found.", status_code=401)

    if not user.check_password(password):
        return error_response("Invalid credentials. Incorrect password.", status_code=401)

    # Role validation if specific role requested
    if requested_role and user.role != requested_role:
        # Allow cross-login with informational notice
        pass

    user_dict = user.to_dict()
    return jsonify({
        "success": True,
        "message": f"Welcome back, {user_dict['name']}!",
        "data": {
            "user": user_dict,
            "role": user.role,
            "verification_status": user.verification_status,
        },
        "user": user_dict
    }), 200


@auth_bp.route("/demo-accounts", methods=["GET"])
def demo_accounts():
    """Returns accessible demo accounts for all 5 roles."""
    return jsonify({
        "success": True,
        "demo_accounts": [
            {
                "role": "FARMER",
                "title": "Individual Farmer",
                "name": "Suresh Patil",
                "phone": "9823012345",
                "password": "password123",
                "location": "Dindori, Nashik",
                "description": "Progressive farmer with 4.5 acres, actively selling Grade A Hybrid Tomatoes & Onions."
            },
            {
                "role": "FPO",
                "title": "Farmer Producer Organization (FPO)",
                "name": "Sahyadri Farmers Producer Co. Ltd.",
                "phone": "9823099999",
                "password": "password123",
                "location": "Mohadi, Dindori, Nashik",
                "description": "Registered FPO aggregating member harvests for export & institutional buyer deals."
            },
            {
                "role": "BUYER",
                "title": "Verified Institutional Buyer",
                "name": "MahaFresh Foods Pvt Ltd",
                "phone": "9820011223",
                "password": "password123",
                "location": "Vashi, Navi Mumbai",
                "description": "Retail chain & food processor buying bulk fruits and vegetables with escrow payments."
            },
            {
                "role": "WAREHOUSE",
                "title": "Cold Storage & Warehouse Provider",
                "name": "Nashik Agro Storage Corp",
                "phone": "9830022334",
                "password": "password123",
                "location": "Dindori Road, Nashik",
                "description": "WDRA accredited multi-chamber cold storage (500 MT capacity)."
            },
            {
                "role": "ADMIN",
                "title": "Maharashtra Agriculture Dept Admin",
                "name": "MahaAgri Nodal Officer",
                "phone": "9810000001",
                "password": "password123",
                "location": "Krishi Bhavan, Pune",
                "description": "Government oversight officer auditing user verifications, APMC prices & trade disputes."
            }
        ]
    }), 200


@auth_bp.route("/logout", methods=["POST"])
def logout():
    return success_response(message="Logged out successfully")


@auth_bp.route("/me", methods=["GET"])
def get_current_user():
    phone = request.args.get("phone")
    user_id = request.args.get("user_id", type=int)

    user = None
    if user_id:
        user = User.query.get(user_id)
    elif phone:
        user = User.query.filter_by(phone=phone).first()

    if not user:
        # Fallback to first user
        user = User.query.first()

    if not user:
        return error_response("No active session found", status_code=404)

    user_dict = user.to_dict()
    return jsonify({
        "success": True,
        "data": {"user": user_dict},
        "user": user_dict
    }), 200
'''

target_path = r"c:\Users\mrswa\OneDrive\Desktop\AgriSaathi2\AgriSaathi\backend\routes\auth_routes.py"
with open(target_path, "w", encoding="utf-8") as f:
    f.write(auth_py_content)
print(f"[OK] Successfully updated {target_path}")
