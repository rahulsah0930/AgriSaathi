"""
Automated Test Suite for Phase 2: Central Agricultural Commodity Catalog & Multilingual Search
"""
import sys
import os

# Ensure UTF-8 output on Windows terminal
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app
from models import db, Commodity, CropLot
from services.commodity_service import (
    search_commodities,
    resolve_commodity_name,
    get_commodity_by_id,
    get_commodity_by_name,
)

def run_tests():
    print("=" * 70)
    print("AGRISAATHI PHASE 2: AGRICULTURAL COMMODITY & MULTILINGUAL TEST SUITE")
    print("=" * 70)

    with app.app_context():
        total_tests = 0
        passed_tests = 0

        def check(description, condition, detail=""):
            nonlocal total_tests, passed_tests
            total_tests += 1
            if condition:
                passed_tests += 1
                print(f"  [PASS] {description} {detail}")
            else:
                print(f"  [FAIL] {description} - FAILED! {detail}")
                raise AssertionError(f"Test failed: {description}")

        # -------------------------------------------------------------
        # Section 1: Catalog Initialization & Counts
        # -------------------------------------------------------------
        print("\n--- 1. Commodity Catalog Verification ---")
        commodity_count = Commodity.query.count()
        check("Total seeded commodities >= 100", commodity_count >= 100, f"(Actual: {commodity_count})")
        
        categories = db.session.query(Commodity.category).distinct().all()
        cat_names = [c[0] for c in categories]
        check("Covers at least 8 agricultural categories", len(cat_names) >= 8, f"(Categories: {len(cat_names)})")
        check("Contains Vegetables category", 'Vegetables' in cat_names)
        check("Contains Fruits category", 'Fruits' in cat_names)
        check("Contains Cereals / Food Grains category", 'Cereals / Food Grains' in cat_names)
        check("Contains Pulses category", 'Pulses' in cat_names)
        check("Contains Oilseeds category", 'Oilseeds' in cat_names)
        check("Contains Spices category", 'Spices' in cat_names)
        check("Contains Commercial / Plantation Crops category", 'Commercial / Plantation Crops' in cat_names)

        # -------------------------------------------------------------
        # Section 2: Required Exact & Multilingual Search Tests
        # -------------------------------------------------------------
        print("\n--- 2. Required Test Queries from Specification ---")
        required_cases = [
            # Tomato group
            ("tomatto", "Tomato", "Typo 'tomatto'"),
            ("tamatar", "Tomato", "Roman Hindi 'tamatar'"),
            ("tamater", "Tomato", "Roman Hindi 'tamater'"),
            ("टमाटर", "Tomato", "Devanagari Hindi 'टमाटर'"),
            ("टोमॅटो", "Tomato", "Devanagari Marathi 'टोमॅटो'"),

            # Onion group
            ("onoin", "Onion", "Typo 'onoin'"),
            ("pyaz", "Onion", "Roman Hindi 'pyaz'"),
            ("pyaaz", "Onion", "Roman Hindi 'pyaaz'"),
            ("pyaaj", "Onion", "Roman Hindi 'pyaaj'"),
            ("प्याज", "Onion", "Devanagari Hindi 'प्याज'"),
            ("कांदा", "Onion", "Devanagari Marathi 'कांदा'"),

            # Brinjal / Eggplant group
            ("brinjal", "Brinjal", "Exact 'brinjal'"),
            ("brinjl", "Brinjal", "Typo 'brinjl'"),
            ("eggplant", "Brinjal", "Alias 'eggplant'"),
            ("baingan", "Brinjal", "Roman Hindi 'baingan'"),
            ("baigan", "Brinjal", "Roman Hindi 'baigan'"),
            ("बैंगन", "Brinjal", "Devanagari Hindi 'बैंगन'"),
            ("वांगी", "Brinjal", "Devanagari Marathi 'वांगी'"),

            # Potato group
            ("potato", "Potato", "Exact 'potato'"),
            ("potatto", "Potato", "Typo 'potatto'"),
            ("aloo", "Potato", "Roman Hindi 'aloo'"),
            ("alu", "Potato", "Roman Hindi 'alu'"),
            ("आलू", "Potato", "Devanagari Hindi 'आलू'"),
            ("बटाटा", "Potato", "Devanagari Marathi 'बटाटा'"),

            # Okra group
            ("okra", "Okra", "Exact 'okra'"),
            ("bhindi", "Okra", "Roman Hindi 'bhindi'"),
            ("bhndi", "Okra", "Typo 'bhndi'"),
            ("lady finger", "Okra", "Alias 'lady finger'"),
            ("भिंडी", "Okra", "Devanagari Hindi 'भिंडी'"),
            ("भेंडी", "Okra", "Devanagari Marathi 'भेंडी'"),
        ]

        for query, expected_canonical, label in required_cases:
            res = search_commodities(query, limit=5)
            check(f"{label} -> {expected_canonical}", len(res) > 0 and res[0]['canonical_name'] == expected_canonical,
                  f"Top result: {res[0]['canonical_name'] if res else 'None'}")

        # -------------------------------------------------------------
        # Section 3: Rejection of Completely Unrelated Queries
        # -------------------------------------------------------------
        print("\n--- 3. Unrelated Queries & False-Positive Prevention ---")
        unrelated_queries = [
            "xyz123nonsense",
            "qwertyuiopasdf",
            "completelyfakecropname999",
            "zzzzz",
            "!@#$%^&*",
        ]
        for uq in unrelated_queries:
            res = search_commodities(uq, limit=5)
            check(f"Unrelated query '{uq}' returns 0 confident matches", len(res) == 0, f"Found {len(res)} matches")

        # -------------------------------------------------------------
        # Section 4: Prefix, Partial & Ranking Tests
        # -------------------------------------------------------------
        print("\n--- 4. Prefix, Partial & Ranking Priority ---")
        # Exact canonical should rank #1
        tomato_res = search_commodities("Tomato", limit=5)
        check("Exact canonical 'Tomato' ranks #1", tomato_res[0]['canonical_name'] == 'Tomato' and tomato_res[0]['match_score'] == 100.0)

        # Prefix search
        pomeg_res = search_commodities("pomeg", limit=5)
        check("Prefix 'pomeg' matches Pomegranate", any(c['canonical_name'] == 'Pomegranate' for c in pomeg_res))

        wheat_prefix = search_commodities("whe", limit=5)
        check("Prefix 'whe' matches Wheat", any(c['canonical_name'] == 'Wheat' for c in wheat_prefix))

        # Empty query handling
        empty_res = search_commodities("", limit=10)
        check("Empty query returns general default list without error", len(empty_res) > 0)

        whitespace_res = search_commodities("   ", limit=10)
        check("Whitespace query returns general default list without error", len(whitespace_res) > 0)

        # -------------------------------------------------------------
        # Section 5: Inactive Commodity Filter
        # -------------------------------------------------------------
        print("\n--- 5. Inactive Commodity Filter ---")
        # Temporarily create/deactivate a test commodity
        test_inactive = Commodity(
            canonical_name="InactiveTestCommodity",
            category="Vegetables",
            english_name="InactiveTestCommodity",
            hindi_name="परीक्षण",
            marathi_name="चाचणी",
            is_active=False
        )
        db.session.add(test_inactive)
        db.session.commit()

        res_inactive = search_commodities("InactiveTestCommodity", limit=5)
        check("Inactive commodity is excluded from search results", not any(c['canonical_name'] == 'InactiveTestCommodity' for c in res_inactive))

        # Cleanup
        db.session.delete(test_inactive)
        db.session.commit()

        # -------------------------------------------------------------
        # Section 6: Resolver Service
        # -------------------------------------------------------------
        print("\n--- 6. Commodity Resolver Service ---")
        resolved_tomato = resolve_commodity_name("tamatar")
        check("resolve_commodity_name('tamatar') returns Tomato", resolved_tomato == "Tomato")

        resolved_onion = resolve_commodity_name("कांदा")
        check("resolve_commodity_name('कांदा') returns Onion", resolved_onion == "Onion")

        resolved_none = resolve_commodity_name("supercalifragilistic")
        check("resolve_commodity_name('supercalifragilistic') returns None", resolved_none is None)

        # -------------------------------------------------------------
        # Section 7: Perishability & Phase 3 Metadata Preparation
        # -------------------------------------------------------------
        print("\n--- 7. Perishability Metadata Verification ---")
        tomato_comm = get_commodity_by_name("Tomato")
        check("Tomato perishability_class is HIGH", tomato_comm.perishability_class == "HIGH")
        check("Tomato default_collection_window_hours is 12", tomato_comm.default_collection_window_hours == 12.0)

        wheat_comm = get_commodity_by_name("Wheat")
        check("Wheat perishability_class is LOW", wheat_comm.perishability_class == "LOW")
        check("Wheat default_collection_window_hours is 72", wheat_comm.default_collection_window_hours == 72.0)

        onion_comm = get_commodity_by_name("Onion")
        check("Onion perishability_class is MEDIUM", onion_comm.perishability_class == "MEDIUM")
        check("Onion default_collection_window_hours is 48", onion_comm.default_collection_window_hours == 48.0)

        # -------------------------------------------------------------
        # Section 8: Image Thumbnails Verification (Real Produce Photos)
        # -------------------------------------------------------------
        print("\n--- 8. Crop Thumbnails Verification (Real Produce Photos) ---")
        check("Tomato has real photograph image_url (.jpg)", bool(tomato_comm.image_url and "tomato.jpg" in tomato_comm.image_url))
        check("Tomato image source is verified produce photograph", "Verified" in str(tomato_comm.image_source))

        # Verify physical JPG and fallback placeholder existence
        uploads_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads', 'commodities')
        tomato_jpg_path = os.path.join(uploads_dir, 'tomato.jpg')
        onion_jpg_path = os.path.join(uploads_dir, 'onion.jpg')
        wheat_jpg_path = os.path.join(uploads_dir, 'wheat.jpg')
        placeholder_svg_path = os.path.join(uploads_dir, 'placeholder.svg')
        check("Physical tomato.jpg exists in uploads/commodities", os.path.exists(tomato_jpg_path) and os.path.getsize(tomato_jpg_path) > 5000)
        check("Physical onion.jpg exists in uploads/commodities", os.path.exists(onion_jpg_path) and os.path.getsize(onion_jpg_path) > 5000)
        check("Physical wheat.jpg exists in uploads/commodities", os.path.exists(wheat_jpg_path) and os.path.getsize(wheat_jpg_path) > 5000)
        check("Physical placeholder.svg exists in uploads/commodities", os.path.exists(placeholder_svg_path))

        # -------------------------------------------------------------
        # Section 9: HTTP REST Endpoints (Flask Test Client)
        # -------------------------------------------------------------
        print("\n--- 9. REST API Endpoint Integration ---")
        client = app.test_client()

        # GET /api/commodities/search
        resp = client.get('/api/commodities/search?q=tomatto')
        check("GET /api/commodities/search?q=tomatto status 200", resp.status_code == 200)
        data = resp.get_json()
        check("Search returns commodities list", 'commodities' in data and len(data['commodities']) > 0)
        check("Top result is Tomato", data['commodities'][0]['canonical_name'] == 'Tomato')

        # GET /api/commodities
        resp_list = client.get('/api/commodities?limit=5')
        check("GET /api/commodities status 200", resp_list.status_code == 200)
        data_list = resp_list.get_json()
        check("Returns paginated list of commodities", len(data_list.get('commodities', [])) == 5)

        # GET /api/commodities/categories
        resp_cat = client.get('/api/commodities/categories')
        check("GET /api/commodities/categories status 200", resp_cat.status_code == 200)
        data_cat = resp_cat.get_json()
        check("Categories list has >= 8 categories", len(data_cat.get('categories', [])) >= 8)

        # GET /api/commodities/resolve?q=tamatar
        resp_resolve = client.get('/api/commodities/resolve?q=tamatar')
        check("GET /api/commodities/resolve?q=tamatar status 200", resp_resolve.status_code == 200)
        data_res = resp_resolve.get_json()
        check("Resolve endpoint returns Tomato commodity", data_res.get('commodity', {}).get('canonical_name') == 'Tomato')

        # GET /api/commodities/<id>
        resp_id = client.get(f'/api/commodities/{tomato_comm.id}')
        check(f"GET /api/commodities/{tomato_comm.id} status 200", resp_id.status_code == 200)
        check("Returns Tomato details", resp_id.get_json().get('commodity', {}).get('canonical_name') == 'Tomato')

        # -------------------------------------------------------------
        # Section 10: Backward Compatibility with Existing CropLot
        # -------------------------------------------------------------
        print("\n--- 10. Backward Compatibility & Lot Model ---")
        # Verify CropLot has commodity_id column and to_dict() includes it
        sample_lot = CropLot.query.first()
        if sample_lot:
            lot_dict = sample_lot.to_dict()
            check("Existing lot has 'crop' string field preserved", 'crop' in lot_dict and bool(lot_dict['crop']))
            check("Existing lot to_dict includes 'commodity_id'", 'commodity_id' in lot_dict)
            check("Existing lot to_dict includes 'commodity' object or None", 'commodity' in lot_dict)

        print("\n" + "=" * 70)
        print(f"ALL TESTS COMPLETED: {passed_tests}/{total_tests} PASSED (100% SUCCESS)")
        print("=" * 70)

if __name__ == '__main__':
    run_tests()
