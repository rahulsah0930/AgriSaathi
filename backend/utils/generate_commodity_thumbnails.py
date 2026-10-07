"""
Generates clean, lightweight, botanical SVG icons for agricultural commodities.
These are locally served under /uploads/commodities/<slug>.svg to ensure
fast, 100% reliable, zero-latency thumbnail rendering across all network environments.
"""
import os
import sys
import re

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

SVG_TEMPLATES = {
    'Tomato': '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <radialGradient id="tomGrad" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#ff4d4d"/>
      <stop offset="70%" stop-color="#dc2626"/>
      <stop offset="100%" stop-color="#991b1b"/>
    </radialGradient>
  </defs>
  <rect width="100" height="100" rx="16" fill="#fef2f2"/>
  <circle cx="50" cy="56" r="34" fill="url(#tomGrad)"/>
  <ellipse cx="40" cy="46" rx="8" ry="12" fill="#ff7878" opacity="0.4" transform="rotate(-25 40 46)"/>
  <path d="M50 25 C50 18 56 14 62 12" stroke="#15803d" stroke-width="4" stroke-linecap="round" fill="none"/>
  <polygon points="50,26 42,22 47,30 36,32 46,36 43,44 50,38 57,44 54,36 64,32 53,30 58,22" fill="#16a34a"/>
</svg>''',

    'Onion': '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <radialGradient id="onGrad" cx="40%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#e879f9"/>
      <stop offset="60%" stop-color="#a21caf"/>
      <stop offset="100%" stop-color="#701a75"/>
    </radialGradient>
  </defs>
  <rect width="100" height="100" rx="16" fill="#fdf4ff"/>
  <path d="M50 20 C68 20 82 38 82 58 C82 74 68 84 50 84 C32 84 18 74 18 58 C18 38 32 20 50 20 Z" fill="url(#onGrad)"/>
  <!-- Root tuft -->
  <path d="M46 84 L44 92 M50 84 L50 94 M54 84 L56 92" stroke="#ca8a04" stroke-width="2" stroke-linecap="round"/>
  <!-- Neck stem -->
  <path d="M50 20 C48 14 52 10 50 6" stroke="#65a30d" stroke-width="4" stroke-linecap="round" fill="none"/>
  <!-- Papery peel lines -->
  <path d="M30 40 Q50 30 70 40" stroke="#f0abfc" stroke-width="1.5" fill="none" opacity="0.6"/>
  <path d="M24 58 Q50 50 76 58" stroke="#f0abfc" stroke-width="1.5" fill="none" opacity="0.6"/>
  <path d="M32 72 Q50 68 68 72" stroke="#f0abfc" stroke-width="1.5" fill="none" opacity="0.6"/>
</svg>''',

    'Potato': '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <radialGradient id="potGrad" cx="40%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="50%" stop-color="#d97706"/>
      <stop offset="100%" stop-color="#92400e"/>
    </radialGradient>
  </defs>
  <rect width="100" height="100" rx="16" fill="#fefce8"/>
  <path d="M22 52 C18 36 34 22 56 24 C74 26 84 40 82 58 C80 74 64 82 44 80 C26 78 24 64 22 52 Z" fill="url(#potGrad)"/>
  <!-- Potato eyes -->
  <ellipse cx="38" cy="38" rx="3" ry="1.5" fill="#78350f" opacity="0.7"/>
  <ellipse cx="62" cy="44" rx="3.5" ry="2" fill="#78350f" opacity="0.7"/>
  <ellipse cx="48" cy="62" rx="4" ry="2" fill="#78350f" opacity="0.7"/>
  <ellipse cx="32" cy="56" rx="2.5" ry="1.5" fill="#78350f" opacity="0.7"/>
  <ellipse cx="68" cy="64" rx="3" ry="1.5" fill="#78350f" opacity="0.7"/>
</svg>''',

    'Brinjal': '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <radialGradient id="brinGrad" cx="35%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#7c3aed"/>
      <stop offset="60%" stop-color="#4c1d95"/>
      <stop offset="100%" stop-color="#2e1065"/>
    </radialGradient>
  </defs>
  <rect width="100" height="100" rx="16" fill="#faf5ff"/>
  <path d="M50 30 C60 30 74 44 76 62 C78 78 66 86 50 86 C34 86 22 78 24 62 C26 44 40 30 50 30 Z" fill="url(#brinGrad)"/>
  <!-- Highlight -->
  <ellipse cx="40" cy="54" rx="6" ry="16" fill="#a78bfa" opacity="0.4" transform="rotate(-15 40 54)"/>
  <!-- Calyx -->
  <path d="M50 30 L40 34 L46 22 L50 28 L54 22 L60 34 Z" fill="#15803d"/>
  <path d="M50 24 C50 16 54 12 52 8" stroke="#15803d" stroke-width="4" stroke-linecap="round" fill="none"/>
</svg>''',

    'Okra': '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="okraGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#84cc16"/>
      <stop offset="100%" stop-color="#3f6212"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="16" fill="#f7fee7"/>
  <!-- Pod body -->
  <path d="M50 18 Q56 46 64 78 Q52 74 50 86 Q46 68 38 46 Q44 26 50 18 Z" fill="url(#okraGrad)"/>
  <!-- Cap & stem -->
  <polygon points="42,20 58,20 55,14 45,14" fill="#365314"/>
  <path d="M50 14 L50 8" stroke="#365314" stroke-width="3" stroke-linecap="round"/>
  <!-- Ridges -->
  <path d="M50 18 Q54 52 50 86" stroke="#4d7c0f" stroke-width="1.5" fill="none"/>
  <path d="M46 22 Q42 50 38 72" stroke="#a3e635" stroke-width="1.2" fill="none" opacity="0.6"/>
</svg>''',

    'Wheat': '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="wheatGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="60%" stop-color="#eab308"/>
      <stop offset="100%" stop-color="#ca8a04"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="16" fill="#fefce8"/>
  <path d="M50 88 L50 20" stroke="#ca8a04" stroke-width="3" stroke-linecap="round"/>
  <!-- Grains -->
  <ellipse cx="44" cy="30" rx="6" ry="10" fill="url(#wheatGrad)" transform="rotate(-30 44 30)"/>
  <ellipse cx="56" cy="30" rx="6" ry="10" fill="url(#wheatGrad)" transform="rotate(30 56 30)"/>
  <ellipse cx="43" cy="44" rx="6" ry="10" fill="url(#wheatGrad)" transform="rotate(-30 43 44)"/>
  <ellipse cx="57" cy="44" rx="6" ry="10" fill="url(#wheatGrad)" transform="rotate(30 57 44)"/>
  <ellipse cx="44" cy="58" rx="6" ry="10" fill="url(#wheatGrad)" transform="rotate(-30 44 58)"/>
  <ellipse cx="56" cy="58" rx="6" ry="10" fill="url(#wheatGrad)" transform="rotate(30 56 58)"/>
  <ellipse cx="50" cy="20" rx="5" ry="8" fill="url(#wheatGrad)"/>
  <!-- Awns / whiskers -->
  <path d="M40 24 L28 14 M60 24 L72 14 M50 14 L50 4" stroke="#a16207" stroke-width="1.5" stroke-linecap="round"/>
</svg>''',

    'Rice': '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="riceGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fef9c3"/>
      <stop offset="100%" stop-color="#facc15"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="16" fill="#fefce8"/>
  <!-- Stem -->
  <path d="M30 88 C40 60 55 40 76 24" stroke="#ca8a04" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- Drooping Grains -->
  <ellipse cx="50" cy="44" rx="4" ry="7" fill="url(#riceGrad)" transform="rotate(45 50 44)"/>
  <ellipse cx="58" cy="38" rx="4" ry="7" fill="url(#riceGrad)" transform="rotate(50 58 38)"/>
  <ellipse cx="66" cy="32" rx="4" ry="7" fill="url(#riceGrad)" transform="rotate(55 66 32)"/>
  <ellipse cx="74" cy="28" rx="4" ry="7" fill="url(#riceGrad)" transform="rotate(60 74 28)"/>
  <ellipse cx="44" cy="54" rx="4" ry="7" fill="url(#riceGrad)" transform="rotate(40 44 54)"/>
  <ellipse cx="54" cy="50" rx="4" ry="7" fill="url(#riceGrad)" transform="rotate(45 54 50)"/>
</svg>''',

    'Soybean': '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <radialGradient id="soyGrad" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="70%" stop-color="#eab308"/>
      <stop offset="100%" stop-color="#854d0e"/>
    </radialGradient>
  </defs>
  <rect width="100" height="100" rx="16" fill="#fefce8"/>
  <!-- Pod -->
  <path d="M22 62 C34 40 60 36 78 50 C66 68 40 72 22 62 Z" fill="#65a30d" opacity="0.85"/>
  <!-- Soybean seeds -->
  <ellipse cx="38" cy="54" rx="9" ry="11" fill="url(#soyGrad)" transform="rotate(15 38 54)"/>
  <ellipse cx="58" cy="50" rx="9" ry="11" fill="url(#soyGrad)" transform="rotate(-10 58 50)"/>
  <!-- Hilum spot -->
  <ellipse cx="38" cy="54" rx="2" ry="1" fill="#713f12"/>
  <ellipse cx="58" cy="50" rx="2" ry="1" fill="#713f12"/>
</svg>''',

    'Grapes': '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <radialGradient id="grapeGrad" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#c084fc"/>
      <stop offset="60%" stop-color="#7e22ce"/>
      <stop offset="100%" stop-color="#3b0764"/>
    </radialGradient>
  </defs>
  <rect width="100" height="100" rx="16" fill="#faf5ff"/>
  <!-- Bunch of grapes -->
  <circle cx="42" cy="40" r="10" fill="url(#grapeGrad)"/>
  <circle cx="58" cy="40" r="10" fill="url(#grapeGrad)"/>
  <circle cx="34" cy="54" r="10" fill="url(#grapeGrad)"/>
  <circle cx="50" cy="54" r="10" fill="url(#grapeGrad)"/>
  <circle cx="66" cy="54" r="10" fill="url(#grapeGrad)"/>
  <circle cx="42" cy="68" r="9" fill="url(#grapeGrad)"/>
  <circle cx="58" cy="68" r="9" fill="url(#grapeGrad)"/>
  <circle cx="50" cy="80" r="8" fill="url(#grapeGrad)"/>
  <!-- Vine stem & leaf -->
  <path d="M50 32 L50 16 Q58 14 62 8" stroke="#65a30d" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M46 26 C36 20 32 30 40 32 Z" fill="#4d7c0f"/>
</svg>''',

    'Banana': '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="banGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="70%" stop-color="#eab308"/>
      <stop offset="100%" stop-color="#ca8a04"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="16" fill="#fefce8"/>
  <path d="M22 28 C26 48 44 76 74 76 C72 68 56 50 38 24 Z" fill="url(#banGrad)"/>
  <!-- Green tip and stem -->
  <path d="M38 24 L36 16 C34 16 32 18 32 20 Z" fill="#65a30d"/>
  <circle cx="74" cy="76" r="3" fill="#713f12"/>
</svg>''',

    'Pomegranate': '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <radialGradient id="pomGrad" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#f87171"/>
      <stop offset="60%" stop-color="#dc2626"/>
      <stop offset="100%" stop-color="#881337"/>
    </radialGradient>
  </defs>
  <rect width="100" height="100" rx="16" fill="#fff1f2"/>
  <circle cx="50" cy="56" r="32" fill="url(#pomGrad)"/>
  <!-- Crown calyx -->
  <polygon points="50,24 44,14 47,24 53,24 56,14" fill="#9f1239"/>
  <!-- Ruby Aril seeds hint -->
  <circle cx="42" cy="50" r="4" fill="#ffe4e6" opacity="0.6"/>
  <circle cx="56" cy="56" r="5" fill="#ffe4e6" opacity="0.4"/>
</svg>''',

    'Mango': '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <radialGradient id="manGrad" cx="40%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#fde047"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#ea580c"/>
    </radialGradient>
  </defs>
  <rect width="100" height="100" rx="16" fill="#fffbeb"/>
  <path d="M48 24 C68 24 82 42 78 64 C74 82 52 86 42 78 C32 68 24 44 48 24 Z" fill="url(#manGrad)"/>
  <!-- Stem & Leaf -->
  <path d="M48 24 C48 16 52 12 50 8" stroke="#78350f" stroke-width="3" stroke-linecap="round"/>
  <path d="M50 18 C60 14 64 22 54 24 Z" fill="#15803d"/>
</svg>''',

    'Cotton': '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <radialGradient id="cotGrad" cx="40%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="80%" stop-color="#f1f5f9"/>
      <stop offset="100%" stop-color="#cbd5e1"/>
    </radialGradient>
  </defs>
  <rect width="100" height="100" rx="16" fill="#f8fafc"/>
  <!-- Calyx -->
  <path d="M50 78 L34 68 L42 60 L50 68 L58 60 L66 68 Z" fill="#78350f"/>
  <!-- Fluffy Boll -->
  <circle cx="38" cy="46" r="16" fill="url(#cotGrad)"/>
  <circle cx="62" cy="46" r="16" fill="url(#cotGrad)"/>
  <circle cx="50" cy="34" r="16" fill="url(#cotGrad)"/>
  <circle cx="50" cy="54" r="17" fill="url(#cotGrad)"/>
</svg>''',

    'Turmeric': '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <radialGradient id="turmGrad" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#fde047"/>
      <stop offset="60%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </radialGradient>
  </defs>
  <rect width="100" height="100" rx="16" fill="#fffbeb"/>
  <!-- Knobby Rhizome -->
  <path d="M26 62 Q34 38 52 42 Q68 34 76 52 Q64 74 42 70 Q28 74 26 62 Z" fill="url(#turmGrad)"/>
  <ellipse cx="64" cy="42" rx="10" ry="8" fill="url(#turmGrad)"/>
  <!-- Cut slice showing orange core -->
  <ellipse cx="32" cy="62" rx="9" ry="7" fill="#ea580c"/>
  <ellipse cx="32" cy="62" rx="6" ry="4.5" fill="#f97316"/>
</svg>''',

    'Garlic': '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <radialGradient id="garGrad" cx="40%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="70%" stop-color="#f1f5f9"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </radialGradient>
  </defs>
  <rect width="100" height="100" rx="16" fill="#f8fafc"/>
  <!-- Cloves -->
  <path d="M50 22 C64 22 78 40 78 60 C78 76 66 84 50 84 C34 84 22 76 22 60 C22 40 36 22 50 22 Z" fill="url(#garGrad)"/>
  <!-- Neck stem -->
  <path d="M50 22 L50 12" stroke="#a3e635" stroke-width="4" stroke-linecap="round"/>
  <!-- Clove divider curves -->
  <path d="M50 24 Q42 54 38 82" stroke="#cbd5e1" stroke-width="2" fill="none"/>
  <path d="M50 24 Q58 54 62 82" stroke="#cbd5e1" stroke-width="2" fill="none"/>
</svg>''',

    'Ginger': '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <radialGradient id="gingGrad" cx="40%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="60%" stop-color="#ca8a04"/>
      <stop offset="100%" stop-color="#854d0e"/>
    </radialGradient>
  </defs>
  <rect width="100" height="100" rx="16" fill="#fefce8"/>
  <path d="M30 64 C24 50 34 36 44 42 C50 32 64 34 68 44 C76 46 82 56 76 68 C68 78 36 78 30 64 Z" fill="url(#gingGrad)"/>
  <ellipse cx="38" cy="38" rx="8" ry="12" fill="url(#gingGrad)" transform="rotate(-20 38 38)"/>
  <ellipse cx="62" cy="36" rx="8" ry="10" fill="url(#gingGrad)" transform="rotate(20 62 36)"/>
</svg>''',

    'Green Chilli': '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="chilGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#84cc16"/>
      <stop offset="60%" stop-color="#4d7c0f"/>
      <stop offset="100%" stop-color="#14532d"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="16" fill="#f7fee7"/>
  <!-- Curved chilli -->
  <path d="M38 24 C48 36 62 50 68 76 C58 72 44 54 34 32 Z" fill="url(#chilGrad)"/>
  <!-- Calyx & stem -->
  <path d="M34 26 L42 20 L38 14" stroke="#15803d" stroke-width="3" fill="none" stroke-linecap="round"/>
</svg>''',

    'Cauliflower': '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <radialGradient id="caulGrad" cx="40%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="70%" stop-color="#fef9c3"/>
      <stop offset="100%" stop-color="#fef08a"/>
    </radialGradient>
  </defs>
  <rect width="100" height="100" rx="16" fill="#fefce8"/>
  <!-- Outer wrapper leaves -->
  <path d="M22 62 C20 44 32 30 46 26 L50 40 Z" fill="#4d7c0f"/>
  <path d="M78 62 C80 44 68 30 54 26 L50 40 Z" fill="#4d7c0f"/>
  <path d="M24 70 C34 84 66 84 76 70 Z" fill="#365314"/>
  <!-- Curd florets -->
  <circle cx="50" cy="48" r="14" fill="url(#caulGrad)"/>
  <circle cx="38" cy="54" r="12" fill="url(#caulGrad)"/>
  <circle cx="62" cy="54" r="12" fill="url(#caulGrad)"/>
  <circle cx="44" cy="62" r="12" fill="url(#caulGrad)"/>
  <circle cx="56" cy="62" r="12" fill="url(#caulGrad)"/>
</svg>''',

    'Cabbage': '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <radialGradient id="cabGrad" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#bef264"/>
      <stop offset="60%" stop-color="#65a30d"/>
      <stop offset="100%" stop-color="#365314"/>
    </radialGradient>
  </defs>
  <rect width="100" height="100" rx="16" fill="#f7fee7"/>
  <circle cx="50" cy="54" r="32" fill="url(#cabGrad)"/>
  <!-- Crinkled leaf lines -->
  <path d="M30 44 Q50 34 68 46" stroke="#d9f99d" stroke-width="2" fill="none" opacity="0.8"/>
  <path d="M24 58 Q50 48 76 60" stroke="#d9f99d" stroke-width="2" fill="none" opacity="0.8"/>
  <path d="M34 70 Q50 64 66 70" stroke="#d9f99d" stroke-width="1.8" fill="none" opacity="0.8"/>
</svg>''',

    'Carrot': '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="carGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fdba74"/>
      <stop offset="60%" stop-color="#ea580c"/>
      <stop offset="100%" stop-color="#c2410c"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="16" fill="#fff7ed"/>
  <!-- Carrot root body -->
  <polygon points="40,28 60,28 52,86 48,86" fill="url(#carGrad)"/>
  <!-- Foliage green top -->
  <path d="M50 28 L42 12 M50 28 L50 8 M50 28 L58 12" stroke="#15803d" stroke-width="3" stroke-linecap="round"/>
  <!-- Ridges -->
  <path d="M44 42 L54 42 M46 56 L52 56 M47 70 L51 70" stroke="#7c2d12" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
</svg>'''
}

