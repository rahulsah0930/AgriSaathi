import os

user_py_content = '''from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from . import db

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(150), nullable=True)
    email = db.Column(db.String(150), unique=True, nullable=True)
    phone = db.Column(db.String(20), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum("FARMER", "FPO", "BUYER", "WAREHOUSE", "ADMIN", name="user_role_enum"), nullable=False)
    verification_status = db.Column(db.Enum("PENDING", "VERIFIED", "REJECTED", name="verification_status_enum"), default="PENDING")
    verification_notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    farmer_profile = db.relationship("FarmerProfile", backref="user", uselist=False, cascade="all, delete-orphan")
    fpo_profile = db.relationship("FPOProfile", backref="user", uselist=False, cascade="all, delete-orphan")
    buyer_profile = db.relationship("BuyerProfile", backref="user", uselist=False, cascade="all, delete-orphan")
    warehouses = db.relationship("Warehouse", backref="user", cascade="all, delete-orphan")
    notifications = db.relationship("Notification", backref="user", cascade="all, delete-orphan")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        display_name = self.name
        profile_data = {}
        if self.role == "FARMER" and self.farmer_profile:
            profile_data = self.farmer_profile.to_dict()
            if not display_name:
                display_name = self.farmer_profile.full_name
        elif self.role == "FPO" and self.fpo_profile:
            profile_data = self.fpo_profile.to_dict()
            if not display_name:
                display_name = self.fpo_profile.fpo_name
        elif self.role == "BUYER" and self.buyer_profile:
            profile_data = self.buyer_profile.to_dict()
            if not display_name:
                display_name = self.buyer_profile.company_name
        elif self.role == "WAREHOUSE" and self.warehouses:
            if not display_name and len(self.warehouses) > 0:
                display_name = self.warehouses[0].warehouse_name

        data = {
            "id": self.id,
            "name": display_name or self.phone,
            "email": self.email,
            "phone": self.phone,
            "role": self.role,
            "verification_status": self.verification_status,
            "verification_notes": self.verification_notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "profile": profile_data,
        }
        if self.farmer_profile:
            data["farmer_profile"] = self.farmer_profile.to_dict()
        if self.fpo_profile:
            data["fpo_profile"] = self.fpo_profile.to_dict()
        if self.buyer_profile:
            data["buyer_profile"] = self.buyer_profile.to_dict()
        return data


class FarmerProfile(db.Model):
    __tablename__ = "farmer_profiles"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    full_name = db.Column(db.String(120), nullable=False)
    aadhaar_masked = db.Column(db.String(20), nullable=True)
    village = db.Column(db.String(100), nullable=False)
    taluka = db.Column(db.String(100), nullable=False)
    district = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(50), default="Maharashtra")
    farm_size_acres = db.Column(db.Float, nullable=True)
    main_crops = db.Column(db.String(255), nullable=True)
    bank_account_masked = db.Column(db.String(30), nullable=True)
    ifsc_code_masked = db.Column(db.String(20), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "full_name": self.full_name,
            "aadhaar_masked": self.aadhaar_masked,
            "village": self.village,
            "taluka": self.taluka,
            "district": self.district,
            "state": self.state,
            "farm_size_acres": self.farm_size_acres,
            "main_crops": self.main_crops,
            "bank_account_masked": self.bank_account_masked,
            "ifsc_code_masked": self.ifsc_code_masked,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class FPOProfile(db.Model):
    __tablename__ = "fpo_profiles"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    fpo_name = db.Column(db.String(200), nullable=False)
    registration_number = db.Column(db.String(100), nullable=False)
    contact_person = db.Column(db.String(120), nullable=False)
    district = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(50), default="Maharashtra")
    member_count = db.Column(db.Integer, default=0)
    primary_crops = db.Column(db.String(255), nullable=True)
    bank_account_masked = db.Column(db.String(30), nullable=True)
    ifsc_code_masked = db.Column(db.String(20), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "fpo_name": self.fpo_name,
            "registration_number": self.registration_number,
            "contact_person": self.contact_person,
            "district": self.district,
            "state": self.state,
            "member_count": self.member_count,
            "primary_crops": self.primary_crops,
            "bank_account_masked": self.bank_account_masked,
            "ifsc_code_masked": self.ifsc_code_masked,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class BuyerProfile(db.Model):
    __tablename__ = "buyer_profiles"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    company_name = db.Column(db.String(200), nullable=False)
    contact_person = db.Column(db.String(150), nullable=False)
    gst_number = db.Column(db.String(50), nullable=True)
    business_category = db.Column(db.String(100), nullable=False)
    address = db.Column(db.Text, nullable=False)
    district = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(100), default="Maharashtra")
    bank_account_mask = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "company_name": self.company_name,
            "contact_person": self.contact_person,
            "gst_number": self.gst_number,
            "business_category": self.business_category,
            "address": self.address,
            "district": self.district,
            "state": self.state,
            "bank_account_mask": self.bank_account_mask,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
'''

target_path = r"c:\Users\mrswa\OneDrive\Desktop\AgriSaathi2\AgriSaathi\backend\models\user.py"
with open(target_path, "w", encoding="utf-8") as f:
    f.write(user_py_content)
print(f"[OK] Successfully updated {target_path}")

models_init_content = '''from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

from .user import User, FarmerProfile, FPOProfile, BuyerProfile
from .warehouse import Warehouse
from .requirement import BuyerRequirement
from .offer import Offer
from .order import Order
from .payment import Payment
from .grievance import Complaint
from .notification import Notification

__all__ = [
    "db",
    "User",
    "FarmerProfile",
    "FPOProfile",
    "BuyerProfile",
    "Warehouse",
    "BuyerRequirement",
    "Offer",
    "Order",
    "Payment",
    "Complaint",
    "Notification",
]
'''

init_target_path = r"c:\Users\mrswa\OneDrive\Desktop\AgriSaathi2\AgriSaathi\backend\models\__init__.py"
with open(init_target_path, "w", encoding="utf-8") as f:
    f.write(models_init_content)
print(f"[OK] Successfully updated {init_target_path}")
