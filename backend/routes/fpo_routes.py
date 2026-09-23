from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from models import db
from models.lot import CropLot, FPOLotMember
from models.user import User, FPOProfile
from services.fpo_aggregation_service import (
    get_smart_collection_duration,
    evaluate_aggregation_status,
    calculate_sell_urgency
)

fpo_bp = Blueprint('fpo', __name__, url_prefix='/api/fpo')


@fpo_bp.route('/suggest-duration', methods=['GET'])
def suggest_collection_duration():
    """Advisory smart duration suggestion based on crop perishability and storage."""
    crop = request.args.get('crop', 'Tomato')
    storage_status = request.args.get('storage_status', 'NOT_STORED')
    target_quantity = request.args.get('target_quantity', type=float)
    unit = request.args.get('unit', 'kg')
    suggestion = get_smart_collection_duration(crop, storage_status, target_quantity, unit)
    return jsonify({'success': True, 'suggestion': suggestion}), 200


@fpo_bp.route('/lots', methods=['GET'])
def get_fpo_lots():
    # Retrieve lots created by FPO accounts with optional seller_id and status filters
    query = CropLot.query.filter_by(seller_type='FPO')
    
    seller_id = request.args.get('seller_id')
    if seller_id and seller_id.isdigit():
        query = query.filter_by(seller_id=int(seller_id))
        
    status = request.args.get('status')
    if status and status != 'ALL':
        query = query.filter_by(status=status)

    fpo_lots = query.order_by(CropLot.created_at.desc()).all()

    # Authoritative evaluation of deadline and capacity thresholds for all active lots
    changed_any = False
    for lot in fpo_lots:
        old_status = lot.aggregation_status
        new_status = evaluate_aggregation_status(lot, commit=False)
        if old_status != new_status:
            changed_any = True

    if changed_any:
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()

    return jsonify({
        'success': True,
        'count': len(fpo_lots),
        'lots': [lot.to_dict() for lot in fpo_lots]
    }), 200


@fpo_bp.route('/lots/<int:lot_id>', methods=['GET'])
def get_fpo_lot_detail(lot_id):
    """Retrieve detailed FPO aggregation lot with member list, equity shares, and payout breakdown."""
    lot = CropLot.query.get(lot_id)
    if not lot or lot.seller_type != 'FPO':
        return jsonify({'success': False, 'error': 'Not Found', 'message': f'FPO Lot #{lot_id} not found.'}), 404

    # Run authoritative lifecycle check
    evaluate_aggregation_status(lot, commit=True)

    lot_dict = lot.to_dict()
    total_qty = lot.quantity or 0.0
    expected_rate = lot.expected_price or 0.0
    total_valuation = round(total_qty * expected_rate, 2)

    # Calculate equity shares and estimated payouts per member
    members_breakdown = []
    grade_distribution = {}
    for m in lot.members:
        m_dict = m.to_dict()
        qty = m.quantity or 0.0
        pct_share = round((qty / total_qty * 100), 1) if total_qty > 0 else 0.0
        payout = round(qty * expected_rate, 2)
        m_dict['percentage_share'] = pct_share
        m_dict['estimated_payout'] = payout
        members_breakdown.append(m_dict)

        g = m.quality_grade or 'Grade A'
        grade_distribution[g] = grade_distribution.get(g, 0.0) + qty

    # Quality Grade Disparity Audit
    distinct_grades = list(grade_distribution.keys())
    has_mismatch = len(distinct_grades) > 1
    mismatch_warning = None
    if has_mismatch:
        primary_grade = lot.quality_grade
        mismatched = [g for g in distinct_grades if g != primary_grade]
        mismatch_warning = (
            f"Quality disparity detected in pooled lot: Pool declared as '{primary_grade}', but member contributions include "
            f"{', '.join(mismatched)}. Recommend grading standardization or batch sorting before buyer dispatch."
        )

    lot_dict['members'] = members_breakdown
    lot_dict['total_valuation'] = total_valuation
    lot_dict['quality_audit'] = {
        'has_mismatch': has_mismatch,
        'distinct_grades': distinct_grades,
        'grade_distribution': {g: round(q, 1) for g, q in grade_distribution.items()},
        'warning_message': mismatch_warning
    }

    return jsonify({
        'success': True,
        'lot': lot_dict
    }), 200


