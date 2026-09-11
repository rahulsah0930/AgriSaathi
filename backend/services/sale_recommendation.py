from datetime import date, timedelta
from services.crop_knowledge import get_crop_profile
from services.price_prediction import predict_crop_price
from models.market import MarketPrice

def calculate_net_sale_recommendation(
    crop='Tomato',
    variety='Standard',
    quantity=1000,
    unit='kg',
    district='Nashik',
    market_name='Pimpalgaon APMC',
    harvest_date=None,
    current_storage_status='NOT_STORED'
):
    """
    Computes Net Return Sale Recommendation by comparing:
    1. Immediate Sale (Spot Mandi Price)
    2. Short-term Hold (Optimal Harvest Window: 3-5 days)
    3. Medium/Long-term Storage (Cold Storage / Warehouse: 15-30 days)

    Accounts for:
    - Price appreciation/depreciation forecast
    - Moisture shrinkage / weight decay
    - Daily storage rental rates
    - Two-way handling and loading expenses
    """
    # Normalize quantity into kg for calculation
    qty_kg = float(quantity)
    if unit.lower() in ['quintal', 'qtl']:
        qty_kg = qty_kg * 100
    elif unit.lower() in ['tonne', 'ton', 't']:
        qty_kg = qty_kg * 1000

    profile = get_crop_profile(crop)
    today = date.today()

    # 1. Fetch current spot rate
    spot_query = MarketPrice.query.filter(
        MarketPrice.crop.ilike(f'%{crop}%')
    ).order_by(MarketPrice.price_date.desc()).first()

    spot_price = spot_query.average_price if spot_query else 22.5

    # 2. Get ML forecasts for 3-day, 7-day, and 14-day horizons
    pred_3d = predict_crop_price(crop=crop, market_name=market_name, district=district, horizon_days=3)
    pred_7d = predict_crop_price(crop=crop, market_name=market_name, district=district, horizon_days=7)
    pred_14d = predict_crop_price(crop=crop, market_name=market_name, district=district, horizon_days=14)

    # -------------------------------------------------------------
    # STRATEGY 1: Sell Immediately (Day 0)
    # -------------------------------------------------------------
    strat1_price = round(spot_price, 2)
    strat1_gross = round(strat1_price * qty_kg, 2)
    strat1_handling = round(0.10 * qty_kg, 2) # Mandi basic handling fee
    strat1_storage_fee = 0.0
    strat1_shrinkage_loss = 0.0
    strat1_net = round(strat1_gross - strat1_handling, 2)

    strategy_immediate = {
        'id': 'IMMEDIATE_SALE',
        'title': 'Sell Today (Spot Market)',
        'timing': 'Immediate (0-24 Hours)',
        'target_date': today.strftime('%d %b %Y'),
        'price_per_kg': strat1_price,
        'gross_revenue': strat1_gross,
        'storage_cost': 0.0,
        'handling_freight': strat1_handling,
        'shrinkage_weight_loss_kg': 0.0,
        'shrinkage_cost': 0.0,
        'net_return': strat1_net,
        'net_per_kg': round(strat1_net / qty_kg, 2),
        'net_delta_vs_today': 0.0,
        'risk': 'LOW',
        'pros': ['Instant liquidity and cash flow', 'Zero storage rent', 'No spoilage risk'],
        'cons': ['Subject to today\'s spot market discount', 'Misses near-term price surges']
    }

    # -------------------------------------------------------------
    # STRATEGY 2: Short-Term Hold (Day 3-5 Optimal Window)
    # -------------------------------------------------------------
    hold_days = 3 if profile['perishability'] in ['HIGH', 'VERY_HIGH'] else 5
    strat2_price = round(pred_3d['predicted_price'] if hold_days == 3 else pred_7d['predicted_price'], 2)
    
    # Ambient shrinkage weight loss
    strat2_shrinkage_pct = min(profile['daily_ambient_shrinkage_rate'] * hold_days, 0.08)
    strat2_salable_qty = round(qty_kg * (1 - strat2_shrinkage_pct), 2)
    strat2_gross = round(strat2_price * strat2_salable_qty, 2)
    strat2_shrinkage_cost = round((qty_kg - strat2_salable_qty) * strat2_price, 2)
    strat2_handling = round(0.15 * qty_kg, 2)
    strat2_net = round(strat2_gross - strat2_handling, 2)

    strategy_short_hold = {
        'id': 'SHORT_HOLD',
        'title': f'Sell Soon ({hold_days}-Day Window)',
        'timing': f'Within {hold_days} Days',
        'target_date': (today + timedelta(days=hold_days)).strftime('%d %b %Y'),
        'price_per_kg': strat2_price,
        'gross_revenue': strat2_gross,
        'storage_cost': 0.0,
        'handling_freight': strat2_handling,
        'shrinkage_weight_loss_kg': round(qty_kg - strat2_salable_qty, 1),
        'shrinkage_cost': strat2_shrinkage_cost,
        'net_return': strat2_net,
        'net_per_kg': round(strat2_net / qty_kg, 2),
        'net_delta_vs_today': round(strat2_net - strat1_net, 2),
        'risk': 'LOW' if profile['perishability'] == 'LOW' else 'MEDIUM',
        'pros': ['Captures short-term price rebounds', 'Avoids formal warehouse storage fees'],
        'cons': [f'Ambient weight loss of {round(strat2_shrinkage_pct * 100, 1)}%', 'Perishable crops must be sheltered from direct heat']
    }

    # -------------------------------------------------------------
    # STRATEGY 3: Cold Storage / Warehouse Preservation (Day 15-30)
    # -------------------------------------------------------------
    # Can this crop be practically cold stored?
    can_store = profile['cold_storage_shelf_life_days'] >= 15
    store_days = min(profile['cold_storage_shelf_life_days'] // 2, 21)
    
    # Estimated price appreciation at 14+ days
    strat3_price = round(pred_14d['predicted_price'] * (1.05 if store_days > 14 else 1.0), 2)
    strat3_shrinkage_pct = round(profile['daily_cold_shrinkage_rate'] * store_days, 3)
    strat3_salable_qty = round(qty_kg * (1 - strat3_shrinkage_pct), 2)
    strat3_gross = round(strat3_price * strat3_salable_qty, 2)
    
    strat3_storage_fee = round(profile['storage_cost_per_kg_per_day'] * qty_kg * store_days, 2)
    strat3_handling = round(profile['handling_loading_per_kg'] * qty_kg, 2)
    strat3_shrinkage_cost = round((qty_kg - strat3_salable_qty) * strat3_price, 2)
    strat3_net = round(strat3_gross - strat3_storage_fee - strat3_handling, 2)

    strategy_store = {
        'id': 'COLD_STORAGE',
        'title': f'Store in Cold Warehouse ({store_days} Days)',
        'timing': f'{store_days} Days Holding',
        'target_date': (today + timedelta(days=store_days)).strftime('%d %b %Y'),
        'is_feasible': can_store,
        'price_per_kg': strat3_price,
        'gross_revenue': strat3_gross,
        'storage_cost': strat3_storage_fee,
        'handling_freight': strat3_handling,
        'shrinkage_weight_loss_kg': round(qty_kg - strat3_salable_qty, 1),
        'shrinkage_cost': strat3_shrinkage_cost,
        'net_return': strat3_net,
        'net_per_kg': round(strat3_net / qty_kg, 2),
        'net_delta_vs_today': round(strat3_net - strat1_net, 2),
        'risk': 'MEDIUM' if can_store else 'HIGH',
        'pros': ['Maximum price arbitrage window', 'Protects against mandi market crashes', 'Enables off-season premium rates'],
        'cons': [f'Accrues ₹{strat3_storage_fee} storage rent', f'Loading/in-out fee of ₹{strat3_handling}']
    }

    # -------------------------------------------------------------
    # DECISION ENGINE: Select the highest Net Return Strategy
    # -------------------------------------------------------------
    strategies = [strategy_immediate, strategy_short_hold]
    if can_store:
        strategies.append(strategy_store)

    # Sort by net return descending
    best_strategy = max(strategies, key=lambda s: s['net_return'])
    
    # Formulate top verdict
    if best_strategy['id'] == 'COLD_STORAGE' and strategy_store['net_delta_vs_today'] > 500:
        verdict = 'STORE & SELL LATER'
        verdict_badge = 'COLD STORAGE HIGHLY BENEFICIAL'
        verdict_color = 'success'
        summary_reason = (
            f"Preserving in cold storage for {store_days} days yields ₹{strategy_store['net_delta_vs_today']:,.0f} "
            f"extra net profit over selling today, comfortably absorbing the ₹{strat3_storage_fee:,.0f} storage rental cost."
        )
        recommended_window = f"{today + timedelta(days=store_days - 5)} to {today + timedelta(days=store_days + 5)}"
    elif best_strategy['id'] == 'SHORT_HOLD' and strategy_short_hold['net_delta_vs_today'] > 200:
        verdict = 'SELL SOON'
        verdict_badge = 'OPTIMAL HARVEST WINDOW'
        verdict_color = 'info'
        summary_reason = (
            f"Holding for {hold_days} days captures an expected price rise to ₹{strat2_price}/kg, "
            f"earning an extra ₹{strategy_short_hold['net_delta_vs_today']:,.0f} net profit before quality degrades."
        )
        recommended_window = f"Within {hold_days} Days"
    else:
        verdict = 'SELL NOW'
        verdict_badge = 'IMMEDIATE CASH FLOW'
        verdict_color = 'warning'
        summary_reason = (
            f"Spot price of ₹{spot_price}/kg is stable. Given perishability risk and storage fees, "
            "selling immediately maximizes take-home return and minimizes risk."
        )
        recommended_window = "Next 24 to 48 Hours"

    return {
        'crop': crop,
        'variety': variety,
        'quantity': quantity,
        'quantity_kg': qty_kg,
        'unit': unit,
        'district': district,
        'market_name': market_name,
        'current_spot_price': spot_price,
        'verdict': verdict,
        'verdict_badge': verdict_badge,
        'verdict_color': verdict_color,
        'summary_reason': summary_reason,
        'recommended_window': recommended_window,
        'best_strategy_id': best_strategy['id'],
        'net_gain_vs_today': round(best_strategy['net_delta_vs_today'], 2),
        'strategies': [strategy_immediate, strategy_short_hold, strategy_store],
        'crop_perishability': {
            'perishability_class': profile['perishability'],
            'ambient_shelf_life': f"{profile['ambient_shelf_life_days']} Days",
            'cold_shelf_life': f"{profile['cold_storage_shelf_life_days']} Days",
            'optimal_temperature': profile['optimal_temp_celsius'],
            'daily_ambient_weight_loss': f"{profile['daily_ambient_shrinkage_rate'] * 100}%/day",
            'daily_cold_weight_loss': f"{profile['daily_cold_shrinkage_rate'] * 100}%/day",
            'benchmark_storage_rent': f"₹{profile['storage_cost_per_kg_per_day']}/kg/day"
        },
        'risk_mitigation_notes': profile['risk_factors']
    }
