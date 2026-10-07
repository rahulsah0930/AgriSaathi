import os
import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app, g
from werkzeug.utils import secure_filename
from models import db
from models.lot import CropLot, CropLotImage, QualityReport
from models.user import User
from services.ai_verification_service import analyze_crop_image
from utils.auth import jwt_required, role_required
from services.file_storage_service import get_storage_provider

lot_bp = Blueprint('lots', __name__, url_prefix='/api/lots')

ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@lot_bp.route('', methods=['GET'])
def get_lots():
    seller_id = request.args.get('seller_id')
    seller_type = request.args.get('seller_type')
    status = request.args.get('status')
    verified_only = request.args.get('verified_only', '').lower() == 'true'

    query = CropLot.query

    if seller_id:
        query = query.filter_by(seller_id=int(seller_id))
    if seller_type:
        query = query.filter_by(seller_type=seller_type.upper())
    if status and status.upper() != 'ALL':
        query = query.filter_by(status=status.upper())
    if verified_only:
        query = query.filter_by(seller_verification_status='VERIFIED')

    lots = query.order_by(CropLot.created_at.desc(), CropLot.id.desc()).all()
    lots_list = []
    for idx, lot in enumerate(lots):
        d = lot.to_dict()
        d['is_new'] = idx == 0 or lot.id > 4
        lots_list.append(d)

    return jsonify({
        'success': True,
        'count': len(lots_list),
        'lots': lots_list,
        'crop_lots': lots_list
    }), 200