@fpo_bp.route('/lots', methods=['POST'])
def create_fpo_lot():
    data = request.get_json() or {}

    required = ['crop', 'expected_price', 'district', 'location']
    for req in required:
        if not data.get(req):
            return jsonify({'success': False, 'error': 'Validation Error', 'message': f"Field '{req}' is required."}), 400

    seller_id = data.get('seller_id', 3) # Demo default FPO
    user = User.query.get(seller_id)

    fpo_name = user.fpo_profile.fpo_name if (user and user.fpo_profile) else 'Sahyadri Farmers Producer Co. Ltd.'

    try:
        target_qty = float(data.get('target_quantity', data.get('quantity', 2000.0)))
        duration_hours = float(data.get('duration_hours', 10.0))
        window_source = data.get('collection_window_source', 'MANUAL')

        start_time = datetime.utcnow()
        deadline_time = start_time + timedelta(hours=duration_hours)

        delivery_deadline = None
        if data.get('delivery_deadline_hours'):
            delivery_deadline = start_time + timedelta(hours=float(data['delivery_deadline_hours']))

        new_lot = CropLot(
            seller_id=seller_id,
            seller_type='FPO',
            seller_name=fpo_name,
            seller_verification_status=user.verification_status if user else 'VERIFIED',
            crop=data['crop'].strip(),
            variety=data.get('variety', 'Garwa / Aggregated').strip(),
            quantity=0.0, # Starts at 0 committed; grows as farmers contribute
            target_quantity=target_qty,
            unit=data.get('unit', 'kg'),
            quality_grade=data.get('quality_grade', 'Grade A'),
            harvest_date=str(data.get('harvest_date', datetime.utcnow().strftime('%Y-%m-%d'))),
            location=data['location'].strip(),
            district=data['district'].strip(),
            expected_price=float(data['expected_price']),
            storage_status=data.get('storage_status', 'NOT_STORED'),
            collection_start_at=start_time,
            collection_deadline_at=deadline_time,
            delivery_deadline_at=delivery_deadline,
            collection_window_source=window_source,
            aggregation_status='OPEN',
            status='ACTIVE'
        )

        db.session.add(new_lot)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': f"FPO aggregation requirement for {target_qty} {new_lot.unit} {new_lot.crop} initiated. Collection window open for {duration_hours:g} hours.",
            'lot': new_lot.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Server Error', 'message': str(e)}), 500


