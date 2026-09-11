from flask import Blueprint, request, jsonify
from datetime import datetime
from models import db
from models.grievance import Grievance
from models.transaction import Transaction
from models.notification import Notification
from models.user import User

grievance_bp = Blueprint('grievances', __name__, url_prefix='/api/grievances')

@grievance_bp.route('', methods=['GET'])
def list_grievances():
    """List grievances filed by or against the user."""
    user_id = request.args.get('user_id', type=int)
    txn_id = request.args.get('transaction_id', type=int)

    query = Grievance.query
    if txn_id:
        query = query.filter_by(transaction_id=txn_id)
    elif user_id:
        query = query.filter((Grievance.complainant_id == user_id) | (Grievance.respondent_id == user_id))

    grievances = query.order_by(Grievance.created_at.desc()).all()
    return jsonify({
        'success': True,
        'total': len(grievances),
        'grievances': [g.to_dict() for g in grievances]
    }), 200


@grievance_bp.route('', methods=['POST'])
def create_grievance():
    """File a formal dispute/grievance for Government Nodal Officer adjudication."""
    data = request.get_json() or {}

    complainant_id = data.get('complainant_id')
    if not complainant_id:
        auth_header = request.headers.get('Authorization', '')
        if 'session_token_' in auth_header:
            try:
                complainant_id = int(auth_header.split('session_token_')[1].split('_')[0])
            except Exception:
                pass
        if not complainant_id:
            complainant_id = 1

    title = data.get('title')
    description = data.get('description')
    category = data.get('category', 'QUALITY_MISMATCH')
    transaction_id = data.get('transaction_id')
    respondent_id = data.get('respondent_id')

    if not title or not description:
        return jsonify({
            'success': False,
            'error': 'Validation Error',
            'message': 'complainant_id, title, and description are mandatory.'
        }), 400

    # Auto-infer respondent from transaction if provided
    if transaction_id and not respondent_id:
        txn = Transaction.query.get(transaction_id)
        if txn:
            respondent_id = txn.seller_id if complainant_id == txn.buyer_id else txn.buyer_id
            # Also update transaction status to DISPUTED
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
