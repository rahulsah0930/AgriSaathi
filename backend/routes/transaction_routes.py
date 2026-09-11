from flask import Blueprint, request, jsonify
from datetime import datetime
from models import db
from models.transaction import Transaction
from models.payment import PaymentRecord
from models.lot import CropLot
from models.offer import Offer
from models.notification import Notification

transaction_bp = Blueprint('transactions', __name__, url_prefix='/api/transactions')

@transaction_bp.route('', methods=['GET'])
def list_transactions():
    """List transactions for the authenticated user or all for admin."""
    user_id = request.args.get('user_id', type=int)
    role = request.args.get('role', '').upper()

    query = Transaction.query
    if user_id:
        if role == 'BUYER':
            query = query.filter_by(buyer_id=user_id)
        elif role in ['FARMER', 'FPO']:
            query = query.filter_by(seller_id=user_id)
        else:
            query = query.filter((Transaction.buyer_id == user_id) | (Transaction.seller_id == user_id))

    transactions = query.order_by(Transaction.created_at.desc()).all()
    return jsonify({
        'success': True,
        'total': len(transactions),
        'transactions': [t.to_dict() for t in transactions]
    }), 200


@transaction_bp.route('/<int:txn_id>', methods=['GET'])
def get_transaction(txn_id):
    """Retrieve full transaction details with escrow and delivery audit records."""
    txn = Transaction.query.get_or_404(txn_id)
    return jsonify({
        'success': True,
        'transaction': txn.to_dict()
    }), 200


@transaction_bp.route('/<int:txn_id>/status', methods=['POST', 'PATCH'])
def update_transaction_status(txn_id):
    """Advance transaction lifecycle."""
    txn = Transaction.query.get_or_404(txn_id)
    data = request.get_json() or {}
    new_status = data.get('status', '').upper()
    carrier = data.get('carrier_name')
    tracking = data.get('tracking_number')
    notes = data.get('notes')

    allowed_statuses = [
        'DEAL_CONFIRMED', 'ADVANCE_PENDING', 'ADVANCE_PAID',
        'PREPARING', 'READY_FOR_PICKUP', 'IN_TRANSIT',
        'DELIVERED', 'BUYER_CONFIRMED', 'COMPLETED', 'DISPUTED', 'CANCELLED'
    ]
    if new_status not in allowed_statuses:
        return jsonify({
            'success': False,
            'error': 'Invalid Status',
            'message': f'Status must be one of: {", ".join(allowed_statuses)}'
        }), 400

    txn.status = new_status
    if carrier:
        txn.carrier_name = carrier
    if tracking:
        txn.tracking_number = tracking
    if notes:
        txn.notes = notes

    now = datetime.utcnow()
    # When buyer confirms delivery receipt:
    if new_status == 'BUYER_CONFIRMED':
        txn.delivery_confirmed_at = now
        # Update Advance Escrow payment to RELEASE_APPROVED
        advance_pay = PaymentRecord.query.filter_by(transaction_id=txn.id, stage='ADVANCE').first()
        if advance_pay:
            advance_pay.status = 'SETTLED'
            advance_pay.escrow_status = 'RELEASED_TO_SELLER'
            advance_pay.settled_at = now

        # Create Balance Payment Record in SETTLED
        balance_pay = PaymentRecord(
            payment_ref=f'PAY-BAL-{txn.transaction_ref}',
            transaction_id=txn.id,
            payer_id=txn.buyer_id,
            payee_id=txn.seller_id,
            amount=txn.balance_amount,
            stage='BALANCE',
            status='SETTLED',
            escrow_status='RELEASED_TO_SELLER',
            payment_method='NET_BANKING_SIMULATED',
            reference_number=f'BAL/SIM/{now.strftime("%Y%m%d")}/{txn.id}99',
            govt_audit_notes='Balance payment settled to Seller bank account upon verified Buyer delivery confirmation.',
            settled_at=now
        )
        db.session.add(balance_pay)
        txn.status = 'COMPLETED'

        # Also update crop lot status to SOLD
        if txn.crop_lot:
            txn.crop_lot.status = 'SOLD'

        # Notify Seller
        db.session.add(Notification(
            user_id=txn.seller_id,
            title=f'Payment Settled: {txn.transaction_ref}',
            message=f'Buyer confirmed delivery. ₹{txn.total_amount:,.2f} released from Government Escrow to your registered bank account.',
            type='PAYMENT'
        ))

    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Transaction {txn.transaction_ref} status updated to {txn.status}.',
        'transaction': txn.to_dict()
    }), 200


@transaction_bp.route('/create', methods=['POST'])
def create_transaction():
    """Create a new transaction directly or from an agreed offer."""
    data = request.get_json() or {}

    crop_lot_id = data.get('crop_lot_id')
    buyer_id = data.get('buyer_id')
    seller_id = data.get('seller_id')
    quantity = float(data.get('quantity', 0))
    agreed_price = float(data.get('agreed_price', 0))
    offer_id = data.get('offer_id')

    lot = CropLot.query.get(crop_lot_id) if crop_lot_id else None
    if not buyer_id or not seller_id or quantity <= 0 or agreed_price <= 0:
        return jsonify({
            'success': False,
            'error': 'Validation Error',
            'message': 'buyer_id, seller_id, positive quantity, and agreed_price are required.'
        }), 400

    total_amount = round(quantity * agreed_price, 2)
    advance_pct = float(data.get('advance_percentage', 20.0))
    advance_amount = round(total_amount * (advance_pct / 100.0), 2)
    balance_amount = round(total_amount - advance_amount, 2)

    txn_ref = f'TXN-2026-MH-{datetime.utcnow().strftime("%f")[:4]}'

    txn = Transaction(
        transaction_ref=txn_ref,
        crop_lot_id=crop_lot_id,
        offer_id=offer_id,
        buyer_id=buyer_id,
        seller_id=seller_id,
        crop=lot.crop if lot else data.get('crop', 'Produce'),
        variety=lot.variety if lot else data.get('variety', 'Standard'),
        quantity=quantity,
        unit=lot.unit if lot else data.get('unit', 'kg'),
        agreed_price_per_unit=agreed_price,
        total_amount=total_amount,
        advance_percentage=advance_pct,
        advance_amount=advance_amount,
        balance_amount=balance_amount,
        status='ADVANCE_PENDING',
        pickup_address=data.get('pickup_address') or (lot.address if lot else 'Farm Gate'),
        pickup_district=data.get('pickup_district') or (lot.district if lot else 'Nashik'),
        pickup_lat=data.get('pickup_lat') or (lot.latitude if lot else None),
        pickup_lng=data.get('pickup_lng') or (lot.longitude if lot else None),
        delivery_address=data.get('delivery_address', 'Buyer Central Depot'),
        delivery_district=data.get('delivery_district', 'Navi Mumbai'),
        delivery_lat=data.get('delivery_lat'),
        delivery_lng=data.get('delivery_lng'),
        warehouse_id=data.get('warehouse_id'),
        notes=data.get('notes', 'Contract created upon offer acceptance.')
    )
    db.session.add(txn)

    # Reserve the crop lot
    if lot:
        lot.status = 'RESERVED'

    # If linked to an offer, mark offer as ACCEPTED
    if offer_id:
        off = Offer.query.get(offer_id)
        if off:
            off.status = 'ACCEPTED'

    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Deal confirmed! Transaction {txn_ref} created. Advance of ₹{advance_amount:,.2f} ({advance_pct}%) is pending Escrow payment.',
        'transaction': txn.to_dict()
    }), 201