@fpo_bp.route('/lots/<int:lot_id>/members', methods=['POST'])
def add_member_contribution(lot_id):
    lot = CropLot.query.get(lot_id)
    if not lot:
        return jsonify({'success': False, 'error': 'Not Found', 'message': f'FPO Lot #{lot_id} not found.'}), 404

    # 1. Authoritative Backend Deadline Check
    evaluate_aggregation_status(lot, commit=False)
    now = datetime.utcnow()
    if lot.collection_deadline_at and now > lot.collection_deadline_at:
        return jsonify({
            'success': False,
            'error': 'Collection Expired',
            'message': 'Aggregation collection window has expired. New contributions are closed.'
        }), 400

    # 2. Status Closure Check
    if lot.aggregation_status in ('FILLED', 'EXPIRED', 'CLOSED', 'CANCELLED'):
        return jsonify({
            'success': False,
            'error': 'Aggregation Closed',
            'message': f'Aggregation requirement is {lot.aggregation_status}. New contributions cannot be accepted.'
        }), 400

    data = request.get_json() or {}
    farmer_name = data.get('farmer_name', '').strip()
    quantity = data.get('quantity')

    if not farmer_name or quantity is None:
        return jsonify({'success': False, 'error': 'Validation Error', 'message': 'Farmer name and quantity are required.'}), 400

    try:
        qty = float(quantity)
        if qty <= 0:
            return jsonify({'success': False, 'error': 'Invalid Quantity', 'message': 'Contribution must be greater than 0.'}), 400

        # 3. Backend Overbooking Prevention Check
        target_qty = lot.target_quantity if lot.target_quantity is not None else lot.quantity
        current_committed = sum(m.quantity for m in lot.members)
        remaining_capacity = max(0.0, round(target_qty - current_committed, 2))

        if qty > remaining_capacity:
            return jsonify({
                'success': False,
                'error': 'Capacity Exceeded',
                'message': f"Only {remaining_capacity:g} {lot.unit} capacity remains in this aggregation.",
                'remaining_capacity': remaining_capacity,
                'target_quantity': target_qty,
                'committed_quantity': current_committed
            }), 400

        member = FPOLotMember(
            fpo_lot_id=lot.id,
            farmer_id=data.get('farmer_id') or data.get('user_id'),
            farmer_name=farmer_name,
            farmer_reference_placeholder=data.get('farmer_reference_placeholder', f'FARMER-MEM-{len(lot.members) + 1}'),
            crop=lot.crop,
            quantity=qty,
            unit=data.get('unit', lot.unit),
            quality_grade=data.get('quality_grade', lot.quality_grade),
            contribution_status=data.get('contribution_status', 'PLEDGED')
        )

        db.session.add(member)
        if member not in lot.members:
            lot.members.append(member)
        db.session.flush()

        # Recalibrate parent lot committed quantity
        lot.quantity = round(current_committed + qty, 2)

        # Trigger authoritative milestone evaluation (90% CLOSING_SOON, 100% FILLED) with idempotent notification
        evaluate_aggregation_status(lot, commit=False)

        db.session.commit()

        return jsonify({
            'success': True,
            'message': f"Added {qty:g} {lot.unit} contribution from {farmer_name}.",
            'member': member.to_dict(),
            'total_aggregated_quantity': lot.quantity,
            'aggregation_status': lot.aggregation_status,
            'lot': lot.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Server Error', 'message': str(e)}), 500


@fpo_bp.route('/lots/<int:lot_id>/members/<int:member_id>/status', methods=['PUT'])
def update_member_status(lot_id, member_id):
    """FPO updates member contribution lifecycle: PLEDGED -> RECEIVED -> VERIFIED."""
    lot = CropLot.query.get(lot_id)
    member = FPOLotMember.query.filter_by(id=member_id, fpo_lot_id=lot_id).first()

    if not lot or not member:
        return jsonify({'success': False, 'error': 'Not Found', 'message': 'Lot or member record not found.'}), 404

    data = request.get_json() or {}
    new_status = data.get('status') or data.get('contribution_status')

    valid_statuses = ('PLEDGED', 'RECEIVED', 'VERIFIED')
    if new_status not in valid_statuses:
        return jsonify({
            'success': False,
            'error': 'Invalid Status',
            'message': f"Status must be one of {', '.join(valid_statuses)}."
        }), 400

    try:
        member.contribution_status = new_status
        db.session.commit()

        return jsonify({
            'success': True,
            'message': f"Farmer contribution status updated to {new_status}.",
            'member': member.to_dict(),
            'lot': lot.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Server Error', 'message': str(e)}), 500


@fpo_bp.route('/lots/<int:lot_id>/members/<int:member_id>', methods=['DELETE'])
def remove_member_contribution(lot_id, member_id):
    lot = CropLot.query.get(lot_id)
    member = FPOLotMember.query.filter_by(id=member_id, fpo_lot_id=lot_id).first()

    if not lot or not member:
        return jsonify({'success': False, 'error': 'Not Found', 'message': 'Lot or member record not found.'}), 404

    try:
        db.session.delete(member)
        db.session.flush()

        # Recalculate total quantity
        lot.quantity = round(sum(m.quantity for m in lot.members), 2)
        evaluate_aggregation_status(lot, commit=False)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': f"Member contribution removed. New total: {lot.quantity} {lot.unit}.",
            'total_aggregated_quantity': lot.quantity,
            'lot': lot.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Server Error', 'message': str(e)}), 500


@fpo_bp.route('/lots/<int:lot_id>/publish', methods=['POST'])
def publish_fpo_lot(lot_id):
    lot = CropLot.query.get(lot_id)
    if not lot:
        return jsonify({'success': False, 'error': 'Not Found', 'message': f'Lot #{lot_id} not found.'}), 404

    if not lot.members or len(lot.members) == 0:
        return jsonify({
            'success': False,
            'error': 'No Members',
            'message': 'Cannot publish an FPO lot without any member farmer contributions.'
        }), 400

    lot.status = 'ACTIVE'
    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'FPO Lot #{lot_id} successfully published with {len(lot.members)} member contributions ({lot.quantity} {lot.unit})!',
        'lot': lot.to_dict()
    }), 200


@fpo_bp.route('/lots/<int:lot_id>/extend', methods=['POST'])
def extend_aggregation_window(lot_id):
    """FPO extends collection window for an aggregation."""
    lot = CropLot.query.get(lot_id)
    if not lot or lot.seller_type != 'FPO':
        return jsonify({'success': False, 'error': 'Not Found', 'message': f'FPO Lot #{lot_id} not found.'}), 404

    data = request.get_json() or {}
    extension_hours = float(data.get('extension_hours', 10.0))

    if extension_hours <= 0:
        return jsonify({'success': False, 'error': 'Invalid Duration', 'message': 'Extension hours must be greater than 0.'}), 400

    try:
        now = datetime.utcnow()
        base_time = max(now, lot.collection_deadline_at or now)
        lot.collection_deadline_at = base_time + timedelta(hours=extension_hours)
        lot.deadline_extension_count = (lot.deadline_extension_count or 0) + 1
        lot.deadline_notified_at = None # Reset so future expiry sends single notification

        # Re-evaluate status
        evaluate_aggregation_status(lot, commit=False)
        lot.status = 'ACTIVE'
        db.session.commit()

        return jsonify({
            'success': True,
            'message': f"Collection window for {lot.crop} extended by {extension_hours:g} hours.",
            'lot': lot.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Server Error', 'message': str(e)}), 500


@fpo_bp.route('/lots/<int:lot_id>/proceed', methods=['POST'])
def proceed_with_collected_quantity(lot_id):
    """FPO finalizes aggregation with existing collected quantity and closes pool for new pledges."""
    lot = CropLot.query.get(lot_id)
    if not lot or lot.seller_type != 'FPO':
        return jsonify({'success': False, 'error': 'Not Found', 'message': f'FPO Lot #{lot_id} not found.'}), 404

    try:
        lot.aggregation_status = 'CLOSED'
        lot.status = 'ACTIVE' # Ready on marketplace for buyers
        db.session.commit()

        return jsonify({
            'success': True,
            'message': f"Aggregation #{lot.id} finalized with collected quantity of {lot.quantity:g} {lot.unit}. Marketplace listing active.",
            'lot': lot.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Server Error', 'message': str(e)}), 500


@fpo_bp.route('/lots/<int:lot_id>/cancel', methods=['POST'])
def cancel_aggregation(lot_id):
    """FPO cancels an aggregation while preserving historical records."""
    lot = CropLot.query.get(lot_id)
    if not lot or lot.seller_type != 'FPO':
        return jsonify({'success': False, 'error': 'Not Found', 'message': f'FPO Lot #{lot_id} not found.'}), 404

    try:
        lot.aggregation_status = 'CANCELLED'
        lot.status = 'CANCELLED'
        db.session.commit()

        return jsonify({
            'success': True,
            'message': f"Aggregation #{lot.id} cancelled. Historical record preserved.",
            'lot': lot.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Server Error', 'message': str(e)}), 500


@fpo_bp.route('/inventory', methods=['GET'])
def get_fpo_inventory():
    """Consolidated FPO Crop Inventory with sell urgency indicator and farmer traceability."""
    seller_id = request.args.get('seller_id')
    query = CropLot.query.filter_by(seller_type='FPO')
    if seller_id and seller_id.isdigit():
        query = query.filter_by(seller_id=int(seller_id))

    lots = query.order_by(CropLot.created_at.desc()).all()

    # Re-evaluate statuses
    for lot in lots:
        evaluate_aggregation_status(lot, commit=False)

    crop_groups = {}
    for lot in lots:
        c = lot.crop.strip()
        if c not in crop_groups:
            crop_groups[c] = {
                'crop': c,
                'unit': lot.unit or 'kg',
                'target_quantity': 0.0,
                'committed_quantity': 0.0,
                'received_quantity': 0.0,
                'verified_quantity': 0.0,
                'available_for_sale': 0.0,
                'active_pools_count': 0,
                'storage_status': lot.storage_status or 'NOT_STORED',
                'batches': []
            }

        group = crop_groups[c]
        d = lot.to_dict()
        group['target_quantity'] += d['target_quantity']
        group['committed_quantity'] += d['committed_quantity']
        group['received_quantity'] += d['received_quantity']
        group['verified_quantity'] += d['verified_quantity']
        group['available_for_sale'] += d['available_for_sale']
        if lot.aggregation_status in ('OPEN', 'CLOSING_SOON'):
            group['active_pools_count'] += 1

        # Traceability details for each lot batch
        group['batches'].append({
            'lot_id': lot.id,
            'variety': lot.variety,
            'aggregation_status': lot.aggregation_status,
            'lot_status': lot.status,
            'quality_grade': lot.quality_grade,
            'storage_status': lot.storage_status,
            'location': lot.location,
            'created_at': d['created_at'],
            'target_quantity': d['target_quantity'],
            'committed_quantity': d['committed_quantity'],
            'received_quantity': d['received_quantity'],
            'verified_quantity': d['verified_quantity'],
            'contributing_farmers': [
                {
                    'farmer_name': m.farmer_name,
                    'farmer_reference': m.farmer_reference_placeholder or f'MEM-{m.id}',
                    'quantity': m.quantity,
                    'unit': m.unit,
                    'quality_grade': m.quality_grade,
                    'contribution_status': m.contribution_status,
                    'created_at': m.created_at.isoformat() if m.created_at else None
                } for m in (lot.members or [])
            ]
        })

    # Calculate sell urgency advisory per crop
    consolidated_inventory = []
    for crop_name, g in crop_groups.items():
        g['target_quantity'] = round(g['target_quantity'], 2)
        g['committed_quantity'] = round(g['committed_quantity'], 2)
        g['received_quantity'] = round(g['received_quantity'], 2)
        g['verified_quantity'] = round(g['verified_quantity'], 2)
        g['available_for_sale'] = round(g['available_for_sale'], 2)

        urgency = calculate_sell_urgency(crop_name, g['storage_status'], g['available_for_sale'])
        g['urgency'] = urgency['priority']
        g['urgency_badge'] = urgency['badge_variant']
        g['urgency_reason'] = urgency['reason']
        consolidated_inventory.append(g)

    return jsonify({
        'success': True,
        'count': len(consolidated_inventory),
        'inventory': consolidated_inventory
    }), 200


# In-memory custom registered organizations store (merged with standard Maharashtra directory)
custom_fpo_registry = []

@fpo_bp.route('/organizations', methods=['GET'])
def get_fpo_organizations():
    """Returns list of registered Maharashtra FPOs that farmers can join."""
    standard_orgs = [
        {
            'id': 1,
            'name': 'Sahyadri Farmers Producer Co. Ltd.',
            'district': 'Nashik',
            'taluka': 'Dindori',
            'crops': ['Grapes', 'Tomato', 'Pomegranate', 'Exotic Vegetables'],
            'members_count': 8200,
            'avg_profit_uplift': '+22%',
            'rating': 4.9,
            'benefits': ['Direct export to Europe & Gulf', 'Packhouse sorting & pre-cooling', 'Shared cold-chain fleet access'],
            'contact': '+91 253 280 1200',
            'address': 'Mohadi, Dindori Road, Nashik, Maharashtra 422207'
        },
        {
            'id': 2,
            'name': 'Dindori Agro Producer Company',
            'district': 'Nashik',
            'taluka': 'Dindori',
            'crops': ['Onion', 'Tomato', 'Maize', 'Soybean'],
            'members_count': 1450,
            'avg_profit_uplift': '+18%',
            'rating': 4.8,
            'benefits': ['Bulk procurement contracts with Reliance & BigBasket', 'Shared tempo & tractor pooling', 'Seeds & fertilizer at 15% wholesale discount'],
            'contact': '+91 98234 56781',
            'address': 'Gat No. 88, APMC Sub-Yard Road, Dindori, Nashik'
        },
        {
            'id': 3,
            'name': 'Junnar Agro Farmer Producer Org',
            'district': 'Pune',
            'taluka': 'Junnar',
            'crops': ['Tomato', 'Onion', 'Cabbage', 'Flowers'],
            'members_count': 2100,
            'avg_profit_uplift': '+20%',
            'rating': 4.7,
            'benefits': ['Daily express logistics to Mumbai Vashi & Pune APMCs', 'Zero intermediary commission', 'Subsidized drip irrigation inputs'],
            'contact': '+91 94220 98112',
            'address': 'Narayangaon Bypass, Junnar, Pune 410504'
        },
        {
            'id': 4,
            'name': 'Solapur Pomegranate & Dryland FPC',
            'district': 'Solapur',
            'taluka': 'Sangola',
            'crops': ['Pomegranate', 'Onion', 'Jowar'],
            'members_count': 1180,
            'avg_profit_uplift': '+25%',
            'rating': 4.8,
            'benefits': ['Direct institutional buyers for export grade Bhagwa pomegranates', 'Cold storage reservation vouchers'],
            'contact': '+91 97631 44520',
            'address': 'Sangola-Pandharpur Road, Solapur 413307'
        },
        {
            'id': 5,
            'name': 'Ahmednagar Krushi Vikas Producer Co.',
            'district': 'Ahmednagar',
            'taluka': 'Rahata',
            'crops': ['Soybean', 'Wheat', 'Maize', 'Sugarcane'],
            'members_count': 960,
            'avg_profit_uplift': '+16%',
            'rating': 4.6,
            'benefits': ['Combined MSP procurement centre', 'Warehouse receipt financing at 4% interest'],
            'contact': '+91 98902 33410',
            'address': 'Near Shirdi APMC Yard, Rahata, Ahmednagar 423107'
        }
    ]

    # Dynamically include any FPO profiles from database
    db_fpos = []
    try:
        fpo_profiles = FPOProfile.query.all()
        for fp in fpo_profiles:
            # Avoid duplicate if matches standard demo names
            if any(s['name'].lower() == fp.fpo_name.lower() for s in standard_orgs):
                continue
            crops_list = [c.strip() for c in (fp.primary_crops or 'Onion, Tomato').split(',') if c.strip()]
            user = User.query.get(fp.user_id) if fp.user_id else None
            db_fpos.append({
                'id': 1000 + fp.id,
                'name': fp.fpo_name,
                'district': fp.district,
                'taluka': 'Main Hub',
                'crops': crops_list,
                'members_count': fp.member_count or 0,
                'avg_profit_uplift': '+20%',
                'rating': 4.8,
                'benefits': ['Direct collective market access', 'Govt verified institutional procurement', 'Fair equity distribution'],
                'contact': user.phone if user else '+91 98000 00000',
                'address': f'{fp.district}, Maharashtra'
            })
    except Exception as e:
        print('Error fetching DB FPO profiles:', e)

    # Combine custom memory + db + standard
    all_orgs = custom_fpo_registry + db_fpos + standard_orgs

    # Normalize fields defensively so frontend never crashes on malformed custom items
    for org in all_orgs:
        if isinstance(org.get('benefits'), str):
            org['benefits'] = [b.strip() for b in org['benefits'].split(',') if b.strip()]
        elif not isinstance(org.get('benefits'), list) or not org.get('benefits'):
            org['benefits'] = [
                'Direct collective market access & bulk contracts',
                'Subsidized quality inputs & cold storage access',
                'Transparent digital member payout settlement'
            ]

        if isinstance(org.get('crops'), str):
            org['crops'] = [c.strip() for c in org['crops'].split(',') if c.strip()]
        elif not isinstance(org.get('crops'), list) or not org.get('crops'):
            org['crops'] = ['Tomato', 'Onion']

        try:
            org['members_count'] = int(org.get('members_count') or 0)
        except (ValueError, TypeError):
            org['members_count'] = 0

    return jsonify({
        'success': True,
        'count': len(all_orgs),
        'organizations': all_orgs
    }), 200


@fpo_bp.route('/organizations', methods=['POST'])
def register_fpo_organization():
    """Allows an FPO to create or publish their organization profile in the discovery directory."""
    data = request.get_json() or {}
    name = data.get('name') or data.get('fpo_name')
    district = data.get('district', 'Nashik')
    taluka = data.get('taluka', 'Main Hub')
    contact = data.get('contact') or data.get('phone', '+91 98000 00000')
    crops = data.get('crops', ['Tomato', 'Onion'])
    if isinstance(crops, str):
        crops = [c.strip() for c in crops.split(',') if c.strip()]
    if not crops:
        crops = ['Tomato', 'Onion']
    
    if not name:
        return jsonify({'success': False, 'message': 'FPO organization name is required.'}), 400

    raw_benefits = data.get('benefits') or [
        'Direct collective market access & bulk contracts',
        'Subsidized quality inputs and fertilizers',
        'Transparent digital member payout settlement'
    ]
    if isinstance(raw_benefits, str):
        benefits = [b.strip() for b in raw_benefits.split(',') if b.strip()]
    elif isinstance(raw_benefits, list):
        benefits = raw_benefits
    else:
        benefits = [str(raw_benefits)]

    new_org = {
        'id': 2000 + len(custom_fpo_registry) + 1,
        'name': name.strip(),
        'district': district.strip(),
        'taluka': taluka.strip(),
        'crops': crops,
        'members_count': int(data.get('members_count', 0)),
        'avg_profit_uplift': data.get('avg_profit_uplift', '+20%'),
        'rating': 4.8,
        'benefits': benefits,
        'contact': contact,
        'address': data.get('address', f'{district}, Maharashtra')
    }

    custom_fpo_registry.insert(0, new_org)

    # If linked to a logged-in user, update FPO profile in DB
    user_id = data.get('user_id')
    if user_id:
        user = User.query.get(user_id)
        if user and user.role == 'FPO' and user.fpo_profile:
            user.fpo_profile.fpo_name = name.strip()
            user.fpo_profile.district = district.strip()
            user.fpo_profile.primary_crops = ', '.join(crops)
            user.fpo_profile.member_count = int(data.get('members_count', 0))
            db.session.commit()

    return jsonify({
        'success': True,
        'message': f'FPO "{name}" successfully registered in Maharashtra Farmer Discovery Directory! Local farmers can now view and apply to join.',
        'organization': new_org
    }), 201


@fpo_bp.route('/direct-lot', methods=['POST'])
def create_direct_fpo_lot():
    """Allows an FPO to directly list and sell aggregated produce from offline farmer groups on the marketplace."""
    data = request.get_json() or {}
    seller_id = data.get('seller_id')
    crop = data.get('crop')
    quantity = data.get('quantity')
    expected_price = data.get('expected_price')
    district = data.get('district', 'Nashik')
    location = data.get('location', 'FPO Packhouse & Aggregation Hub')
    
    if not crop or not quantity or not expected_price:
        return jsonify({'success': False, 'message': 'Crop, quantity and expected price are required.'}), 400
        
    try:
        qty = float(quantity)
        price = float(expected_price)
    except ValueError:
        return jsonify({'success': False, 'message': 'Quantity and price must be numbers.'}), 400

    user = User.query.get(seller_id) if seller_id else None
    seller_name = (user.name or (user.fpo_profile.fpo_name if user.fpo_profile else None)) if user else (data.get('fpo_name') or 'FPO Producer Co.')

    lot = CropLot(
        seller_id=user.id if user else 3,
        seller_type='FPO',
        seller_name=seller_name,
        seller_verification_status=user.verification_status if user else 'PENDING',
        crop=crop,
        variety=data.get('variety', 'Commercial Bulk'),
        quantity=qty,
        unit=data.get('unit', 'tonne'),
        quality_grade=data.get('quality_grade', 'Grade A'),
        harvest_date=data.get('harvest_date', datetime.utcnow().strftime('%Y-%m-%d')),
        location=location,
        district=district,
        expected_price=price,
        storage_status=data.get('storage_status', 'NOT_STORED'),
        image_url=data.get('image_url') or '/uploads/crop_lots/default_lot.jpg',
        status='ACTIVE'
    )
    db.session.add(lot)
    db.session.commit()
    
    # Associate offline group members
    offline_farmers = int(data.get('offline_farmers_count', 12))
    member_qty = round(qty / max(1, offline_farmers), 2)
    for i in range(min(offline_farmers, 5)):
        db.session.add(FPOLotMember(
            fpo_lot_id=lot.id,
            farmer_name=f'Offline Member Farmer #{i+1}',
            farmer_reference_placeholder='98XXXXXX' + str(10 + i),
            crop=lot.crop,
            quantity=member_qty,
            unit=lot.unit,
            quality_grade=lot.quality_grade,
            contribution_status='RECEIVED'
        ))
    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Direct commercial lot #{lot.id} ({qty} {lot.unit} {crop}) successfully listed on the marketplace! Buyers can now submit binding bids.',
        'lot': lot.to_dict()
    }), 201


@fpo_bp.route('/benchmarks', methods=['GET'])
def get_fpo_benchmarks():
    """Provides market benchmarks comparing APMC baseline prices vs FPO payout rates across Maharashtra."""
    benchmarks = [
        {
            'crop': 'Tomato (Hybrid)',
            'apmc_mandi_avg': 22.5,
            'fpo_avg_payout': 25.2,
            'top_fpo_payout': 26.5,
            'buyer_bulk_rate': 28.0,
            'fpo_operating_margin': 2.8,
            'avg_settlement_days': 'T+2 Days',
            'top_fpos': ['Sahyadri Farmers Producer Co.', 'Junnar Agro FPO', 'Dindori Agro PC']
        },
        {
            'crop': 'Onion (Nashik Red)',
            'apmc_mandi_avg': 26.5,
            'fpo_avg_payout': 29.0,
            'top_fpo_payout': 30.5,
            'buyer_bulk_rate': 32.5,
            'fpo_operating_margin': 3.5,
            'avg_settlement_days': 'T+3 Days',
            'top_fpos': ['Dindori Agro Producer Company', 'Lasalgaon Krishi Vikas', 'MahaFPC Nashik']
        },
        {
            'crop': 'Soybean (Yellow)',
            'apmc_mandi_avg': 44.0,
            'fpo_avg_payout': 47.5,
            'top_fpo_payout': 49.0,
            'buyer_bulk_rate': 51.0,
            'fpo_operating_margin': 3.5,
            'avg_settlement_days': 'T+2 Days',
            'top_fpos': ['Ahmednagar Krushi Vikas', 'Latur Shetkari Producer Co.', 'Marathwada Agro FPC']
        },
        {
            'crop': 'Pomegranate (Bhagwa)',
            'apmc_mandi_avg': 85.0,
            'fpo_avg_payout': 105.0,
            'top_fpo_payout': 112.0,
            'buyer_bulk_rate': 120.0,
            'fpo_operating_margin': 15.0,
            'avg_settlement_days': 'T+2 Days',
            'top_fpos': ['Solapur Pomegranate & Dryland FPC', 'Sangola Bhagwa Producer Co.']
        },
        {
            'crop': 'Grapes (Thompson)',
            'apmc_mandi_avg': 65.0,
            'fpo_avg_payout': 78.0,
            'top_fpo_payout': 84.0,
            'buyer_bulk_rate': 92.0,
            'fpo_operating_margin': 14.0,
            'avg_settlement_days': 'T+2 Days',
            'top_fpos': ['Sahyadri Farmers Producer Co. Ltd.', 'Nashik Grape Growers FPC']
        }
    ]
    return jsonify({'success': True, 'benchmarks': benchmarks}), 200


@fpo_bp.route('/join-request', methods=['POST'])
def submit_join_request():
    """Allows an individual farmer to apply for membership in an FPO."""
    data = request.get_json() or {}
    farmer_name = data.get('farmer_name', 'Suresh Patil')
    fpo_name = data.get('fpo_name', 'Sahyadri Farmers Producer Co. Ltd.')
    phone = data.get('phone', '9823012345')
    crop = data.get('crop', 'Tomato')
    district = data.get('district', 'Nashik')
    land_acres = data.get('land_acres', 3.5)

    from models.notification import Notification
    user_id = data.get('user_id', 1)
    db.session.add(Notification(
        user_id=user_id,
        title=f'Membership Request Sent: {fpo_name}',
        message=f'Your membership application for {crop} ({land_acres} acres in {district}) has been registered with {fpo_name}. FPO Secretary will contact you at {phone}.',
        type='FPO'
    ))
    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Membership application successfully submitted to {fpo_name}! You will receive updates under Notifications.',
        'application': {
            'farmer_name': farmer_name,
            'fpo_name': fpo_name,
            'status': 'PENDING_APPROVAL',
            'submitted_at': 'Just now'
        }
    }), 201
