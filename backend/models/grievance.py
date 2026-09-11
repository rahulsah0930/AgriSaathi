from datetime import datetime
from models import db

class Grievance(db.Model):
    __tablename__ = 'grievances'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    grievance_ref = db.Column(db.String(50), unique=True, nullable=False)
    transaction_id = db.Column(db.Integer, db.ForeignKey('transactions.id', ondelete='SET NULL'), nullable=True)
    complainant_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    respondent_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)

    category = db.Column(
        db.Enum(
            'QUALITY_MISMATCH',
            'QUANTITY_SHORTAGE',
            'DELIVERY_DELAY',
            'PAYMENT_ISSUE',
            'STORAGE_DAMAGE',
            'OTHER',
            name='grievance_categories'
        ),
        default='QUALITY_MISMATCH'
    )
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=False)
    evidence_photo_url = db.Column(db.String(255), nullable=True)

    location_address = db.Column(db.String(255), nullable=True)
    location_district = db.Column(db.String(100), nullable=True)
    location_lat = db.Column(db.Float, nullable=True)
    location_lng = db.Column(db.Float, nullable=True)

    status = db.Column(
        db.Enum('OPEN', 'UNDER_INVESTIGATION', 'RESOLVED', 'DISMISSED', name='grievance_statuses'),
        default='OPEN'
    )
    resolution_notes = db.Column(db.Text, nullable=True)
    resolved_by_admin_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    resolved_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    complainant = db.relationship('User', foreign_keys=[complainant_id])
    respondent = db.relationship('User', foreign_keys=[respondent_id])
    resolved_by = db.relationship('User', foreign_keys=[resolved_by_admin_id])

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            'id': self.id,
            'grievance_ref': self.grievance_ref,
            'transaction_id': self.transaction_id,
            'complainant_id': self.complainant_id,
            'complainant_name': self.complainant.name if self.complainant else 'Complainant',
            'complainant_role': self.complainant.role if self.complainant else 'USER',
            'respondent_id': self.respondent_id,
            'respondent_name': self.respondent.name if self.respondent else 'Respondent',
            'category': self.category,
            'title': self.title,
            'description': self.description,
            'evidence_photo_url': self.evidence_photo_url,
            'location_address': self.location_address,
            'location_district': self.location_district,
            'coordinates': {'lat': self.location_lat, 'lng': self.location_lng} if self.location_lat else None,
            'status': self.status,
            'resolution_notes': self.resolution_notes,
            'resolved_by_admin_id': self.resolved_by_admin_id,
            'resolved_by_name': self.resolved_by.name if self.resolved_by else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None
        }
