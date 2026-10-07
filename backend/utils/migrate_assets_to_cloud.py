import os
import sys
import argparse

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import Config
from models import db, Commodity, CropLot, TransportOrder
from app import create_app

def migrate_assets(include_user_uploads=False, update_db=False):
    """
    Explicit one-time utility to migrate local disk assets to configured cloud storage.
    Does NOT run on application startup.
    """
    print("=" * 65)
    print("  AGRISAATHI CLOUD ASSET MIGRATION UTILITY")
    print("=" * 65)

    if not (Config.CLOUDINARY_CLOUD_NAME and Config.CLOUDINARY_API_KEY and Config.CLOUDINARY_API_SECRET):
        print("[ABORT] Cloudinary credentials are not configured in environment.")
        print("Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET first.")
        return False

    try:
        import cloudinary
        import cloudinary.uploader
        cloudinary.config(
            cloud_name=Config.CLOUDINARY_CLOUD_NAME,
            api_key=Config.CLOUDINARY_API_KEY,
            api_secret=Config.CLOUDINARY_API_SECRET,
            secure=True
        )
    except ImportError:
        print("[ERROR] 'cloudinary' package is not installed. Run 'pip install cloudinary'.")
        return False

    app = create_app()
    with app.app_context():
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        
        # 1. Commodity Photos Migration
        commodities_dir = os.path.join(backend_dir, 'uploads', 'commodities')
        if os.path.exists(commodities_dir):
            files = [f for f in os.listdir(commodities_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))]
            print(f"[*] Found {len(files)} local commodity photographs in uploads/commodities/")
            
            uploaded_count = 0
            for fname in files:
                fpath = os.path.join(commodities_dir, fname)
                base_name = os.path.splitext(fname)[0]
                public_id = f"agrisaathi/commodities/{base_name}"
                
                try:
                    res = cloudinary.uploader.upload(
                        fpath,
                        folder='agrisaathi/commodities',
                        public_id=base_name,
                        overwrite=True,
                        resource_type='image'
                    )
                    cloud_url = res.get('secure_url')
                    uploaded_count += 1
                    print(f"  [+] Uploaded {fname} -> {cloud_url}")

                    if update_db:
                        # Find matching commodity
                        comm = Commodity.query.filter(
                            (Commodity.image_url.like(f"%{fname}%")) | (Commodity.slug == base_name)
                        ).first()
                        if comm:
                            comm.image_url = cloud_url
                            db.session.commit()
                except Exception as e:
                    print(f"  [-] Failed to upload {fname}: {e}")

            print(f"[OK] Migrated {uploaded_count}/{len(files)} commodity assets.")

        # 2. User Uploads Migration (Optional)
        if include_user_uploads:
            # Crop lots
            crops_dir = os.path.join(backend_dir, 'uploads', 'crop_lots')
            if os.path.exists(crops_dir):
                crop_files = [f for f in os.listdir(crops_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))]
                print(f"[*] Found {len(crop_files)} user crop images in uploads/crop_lots/")
                for cf in crop_files:
                    fpath = os.path.join(crops_dir, cf)
                    try:
                        res = cloudinary.uploader.upload(
                            fpath,
                            folder='agrisaathi/lots',
                            public_id=os.path.splitext(cf)[0],
                            resource_type='image'
                        )
                        cloud_url = res.get('secure_url')
                        print(f"  [+] Uploaded user lot image {cf} -> {cloud_url}")
                        if update_db:
                            lots = CropLot.query.filter(CropLot.image_url.like(f"%{cf}%")).all()
                            for l in lots:
                                l.image_url = cloud_url
                            db.session.commit()
                    except Exception as e:
                        print(f"  [-] Failed {cf}: {e}")

            # POD images
            pod_dir = os.path.join(backend_dir, 'uploads', 'pod')
            if os.path.exists(pod_dir):
                pod_files = [f for f in os.listdir(pod_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))]
                print(f"[*] Found {len(pod_files)} POD images in uploads/pod/")
                for pf in pod_files:
                    fpath = os.path.join(pod_dir, pf)
                    try:
                        res = cloudinary.uploader.upload(
                            fpath,
                            folder='agrisaathi/pod',
                            public_id=os.path.splitext(pf)[0],
                            resource_type='image'
                        )
                        cloud_url = res.get('secure_url')
                        print(f"  [+] Uploaded POD image {pf} -> {cloud_url}")
                        if update_db:
                            orders = TransportOrder.query.filter(TransportOrder.pod_image_url.like(f"%{pf}%")).all()
                            for o in orders:
                                o.pod_image_url = cloud_url
                            db.session.commit()
                    except Exception as e:
                        print(f"  [-] Failed {pf}: {e}")

    print("\n[COMPLETE] Cloud asset migration finished.")
    return True


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Migrate local AgriSaathi assets to cloud storage.")
    parser.add_argument('--include-user-uploads', action='store_true', help="Also migrate user crop lot and POD uploads")
    parser.add_argument('--update-db', action='store_true', help="Update database records to cloud URLs")
    args = parser.parse_args()

    migrate_assets(include_user_uploads=args.include_user_uploads, update_db=args.update_db)
