from flask import Blueprint, request, jsonify
from models import db
from models.notification import Notification

notification_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')

@notification_bp.route('', methods=['GET'])
def get_notifications():
    """Retrieve in-app notifications for the active user with optional unread filter."""
    user_id = request.args.get('user_id', 1, type=int)
    type_filter = request.args.get('type')
    unread_only = request.args.get('unread_only', 'false').lower() == 'true'

    query = Notification.query.filter_by(user_id=user_id)

    if unread_only:
        query = query.filter_by(is_read=False)

    if type_filter and type_filter != 'ALL':
        query = query.filter_by(type=type_filter)

    notifications = query.order_by(Notification.created_at.desc()).all()
    unread_count = Notification.query.filter_by(user_id=user_id, is_read=False).count()

    return jsonify({
        'success': True,
        'count': len(notifications),
        'unread_count': unread_count,
        'notifications': [n.to_dict() for n in notifications]
    }), 200


@notification_bp.route('/<int:notification_id>/read', methods=['PATCH', 'POST'])
def mark_as_read(notification_id):
    """Mark an individual notification as read."""
    notification = Notification.query.get(notification_id)
    if not notification:
        return jsonify({'success': False, 'error': 'Notification not found'}), 404

    notification.is_read = True
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Notification marked as read.',
        'notification': notification.to_dict()
    }), 200


@notification_bp.route('/mark-all-read', methods=['POST', 'PATCH'])
def mark_all_read():
    """Mark all notifications as read for a given user."""
    data = request.get_json() or {}
    user_id = data.get('user_id') or request.args.get('user_id', 1, type=int)

    Notification.query.filter_by(user_id=user_id, is_read=False).update({'is_read': True})
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'All notifications marked as read.'
    }), 200


@notification_bp.route('', methods=['POST'])
def create_notification():
    """Create a new notification (simulation or system alert)."""
    data = request.get_json() or {}
    user_id = data.get('user_id', 1)
    title = data.get('title')
    message = data.get('message')
    notif_type = data.get('type', 'INFO')

    if not title or not message:
        return jsonify({'success': False, 'error': 'Title and message are required.'}), 400

    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notif_type,
        is_read=False
    )
    db.session.add(notif)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Notification created successfully.',
        'notification': notif.to_dict()
    }), 201
