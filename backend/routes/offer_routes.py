from flask import Blueprint, request, jsonify
from datetime import datetime, date
from models import db
from models.offer import Offer, NegotiationHistory
from models.lot import CropLot
from models.transaction import Transaction
from models.user import User

offer_bp = Blueprint('offers', __name__, url_prefix='/api/offers')

@offer_bp.route('', methods=['GET'])
def list_offers():
    """Returns offers for either seller or buyer, optionally filtered by status or crop_lot_id."""
    try:
        seller_id = request.args.get('seller_id', type=int)
        buyer_id = request.args.get('buyer_id', type=int)
        crop_lot_id = request.args.get('crop_lot_id', type=int)
        status = request.args.get('status')

        query = Offer.query
        if seller_id:
            query = query.filter_by(seller_id=seller_id)
        elif buyer_id:
            query = query.filter_by(buyer_id=buyer_id)

        if crop_lot_id:
            query = query.filter_by(crop_lot_id=crop_lot_id)
        if status and status != 'ALL':
            query = query.filter_by(status=status)

        offers = query.order_by(Offer.created_at.desc()).all()

        return jsonify({
            'success': True,
            'count': len(offers),
            'offers': [o.to_dict() for o in offers]
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@offer_bp.route('/<int:offer_id>', methods=['GET'])
def get_offer(offer_id):
    """Returns single offer details with complete negotiation trail."""
    try:
        offer = Offer.query.get_or_404(offer_id)
        return jsonify({
            'success': True,
            'offer': offer.to_dict()
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@offer_bp.route('', methods=['POST'])
def create_offer():
    """Buyer submits an initial firm procurement offer."""
    try:
        data = request.get_json() or {}
        crop_lot_id = data.get('crop_lot_id') or data.get('lot_id')
        buyer_id = data.get('buyer_id')
        if not buyer_id:
            auth_header = request.headers.get('Authorization', '')
            if 'session_token_' in auth_header:
                try:
                    buyer_id = int(auth_header.split('session_token_')[1].split('_')[0])
                except Exception:
                    pass
            if not buyer_id:
                buyer_user = User.query.filter_by(role='BUYER').first()
                if buyer_user:
                    buyer_id = buyer_user.id

        offer_price = float(data.get('offer_price') or data.get('offered_price') or 0)
        quantity = float(data.get('quantity') or data.get('offered_quantity') or 0)
        advance_percentage = float(data.get('advance_percentage') or data.get('proposed_advance_percentage') or 20.0)
        message = data.get('message') or data.get('note') or 'Procurement offer submitted.'
        delivery_date_str = data.get('delivery_date')

        if not crop_lot_id or not buyer_id or offer_price <= 0 or quantity <= 0:
            return jsonify({
                'success': False,
                'error': 'Validation Error',
                'message': 'crop_lot_id, buyer_id, positive offer_price, and quantity are required.'
            }), 400

        lot = CropLot.query.get_or_404(crop_lot_id)
        buyer = User.query.get_or_404(buyer_id)

        buyer_name = buyer.name
        if buyer.buyer_profile and buyer.buyer_profile.company_name:
            buyer_name = buyer.buyer_profile.company_name

        delivery_date = date.today()
        if delivery_date_str:
            try:
                delivery_date = datetime.strptime(delivery_date_str, '%Y-%m-%d').date()
            except ValueError:
                pass

        total_val = round(quantity * offer_price, 2)

        new_offer = Offer(
            crop_lot_id=crop_lot_id,
            buyer_id=buyer_id,
            buyer_name=buyer_name or 'Buyer',
            buyer_verification_status=buyer.verification_status,
            seller_id=lot.seller_id,
            quantity=quantity,
            unit=lot.unit,
            offer_price=offer_price,
            total_value=total_val,
            delivery_date=delivery_date,
            message=message,
            status='PENDING'
        )
        db.session.add(new_offer)
        db.session.flush()

        # Log initial negotiation history
        history = NegotiationHistory(
            offer_id=new_offer.id,
            actor_id=buyer_id,
            actor_role='BUYER',
            actor_name=buyer_name or 'Buyer',
            action='INITIAL_OFFER',
            price=offer_price,
            quantity=quantity,
            message=message
        )
        db.session.add(history)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Offer submitted successfully. The seller has been notified.',
            'offer': new_offer.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@offer_bp.route('/<int:offer_id>/counter', methods=['POST'])
def counter_offer(offer_id):
    """Submits a counter-offer in the negotiation chain (either by Seller or Buyer)."""
    try:
        offer = Offer.query.get_or_404(offer_id)
        data = request.get_json(silent=True) or {}

        counter_price = float(data.get('counter_price', 0))
        counter_message = data.get('counter_message', '')
        actor_role = data.get('actor_role', 'SELLER').upper()
        actor_id = data.get('actor_id', offer.seller_id if actor_role == 'SELLER' else offer.buyer_id)

        if counter_price <= 0:
            return jsonify({'success': False, 'error': 'A valid positive counter price is required'}), 400

        actor = User.query.get(actor_id)
        actor_name = actor.name if actor else ('Seller' if actor_role == 'SELLER' else 'Buyer')

        offer.counter_price = counter_price
        offer.counter_message = counter_message
        offer.status = 'COUNTERED'

        # Record in negotiation audit trail
        history = NegotiationHistory(
            offer_id=offer.id,
            actor_id=actor_id,
            actor_role=actor_role,
            actor_name=actor_name,
            action='COUNTER_OFFER',
            price=counter_price,
            quantity=offer.quantity,
            message=counter_message
        )
        db.session.add(history)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': f'Counter-offer of ₹{counter_price:,.2f}/{offer.unit} submitted!',
            'offer': offer.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@offer_bp.route('/<int:offer_id>/accept', methods=['POST'])
def accept_offer(offer_id):
    """
    Accepts offer/counter-offer -> deal agreed -> auto-creates Transaction in ADVANCE_PENDING,
    reserves crop lot, and adds history record.
    """
    try:
        offer = Offer.query.get_or_404(offer_id)
        data = request.get_json(silent=True) or {}
        actor_role = data.get('actor_role', 'SELLER').upper()
        actor_id = data.get('actor_id', offer.seller_id if actor_role == 'SELLER' else offer.buyer_id)

        if offer.status in ['ACCEPTED', 'REJECTED', 'CANCELLED']:
            return jsonify({'success': False, 'error': f'Offer is already {offer.status}'}), 400

        # Agreed price is counter_price if countered, else offer_price
        final_price = offer.counter_price if (offer.counter_price and offer.status == 'COUNTERED') else offer.offer_price
        total_amount = round(offer.quantity * final_price, 2)

        offer.status = 'ACCEPTED'

        # Reserve parent crop lot
        if offer.lot and offer.lot.status in ['ACTIVE', 'DRAFT']:
            offer.lot.status = 'RESERVED'

        actor = User.query.get(actor_id)
        actor_name = actor.name if actor else actor_role

        # Log in negotiation history
        history = NegotiationHistory(
            offer_id=offer.id,
            actor_id=actor_id,
            actor_role=actor_role,
            actor_name=actor_name,
            action='ACCEPTED',
            price=final_price,
            quantity=offer.quantity,
            message=f'Deal agreed at ₹{final_price:,.2f}/{offer.unit}. Contract auto-generated.'
        )
        db.session.add(history)

        # Auto-create Transaction
        advance_pct = 20.0
        advance_amt = round(total_amount * (advance_pct / 100.0), 2)
        balance_amt = round(total_amount - advance_amt, 2)
        txn_ref = f'TXN-2026-MH-{datetime.utcnow().strftime("%f")[:4]}'

        txn = Transaction(
            transaction_ref=txn_ref,
            crop_lot_id=offer.crop_lot_id,
            offer_id=offer.id,
            buyer_id=offer.buyer_id,
            seller_id=offer.seller_id,
            crop=offer.lot.crop if offer.lot else 'Produce',
            variety=offer.lot.variety if offer.lot else 'Standard',
            quantity=offer.quantity,
            unit=offer.unit,
            agreed_price_per_unit=final_price,
            total_amount=total_amount,
            advance_percentage=advance_pct,
            advance_amount=advance_amt,
            balance_amount=balance_amt,
            status='ADVANCE_PENDING',
            pickup_address=offer.lot.address if offer.lot else 'Farm Gate, Nashik',
            pickup_district=offer.lot.district if offer.lot else 'Nashik',
            pickup_lat=offer.lot.latitude if offer.lot else None,
            pickup_lng=offer.lot.longitude if offer.lot else None,
            delivery_address='Buyer Central Processing Hub',
            delivery_district='Navi Mumbai',
            notes=f'Auto-created upon offer acceptance. 20% advance (₹{advance_amt:,.2f}) pending deposit into Government Escrow.'
        )
        db.session.add(txn)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': f'Deal confirmed at ₹{final_price:,.2f}/{offer.unit}! Transaction {txn_ref} created. Advance payment of ₹{advance_amt:,.2f} is pending in Escrow.',
            'offer': offer.to_dict(),
            'transaction': txn.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@offer_bp.route('/<int:offer_id>/reject', methods=['POST'])
def reject_offer(offer_id):
    """Declines an offer."""
    try:
        offer = Offer.query.get_or_404(offer_id)
        data = request.get_json() or {}
        actor_role = data.get('actor_role', 'SELLER').upper()
        actor_id = data.get('actor_id', offer.seller_id if actor_role == 'SELLER' else offer.buyer_id)

        offer.status = 'REJECTED'
        actor = User.query.get(actor_id)
        actor_name = actor.name if actor else actor_role

        history = NegotiationHistory(
            offer_id=offer.id,
            actor_id=actor_id,
            actor_role=actor_role,
            actor_name=actor_name,
            action='REJECTED',
            price=offer.offer_price,
            quantity=offer.quantity,
            message=data.get('reason', 'Offer declined.')
        )
        db.session.add(history)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Offer declined.',
            'offer': offer.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
