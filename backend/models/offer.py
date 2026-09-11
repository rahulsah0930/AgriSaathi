from models import db
from datetime import datetime, date

class Offer(db.Model):
    __tablename__ = 'offers'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    crop_lot_id = db.Column(db.Integer, db.ForeignKey('crop_lots.id', ondelete='CASCADE'), nullable=False)
    buyer_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    buyer_name = db.Column(db.String(150), nullable=False)
    buyer_verification_status = db.Column(db.String(20), default='VERIFIED')
    seller_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(20), default='kg')
    offer_price = db.Column(db.Float, nullable=False)
    total_value = db.Column(db.Float, nullable=False)
    delivery_date = db.Column(db.Date, nullable=False, default=date.today)
    message = db.Column(db.Text, nullable=True)
    counter_price = db.Column(db.Float, nullable=True)
    counter_message = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default='PENDING') # PENDING, ACCEPTED, REJECTED, COUNTERED, EXPIRED, CANCELLED
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    lot = db.relationship('CropLot', backref=db.backref('buyer_offers_list', lazy=True, cascade='all, delete-orphan'))
    buyer = db.relationship('User', foreign_keys=[buyer_id])
    seller = db.relationship('User', foreign_keys=[seller_id])
    history = db.relationship('NegotiationHistory', backref='offer', cascade='all, delete-orphan', lazy=True, order_by='NegotiationHistory.created_at.asc()')

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            'id': self.id,
            'crop_lot_id': self.crop_lot_id,
            'lot_crop': self.lot.crop if self.lot else 'Produce',
            'lot_variety': self.lot.variety if self.lot else 'Standard',
            'lot_expected_price': self.lot.expected_price if self.lot else 0.0,
            'buyer_id': self.buyer_id,
            'buyer_name': self.buyer_name,
            'buyer_verification_status': self.buyer_verification_status,
            'seller_id': self.seller_id,
            'seller_name': self.seller.name if self.seller else 'Seller',
            'quantity': round(self.quantity, 1),
            'unit': self.unit,
            'offer_price': round(self.offer_price, 2),
            'offered_price': round(self.offer_price, 2),
            'advance_percentage': 20.0,
            'total_value': round(self.total_value, 2),
            'delivery_date': self.delivery_date.isoformat() if hasattr(self.delivery_date, 'isoformat') else str(self.delivery_date),
            'message': self.message,
            'counter_price': round(self.counter_price, 2) if self.counter_price else None,
            'counter_message': self.counter_message,
            'status': self.status,
            'price_diff_vs_expected': round(self.offer_price - (self.lot.expected_price if self.lot else self.offer_price), 2),
            'history': [h.to_dict() for h in self.history] if self.history else [],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class NegotiationHistory(db.Model):
    __tablename__ = 'negotiation_history'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    offer_id = db.Column(db.Integer, db.ForeignKey('offers.id', ondelete='CASCADE'), nullable=False)
    actor_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    actor_role = db.Column(db.String(20), nullable=False) # 'BUYER' or 'SELLER'
    actor_name = db.Column(db.String(150), nullable=False)
    action = db.Column(db.String(30), nullable=False) # 'INITIAL_OFFER', 'COUNTER_OFFER', 'ACCEPTED', 'REJECTED', 'CANCELLED'
    price = db.Column(db.Float, nullable=False)
    quantity = db.Column(db.Float, nullable=True)
    message = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    actor = db.relationship('User')

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            'id': self.id,
            'offer_id': self.offer_id,
            'actor_id': self.actor_id,
            'actor_role': self.actor_role,
            'actor_name': self.actor_name,
            'action': self.action,
            'price': self.price,
            'quantity': self.quantity,
            'message': self.message,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
