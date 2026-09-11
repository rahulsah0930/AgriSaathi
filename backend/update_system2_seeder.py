import os

seeder_path = r"c:\Users\mrswa\OneDrive\Desktop\AgriSaathi2\AgriSaathi\backend\services\demo_seeder.py"

with open(seeder_path, "r", encoding="utf-8") as f:
    orig = f.read()

# Check if FarmerProfile and FPOProfile are imported
if "FarmerProfile" not in orig:
    orig = orig.replace(
        "from models import (\n    db,\n    User,\n    BuyerProfile,",
        "from models import (\n    db,\n    User,\n    FarmerProfile,\n    FPOProfile,\n    BuyerProfile,"
    )

# Add Suresh Patil and Sahyadri FPO seeding block if not present
suresh_block = '''
        # Seed Suresh Patil (Primary Farmer Demo Account)
        suresh_user = User.query.filter_by(phone="9823012345").first()
        if not suresh_user:
            suresh_user = User(
                name="Suresh Patil",
                email="suresh.patil@agrisaathi.in",
                phone="9823012345",
                role="FARMER",
                verification_status="VERIFIED",
                verification_notes="Aadhaar and 7/12 Land record verified by Taluka Agriculture Officer.",
            )
            suresh_user.set_password("password123")
            db.session.add(suresh_user)
            db.session.flush()

            fp = FarmerProfile(
                user_id=suresh_user.id,
                full_name="Suresh Patil",
                aadhaar_masked="XXXX XXXX 8901",
                village="Dindori",
                taluka="Dindori",
                district="Nashik",
                state="Maharashtra",
                farm_size_acres=4.5,
                main_crops="Tomato, Onion, Grapes",
                bank_account_masked="XXXXXX4589",
                ifsc_code_masked="SBIN0001234"
            )
            db.session.add(fp)

        # Seed Sahyadri FPO (Primary FPO Demo Account)
        sahyadri_user = User.query.filter_by(phone="9823099999").first()
        if not sahyadri_user:
            sahyadri_user = User(
                name="Sahyadri Farmers Producer Co. Ltd.",
                email="contact@sahyadrifarmers.org",
                phone="9823099999",
                role="FPO",
                verification_status="VERIFIED",
                verification_notes="State FPO Federation Certificate & Executive Audit verified.",
            )
            sahyadri_user.set_password("password123")
            db.session.add(sahyadri_user)
            db.session.flush()

            fpop = FPOProfile(
                user_id=sahyadri_user.id,
                fpo_name="Sahyadri Farmers Producer Co. Ltd.",
                registration_number="FPO-MH-NSK-2022-0451",
                contact_person="Vilas Shinde",
                district="Nashik",
                state="Maharashtra",
                member_count=1250,
                primary_crops="Tomato, Grapes, Onion",
                bank_account_masked="XXXXXX8912",
                ifsc_code_masked="MAHB0001234"
            )
            db.session.add(fpop)
'''

if "suresh_user = User.query.filter_by(phone=\"9823012345\")" not in orig:
    # Insert right after `def seed_demo_users():\n    \"\"\"...\"\"\"\n    try:`
    marker = 'def seed_demo_users():\n    """Seeds realistic demo accounts and initial transactions for Buyer, Warehouse and Admin."""\n    try:'
    if marker in orig:
        orig = orig.replace(marker, marker + suresh_block)
    else:
        # fallback marker
        orig = orig.replace("try:\n", "try:" + suresh_block, 1)

with open(seeder_path, "w", encoding="utf-8") as f:
    f.write(orig)

print(f"[OK] Successfully updated {seeder_path}")