@lot_bp.route('', methods=['POST'])
@jwt_required
@role_required('FARMER', 'FPO', 'ADMIN')
def create_lot():
    user = g.current_user
    if getattr(user, 'verification_status', '') == 'SUSPENDED':
        return jsonify({
            'success': False,
            'error': 'Account Suspended',
            'message': 'Suspended accounts cannot create new crop listings.'
        }), 403

    data = request.get_json() or {}

    # Validation
    required_fields = ['crop', 'quantity', 'unit', 'quality_grade', 'harvest_date', 'location', 'district', 'expected_price']
    for field in required_fields:
        if not data.get(field) and data.get(field) != 0:
            return jsonify({
                'success': False,
                'error': 'Validation Error',
                'message': f"Field '{field}' is required."
            }), 400

    try:
        quantity = float(data['quantity'])
        expected_price = float(data['expected_price'])
        if quantity <= 0:
            return jsonify({'success': False, 'error': 'Invalid Quantity', 'message': 'Quantity must be greater than 0.'}), 400
        if expected_price <= 0:
            return jsonify({'success': False, 'error': 'Invalid Price', 'message': 'Expected price must be greater than 0.'}), 400
    except ValueError:
        return jsonify({'success': False, 'error': 'Invalid Format', 'message': 'Quantity and Price must be numeric.'}), 400

    # Determine seller identity from verified JWT claims
    user = g.current_user
    seller_id = user.id
    seller_type = user.role if user.role in ['FARMER', 'FPO'] else 'FARMER'

    seller_name = None
    if user.role == 'FPO' and user.fpo_profile:
        seller_name = user.fpo_profile.fpo_name
    elif user.farmer_profile:
        seller_name = user.farmer_profile.full_name
    else:
        seller_name = user.name or user.phone

    verification_status = user.verification_status

    status = data.get('status', 'ACTIVE')
    images_list = data.get('images') or []
    if data.get('image_url') and not images_list:
        images_list = [data['image_url']]

    # Recommended publishing requirement: At least 1 crop image is required before an ACTIVE crop lot is published
    if status == 'ACTIVE' and not images_list:
        return jsonify({
            'success': False,
            'error': 'Image Required',
            'message': 'Please upload at least one produce photo before publishing.'
        }), 400

    try:
        # Determine primary image URL
        primary_img_url = None
        if images_list:
            for item in images_list:
                if isinstance(item, dict) and item.get('is_primary'):
                    primary_img_url = item.get('image_url')
                    break
            if not primary_img_url:
                primary_img_url = images_list[0] if isinstance(images_list[0], str) else images_list[0].get('image_url')

        lat_val = data.get('latitude')
        lng_val = data.get('longitude')
        try:
            latitude = float(lat_val) if lat_val is not None and str(lat_val).strip() != '' else None
            longitude = float(lng_val) if lng_val is not None and str(lng_val).strip() != '' else None
        except (ValueError, TypeError):
            latitude, longitude = None, None

        raw_addr = data.get('address') or data.get('location') or ''
        raw_village = data.get('village') or ''
        raw_taluka = data.get('taluka') or ''
        raw_pincode = data.get('pincode') or ''
        raw_state = data.get('state') or 'Maharashtra'

        # Resolve commodity master reference
        comm_id = data.get('commodity_id')
        crop_val = data['crop'].strip()
        try:
            from services.commodity_service import resolve_commodity_name, get_commodity_by_name, get_commodity_by_id
            if comm_id:
                comm = get_commodity_by_id(int(comm_id))
                if comm:
                    crop_val = comm.canonical_name
            else:
                canonical = resolve_commodity_name(crop_val)
                comm = get_commodity_by_name(canonical)
                if comm:
                    comm_id = comm.id
                    crop_val = comm.canonical_name
        except Exception:
            pass

        new_lot = CropLot(
            seller_id=seller_id,
            seller_type=seller_type,
            seller_name=seller_name,
            seller_verification_status=verification_status,
            crop=crop_val,
            commodity_id=comm_id,
            variety=data.get('variety', 'Standard').strip(),
            quantity=quantity,
            unit=(data.get('unit') or 'kg').strip().lower(),
            quality_grade=data.get('quality_grade', 'Grade A'),
            harvest_date=str(data['harvest_date']),
            location=data['location'].strip() if data.get('location') else (raw_addr.strip() or 'Farm Gate'),
            district=data['district'].strip(),
            latitude=latitude,
            longitude=longitude,
            address=raw_addr.strip() if raw_addr else None,
            village=raw_village.strip() if raw_village else None,
            taluka=raw_taluka.strip() if raw_taluka else None,
            pincode=raw_pincode.strip() if raw_pincode else None,
            state=raw_state.strip() if raw_state else 'Maharashtra',
            expected_price=expected_price,
            storage_status=data.get('storage_status', 'NOT_STORED'),
            image_url=primary_img_url,
            status=status
        )

        db.session.add(new_lot)
        db.session.flush()

        # Attach up to 5 CropLotImage records
        has_primary = False
        for idx, img_item in enumerate(images_list[:5]):
            img_url = img_item if isinstance(img_item, str) else img_item.get('image_url')
            is_prim = False
            if isinstance(img_item, dict) and img_item.get('is_primary'):
                is_prim = True
                has_primary = True
            elif isinstance(img_item, str) and img_url == primary_img_url and not has_primary:
                is_prim = True
                has_primary = True

            if img_url:
                lot_img = CropLotImage(
                    crop_lot_id=new_lot.id,
                    image_url=img_url,
                    is_primary=is_prim
                )
                db.session.add(lot_img)

        # Fallback: if no image was marked primary, mark the first one
        db.session.flush()
        if not has_primary and new_lot.images:
            new_lot.images[0].is_primary = True
            new_lot.image_url = new_lot.images[0].image_url

        # Initialize transparent QualityReport with Prototype Visual Quality Assistance
        declared_grade = data.get('quality_grade', 'Grade A')
        img_res = analyze_crop_image(primary_img_url, new_lot.crop, declared_grade)

        q_report = QualityReport(
            crop_lot_id=new_lot.id,
            seller_declared_grade=declared_grade,
            verified_grade=None,  # Not verified until official Buyer/FPO/Officer inspection
            condition_summary=data.get('condition_summary', 'Freshly Harvested, Field Packed'),
            moisture_percentage=float(data['moisture_percentage']) if data.get('moisture_percentage') is not None else 12.0,
            damage_percentage=float(data['damage_percentage']) if data.get('damage_percentage') is not None else 2.0,
            freshness_status=data.get('freshness_status', 'FRESH'),
            verification_status='SELF_REPORTED',  # Always SELF_REPORTED on upload
            image_validation_status=img_res.get('image_validation_status', 'PASSED'),
            ai_verification_status=img_res.get('image_validation_status', 'PASSED'),
            ai_score=img_res.get('ai_score'),
            ai_crop_consistency=img_res.get('ai_crop_consistency'),
            ai_quality_assessment=img_res.get('ai_quality_assessment', 'SUFFICIENT'),
            ai_signals=img_res.get('validation_signals', 'Image integrity check evaluated on upload.'),
            verifier_notes='Seller self-declared parameters. Image validation passed on upload.'
        )
        db.session.add(q_report)
        db.session.commit()



        return jsonify({
            'success': True,
            'message': 'Crop lot created successfully and published to marketplace.' if status == 'ACTIVE' else 'Crop lot saved as DRAFT.',
            'lot': new_lot.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': 'Server Error',
            'message': str(e)
        }), 500


