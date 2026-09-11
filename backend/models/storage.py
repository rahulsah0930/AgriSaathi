from models import db
from datetime import datetime, date

class Warehouse(db.Model):
    __tablename__ = 'warehouses'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(200), nullable=False)
    verification_status = db.Column(db.String(20), default='VERIFIED') # PENDING, VERIFIED, REJECTED
    district = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(200), nullable=False)
    storage_type = db.Column(db.String(50), nullable=False) # NORMAL, COLD_STORAGE, CONTROLLED
    supported_crops = db.Column(db.String(255), nullable=False)
    total_capacity = db.Column(db.Float, nullable=False) # In tonnes
    available_capacity = db.Column(db.Float, nullable=False) # In tonnes
    price_per_kg_per_day = db.Column(db.Float, nullable=False)
    temperature_range_placeholder = db.Column(db.String(50), nullable=True)
    availability_status = db.Column(db.String(20), default='AVAILABLE') # AVAILABLE, LIMITED, FULL
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    bookings = db.relationship('StorageBooking', backref='warehouse', lazy=True, cascade='all, delete-orphan')

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'verification_status': self.verification_status,
            'district': self.district,
            'location': self.location,
            'storage_type': self.storage_type,
            'supported_crops': self.supported_crops,
            'total_capacity': round(self.total_capacity, 1),
            'available_capacity': round(self.available_capacity, 1),
            'occupancy_percentage': round(((self.total_capacity - self.available_capacity) / self.total_capacity) * 100, 1) if self.total_capacity > 0 else 0,
            'price_per_kg_per_day': round(self.price_per_kg_per_day, 3),
            'price_per_tonne_per_month': round(self.price_per_kg_per_day * 1000 * 30, 2),
            'temperature_range': self.temperature_range_placeholder or 'Ambient (18-24°C)',
            'availability_status': self.availability_status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class StorageBooking(db.Model):
    __tablename__ = 'storage_bookings'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    user_role = db.Column(db.String(20), nullable=False, default='FARMER') # FARMER, FPO
    warehouse_id = db.Column(db.Integer, db.ForeignKey('warehouses.id', ondelete='CASCADE'), nullable=False)
    crop = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(20), default='kg')
    start_date = db.Column(db.Date, nullable=False, default=date.today)
    expected_duration_days = db.Column(db.Integer, nullable=False, default=14)
    estimated_cost = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='REQUESTED') # REQUESTED, CONFIRMED, CANCELLED, COMPLETED
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_role': self.user_role,
            'warehouse_id': self.warehouse_id,
            'warehouse_name': self.warehouse.name if self.warehouse else 'Warehouse',
            'warehouse_district': self.warehouse.district if self.warehouse else 'Maharashtra',
            'crop': self.crop,
            'quantity': round(self.quantity, 1),
            'unit': self.unit,
            'start_date': self.start_date.isoformat() if hasattr(self.start_date, 'isoformat') else str(self.start_date),
            'expected_duration_days': self.expected_duration_days,
            'estimated_cost': round(self.estimated_cost, 2),
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
