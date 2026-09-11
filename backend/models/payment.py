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
    stage = db.Column(db.Enum('ADVANCE', 'BALANCE', 'REFUND', name='payment_stages'), nullable=False)
    status = db.Column(
        db.Enum(
            'ADVANCE_PENDING',
            'ADVANCE_PAID',
            'BALANCE_PENDING',
            'BALANCE_PAID',
            'ESCROW_HELD',
            'RELEASE_APPROVED',
            'SETTLED',
            'REFUNDED',
            name='payment_record_statuses'
        ),
        default='ADVANCE_PENDING'
    )
    escrow_status = db.Column(
        db.Enum(
            'HELD_BY_GOVT_ESCROW',
            'RELEASED_TO_SELLER',
            'REFUNDED_TO_BUYER',
            'NOT_APPLICABLE',
            name='escrow_statuses'
        ),
        default='HELD_BY_GOVT_ESCROW'
    )

    payment_method = db.Column(db.String(50), default='UPI_SIMULATED')
    reference_number = db.Column(db.String(100), nullable=True)
    govt_audit_notes = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    settled_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    payer = db.relationship('User', foreign_keys=[payer_id])
    payee = db.relationship('User', foreign_keys=[payee_id])

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            'id': self.id,
            'payment_ref': self.payment_ref,
            'transaction_id': self.transaction_id,
            'payer_id': self.payer_id,
            'payer_name': self.payer.name if self.payer else 'Payer',
            'payee_id': self.payee_id,
            'payee_name': self.payee.name if self.payee else 'Payee',
            'amount': self.amount,
            'stage': self.stage,
            'status': self.status,
            'escrow_status': self.escrow_status,
            'payment_method': self.payment_method,
            'reference_number': self.reference_number,
            'govt_audit_notes': self.govt_audit_notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'settled_at': self.settled_at.isoformat() if self.settled_at else None
        }
