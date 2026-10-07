from models import db
from datetime import datetime

class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    title = db.Column(db.String(150), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(50), default='INFO')
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref=db.backref('notifications', lazy=True, cascade='all, delete-orphan'))

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'message': self.message,
            'type': self.type,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'time_ago': self._format_time_ago()
        }

    def _format_time_ago(self):
        if not self.created_at:
            return 'Just now'
        diff = datetime.utcnow() - self.created_at
        seconds = diff.total_seconds()
        if seconds < 60:
            return 'Just now'
        elif seconds < 3600:
            return f'{int(seconds // 60)}m ago'
        elif seconds < 86400:
            return f'{int(seconds // 3600)}h ago'
        else:
            return f'{int(seconds // 86400)}d ago'


class NotificationEvent(db.Model):
    __tablename__ = 'notification_events'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    event_key = db.Column(db.String(150), unique=True, nullable=False, index=True)
    recipient_user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=True)
    notification_id = db.Column(db.Integer, db.ForeignKey('notifications.id', ondelete='SET NULL'), nullable=True)
    event_type = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            'id': self.id,
            'event_key': self.event_key,
            'recipient_user_id': self.recipient_user_id,
            'notification_id': self.notification_id,
            'event_type': self.event_type,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


def emit_idempotent_notification(event_key, recipient_user_id, title, message, notif_type='INFO'):
    """
    Safely emits a single notification to recipient_user_id keyed by event_key.
    If event_key already exists in notification_events, it is a no-op and returns None.
    Returns the created Notification, or None if already emitted.
    """
    if not recipient_user_id or not event_key:
        return None

    # Check whether event already emitted
    existing = NotificationEvent.query.filter_by(event_key=event_key).first()
    if existing:
        return None

    try:
        notif = Notification(
            user_id=recipient_user_id,
            title=title,
            message=message,
            type=notif_type
        )
        db.session.add(notif)
        db.session.flush()

        event = NotificationEvent(
            event_key=event_key,
            recipient_user_id=recipient_user_id,
            notification_id=notif.id,
            event_type=notif_type
        )
        db.session.add(event)
        return notif
    except Exception:
        return None