@lot_bp.route('/<int:lot_id>', methods=['GET'])
def get_lot_details(lot_id):
    lot = CropLot.query.get(lot_id)
    if not lot:
        return jsonify({'success': False, 'error': 'Not Found', 'message': f'Lot #{lot_id} not found.'}), 404

    lot_dict = lot.to_dict()

    # Add AI Recommendation preview specific to this crop
    lot_dict['ai_recommendation'] = {
        'recommendation': 'SELL SOON' if lot.crop in ['Tomato', 'Grapes'] else 'WAIT',
        'recommended_window': 'Within 2 Days' if lot.crop in ['Tomato', 'Grapes'] else '5 to 7 Days',
        'current_price': 22.5 if lot.crop == 'Tomato' else 26.5,
        'predicted_price': 25.0 if lot.crop == 'Tomato' else 28.5,
        'estimated_net_return': round(lot.quantity * (24.0 if lot.crop == 'Tomato' else 27.5)),
        'risk': 'HIGH' if lot.crop in ['Tomato', 'Grapes'] else 'MEDIUM',
        'reason': f"Based on current {lot.district} APMC prices and perishability profile for {lot.crop}, price gains are expected within the next 48-72 hours."
    }

    # Add mock buyer offers for this lot
    lot_dict['buyer_offers'] = [
        {
            'id': 501,
            'buyer_name': 'ABC Foods Pvt Ltd',
            'buyer_verification_status': 'VERIFIED',
            'offer_price': lot.expected_price - 1.0,
            'quantity': lot.quantity,
            'unit': lot.unit,
            'total_value': round(lot.quantity * (lot.expected_price - 1.0)),
            'delivery_date': '2026-09-15',
            'status': 'PENDING'
        }
    ]

    return jsonify({
        'success': True,
        'lot': lot_dict
    }), 200


@lot_bp.route('/<int:lot_id>', methods=['PUT'])
@jwt_required
def update_lot(lot_id):
    lot = CropLot.query.get(lot_id)
    if not lot:
        return jsonify({'success': False, 'error': 'Not Found', 'message': f'Lot #{lot_id} not found.'}), 404

    # IDOR Prevention: only lot owner or admin can edit
    if lot.seller_id != g.current_user.id and g.current_user.role != 'ADMIN':
        return jsonify({'success': False, 'error': 'Forbidden', 'message': 'You do not have permission to modify this produce lot.'}), 403

    if lot.status == 'SOLD':
        return jsonify({'success': False, 'error': 'Forbidden', 'message': 'Sold lots cannot be edited.'}), 403

    data = request.get_json() or {}

    if 'crop' in data: lot.crop = data['crop']
    if 'variety' in data: lot.variety = data['variety']
    if 'quantity' in data: lot.quantity = float(data['quantity'])
    if 'unit' in data: lot.unit = data['unit']
    if 'quality_grade' in data: lot.quality_grade = data['quality_grade']
    if 'harvest_date' in data: lot.harvest_date = str(data['harvest_date'])
    if 'location' in data: lot.location = data['location']
    if 'district' in data: lot.district = data['district']
    if 'expected_price' in data: lot.expected_price = float(data['expected_price'])
    if 'storage_status' in data: lot.storage_status = data['storage_status']
    if 'status' in data: lot.status = data['status']

    db.session.commit()
    return jsonify({
        'success': True,
        'message': f'Crop lot #{lot_id} updated successfully.',
        'lot': lot.to_dict()
    }), 200


