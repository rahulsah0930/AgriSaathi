models_init_content = '''from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

from .user import User, FarmerProfile, FPOProfile, BuyerProfile
from .warehouse import Warehouse, StorageBooking
from .requirement import BuyerRequirement
from .offer import Offer
from .order import Order
from .payment import Payment
from .grievance import Complaint
from .notification import Notification

__all__ = [
    "db",
    "User",
    "FarmerProfile",
    "FPOProfile",
    "BuyerProfile",
    "Warehouse",
    "StorageBooking",
    "BuyerRequirement",
    "Offer",
    "Order",
    "Payment",
    "Complaint",
    "Notification",
]
'''

init_target_path = r"c:\Users\mrswa\OneDrive\Desktop\AgriSaathi2\AgriSaathi\backend\models\__init__.py"
with open(init_target_path, "w", encoding="utf-8") as f:
    f.write(models_init_content)
print(f"[OK] Successfully updated {init_target_path}")
