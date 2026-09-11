"""
Crop Knowledge Base for Maharashtra Agriculture.
Contains empirical data regarding crop perishability, ambient farm shelf-life,
cold storage parameters, daily moisture/shrinkage loss rates, and benchmark storage tariffs.
"""

CROP_PROFILES = {
    'Tomato': {
        'category': 'VEGETABLE',
        'perishability': 'HIGH',
        'ambient_shelf_life_days': 5,
        'cold_storage_shelf_life_days': 21,
        'optimal_temp_celsius': '10-12°C',
        'optimal_humidity': '85-90%',
        'daily_ambient_shrinkage_rate': 0.008,    # 0.8% weight loss per day at ambient temp
        'daily_cold_shrinkage_rate': 0.002,       # 0.2% weight loss per day in cold storage
        'storage_cost_per_kg_per_day': 0.12,      # ₹0.12/kg/day (₹120/tonne/day)
        'handling_loading_per_kg': 0.20,          # ₹0.20/kg loading/unloading
        'risk_factors': [
            'Fruit softening and skin breakdown after 96 hours at ambient temperature.',
            'High moisture loss leading to weight discount at APMC mandi.'
        ]
    },
    'Onion': {
        'category': 'VEGETABLE',
        'perishability': 'MEDIUM',
        'ambient_shelf_life_days': 45,
        'cold_storage_shelf_life_days': 180,
        'optimal_temp_celsius': '0-2°C or Ventilated Chawl',
        'optimal_humidity': '65-70%',
        'daily_ambient_shrinkage_rate': 0.0025,   # 0.25% shrinkage/sprouting per day
        'daily_cold_shrinkage_rate': 0.0008,      # 0.08% shrinkage per day
        'storage_cost_per_kg_per_day': 0.06,      # ₹0.06/kg/day
        'handling_loading_per_kg': 0.15,
        'risk_factors': [
            'Sprouting and rotting accelerated if relative humidity exceeds 75%.',
            'Post-monsoon kharif crop has higher moisture content and shorter shelf-life.'
        ]
    },
    'Soybean': {
        'category': 'OILSEED',
        'perishability': 'LOW',
        'ambient_shelf_life_days': 240,
        'cold_storage_shelf_life_days': 365,
        'optimal_temp_celsius': 'Ambient Dry Warehouse',
        'optimal_humidity': '10-12% grain moisture',
        'daily_ambient_shrinkage_rate': 0.0002,
        'daily_cold_shrinkage_rate': 0.0001,
        'storage_cost_per_kg_per_day': 0.03,      # Standard dry warehouse
        'handling_loading_per_kg': 0.10,
        'risk_factors': [
            'Fungal infection and discoloration if grain moisture exceeds 13%.',
            'Rodent and pest infestation in unscientific storage.'
        ]
    },
    'Grapes': {
        'category': 'FRUIT',
        'perishability': 'VERY_HIGH',
        'ambient_shelf_life_days': 3,
        'cold_storage_shelf_life_days': 45,
        'optimal_temp_celsius': '0-1°C with SO2 pads',
        'optimal_humidity': '90-95%',
        'daily_ambient_shrinkage_rate': 0.015,
        'daily_cold_shrinkage_rate': 0.003,
        'storage_cost_per_kg_per_day': 0.25,      # Specialized CA cold store
        'handling_loading_per_kg': 0.35,
        'risk_factors': [
            'Berry shatter and stem browning within 48 hours without pre-cooling.',
            'Botrytis cinerea (gray mold) proliferation without sulfur dioxide treatment.'
        ]
    },
    'Pomegranate': {
        'category': 'FRUIT',
        'perishability': 'MEDIUM',
        'ambient_shelf_life_days': 14,
        'cold_storage_shelf_life_days': 90,
        'optimal_temp_celsius': '5-7°C',
        'optimal_humidity': '90-95%',
        'daily_ambient_shrinkage_rate': 0.003,
        'daily_cold_shrinkage_rate': 0.0009,
        'storage_cost_per_kg_per_day': 0.15,
        'handling_loading_per_kg': 0.25,
        'risk_factors': [
            'Husk scald and internal breakdown at temperatures below 5°C.',
            'Weight loss and aril desiccation in low humidity environments.'
        ]
    },
    'Wheat': {
        'category': 'GRAIN',
        'perishability': 'LOW',
        'ambient_shelf_life_days': 365,
        'cold_storage_shelf_life_days': 720,
        'optimal_temp_celsius': 'Ambient Aerated Silo / Warehouse',
        'optimal_humidity': '<12% moisture',
        'daily_ambient_shrinkage_rate': 0.0001,
        'daily_cold_shrinkage_rate': 0.00005,
        'storage_cost_per_kg_per_day': 0.025,
        'handling_loading_per_kg': 0.08,
        'risk_factors': [
            'Weevil and khapra beetle attack during humid monsoon months.',
            'Moisture absorption causing mustiness.'
        ]
    },
    'Banana': {
        'category': 'FRUIT',
        'perishability': 'HIGH',
        'ambient_shelf_life_days': 6,
        'cold_storage_shelf_life_days': 25,
        'optimal_temp_celsius': '13-14°C',
        'optimal_humidity': '85-90%',
        'daily_ambient_shrinkage_rate': 0.009,
        'daily_cold_shrinkage_rate': 0.0025,
        'storage_cost_per_kg_per_day': 0.10,
        'handling_loading_per_kg': 0.18,
        'risk_factors': [
            'Chilling injury if stored below 12°C causing skin turning dark/gray.',
            'Rapid ethylene-induced ripening at ambient summer temperatures.'
        ]
    }
}

def get_crop_profile(crop_name):
    """Retrieves standard agronomic storage and perishability parameters."""
    for key, profile in CROP_PROFILES.items():
        if key.lower() in crop_name.lower() or crop_name.lower() in key.lower():
            return {**profile, 'crop': key}
    
    # Sensible default for other produce
    return {
        'crop': crop_name,
        'category': 'GENERAL_PRODUCE',
        'perishability': 'MEDIUM',
        'ambient_shelf_life_days': 10,
        'cold_storage_shelf_life_days': 60,
        'optimal_temp_celsius': '8-12°C',
        'optimal_humidity': '80-85%',
        'daily_ambient_shrinkage_rate': 0.004,
        'daily_cold_shrinkage_rate': 0.001,
        'storage_cost_per_kg_per_day': 0.08,
        'handling_loading_per_kg': 0.15,
        'risk_factors': ['Standard quality degradation over storage duration.']
    }
