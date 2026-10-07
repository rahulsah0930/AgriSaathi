import json
import re
import unicodedata
from rapidfuzz import fuzz
from models import db
from models.commodity import Commodity
from utils.commodity_data import COMMODITIES_CATALOG

def normalize_text(text):
    """
    Normalizes text for consistent search:
    - Lowercase
    - Unicode NFKD normalization
    - Strip punctuation (while preserving Devanagari script characters)
    - Collapse extra whitespace
    """
    if not text:
        return ""
    # Unicode NFKD normalization
    normalized = unicodedata.normalize('NFKD', str(text))
    # Convert to lowercase
    normalized = normalized.lower()
    # Replace punctuation and symbols with space, keep alphanumeric, Devanagari (\u0900-\u097F), and spaces
    cleaned = re.sub(r'[^\w\s\u0900-\u097F]', ' ', normalized)
    # Collapse multiple spaces
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned

def compute_match_score(query_raw, commodity):
    """
    Evaluates how closely a commodity matches the search query.
    Returns (score, match_type).
    Ranking priorities:
    1. Exact canonical name match (100)
    2. Exact English name match (100)
    3. Exact Hindi / Marathi translation match (98)
    4. Exact alias match (95)
    5. Prefix match (85-90)
    6. Substring / Token match (75-80)
    7. Fuzzy similarity >= 65 (score scaled 60-84)
    Returns score = 0 if similarity is below threshold.
    """
    q_norm = normalize_text(query_raw)
    if not q_norm:
        return 0, 'none'

    c_name_norm = normalize_text(commodity.canonical_name)
    eng_name_norm = normalize_text(commodity.english_name)
    hin_name_norm = normalize_text(commodity.hindi_name)
    mar_name_norm = normalize_text(commodity.marathi_name)

    aliases = commodity.get_aliases_list()
    norm_aliases = [normalize_text(a) for a in aliases if a]

    # 1. Exact Canonical / English Match
    if q_norm == c_name_norm or q_norm == eng_name_norm:
        return 100.0, 'exact_canonical'

    # 2. Exact Translated (Hindi / Marathi) Match
    if q_norm == hin_name_norm or q_norm == mar_name_norm:
        return 98.0, 'exact_translation'

    # 3. Exact Alias Match
    if q_norm in norm_aliases:
        return 95.0, 'exact_alias'

    # 4. Prefix Match
    if c_name_norm.startswith(q_norm) or eng_name_norm.startswith(q_norm):
        return 90.0, 'prefix_canonical'
    if hin_name_norm.startswith(q_norm) or mar_name_norm.startswith(q_norm):
        return 88.0, 'prefix_translation'
    if any(a.startswith(q_norm) for a in norm_aliases):
        return 86.0, 'prefix_alias'

    # 5. Token / Word Boundary Match
    tokens = set(c_name_norm.split() + eng_name_norm.split() + [a for item in norm_aliases for a in item.split()])
    if q_norm in tokens:
        return 80.0, 'token_exact'
    if any(tok.startswith(q_norm) for tok in tokens):
        return 78.0, 'token_prefix'

    # Substring in canonical or translation
    if q_norm in c_name_norm or q_norm in eng_name_norm or q_norm in hin_name_norm or q_norm in mar_name_norm:
        return 75.0, 'substring'

    # 6. Fuzzy Similarity using RapidFuzz
    # We compare against canonical, english, hindi, marathi, and all aliases
    candidates = [c_name_norm, eng_name_norm, hin_name_norm, mar_name_norm] + norm_aliases
    best_fuzzy = 0.0

    for cand in candidates:
        if not cand:
            continue
        # Ratio for character-level similarity
        r1 = fuzz.ratio(q_norm, cand)
        # Token sort ratio for word reordering
        r2 = fuzz.token_sort_ratio(q_norm, cand)
        cand_best = max(r1, r2)
        if cand_best > best_fuzzy:
            best_fuzzy = cand_best

    # Enforce strict relevance threshold: ignore scores under 65 to avoid irrelevant suggestions
    if best_fuzzy >= 65.0:
        # Scale 65..100 -> 60..84
        scaled_score = 60.0 + ((best_fuzzy - 65.0) / 35.0) * 24.0
        return scaled_score, 'fuzzy'

    return 0.0, 'none'

