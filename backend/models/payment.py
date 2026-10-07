from datetime import datetime
from models import db

class PaymentRecord(db.Model):
    __tablename__ = 'payment_records'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    payment_ref = db.Column(db.String(50), unique=True, nullable=False)
    transaction_id = db.Column(db.Integer, db.ForeignKey('transactions.id', ondelete='CASCADE'), nullable=False)
    payer_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    payee_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)

    amount = db.Column(db.Float, nullable=False)
    # Stage / Payment Type: ADVANCE, BALANCE, REFUND
    stage = db.Column(db.String(50), nullable=False)
    # Status: PENDING, ESCROW_HELD, RELEASED, SETTLED, REFUND_PENDING, REFUNDED, FAILED
    status = db.Column(db.String(50), default='PENDING', nullable=False)
    # Escrow status: HELD_IN_SIMULATED_ESCROW, RELEASED_TO_SELLER, REFUNDED_TO_BUYER, NOT_APPLICABLE
    escrow_status = db.Column(db.String(50), default='HELD_IN_SIMULATED_ESCROW', nullable=False)

    payment_method = db.Column(db.String(50), default='SIMULATED_ESCROW')
    reference_number = db.Column(db.String(100), nullable=True)
    govt_audit_notes = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    settled_at = db.Column(db.DateTime, nullable=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    payer = db.relationship('User', foreign_keys=[payer_id])
    payee = db.relationship('User', foreign_keys=[payee_id])

    @property
    def payment_type(self):
        return self.stage

    @payment_type.setter
    def payment_type(self, val):
        self.stage = val

    @property
    def released_at(self):
        return self.settled_at

    @released_at.setter
    def released_at(self, val):
        self.settled_at = val

    def to_dict(self):
        return {
            'id': self.id,
            'payment_ref': self.payment_ref,
            'reference': self.payment_ref,
            'transaction_id': self.transaction_id,
            'payer_id': self.payer_id,
            'payer_name': self.payer.name if self.payer else 'Payer',
            'payee_id': self.payee_id,
            'payee_name': self.payee.name if self.payee else 'Payee',
            'amount': self.amount,
            'stage': self.stage,
            'payment_type': self.stage,
            'status': self.status,
            'escrow_status': self.escrow_status,
            'payment_method': self.payment_method,
            'reference_number': self.reference_number,
            'govt_audit_notes': self.govt_audit_notes,
            'is_simulated_escrow': True,
            'escrow_type': 'SIMULATED_PROTOTYPE_ESCROW',
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else (self.created_at.isoformat() if self.created_at else None),
            'settled_at': self.settled_at.isoformat() if self.settled_at else None,
            'released_at': self.settled_at.isoformat() if self.settled_at else None
        }
