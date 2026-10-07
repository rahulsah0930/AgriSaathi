from flask import Blueprint, request, jsonify, g
from models import db
from models.notification import Notification
from utils.auth import jwt_required, role_required

notification_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')

@notification_bp.route('', methods=['GET'])
@jwt_required
def get_notifications():
    """Retrieve in-app notifications strictly for the authenticated user."""
    user_id = g.current_user.id
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
@jwt_required
def mark_as_read(notification_id):
    """Mark an individual notification as read."""
    notification = Notification.query.get(notification_id)
    if not notification:
        return jsonify({'success': False, 'error': 'Notification not found'}), 404

    if notification.user_id != g.current_user.id and g.current_user.role != 'ADMIN':
        return jsonify({'success': False, 'error': 'Forbidden', 'message': 'You are not authorized to modify this notification.'}), 403

    notification.is_read = True
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Notification marked as read.',
        'notification': notification.to_dict()
    }), 200


@notification_bp.route('/mark-all-read', methods=['POST', 'PATCH'])
@jwt_required
def mark_all_read():
    """Mark all notifications as read for the authenticated user."""
    Notification.query.filter_by(user_id=g.current_user.id, is_read=False).update({'is_read': True})
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'All notifications marked as read.'
    }), 200


@notification_bp.route('', methods=['POST'])
@jwt_required
@role_required('ADMIN')
def create_notification():
    """Create a new notification (administrative announcements or alerts)."""
    data = request.get_json() or {}
    target_user_id = data.get('user_id') or g.current_user.id
    title = data.get('title')
    message = data.get('message')
    notif_type = data.get('type', 'INFO')

    if not title or not message:
        return jsonify({'success': False, 'error': 'Title and message are required.'}), 400

    notif = Notification(
        user_id=target_user_id,
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

