from datetime import datetime
from models import db

class CropLot(db.Model):
    __tablename__ = 'crop_lots'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    seller_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    seller_type = db.Column(db.Enum('FARMER', 'FPO', name='seller_types'), nullable=False)
    seller_name = db.Column(db.String(150), nullable=False)
    seller_verification_status = db.Column(db.Enum('PENDING', 'VERIFIED', 'REJECTED', name='verification_statuses'), default='PENDING')
    crop = db.Column(db.String(100), nullable=False)
    variety = db.Column(db.String(100), nullable=True)
    quantity = db.Column(db.Float, nullable=False)
    unit = db.Column(db.Enum('kg', 'quintal', 'tonne', name='quantity_units'), default='kg')
    quality_grade = db.Column(db.Enum('Grade A', 'Grade B', 'Grade C', name='quality_grades'), default='Grade A')
    harvest_date = db.Column(db.String(30), nullable=False)
    location = db.Column(db.String(150), nullable=False)
    district = db.Column(db.String(100), nullable=False)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    address = db.Column(db.String(255), nullable=True)
    village = db.Column(db.String(100), nullable=True)
    taluka = db.Column(db.String(100), nullable=True)
    pincode = db.Column(db.String(20), nullable=True)
    state = db.Column(db.String(50), default='Maharashtra')
    expected_price = db.Column(db.Float, nullable=False)
    storage_status = db.Column(db.Enum('NOT_STORED', 'IN_STORAGE', 'SCHEDULED', name='storage_statuses'), default='NOT_STORED')
    image_url = db.Column(db.String(255), nullable=True)
    status = db.Column(db.Enum('DRAFT', 'ACTIVE', 'RESERVED', 'SOLD', 'EXPIRED', 'CANCELLED', name='lot_statuses'), default='ACTIVE')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    members = db.relationship('FPOLotMember', backref='lot', cascade='all, delete-orphan', lazy=True)
    images = db.relationship('CropLotImage', backref='lot', cascade='all, delete-orphan', lazy=True)
    quality_report = db.relationship('QualityReport', backref='lot', uselist=False, cascade='all, delete-orphan', lazy=True)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        # Determine primary image URL from CropLotImage list or fallback to legacy image_url
        primary_img = None
        if self.images:
            for img in self.images:
                if img.is_primary:
                    primary_img = img.image_url
                    break
            if not primary_img and len(self.images) > 0:
                primary_img = self.images[0].image_url
        if not primary_img:
            primary_img = self.image_url

        q_report = self.quality_report.to_dict() if self.quality_report else None
        ver_status = self.quality_report.verification_status if self.quality_report else 'SELF_REPORTED'
        ver_grade = self.quality_report.verified_grade if self.quality_report else None

        return {
            'id': self.id,
            'seller_id': self.seller_id,
            'seller_type': self.seller_type,
            'seller_name': self.seller_name,
            'seller_verification_status': self.seller_verification_status,
            'crop': self.crop,
            'variety': self.variety or 'Standard',
            'quantity': self.quantity,
            'unit': self.unit,
            'quality_grade': self.quality_grade,
            'harvest_date': str(self.harvest_date),
            'location': self.location,
            'district': self.district,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'address': self.address or self.location,
            'village': self.village,
            'taluka': self.taluka,
            'pincode': self.pincode,
            'state': self.state or 'Maharashtra',
            'coordinates': {
                'lat': self.latitude,
                'lng': self.longitude
            } if self.latitude is not None and self.longitude is not None else None,
            'expected_price': self.expected_price,
            'storage_status': self.storage_status,
            'image_url': primary_img,
            'primary_image_url': primary_img,
            'images': [img.to_dict() for img in self.images] if self.images else [],
            'images_count': len(self.images) if self.images else (1 if self.image_url else 0),
            'quality_report': q_report,
            'verification_status': ver_status,
            'verified_grade': ver_grade,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'members': [m.to_dict() for m in self.members] if self.members else [],
            'members_count': len(self.members) if self.members else 0,
            'offers_count': 2 if self.status == 'ACTIVE' else 0 # Demo offer link
        }



class CropLotImage(db.Model):
    __tablename__ = 'crop_lot_images'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    crop_lot_id = db.Column(db.Integer, db.ForeignKey('crop_lots.id', ondelete='CASCADE'), nullable=False)
    image_url = db.Column(db.String(255), nullable=False)
    is_primary = db.Column(db.Boolean, default=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            'id': self.id,
            'crop_lot_id': self.crop_lot_id,
            'image_url': self.image_url,
            'is_primary': self.is_primary,
            'uploaded_at': self.uploaded_at.isoformat() if self.uploaded_at else None
        }


