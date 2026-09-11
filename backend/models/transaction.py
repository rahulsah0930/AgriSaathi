from datetime import datetime
from models import db

class Transaction(db.Model):
    __tablename__ = 'transactions'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    transaction_ref = db.Column(db.String(50), unique=True, nullable=False)
    crop_lot_id = db.Column(db.Integer, db.ForeignKey('crop_lots.id', ondelete='SET NULL'), nullable=True)
    offer_id = db.Column(db.Integer, db.ForeignKey('offers.id', ondelete='SET NULL'), nullable=True)
    buyer_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    seller_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)

    crop = db.Column(db.String(100), nullable=False)
    variety = db.Column(db.String(100), nullable=True)
    quantity = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(20), default='kg')
    agreed_price_per_unit = db.Column(db.Float, nullable=False)
    total_amount = db.Column(db.Float, nullable=False)

    # Configurable Escrow advance percentage (default 20%)
    advance_percentage = db.Column(db.Float, default=20.0)
    advance_amount = db.Column(db.Float, nullable=False)
    balance_amount = db.Column(db.Float, nullable=False)

    status = db.Column(
        db.Enum(
            'DEAL_CONFIRMED',
            'ADVANCE_PENDING',
            'ADVANCE_PAID',
            'PREPARING',
            'READY_FOR_PICKUP',
            'IN_TRANSIT',
            'DELIVERED',
            'BUYER_CONFIRMED',
            'COMPLETED',
            'DISPUTED',
            'CANCELLED',
            name='transaction_statuses'
        ),
        default='ADVANCE_PENDING'
    )

    pickup_address = db.Column(db.String(255), nullable=True)
    pickup_district = db.Column(db.String(100), nullable=True)
    pickup_lat = db.Column(db.Float, nullable=True)
    pickup_lng = db.Column(db.Float, nullable=True)

    delivery_address = db.Column(db.String(255), nullable=True)
    delivery_district = db.Column(db.String(100), nullable=True)
    delivery_lat = db.Column(db.Float, nullable=True)
    delivery_lng = db.Column(db.Float, nullable=True)

    warehouse_id = db.Column(db.Integer, nullable=True)
    carrier_name = db.Column(db.String(100), nullable=True)
    tracking_number = db.Column(db.String(100), nullable=True)

    delivery_confirmed_at = db.Column(db.DateTime, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    govt_audit_notes = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    buyer = db.relationship('User', foreign_keys=[buyer_id], backref='buyer_transactions')
    seller = db.relationship('User', foreign_keys=[seller_id], backref='seller_transactions')
    crop_lot = db.relationship('CropLot', backref='transactions')
    payments = db.relationship('PaymentRecord', backref='transaction', cascade='all, delete-orphan', lazy=True)
    grievances = db.relationship('Grievance', backref='transaction', cascade='all, delete-orphan', lazy=True)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.advance_amount and self.total_amount:
            pct = self.advance_percentage or 20.0
            self.advance_amount = round(self.total_amount * (pct / 100.0), 2)
            self.balance_amount = round(self.total_amount - self.advance_amount, 2)

    def to_dict(self):
        buyer_name = self.buyer.name if self.buyer else 'Buyer'
        if self.buyer and self.buyer.buyer_profile:
            buyer_name = self.buyer.buyer_profile.company_name

        seller_name = self.seller.name if self.seller else 'Seller'
        if self.seller and self.seller.farmer_profile:
            seller_name = self.seller.farmer_profile.full_name
        elif self.seller and self.seller.fpo_profile:
            seller_name = self.seller.fpo_profile.fpo_name

        return {
            'id': self.id,
            'transaction_ref': self.transaction_ref,
            'crop_lot_id': self.crop_lot_id,
            'offer_id': self.offer_id,
            'buyer_id': self.buyer_id,
            'buyer_name': buyer_name,
            'seller_id': self.seller_id,
            'seller_name': seller_name,
            'crop': self.crop,
            'variety': self.variety,
            'quantity': self.quantity,
            'unit': self.unit,
            'agreed_price_per_unit': self.agreed_price_per_unit,
            'total_amount': self.total_amount,
            'total_value': self.total_amount,
            'advance_percentage': self.advance_percentage,
            'advance_amount': self.advance_amount,
            'balance_amount': self.balance_amount,
            'status': self.status,
            'pickup_address': self.pickup_address,
            'pickup_district': self.pickup_district,
            'pickup_coordinates': {'lat': self.pickup_lat, 'lng': self.pickup_lng} if self.pickup_lat else None,
            'delivery_address': self.delivery_address,
            'delivery_district': self.delivery_district,
            'delivery_coordinates': {'lat': self.delivery_lat, 'lng': self.delivery_lng} if self.delivery_lat else None,
            'warehouse_id': self.warehouse_id,
            'carrier_name': self.carrier_name,
            'tracking_number': self.tracking_number,
            'delivery_confirmed_at': self.delivery_confirmed_at.isoformat() if self.delivery_confirmed_at else None,
            'notes': self.notes,
            'govt_audit_notes': self.govt_audit_notes,
            'payments': [p.to_dict() for p in self.payments] if self.payments else [],
            'grievances': [g.to_dict() for g in self.grievances] if self.grievances else [],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
