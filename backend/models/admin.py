from datetime import datetime
from models import db

class AdminAuditLog(db.Model):
    __tablename__ = 'admin_audit_logs'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    admin_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    action = db.Column(db.String(100), nullable=False) # USER_VERIFIED, USER_REJECTED, USER_SUSPENDED, WAREHOUSE_VERIFIED, WAREHOUSE_REJECTED, WAREHOUSE_SUSPENDED, LOGISTICS_PROVIDER_VERIFIED, GRIEVANCE_REVIEW_STARTED, GRIEVANCE_RESOLVED, ADMIN_REFUND_APPROVED
    target_type = db.Column(db.String(50), nullable=False) # USER, WAREHOUSE, LOGISTICS, GRIEVANCE, TRANSACTION, STORAGE_BOOKING
    target_id = db.Column(db.Integer, nullable=True)
    details = db.Column(db.Text, nullable=True)
    reason = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    admin = db.relationship('User', foreign_keys=[admin_id])

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        admin_name = self.admin.name if self.admin else 'System Administrator'
        return {
            'id': self.id,
            'admin_id': self.admin_id,
            'admin_name': admin_name,
            'action': self.action,
            'target_type': self.target_type,
            'target_id': self.target_id,
            'details': self.details,
            'reason': self.reason,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