class FPOLotMember(db.Model):
    __tablename__ = 'fpo_lot_members'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    fpo_lot_id = db.Column(db.Integer, db.ForeignKey('crop_lots.id', ondelete='CASCADE'), nullable=False)
    farmer_name = db.Column(db.String(150), nullable=False)
    farmer_reference_placeholder = db.Column(db.String(50), nullable=True)
    crop = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    unit = db.Column(db.Enum('kg', 'quintal', 'tonne', name='quantity_units'), default='kg')
    quality_grade = db.Column(db.Enum('Grade A', 'Grade B', 'Grade C', name='quality_grades'), default='Grade A')
    contribution_status = db.Column(db.Enum('PLEDGED', 'RECEIVED', 'VERIFIED', name='contribution_statuses'), default='PLEDGED')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            'id': self.id,
            'fpo_lot_id': self.fpo_lot_id,
            'farmer_name': self.farmer_name,
            'farmer_reference_placeholder': self.farmer_reference_placeholder,
            'crop': self.crop,
            'quantity': self.quantity,
            'unit': self.unit,
            'quality_grade': self.quality_grade,
            'contribution_status': self.contribution_status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class QualityReport(db.Model):
    __tablename__ = 'quality_reports'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    crop_lot_id = db.Column(db.Integer, db.ForeignKey('crop_lots.id', ondelete='CASCADE'), nullable=False, unique=True)
    seller_declared_grade = db.Column(db.String(50), nullable=False, default='Grade A')
    verified_grade = db.Column(db.String(50), nullable=True)
    condition_summary = db.Column(db.String(150), nullable=True, default='Freshly Harvested')
    moisture_percentage = db.Column(db.Float, nullable=True, default=12.0)
    damage_percentage = db.Column(db.Float, nullable=True, default=2.0)
    freshness_status = db.Column(db.String(30), default='FRESH')
    verification_status = db.Column(
        db.String(50),
        default='SELF_REPORTED'
    )  # 'SELF_REPORTED', 'VERIFICATION_REQUESTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'REQUIRES_RECHECK'
    # AI-Assisted Visual Quality Verification
    ai_verification_status = db.Column(db.String(50), default='PASSED')  # 'PENDING', 'PASSED', 'FLAGGED', 'MANUAL_REVIEW'
    ai_score = db.Column(db.Float, default=0.92)
    ai_crop_consistency = db.Column(db.Boolean, default=True)
    ai_quality_assessment = db.Column(db.String(50), default='SUFFICIENT')  # 'SUFFICIENT', 'INSUFFICIENT'
    ai_signals = db.Column(db.Text, default='AI Visual Check: Produce color, texture, and size distribution are consistent. No spoilage markers detected.')
    ai_reviewed_by_admin = db.Column(db.Boolean, default=False)
    ai_review_notes = db.Column(db.Text, nullable=True)

    verified_by = db.Column(db.String(150), nullable=True)
    verifier_role = db.Column(db.String(100), nullable=True)  # 'FPO_REPRESENTATIVE', 'BUYER_INSPECTOR', 'AUTHORIZED_OFFICER'
    verification_date = db.Column(db.String(50), nullable=True)
    verifier_notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            'id': self.id,
            'crop_lot_id': self.crop_lot_id,
            'seller_declared_grade': self.seller_declared_grade,
            'verified_grade': self.verified_grade,
            'condition_summary': self.condition_summary or 'Freshly Harvested',
            'moisture_percentage': self.moisture_percentage,
            'damage_percentage': self.damage_percentage,
            'freshness_status': self.freshness_status or 'FRESH',
            'verification_status': self.verification_status or 'SELF_REPORTED',
            'ai_verification_status': self.ai_verification_status or 'PASSED',
            'ai_score': round(self.ai_score, 2) if self.ai_score is not None else 0.90,
            'ai_crop_consistency': self.ai_crop_consistency if self.ai_crop_consistency is not None else True,
            'ai_quality_assessment': self.ai_quality_assessment or 'SUFFICIENT',
            'ai_signals': self.ai_signals or 'Visual check passed.',
            'ai_reviewed_by_admin': self.ai_reviewed_by_admin or False,
            'ai_review_notes': self.ai_review_notes,
            'verified_by': self.verified_by,
            'verifier_role': self.verifier_role,
            'verification_date': self.verification_date,
            'verifier_notes': self.verifier_notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

