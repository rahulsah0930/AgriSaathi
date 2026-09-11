from flask import Blueprint, request, jsonify
from models import db
from models.storage import Warehouse, StorageBooking
from datetime import datetime, date

storage_bp = Blueprint('storage', __name__, url_prefix='/api')

@storage_bp.route('/warehouses', methods=['GET'])
def list_warehouses():
    """Returns warehouses with filtering by district, storage_type, and status."""
    try:
        from models.user import WarehouseProfile
        # Auto-sync any registered WarehouseProfile into Warehouse table if not present
        existing_names = {w.name.lower() for w in Warehouse.query.all()}
        profiles = WarehouseProfile.query.all()
        for p in profiles:
            if p.warehouse_name and p.warehouse_name.lower() not in existing_names:
                st_type = p.storage_type or 'COLD_STORAGE'
                mapped = 'COLD_STORAGE'
                if 'controlled' in st_type.lower() or 'atmosphere' in st_type.lower():
                    mapped = 'CONTROLLED'
                elif 'dry' in st_type.lower() or 'normal' in st_type.lower() or 'ambient' in st_type.lower():
                    mapped = 'NORMAL'

                cap = float(p.capacity_mt or 2500.0)
                tariff = float(p.tariff_per_quintal_month or 55.0)
                price_day = round(tariff / (100.0 * 30.0), 4)

                user_v_status = 'PENDING'
                if getattr(p, 'user', None) and p.user.verification_status:
                    user_v_status = p.user.verification_status

                sync_wh = Warehouse(
                    name=p.warehouse_name.strip(),
                    verification_status=user_v_status,
                    district=p.district.strip() if p.district else 'Nashik',
                    location=p.address.strip() if p.address else f"{p.district or 'Nashik'} Agro Hub",
                    storage_type=mapped,
                    supported_crops=p.supported_crops or 'Tomato, Onion, Grapes, Pomegranate',
                    total_capacity=cap,
                    available_capacity=cap,
                    price_per_kg_per_day=price_day if price_day > 0 else 0.018,
                    temperature_range_placeholder='0°C to 4°C' if mapped == 'COLD_STORAGE' else ('1°C to 8°C' if mapped == 'CONTROLLED' else 'Ambient (18-24°C)'),
                    availability_status='AVAILABLE'
                )
                db.session.add(sync_wh)
                existing_names.add(p.warehouse_name.lower())
        db.session.commit()

        district = request.args.get('district')
        storage_type = request.args.get('storage_type')
        status = request.args.get('status')
        search = request.args.get('search')

        query = Warehouse.query

        if district:
            query = query.filter(Warehouse.district.ilike(f'%{district}%'))
        if storage_type:
            query = query.filter(Warehouse.storage_type == storage_type)
        if status:
            query = query.filter(Warehouse.availability_status == status)
        if search:
            pattern = f'%{search}%'
            query = query.filter(
                (Warehouse.name.ilike(pattern)) |
                (Warehouse.location.ilike(pattern)) |
                (Warehouse.supported_crops.ilike(pattern))
            )

        # Order by newest first so newly added cold stores appear at top
        warehouses = query.order_by(Warehouse.id.desc()).all()

        wh_list = []
        for idx, w in enumerate(warehouses):
            d = w.to_dict()
            # Mark newest warehouse as newly added
            d['is_new'] = idx == 0 or w.id > 3
            wh_list.append(d)

        return jsonify({
            'success': True,
            'count': len(wh_list),
            'warehouses': wh_list
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@storage_bp.route('/warehouses', methods=['POST'])
def create_warehouse():
    """Allows adding a new cold storage / warehouse facility."""
    try:
        data = request.get_json() or {}
        name = data.get('name') or data.get('warehouse_name')
        if not name:
            return jsonify({'success': False, 'error': 'Warehouse name is required'}), 400

        district = data.get('district', 'Nashik').strip()
        location = data.get('location') or data.get('address') or f"{district} Cold Chain Zone"
        storage_type = data.get('storage_type', 'COLD_STORAGE').upper()
        if 'COLD' in storage_type:
            storage_type = 'COLD_STORAGE'
        elif 'CONTROLLED' in storage_type:
            storage_type = 'CONTROLLED'
        else:
            storage_type = 'NORMAL'

        total_capacity = float(data.get('total_capacity') or data.get('capacity_mt') or 2500.0)
        available_capacity = float(data.get('available_capacity') or total_capacity)
        price_per_kg_per_day = float(data.get('price_per_kg_per_day') or 0.02)
        supported_crops = data.get('supported_crops', 'Tomato, Onion, Grapes, Pomegranate, Potato')
        temp_range = data.get('temperature_range') or ('0°C to 4°C' if storage_type == 'COLD_STORAGE' else 'Ambient')

        new_wh = Warehouse(
            name=name.strip(),
            verification_status='PENDING',
            district=district,
            location=location.strip(),
            storage_type=storage_type,
            supported_crops=supported_crops,
            total_capacity=total_capacity,
            available_capacity=available_capacity,
            price_per_kg_per_day=price_per_kg_per_day,
            temperature_range_placeholder=temp_range,
            availability_status='AVAILABLE'
        )
        db.session.add(new_wh)
        db.session.commit()

        d = new_wh.to_dict()
        d['is_new'] = True

        return jsonify({
            'success': True,
            'message': f'Cold storage {name} added successfully and visible to farmers and FPOs!',
            'warehouse': d
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@storage_bp.route('/warehouses/<int:warehouse_id>', methods=['GET'])
def get_warehouse(warehouse_id):
    """Returns detailed information for a single warehouse."""
    try:
        warehouse = Warehouse.query.get(warehouse_id)
        if not warehouse:
            return jsonify({'success': False, 'error': 'Warehouse not found'}), 404

        return jsonify({
            'success': True,
            'warehouse': warehouse.to_dict()
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@storage_bp.route('/storage-bookings', methods=['POST'])
def create_storage_booking():
    """Farmer/FPO initiates a storage booking request."""
    try:
        data = request.get_json() or {}
        user_id = data.get('user_id', 1)
        user_role = data.get('user_role', 'FARMER')
        warehouse_id = data.get('warehouse_id')
        crop = data.get('crop')
        quantity = float(data.get('quantity', 0))
        unit = data.get('unit', 'kg')
        expected_duration_days = int(data.get('expected_duration_days', 14))
        start_date_str = data.get('start_date')

        if not warehouse_id or not crop or quantity <= 0:
            return jsonify({'success': False, 'error': 'Warehouse, crop, and positive quantity are required'}), 400

        warehouse = Warehouse.query.get(warehouse_id)
        if not warehouse:
            return jsonify({'success': False, 'error': 'Warehouse not found'}), 404

        # Convert quantity to kg for pricing
        qty_kg = quantity
        if unit.lower() in ['quintal', 'qtl']:
            qty_kg = quantity * 100
        elif unit.lower() in ['tonne', 'ton', 't']:
            qty_kg = quantity * 1000

        # Calculate estimated cost
        estimated_cost = round(qty_kg * warehouse.price_per_kg_per_day * expected_duration_days, 2)

        start_date = date.today()
        if start_date_str:
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            except ValueError:
                pass

        booking = StorageBooking(
            user_id=user_id,
            user_role=user_role,
            warehouse_id=warehouse_id,
            crop=crop,
            quantity=quantity,
            unit=unit,
            start_date=start_date,
            expected_duration_days=expected_duration_days,
            estimated_cost=estimated_cost,
            status='REQUESTED'
        )

        db.session.add(booking)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': f'Storage booking request submitted for {warehouse.name}',
            'booking': booking.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@storage_bp.route('/storage-bookings', methods=['GET'])
def list_user_bookings():
    """Lists storage bookings for the current farmer/FPO."""
    try:
        user_id = request.args.get('user_id', 1)
        bookings = StorageBooking.query.filter_by(user_id=user_id).order_by(StorageBooking.created_at.desc()).all()

        return jsonify({
            'success': True,
            'count': len(bookings),
            'bookings': [b.to_dict() for b in bookings]
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
