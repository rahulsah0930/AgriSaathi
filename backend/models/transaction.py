from datetime import datetime
from models import db

class Transaction(db.Model):
    __tablename__ = 'transactions'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    transaction_ref = db.Column(db.String(50), unique=True, nullable=False)
    crop_lot_id = db.Column(db.Integer, db.ForeignKey('crop_lots.id', ondelete='SET NULL'), nullable=True)
    commodity_id = db.Column(db.Integer, db.ForeignKey('commodities.id', ondelete='SET NULL'), nullable=True)
    offer_id = db.Column(db.Integer, db.ForeignKey('offers.id', ondelete='SET NULL'), nullable=True)
    dispute_id = db.Column(db.Integer, nullable=True)
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

    # String column for deterministic state-machine lifecycle
    status = db.Column(db.String(50), default='AWAITING_ADVANCE', nullable=False)

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
    settled_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)
    cancelled_at = db.Column(db.DateTime, nullable=True)

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
    history = db.relationship('TransactionHistory', backref='transaction', cascade='all, delete-orphan', lazy=True, order_by='TransactionHistory.created_at.asc()')

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

        # Include lot image and thumbnail if available
        lot_image_url = None
        if self.crop_lot:
            lot_image_url = getattr(self.crop_lot, 'image_url', None)
            if not lot_image_url and getattr(self.crop_lot, 'images', None) and len(self.crop_lot.images) > 0:
                lot_image_url = self.crop_lot.images[0].image_url

        return {
            'id': self.id,
            'transaction_id': self.id,
            'transaction_ref': self.transaction_ref,
            'crop_lot_id': self.crop_lot_id,
            'commodity_id': self.commodity_id,
            'offer_id': self.offer_id,
            'dispute_id': self.dispute_id,
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
            'settled_at': self.settled_at.isoformat() if self.settled_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'cancelled_at': self.cancelled_at.isoformat() if self.cancelled_at else None,
            'notes': self.notes,
            'govt_audit_notes': self.govt_audit_notes,
            'is_prototype_escrow': True,
            'escrow_type': 'SIMULATED_PROTOTYPE_ESCROW',
            'lot_image_url': lot_image_url,
            'transport_order': (
                [r for r in self.logistics_requests if r.status != 'CANCELLED'][-1].to_dict()
                if (hasattr(self, 'logistics_requests') and [r for r in self.logistics_requests if r.status != 'CANCELLED'])
                else (self.logistics_requests[-1].to_dict() if (hasattr(self, 'logistics_requests') and self.logistics_requests) else None)
            ),
            'payments': [p.to_dict() for p in self.payments] if self.payments else [],
            'grievances': [g.to_dict() for g in self.grievances] if self.grievances else [],
            'history': [h.to_dict() for h in self.history] if self.history else [],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class TransactionHistory(db.Model):
    __tablename__ = 'transaction_history'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    transaction_id = db.Column(db.Integer, db.ForeignKey('transactions.id', ondelete='CASCADE'), nullable=False)
    event = db.Column(db.String(100), nullable=False)
    actor_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    actor_role = db.Column(db.String(50), nullable=True)
    previous_state = db.Column(db.String(50), nullable=True)
    new_state = db.Column(db.String(50), nullable=True)
    details = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    actor = db.relationship('User')

    def to_dict(self):
        actor_name = self.actor.name if self.actor else (self.actor_role or 'System')
        return {
            'id': self.id,
            'transaction_id': self.transaction_id,
            'event': self.event,
            'actor_id': self.actor_id,
            'actor_role': self.actor_role,
            'actor_name': actor_name,
            'previous_state': self.previous_state,
            'new_state': self.new_state,
            'details': self.details,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