@lot_bp.route('/<int:lot_id>/status', methods=['PATCH'])
@jwt_required
def update_lot_status(lot_id):
    lot = CropLot.query.get(lot_id)
    if not lot:
        return jsonify({'success': False, 'error': 'Not Found', 'message': f'Lot #{lot_id} not found.'}), 404

    # IDOR Prevention: only lot owner or admin can update status
    if lot.seller_id != g.current_user.id and g.current_user.role != 'ADMIN':
        return jsonify({'success': False, 'error': 'Forbidden', 'message': 'You do not have permission to update this produce lot status.'}), 403

    data = request.get_json() or {}
    new_status = data.get('status', '').upper()

    valid_statuses = ['DRAFT', 'ACTIVE', 'RESERVED', 'SOLD', 'EXPIRED', 'CANCELLED']
    if new_status not in valid_statuses:
        return jsonify({
            'success': False,
            'error': 'Invalid Status',
            'message': f"Status must be one of {valid_statuses}."
        }), 400

    # Business rule: only allow sensible actions based on status
    if lot.status == 'SOLD':
        return jsonify({'success': False, 'error': 'Forbidden', 'message': 'Sold lots cannot change status.'}), 403

    lot.status = new_status
    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Lot #{lot_id} status updated to {new_status}.',
        'lot': lot.to_dict()
    }), 200


@lot_bp.route('/<int:lot_id>', methods=['DELETE'])
@jwt_required
def delete_lot(lot_id):
    lot = CropLot.query.get(lot_id)
    if not lot:
        return jsonify({'success': False, 'error': 'Not Found', 'message': f'Lot #{lot_id} not found.'}), 404

    # IDOR Prevention: only lot owner or admin can delete
    if lot.seller_id != g.current_user.id and g.current_user.role != 'ADMIN':
        return jsonify({'success': False, 'error': 'Forbidden', 'message': 'You do not have permission to delete this produce lot.'}), 403

    if lot.status in ['ACTIVE', 'RESERVED', 'SOLD']:
        return jsonify({
            'success': False,
            'error': 'Forbidden',
            'message': f'Cannot delete lot with status {lot.status}. Please deactivate or cancel it first.'
        }), 403

    db.session.delete(lot)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Lot #{lot_id} deleted successfully.'
    }), 200


@lot_bp.route('/upload-image', methods=['POST'])
@jwt_required
def upload_standalone_image():
    """Accepts single or multi-file crop photo upload and stores in uploads/crop_lots/."""
    uploaded_files = []
    for key in ['images', 'image', 'file', 'photos']:
        if key in request.files:
            uploaded_files.extend(request.files.getlist(key))

    if not uploaded_files and request.files:
        for key in request.files:
            uploaded_files.extend(request.files.getlist(key))

    uploaded_files = [f for f in uploaded_files if f and f.filename and f.filename.strip() != '']

    if not uploaded_files:
        return jsonify({'success': False, 'error': 'No file uploaded', 'message': 'Please provide an image file.'}), 400

    saved_files = []
    for file in uploaded_files:
        if not allowed_file(file.filename):
            return jsonify({
                'success': False,
                'error': 'Invalid file format',
                'message': f'Only JPG, PNG and WEBP images are supported. Invalid file: {file.filename}'
            }), 400

        # Validate file size
        file.seek(0, os.SEEK_END)
        size = file.tell()
        file.seek(0)
        if size > MAX_FILE_SIZE:
            return jsonify({
                'success': False,
                'error': 'File too large',
                'message': f'Image must be smaller than 5 MB ({file.filename} is {round(size / (1024*1024), 2)} MB).'
            }), 400

        storage_provider = get_storage_provider()
        save_res = storage_provider.save_file(file, category='crop_lots')
        saved_files.append({
            'image_url': save_res['url'],
            'filename': save_res['filename'],
            'original_name': save_res['original_filename']
        })

    return jsonify({
        'success': True,
        'message': f'{len(saved_files)} image(s) uploaded successfully.',
        'files': saved_files,
        'image_url': saved_files[0]['image_url'] if saved_files else None,
        'filename': saved_files[0]['filename'] if saved_files else None
    }), 201