GENERIC_PLACEHOLDER_SVG = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="sproutGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#4ade80"/>
      <stop offset="100%" stop-color="#15803d"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="16" fill="#f0fdf4"/>
  <!-- Soil Mound -->
  <path d="M20 78 C35 72 65 72 80 78 C70 86 30 86 20 78 Z" fill="#78350f" opacity="0.8"/>
  <!-- Sprout Stem -->
  <path d="M50 74 C50 56 48 40 50 32" stroke="#16a34a" stroke-width="4" stroke-linecap="round" fill="none"/>
  <!-- Left Leaf -->
  <path d="M50 46 C36 40 30 52 46 52 Z" fill="url(#sproutGrad)"/>
  <!-- Right Leaf -->
  <path d="M50 36 C64 30 70 42 54 42 Z" fill="url(#sproutGrad)"/>
</svg>'''

def generate_thumbnails(output_dir):
    os.makedirs(output_dir, exist_ok=True)

    # 1. Write generic placeholder
    placeholder_path = os.path.join(output_dir, 'placeholder.svg')
    with open(placeholder_path, 'w', encoding='utf-8') as f:
        f.write(GENERIC_PLACEHOLDER_SVG.strip())

    # 2. Write dedicated SVGs from templates
    count = 0
    generated_slugs = set()
    for name, svg_content in SVG_TEMPLATES.items():
        slug = re.sub(r'[^\w]+', '_', name.strip().lower()).strip('_')
        file_path = os.path.join(output_dir, f"{slug}.svg")
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(svg_content.strip())
        count += 1
        generated_slugs.add(slug)

    # 3. For any other commodity in COMMODITIES_CATALOG, generate category-themed botanical SVG
    try:
        from utils.commodity_data import COMMODITIES_CATALOG
        CATEGORY_THEMES = {
            'Vegetables': {'bg': '#f0fdf4', 'fill': '#16a34a', 'grad': '#15803d', 'text': '#14532d'},
            'Fruits': {'bg': '#fff7ed', 'fill': '#ea580c', 'grad': '#c2410c', 'text': '#7c2d12'},
            'Cereals / Food Grains': {'bg': '#fefce8', 'fill': '#ca8a04', 'grad': '#a16207', 'text': '#713f12'},
            'Pulses': {'bg': '#fffbeb', 'fill': '#d97706', 'grad': '#b45309', 'text': '#78350f'},
            'Oilseeds': {'bg': '#fefce8', 'fill': '#eab308', 'grad': '#ca8a04', 'text': '#713f12'},
            'Spices': {'bg': '#fff1f2', 'fill': '#e11d48', 'grad': '#be123c', 'text': '#881337'},
            'Commercial / Plantation Crops': {'bg': '#f8fafc', 'fill': '#0284c7', 'grad': '#0369a1', 'text': '#0c4a6e'},
            'Flowers': {'bg': '#fdf2f8', 'fill': '#db2777', 'grad': '#be185d', 'text': '#831843'},
            'Medicinal & Aromatic': {'bg': '#f0fdfa', 'fill': '#0d9488', 'grad': '#0f766e', 'text': '#134e4a'},
        }

        for item in COMMODITIES_CATALOG:
            slug = re.sub(r'[^\w]+', '_', item['canonical_name'].strip().lower()).strip('_')
            if slug not in generated_slugs:
                cat = item.get('category', 'Vegetables')
                theme = CATEGORY_THEMES.get(cat, CATEGORY_THEMES['Vegetables'])
                letter = item['canonical_name'][0].upper()
                c_name = item['canonical_name'][:12]

                svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <radialGradient id="grad_{slug}" cx="40%" cy="40%" r="60%">
      <stop offset="0%" stop-color="{theme['fill']}"/>
      <stop offset="100%" stop-color="{theme['grad']}"/>
    </radialGradient>
  </defs>
  <rect width="100" height="100" rx="16" fill="{theme['bg']}"/>
  <circle cx="50" cy="50" r="32" fill="url(#grad_{slug})" opacity="0.9"/>
  <!-- Leaf accent -->
  <path d="M50 22 C56 16 64 20 60 26 C54 26 50 24 50 22 Z" fill="#22c55e"/>
  <text x="50" y="58" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">{letter}</text>
  <text x="50" y="92" font-family="system-ui, -apple-system, sans-serif" font-size="8.5" font-weight="600" fill="{theme['text']}" text-anchor="middle">{c_name}</text>
</svg>'''
                file_path = os.path.join(output_dir, f"{slug}.svg")
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(svg.strip())
                count += 1
                generated_slugs.add(slug)
    except Exception as e:
        print("[Notice] Could not auto-generate themed SVGs:", e)

    print(f"[AgriSaathi] Generated {count} SVG commodity thumbnails in {output_dir}")

if __name__ == '__main__':
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    target_dir = os.path.join(backend_dir, 'uploads', 'commodities')
    generate_thumbnails(target_dir)
