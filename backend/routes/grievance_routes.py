from flask import Blueprint, request, jsonify, g
from datetime import datetime
from models import db
from models.grievance import Grievance
from models.transaction import Transaction
from models.notification import Notification
from models.user import User
from utils.auth import jwt_required, role_required

grievance_bp = Blueprint('grievances', __name__, url_prefix='/api/grievances')

@grievance_bp.route('', methods=['GET'])
@jwt_required
def list_grievances():
    """List grievances filed by or against the authenticated user, or all for admin."""
    user = g.current_user
    txn_id = request.args.get('transaction_id', type=int)

    query = Grievance.query
    if user.role != 'ADMIN':
        query = query.filter((Grievance.complainant_id == user.id) | (Grievance.respondent_id == user.id))
    elif user.role == 'ADMIN' and request.args.get('user_id'):
        uid = request.args.get('user_id', type=int)
        query = query.filter((Grievance.complainant_id == uid) | (Grievance.respondent_id == uid))

    if txn_id:
        query = query.filter_by(transaction_id=txn_id)

    grievances = query.order_by(Grievance.created_at.desc()).all()
    return jsonify({
        'success': True,
        'total': len(grievances),
        'grievances': [g.to_dict() for g in grievances]
    }), 200


@grievance_bp.route('', methods=['POST'])
@jwt_required
def create_grievance():
    """File a formal dispute/grievance for Government Nodal Officer adjudication."""
    data = request.get_json() or {}
    complainant_id = g.current_user.id

    title = data.get('title')
    description = data.get('description')
    category = data.get('category', 'QUALITY_MISMATCH')
    transaction_id = data.get('transaction_id')
    respondent_id = data.get('respondent_id')

    if not title or not description:
        return jsonify({
            'success': False,
            'error': 'Validation Error',
            'message': 'title and description are mandatory.'
        }), 400

    # Auto-infer respondent from transaction if provided and verify participant
    if transaction_id:
        txn = Transaction.query.get(transaction_id)
        if txn:
            if g.current_user.id not in (txn.buyer_id, txn.seller_id) and g.current_user.role != 'ADMIN':
                return jsonify({
                    'success': False,
                    'error': 'Forbidden',
                    'message': 'You are not a participant in this transaction.'
                }), 403
            if not respondent_id:
                respondent_id = txn.seller_id if complainant_id == txn.buyer_id else txn.buyer_id
            txn.status = 'DISPUTED'

    ref = f'GRV-2026-{int(datetime.utcnow().timestamp()) % 100000:05d}'

    grievance = Grievance(
        grievance_ref=ref,
        transaction_id=transaction_id,
        complainant_id=complainant_id,
        respondent_id=respondent_id,
        category=category,
        title=title,
        description=description,
        evidence_photo_url=data.get('evidence_photo_url'),
        location_address=data.get('location_address'),
        location_district=data.get('location_district', 'Nashik'),
        location_lat=float(data.get('location_lat')) if data.get('location_lat') else None,
        location_lng=float(data.get('location_lng')) if data.get('location_lng') else None,
        status='OPEN',
        resolution_notes='Grievance submitted. Transferred to Taluka Nodal Agriculture Officer for review.'
    )
    db.session.add(grievance)

    # Notify Government Admins
    admins = User.query.filter_by(role='ADMIN').all()
    for admin in admins:
        db.session.add(Notification(
            user_id=admin.id,
            title=f'Dispute Raised: {ref}',
            message=f'New {category} claim filed: "{title}". Requires administrative adjudication.',
            type='DISPUTE'
        ))

    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Grievance {ref} lodged successfully. Government Nodal Officer will investigate within 24-48 hours.',
        'grievance': grievance.to_dict()
    }), 201
