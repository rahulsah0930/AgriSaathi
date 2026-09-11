from app import create_app
from models.user import User

app = create_app()
with app.app_context():
    tests = [
        ('9823012345', 'farmer123', 'FARMER'),
        ('9823012345', 'password123', 'FARMER'),
        ('9823054321', 'farmer123', 'FARMER'),
        ('9823099999', 'fpo123', 'FPO'),
        ('9823099999', 'password123', 'FPO'),
        ('9820011223', 'buyer123', 'BUYER'),
        ('9820011223', 'password123', 'BUYER'),
        ('9830022334', 'warehouse123', 'WAREHOUSE'),
        ('9830022334', 'password123', 'WAREHOUSE'),
        ('9810000001', 'admin123', 'ADMIN'),
        ('9810000001', 'password123', 'ADMIN'),
    ]
    all_ok = True
    for phone, pwd, role in tests:
        u = User.query.filter_by(phone=phone).first()
        valid = u.check_password(pwd) if u else False
        print(f"[{'PASS' if valid else 'FAIL'}] {role} ({phone}) with '{pwd}' -> {valid}")
        if not valid:
            all_ok = False

    print("ALL DEMO LOGINS PASS:", all_ok)