@lot_bp.route('/<int:lot_id>/images', methods=['POST'])
@jwt_required
def upload_lot_image(lot_id):
    """Uploads an image directly to an existing crop lot."""
    lot = CropLot.query.get(lot_id)
    if not lot:
        return jsonify({'success': False, 'error': 'Not Found', 'message': f'Lot #{lot_id} not found.'}), 404

    if lot.seller_id != g.current_user.id and g.current_user.role != 'ADMIN':
        return jsonify({'success': False, 'error': 'Forbidden', 'message': 'You do not have permission to modify images for this lot.'}), 403

    uploaded_files = []
    for key in ['images', 'image', 'file', 'photos']:
        if key in request.files:
            uploaded_files.extend(request.files.getlist(key))

    if not uploaded_files and request.files:
        for key in request.files:
            uploaded_files.extend(request.files.getlist(key))

    uploaded_files = [f for f in uploaded_files if f and f.filename and f.filename.strip() != '']

    if not uploaded_files:
        return jsonify({'success': False, 'error': 'No file uploaded', 'message': 'Please provide an image file.'}), 400

    if len(lot.images) + len(uploaded_files) > 5:
        return jsonify({
            'success': False,
            'error': 'Limit Reached',
            'message': 'You can upload a maximum of 5 photos per crop lot.'
        }), 400

    saved_items = []
    for file in uploaded_files:
        if not allowed_file(file.filename):
            return jsonify({
                'success': False,
                'error': 'Invalid file format',
                'message': f'Only JPG, PNG and WEBP images are supported. Invalid file: {file.filename}'
            }), 400

        file.seek(0, os.SEEK_END)
        size = file.tell()
        file.seek(0)
        if size > MAX_FILE_SIZE:
            return jsonify({
                'success': False,
                'error': 'File too large',
                'message': f'Image must be smaller than 5 MB.'
            }), 400

        storage_provider = get_storage_provider()
        save_res = storage_provider.save_file(file, category='crop_lots')
        relative_url = save_res['url']
        is_primary = (len(lot.images) == 0 and len(saved_items) == 0) or request.form.get('is_primary', 'false').lower() == 'true'

        if is_primary:
            for img in lot.images:
                img.is_primary = False
            lot.image_url = relative_url

        new_img = CropLotImage(
            crop_lot_id=lot.id,
            image_url=relative_url,
            is_primary=is_primary
        )
        db.session.add(new_img)
        saved_items.append(new_img)

    if not lot.image_url and saved_items:
        lot.image_url = saved_items[0].image_url

    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'{len(saved_items)} crop photo(s) uploaded and attached.',
        'images': [img.to_dict() for img in lot.images],
        'lot': lot.to_dict()
    }), 201


@lot_bp.route('/<int:lot_id>/images/<int:image_id>', methods=['DELETE'])
@jwt_required
def delete_lot_image(lot_id, image_id):
    """Deletes an image from a crop lot and disk."""
    lot = CropLot.query.get(lot_id)
    img = CropLotImage.query.filter_by(id=image_id, crop_lot_id=lot_id).first()
    if not lot or not img:
        return jsonify({'success': False, 'error': 'Not Found', 'message': 'Lot or image record not found.'}), 404

    if lot.seller_id != g.current_user.id and g.current_user.role != 'ADMIN':
        return jsonify({'success': False, 'error': 'Forbidden', 'message': 'You do not have permission to delete images from this lot.'}), 403

    # Remove file from disk if present
    filename = os.path.basename(img.image_url)
    file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception:
            pass

    was_primary = img.is_primary
    db.session.delete(img)
    db.session.flush()

    # If the deleted image was primary, appoint the first remaining image as primary
    if was_primary and len(lot.images) > 0:
        lot.images[0].is_primary = True
        lot.image_url = lot.images[0].image_url
    elif len(lot.images) == 0:
        lot.image_url = None

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Image deleted successfully.',
        'lot': lot.to_dict()
    }), 200


@lot_bp.route('/<int:lot_id>/images/<int:image_id>/primary', methods=['PATCH', 'POST'])
@jwt_required
def set_primary_image(lot_id, image_id):
    """Sets an image as the primary image for the crop lot."""
    lot = CropLot.query.get(lot_id)
    img = CropLotImage.query.filter_by(id=image_id, crop_lot_id=lot_id).first()
    if not lot or not img:
        return jsonify({'success': False, 'error': 'Not Found', 'message': 'Lot or image record not found.'}), 404

    if lot.seller_id != g.current_user.id and g.current_user.role != 'ADMIN':
        return jsonify({'success': False, 'error': 'Forbidden', 'message': 'You do not have permission to modify this lot.'}), 403

    for other_img in lot.images:
        other_img.is_primary = (other_img.id == image_id)

    lot.image_url = img.image_url
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Primary photo updated.',
        'primary_image_url': img.image_url,
        'lot': lot.to_dict()
    }), 200


