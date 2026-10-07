from models import db
from datetime import datetime, date

class Warehouse(db.Model):
    __tablename__ = 'warehouses'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    operator_user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    name = db.Column(db.String(200), nullable=False)
    verification_status = db.Column(db.String(20), default='PENDING', index=True) # PENDING, VERIFIED, REJECTED, SUSPENDED
    district = db.Column(db.String(100), nullable=False, index=True)
    location = db.Column(db.String(200), nullable=False)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    storage_type = db.Column(db.String(50), nullable=False) # DRY_STORAGE, COLD_STORAGE, CONTROLLED_STORAGE
    supported_crops = db.Column(db.String(255), nullable=False)
    total_capacity = db.Column(db.Float, nullable=False) # In tonnes
    available_capacity = db.Column(db.Float, nullable=False) # In tonnes
    price_per_kg_per_day = db.Column(db.Float, nullable=False)
    temperature_range_placeholder = db.Column(db.String(50), nullable=True)
    availability_status = db.Column(db.String(20), default='AVAILABLE') # AVAILABLE, LIMITED, FULL
    verified_at = db.Column(db.DateTime, nullable=True)
    verified_by_admin_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    rejection_reason = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    operator = db.relationship('User', foreign_keys=[operator_user_id])
    verified_by_admin = db.relationship('User', foreign_keys=[verified_by_admin_id])
    bookings = db.relationship('StorageBooking', backref='warehouse', lazy=True, cascade='all, delete-orphan')

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        operator_name = self.operator.name if self.operator else None
        return {
            'id': self.id,
            'operator_user_id': self.operator_user_id,
            'operator_name': operator_name,
            'name': self.name,
            'verification_status': self.verification_status,
            'district': self.district,
            'location': self.location,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'coordinates': {'lat': self.latitude, 'lng': self.longitude} if self.latitude and self.longitude else None,
            'storage_type': self.storage_type,
            'supported_crops': self.supported_crops,
            'total_capacity': round(self.total_capacity, 1),
            'available_capacity': round(self.available_capacity, 1),
            'occupancy_percentage': round(((self.total_capacity - self.available_capacity) / self.total_capacity) * 100, 1) if self.total_capacity > 0 else 0,
            'price_per_kg_per_day': round(self.price_per_kg_per_day, 4),
            'price_per_tonne_per_month': round(self.price_per_kg_per_day * 1000 * 30, 2),
            'temperature_range': self.temperature_range_placeholder or ('0°C to 4°C' if 'COLD' in (self.storage_type or '') else 'Ambient (18-24°C)'),
            'availability_status': self.availability_status,
            'verified_at': self.verified_at.isoformat() if self.verified_at else None,
            'verified_by_admin_id': self.verified_by_admin_id,
            'rejection_reason': self.rejection_reason,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class StorageBooking(db.Model):
    __tablename__ = 'storage_bookings'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    booking_ref = db.Column(db.String(50), unique=True, nullable=True, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    user_role = db.Column(db.String(20), nullable=False, default='FARMER') # FARMER, FPO, BUYER
    warehouse_id = db.Column(db.Integer, db.ForeignKey('warehouses.id', ondelete='CASCADE'), nullable=False, index=True)
    commodity_id = db.Column(db.Integer, db.ForeignKey('commodities.id', ondelete='SET NULL'), nullable=True)
    crop = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(20), default='kg')
    storage_type = db.Column(db.String(50), default='COLD_STORAGE') # DRY_STORAGE, COLD_STORAGE, CONTROLLED_STORAGE
    start_date = db.Column(db.Date, nullable=False, default=date.today)
    expected_duration_days = db.Column(db.Integer, nullable=False, default=14)
    expected_end_date = db.Column(db.Date, nullable=True)
    actual_check_in_at = db.Column(db.DateTime, nullable=True)
    actual_check_out_at = db.Column(db.DateTime, nullable=True)
    estimated_cost = db.Column(db.Float, nullable=False)
    # Lifecycle: REQUESTED, APPROVED, CHECKED_IN, ACTIVE, CHECKED_OUT, COMPLETED, REJECTED, CANCELLED
    status = db.Column(db.String(30), default='REQUESTED', nullable=False, index=True)
    approved_at = db.Column(db.DateTime, nullable=True)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    rejection_reason = db.Column(db.Text, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('User', foreign_keys=[user_id])
    commodity = db.relationship('Commodity', foreign_keys=[commodity_id])

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        user_name = self.user.name if self.user else f"User #{self.user_id}"
        commodity_data = self.commodity.to_dict() if self.commodity else None
        return {
            'id': self.id,
            'booking_ref': self.booking_ref or f"SBK-{self.id}",
            'user_id': self.user_id,
            'user_name': user_name,
            'user_role': self.user_role,
            'warehouse_id': self.warehouse_id,
            'warehouse_name': self.warehouse.name if self.warehouse else 'Warehouse Facility',
            'warehouse_district': self.warehouse.district if self.warehouse else 'Maharashtra',
            'warehouse_location': self.warehouse.location if self.warehouse else '',
            'commodity_id': self.commodity_id,
            'commodity': commodity_data,
            'crop': self.crop,
            'quantity': round(self.quantity, 1),
            'unit': self.unit,
            'storage_type': self.storage_type,
            'start_date': self.start_date.isoformat() if hasattr(self.start_date, 'isoformat') else str(self.start_date),
            'expected_duration_days': self.expected_duration_days,
            'expected_end_date': self.expected_end_date.isoformat() if hasattr(self.expected_end_date, 'isoformat') and self.expected_end_date else None,
            'actual_check_in_at': self.actual_check_in_at.isoformat() if self.actual_check_in_at else None,
            'actual_check_out_at': self.actual_check_out_at.isoformat() if self.actual_check_out_at else None,
            'estimated_cost': round(self.estimated_cost, 2),
            'cost_status': 'ESTIMATED',
            'status': self.status,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'approved_by': self.approved_by,
            'rejection_reason': self.rejection_reason,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