def search_commodities(query, category=None, limit=10):
    """
    Performs ranked search across all active commodities in the catalog.
    Supports English, Hindi, Marathi, Roman transliterations, and typos.
    Returns list of dicts with match_score.
    """
    query_str = (query or "").strip()

    # Base query
    db_query = Commodity.query.filter_by(is_active=True)
    if category and category.upper() != 'ALL':
        db_query = db_query.filter(Commodity.category.ilike(f"%{category}%"))

    commodities = db_query.all()

    if not query_str:
        # Return top commodities ordered alphabetically
        return [c.to_dict() for c in commodities[:limit]]

    scored_results = []
    for c in commodities:
        score, match_type = compute_match_score(query_str, c)
        if score > 0:
            scored_results.append((score, c))

    # Sort descending by score, then ascending by canonical name
    scored_results.sort(key=lambda item: (-item[0], item[1].canonical_name.lower()))

    # Slice to limit
    top_results = scored_results[:limit]
    return [c.to_dict(match_score=score) for score, c in top_results]

def get_commodity_by_id(commodity_id):
    """Fetches a single commodity by ID."""
    return db.session.get(Commodity, commodity_id)

def get_commodity_by_name(canonical_name):
    """Fetches a single commodity by its canonical name."""
    if not canonical_name:
        return None
    return Commodity.query.filter(Commodity.canonical_name.ilike(canonical_name.strip())).first()

def resolve_commodity_name(raw_name):
    """
    Given an arbitrary user input or crop alias (e.g. 'tamatar', 'pyaaj', 'tomatto'),
    resolves and returns the canonical commodity name (e.g. 'Tomato', 'Onion'),
    or returns None if no confident match was found.
    """
    if not raw_name or not str(raw_name).strip():
        return None

    results = search_commodities(str(raw_name), limit=1)
    if results and results[0].get('match_score', 0) >= 65.0:
        return results[0]['canonical_name']

    return None

def seed_commodities_if_needed():
    """
    Populates the commodities table with the master catalog if missing.
    Also synchronizes default_collection_window_hours and perishability_class with master catalog defaults.
    """
    count = Commodity.query.count()
    catalog_by_name = {item['canonical_name']: item for item in COMMODITIES_CATALOG}

    added = 0
    updated = 0

    for item in COMMODITIES_CATALOG:
        existing = Commodity.query.filter_by(canonical_name=item['canonical_name']).first()
        if not existing:
            aliases_json = json.dumps(item.get('aliases', []), ensure_ascii=False)
            trans_json = json.dumps(item.get('transliterations', []), ensure_ascii=False)
            keywords = f"{item['canonical_name']} {item['english_name']} {item['hindi_name']} {item['marathi_name']} {' '.join(item.get('aliases', []))}"
            
            c = Commodity(
                canonical_name=item['canonical_name'],
                category=item['category'],
                sub_category=item.get('sub_category'),
                english_name=item['english_name'],
                hindi_name=item['hindi_name'],
                marathi_name=item['marathi_name'],
                aliases=aliases_json,
                transliterations=trans_json,
                search_keywords=keywords.lower(),
                image_url=item.get('image_url'),
                image_source=item.get('image_source'),
                is_active=True,
                perishability_class=item.get('perishability_class', 'MEDIUM'),
                default_collection_window_hours=float(item.get('default_collection_window_hours', 24.0))
            )
            db.session.add(c)
            added += 1
        else:
            cat_p = item.get('perishability_class', 'MEDIUM')
            cat_w = float(item.get('default_collection_window_hours', 24.0))
            if existing.perishability_class != cat_p or existing.default_collection_window_hours != cat_w:
                existing.perishability_class = cat_p
                existing.default_collection_window_hours = cat_w
                updated += 1

    if added > 0 or updated > 0:
        db.session.commit()
        if added > 0:
            print(f"[AgriSaathi] Successfully seeded {added} Indian agricultural commodities.")
        if updated > 0:
            print(f"[AgriSaathi] Successfully synchronized defaults for {updated} agricultural commodities.")

    return Commodity.query.count()