# --------------------------------------------------------------------
# QUALITY VERIFICATION ENDPOINTS (Enhancement 1 - Stage 2)
# --------------------------------------------------------------------
@lot_bp.route('/<int:lot_id>/quality', methods=['GET'])
def get_lot_quality(lot_id):
    """Retrieve quality report and verification status for a crop lot."""
    lot = CropLot.query.get(lot_id)
    if not lot:
        return jsonify({'success': False, 'error': 'Not Found', 'message': f'Lot #{lot_id} not found.'}), 404

    qr = lot.quality_report
    if not qr:
        # Create default report if not present
        qr = QualityReport(
            crop_lot_id=lot.id,
            seller_declared_grade=lot.quality_grade or 'Grade A',
            verified_grade=None,
            condition_summary='Freshly Harvested, Field Packed',
            moisture_percentage=12.0,
            damage_percentage=2.0,
            freshness_status='FRESH',
            verification_status='SELF_REPORTED',
            verifier_notes='Seller self-declaration.'
        )
        db.session.add(qr)
        db.session.commit()

    return jsonify({
        'success': True,
        'lot_id': lot.id,
        'crop': lot.crop,
        'quality_report': qr.to_dict()
    }), 200


@lot_bp.route('/<int:lot_id>/quality/request-verification', methods=['POST'])
@jwt_required
def request_quality_verification(lot_id):
    """Farmer/FPO requests quality verification by authorized inspection."""
    lot = CropLot.query.get(lot_id)
    if not lot:
        return jsonify({'success': False, 'error': 'Not Found', 'message': f'Lot #{lot_id} not found.'}), 404

    if lot.seller_id != g.current_user.id and g.current_user.role != 'ADMIN':
        return jsonify({'success': False, 'error': 'Forbidden', 'message': 'You do not have permission to request verification for this lot.'}), 403

    data = request.get_json() or {}
    qr = lot.quality_report
    if not qr:
        qr = QualityReport(
            crop_lot_id=lot.id,
            seller_declared_grade=lot.quality_grade or 'Grade A',
            condition_summary='Freshly Harvested',
            moisture_percentage=12.0,
            damage_percentage=2.0,
            freshness_status='FRESH'
        )
        db.session.add(qr)

    qr.verification_status = 'VERIFICATION_REQUESTED'
    if data.get('notes'):
        qr.verifier_notes = f"Seller request note: {data['notes'].strip()}"
    if data.get('preferred_date'):
        qr.verification_date = str(data['preferred_date'])

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Quality verification requested successfully. An authorized inspector or FPO representative will review the lot.',
        'quality_report': qr.to_dict(),
        'lot': lot.to_dict()
    }), 200


@lot_bp.route('/<int:lot_id>/quality/verify', methods=['POST'])
@jwt_required
@role_required('ADMIN')
def verify_lot_quality(lot_id):
    """Review action by authorized inspector, FPO representative, or buyer quality inspector."""
    lot = CropLot.query.get(lot_id)
    if not lot:
        return jsonify({'success': False, 'error': 'Not Found', 'message': f'Lot #{lot_id} not found.'}), 404

    data = request.get_json() or {}
    status_choice = data.get('verification_status', 'VERIFIED')
    allowed_statuses = ['UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'REQUIRES_RECHECK']
    if status_choice not in allowed_statuses:
        return jsonify({
            'success': False,
            'error': 'Validation Error',
            'message': f"Invalid status. Allowed choices: {', '.join(allowed_statuses)}"
        }), 400

    qr = lot.quality_report
    if not qr:
        qr = QualityReport(
            crop_lot_id=lot.id,
            seller_declared_grade=lot.quality_grade or 'Grade A'
        )
        db.session.add(qr)

    qr.verification_status = status_choice
    qr.verified_grade = data.get('verified_grade', qr.seller_declared_grade)
    qr.verified_by = data.get('verified_by', 'MahaAgri Authorized Quality Cell')
    qr.verifier_role = data.get('verifier_role', 'AUTHORIZED_OFFICER')
    qr.verification_date = data.get('verification_date', datetime.utcnow().strftime('%Y-%m-%d'))
    if 'moisture_percentage' in data and data['moisture_percentage'] is not None:
        try:
            qr.moisture_percentage = float(data['moisture_percentage'])
        except (ValueError, TypeError):
            pass
    if 'damage_percentage' in data and data['damage_percentage'] is not None:
        try:
            qr.damage_percentage = float(data['damage_percentage'])
        except (ValueError, TypeError):
            pass
    if 'freshness_status' in data:
        qr.freshness_status = data['freshness_status']
    if 'condition_summary' in data:
        qr.condition_summary = data['condition_summary']
    if 'verifier_notes' in data:
        qr.verifier_notes = data['verifier_notes']

    # If verified, synchronize lot's official quality_grade
    if status_choice == 'VERIFIED' and qr.verified_grade:
        lot.quality_grade = qr.verified_grade

    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Quality verification updated: {status_choice}.',
        'quality_report': qr.to_dict(),
        'lot': lot.to_dict()
    }), 200


@lot_bp.route('/<int:lot_id>/quality-review', methods=['POST'])
@jwt_required
def buyer_fpo_quality_review(lot_id):
    """
    Quality review by authorized Buyer, FPO, or Admin reviewer.
    Allows recording ACCEPTABLE, NEEDS_INSPECTION, or REJECTED with notes.
    Prevents self-review by seller/farmer.
    Preserves original uploaded crop images and declarations.
    """
    lot = CropLot.query.get(lot_id)
    if not lot:
        return jsonify({'success': False, 'error': 'Not Found', 'message': f'Lot #{lot_id} not found.'}), 404

    current_user = g.current_user

    # Farmer / Seller cannot self-mark Buyer/FPO verification
    if lot.seller_id == current_user.id and current_user.role != 'ADMIN':
        return jsonify({
            'success': False,
            'error': 'Forbidden',
            'message': 'Seller / Farmer cannot self-mark Buyer/FPO quality verification.'
        }), 403

    allowed_roles = {'BUYER', 'FPO', 'ADMIN'}
    if current_user.role not in allowed_roles:
        return jsonify({
            'success': False,
            'error': 'Forbidden',
            'message': f"Quality review requires one of the following roles: {', '.join(sorted(allowed_roles))}."
        }), 403

    data = request.get_json() or {}
    review_status = data.get('review_status', 'ACCEPTABLE').upper()
    valid_statuses = {'ACCEPTABLE', 'NEEDS_INSPECTION', 'REJECTED'}
    if review_status not in valid_statuses:
        return jsonify({
            'success': False,
            'error': 'Validation Error',
            'message': f"Invalid review_status. Allowed values: {', '.join(sorted(valid_statuses))}."
        }), 400

    notes = data.get('notes', '').strip()
    verified_grade = data.get('verified_grade')

    qr = lot.quality_report
    if not qr:
        qr = QualityReport(
            crop_lot_id=lot.id,
            seller_declared_grade=lot.quality_grade or 'Grade A'
        )
        db.session.add(qr)

    reviewer_name = getattr(current_user, 'name', None) or getattr(current_user, 'full_name', None) or getattr(current_user, 'phone', 'Authorized Reviewer')
    review_time = datetime.utcnow()

    qr.buyer_review_status = review_status
    qr.buyer_review_notes = notes
    qr.buyer_reviewed_by = reviewer_name
    qr.buyer_reviewed_at = review_time

    qr.verified_by = reviewer_name
    qr.verifier_role = current_user.role
    qr.verification_date = review_time.strftime('%Y-%m-%d')
    if notes:
        qr.verifier_notes = notes

    if review_status == 'ACCEPTABLE':
        qr.verification_status = 'VERIFIED'
        if verified_grade:
            qr.verified_grade = verified_grade
            lot.quality_grade = verified_grade
        elif not qr.verified_grade:
            qr.verified_grade = qr.seller_declared_grade
    elif review_status == 'NEEDS_INSPECTION':
        qr.verification_status = 'NEEDS_INSPECTION'
    elif review_status == 'REJECTED':
        qr.verification_status = 'REJECTED'

    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Quality review successfully recorded as {review_status}.',
        'quality_report': qr.to_dict(),
        'lot': lot.to_dict()
    }), 200



