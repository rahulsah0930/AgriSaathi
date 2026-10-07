"""
Comprehensive Indian Mandi / e-NAM Agricultural Commodity Master Catalog.
Provides canonical names, multilingual translations (English, Hindi, Marathi),
Roman transliterations, regional aliases, mandi keywords, perishability classifications,
and verified produce photographs.
"""

COMMODITIES_CATALOG = [
    {
        "canonical_name": "Tomato",
        "english_name": "Tomato",
        "hindi_name": "टमाटर",
        "marathi_name": "टोमॅटो",
        "category": "Vegetables",
        "sub_category": "Solanaceous",
        "perishability_class": "HIGH",
        "default_collection_window_hours": 12.0,
        "aliases": [
            "tamatar",
            "tamater",
            "tomto",
            "tomatto",
            "tomatr",
            "tamator",
            "टमाटर",
            "टोमॅटो",
            "tamatero",
            "solanum lycopersicum",
            "love apple"
        ],
        "transliterations": [],
        "search_keywords": [
            "tomato tomato टमाटर टोमॅटो tamatar tamater tomto tomatto tomatr tamator टमाटर टोमॅटो tamatero solanum lycopersicum love apple"
        ],
        "image_url": "/uploads/commodities/tomato.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Onion",
        "english_name": "Onion",
        "hindi_name": "प्याज",
        "marathi_name": "कांदा",
        "category": "Vegetables",
        "sub_category": "Alliums",
        "perishability_class": "MEDIUM",
        "default_collection_window_hours": 48.0,
        "aliases": [
            "pyaz",
            "pyaaz",
            "pyaaj",
            "kanda",
            "kaanda",
            "onion",
            "onoin",
            "oniyon",
            "प्याज",
            "कांदा",
            "allium cepa",
            "dunkel",
            "dungri"
        ],
        "transliterations": [],
        "search_keywords": [
            "onion onion प्याज कांदा pyaz pyaaz pyaaj kanda kaanda onion onoin oniyon प्याज कांदा allium cepa dunkel dungri"
        ],
        "image_url": "/uploads/commodities/onion.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Potato",
        "english_name": "Potato",
        "hindi_name": "आलू",
        "marathi_name": "बटाटा",
        "category": "Vegetables",
        "sub_category": "Tubers",
        "perishability_class": "MEDIUM",
        "default_collection_window_hours": 48.0,
        "aliases": [
            "potatto",
            "potto",
            "aloo",
            "alu",
            "batata",
            "बटाटा",
            "आलू",
            "aaloo",
            "allu",
            "solanum tuberosum",
            "potatoe"
        ],
        "transliterations": [],
        "search_keywords": [
            "potato potato आलू बटाटा potatto potto aloo alu batata बटाटा आलू aaloo allu solanum tuberosum potatoe"
        ],
        "image_url": "/uploads/commodities/potato.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Brinjal",
        "english_name": "Brinjal / Eggplant",
        "hindi_name": "बैंगन",
        "marathi_name": "वांगी",
        "category": "Vegetables",
        "sub_category": "Solanaceous",
        "perishability_class": "HIGH",
        "default_collection_window_hours": 18.0,
        "aliases": [
            "brinjal",
            "brinjl",
            "eggplant",
            "baingan",
            "baigan",
            "vangi",
            "vaangi",
            "बैंगन",
            "वांगी",
            "aubergine",
            "vange",
            "solanum melongena"
        ],
        "transliterations": [],
        "search_keywords": [
            "brinjal brinjal / eggplant बैंगन वांगी brinjal brinjl eggplant baingan baigan vangi vaangi बैंगन वांगी aubergine vange solanum melongena"
        ],
        "image_url": "/uploads/commodities/brinjal.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Okra",
        "english_name": "Okra / Ladyfinger",
        "hindi_name": "भिंडी",
        "marathi_name": "भेंडी",
        "category": "Vegetables",
        "sub_category": "Malvaceae",
        "perishability_class": "HIGH",
        "default_collection_window_hours": 12.0,
        "aliases": [
            "okra",
            "lady finger",
            "ladyfinger",
            "bhindi",
            "bhndi",
            "bhendi",
            "bhende",
            "भिंडी",
            "भेंडी",
            "abelmoschus esculentus",
            "dharosh"
        ],
        "transliterations": [],
        "search_keywords": [
            "okra okra / ladyfinger भिंडी भेंडी okra lady finger ladyfinger bhindi bhndi bhendi bhende भिंडी भेंडी abelmoschus esculentus dharosh"
        ],
        "image_url": "/uploads/commodities/okra.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Cauliflower",
        "english_name": "Cauliflower",
        "hindi_name": "फूलगोभी",
        "marathi_name": "फ्लॉवर",
        "category": "Vegetables",
        "sub_category": "Cruciferous",
        "perishability_class": "HIGH",
        "default_collection_window_hours": 18.0,
        "aliases": [
            "cauliflower",
            "phool gobhi",
            "phoolgobhi",
            "gobhi",
            "flower",
            "phul gobi",
            "फूलगोभी",
            "फ्लॉवर",
            "gobi"
        ],
        "transliterations": [],
        "search_keywords": [
            "cauliflower cauliflower फूलगोभी फ्लॉवर cauliflower phool gobhi phoolgobhi gobhi flower phul gobi फूलगोभी फ्लॉवर gobi"
        ],
        "image_url": "/uploads/commodities/cauliflower.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Cabbage",
        "english_name": "Cabbage",
        "hindi_name": "पत्तागोभी",
        "marathi_name": "कोबी",
        "category": "Vegetables",
        "sub_category": "Cruciferous",
        "perishability_class": "HIGH",
        "default_collection_window_hours": 18.0,
        "aliases": [
            "cabbage",
            "patta gobhi",
            "pattagobhi",
            "kobi",
            "bandh gobhi",
            "पत्तागोभी",
            "कोबी",
            "bandha gobi"
        ],
        "transliterations": [],
        "search_keywords": [
            "cabbage cabbage पत्तागोभी कोबी cabbage patta gobhi pattagobhi kobi bandh gobhi पत्तागोभी कोबी bandha gobi"
        ],
        "image_url": "/uploads/commodities/cabbage.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Carrot",
        "english_name": "Carrot",
        "hindi_name": "गाजर",
        "marathi_name": "गाजर",
        "category": "Vegetables",
        "sub_category": "Root Vegetables",
        "perishability_class": "MEDIUM",
        "default_collection_window_hours": 48.0,
        "aliases": [
            "carrot",
            "gajar",
            "gaajar",
            "गाजर",
            "dacus carota"
        ],
        "transliterations": [],
        "search_keywords": [
            "carrot carrot गाजर गाजर carrot gajar gaajar गाजर dacus carota"
        ],
        "image_url": "/uploads/commodities/carrot.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Radish",
        "english_name": "Radish",
        "hindi_name": "मूली",
        "marathi_name": "मुळा",
        "category": "Vegetables",
        "sub_category": "Root Vegetables",
        "perishability_class": "MEDIUM",
        "default_collection_window_hours": 48.0,
        "aliases": [
            "radish",
            "mooli",
            "muli",
            "mula",
            "मूली",
            "मुळा"
        ],
        "transliterations": [],
        "search_keywords": [
            "radish radish मूली मुळा radish mooli muli mula मूली मुळा"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Green Peas",
        "english_name": "Green Peas",
        "hindi_name": "हरा मटर",
        "marathi_name": "हिरवा वाटाणा",
        "category": "Vegetables",
        "sub_category": "Legumes",
        "perishability_class": "HIGH",
        "default_collection_window_hours": 18.0,
        "aliases": [
            "peas",
            "green peas",
            "matar",
            "mattar",
            "vatana",
            "watana",
            "हरा मटर",
            "मटर",
            "हिरवा वाटाणा",
            "वाटाणा"
        ],
        "transliterations": [],
        "search_keywords": [
            "green peas green peas हरा मटर हिरवा वाटाणा peas green peas matar mattar vatana watana हरा मटर मटर हिरवा वाटाणा वाटाणा"
        ],
        "image_url": "/uploads/commodities/green_peas.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Capsicum",
        "english_name": "Capsicum / Bell Pepper",
        "hindi_name": "शिमला मिर्च",
        "marathi_name": "ढोबळी मिरची",
        "category": "Vegetables",
        "sub_category": "Solanaceous",
        "perishability_class": "HIGH",
        "default_collection_window_hours": 18.0,
        "aliases": [
            "capsicum",
            "bell pepper",
            "shimla mirch",
            "shimla",
            "dhobli mirchi",
            "शिमला मिर्च",
            "ढोबळी मिरची",
            "sweet pepper"
        ],
        "transliterations": [],
        "search_keywords": [
            "capsicum capsicum / bell pepper शिमला मिर्च ढोबळी मिरची capsicum bell pepper shimla mirch shimla dhobli mirchi शिमला मिर्च ढोबळी मिरची sweet pepper"
        ],
        "image_url": "/uploads/commodities/capsicum.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Green Chilli",
        "english_name": "Green Chilli",
        "hindi_name": "हरी मिर्च",
        "marathi_name": "हिरवी मिरची",
        "category": "Vegetables",
        "sub_category": "Solanaceous",
        "perishability_class": "HIGH",
        "default_collection_window_hours": 18.0,
        "aliases": [
            "green chilli",
            "chilli",
            "hari mirch",
            "hirvi mirchi",
            "chili",
            "mirchi",
            "हरी मिर्च",
            "हिरवी मिरची",
            "मिरची"
        ],
        "transliterations": [],
        "search_keywords": [
            "green chilli green chilli हरी मिर्च हिरवी मिरची green chilli chilli hari mirch hirvi mirchi chili mirchi हरी मिर्च हिरवी मिरची मिरची"
        ],
        "image_url": "/uploads/commodities/green_chilli.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Garlic",
        "english_name": "Garlic",
        "hindi_name": "लहसुन",
        "marathi_name": "लसूण",
        "category": "Vegetables",
        "sub_category": "Alliums",
        "perishability_class": "MEDIUM",
        "default_collection_window_hours": 48.0,
        "aliases": [
            "garlic",
            "lahsun",
            "lasun",
            "lehsan",
            "लहसुन",
            "लसूण",
            "allium sativum"
        ],
        "transliterations": [],
        "search_keywords": [
            "garlic garlic लहसुन लसूण garlic lahsun lasun lehsan लहसुन लसूण allium sativum"
        ],
        "image_url": "/uploads/commodities/garlic.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Ginger",
        "english_name": "Ginger",
        "hindi_name": "अदरक",
        "marathi_name": "आले",
        "category": "Vegetables",
        "sub_category": "Rhizomes",
        "perishability_class": "MEDIUM",
        "default_collection_window_hours": 48.0,
        "aliases": [
            "ginger",
            "adrak",
            "aale",
            "ale",
            "adrakh",
            "अदरक",
            "आले",
            "zingiber officinale"
        ],
        "transliterations": [],
        "search_keywords": [
            "ginger ginger अदरक आले ginger adrak aale ale adrakh अदरक आले zingiber officinale"
        ],
        "image_url": "/uploads/commodities/ginger.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Cucumber",
        "english_name": "Cucumber",
        "hindi_name": "खीरा",
        "marathi_name": "काकडी",
        "category": "Vegetables",
        "sub_category": "Cucurbits",
        "perishability_class": "HIGH",
        "default_collection_window_hours": 18.0,
        "aliases": [
            "cucumber",
            "kheera",
            "khira",
            "kakdi",
            "kakadi",
            "खीरा",
            "काकडी"
        ],
        "transliterations": [],
        "search_keywords": [
            "cucumber cucumber खीरा काकडी cucumber kheera khira kakdi kakadi खीरा काकडी"
        ],
        "image_url": "/uploads/commodities/cucumber.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Bottle Gourd",
        "english_name": "Bottle Gourd",
        "hindi_name": "लौकी",
        "marathi_name": "दुधी भोपळा",
        "category": "Vegetables",
        "sub_category": "Cucurbits",
        "perishability_class": "HIGH",
        "default_collection_window_hours": 18.0,
        "aliases": [
            "bottle gourd",
            "lauki",
            "doodhi",
            "dudhi",
            "dudhi bhopla",
            "ghiya",
            "लौकी",
            "दुधी भोपळा",
            "घिया"
        ],
        "transliterations": [],
        "search_keywords": [
            "bottle gourd bottle gourd लौकी दुधी भोपळा bottle gourd lauki doodhi dudhi dudhi bhopla ghiya लौकी दुधी भोपळा घिया"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Bitter Gourd",
        "english_name": "Bitter Gourd",
        "hindi_name": "करेला",
        "marathi_name": "कारले",
        "category": "Vegetables",
        "sub_category": "Cucurbits",
        "perishability_class": "HIGH",
        "default_collection_window_hours": 18.0,
        "aliases": [
            "bitter gourd",
            "karela",
            "karle",
            "karla",
            "करेला",
            "कारले",
            "momordica charantia"
        ],
        "transliterations": [],
        "search_keywords": [
            "bitter gourd bitter gourd करेला कारले bitter gourd karela karle karla करेला कारले momordica charantia"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Ridge Gourd",
        "english_name": "Ridge Gourd",
        "hindi_name": "तोरई",
        "marathi_name": "दोडका",
        "category": "Vegetables",
        "sub_category": "Cucurbits",
        "perishability_class": "HIGH",
        "default_collection_window_hours": 18.0,
        "aliases": [
            "ridge gourd",
            "torai",
            "tori",
            "dodka",
            "shirale",
            "तोरई",
            "दोडका",
            "शिराळे"
        ],
        "transliterations": [],
        "search_keywords": [
            "ridge gourd ridge gourd तोरई दोडका ridge gourd torai tori dodka shirale तोरई दोडका शिराळे"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Pumpkin",
        "english_name": "Pumpkin",
        "hindi_name": "कद्दू",
        "marathi_name": "लाल भोपळा",
        "category": "Vegetables",
        "sub_category": "Cucurbits",
        "perishability_class": "HIGH",
        "default_collection_window_hours": 18.0,
        "aliases": [
            "pumpkin",
            "kaddu",
            "bhopla",
            "lal bhopla",
            "kohla",
            "कद्दू",
            "लाल भोपळा"
        ],
        "transliterations": [],
        "search_keywords": [
            "pumpkin pumpkin कद्दू लाल भोपळा pumpkin kaddu bhopla lal bhopla kohla कद्दू लाल भोपळा"
        ],
        "image_url": "/uploads/commodities/pumpkin.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Cluster Beans",
        "english_name": "Cluster Beans",
        "hindi_name": "ग्वार फली",
        "marathi_name": "गवार",
        "category": "Vegetables",
        "sub_category": "Legumes",
        "perishability_class": "HIGH",
        "default_collection_window_hours": 18.0,
        "aliases": [
            "cluster beans",
            "guar",
            "gwar",
            "gavar",
            "gawar",
            "gawar phali",
            "ग्वार फली",
            "गवार"
        ],
        "transliterations": [],
        "search_keywords": [
            "cluster beans cluster beans ग्वार फली गवार cluster beans guar gwar gavar gawar gawar phali ग्वार फली गवार"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Spinach",
        "english_name": "Spinach",
        "hindi_name": "पालक",
        "marathi_name": "पालक",
        "category": "Vegetables",
        "sub_category": "Leafy",
        "perishability_class": "HIGH",
        "default_collection_window_hours": 12.0,
        "aliases": [
            "spinach",
            "palak",
            "paalak",
            "पालक",
            "spinacia oleracea"
        ],
        "transliterations": [],
        "search_keywords": [
            "spinach spinach पालक पालक spinach palak paalak पालक spinacia oleracea"
        ],
        "image_url": "/uploads/commodities/spinach.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Fenugreek Leaves",
        "english_name": "Fenugreek Leaves / Methi",
        "hindi_name": "मेथी",
        "marathi_name": "मेथी",
        "category": "Vegetables",
        "sub_category": "Leafy",
        "perishability_class": "HIGH",
        "default_collection_window_hours": 12.0,
        "aliases": [
            "fenugreek leaves",
            "methi",
            "methi bhaji",
            "मेथी"
        ],
        "transliterations": [],
        "search_keywords": [
            "fenugreek leaves fenugreek leaves / methi मेथी मेथी fenugreek leaves methi methi bhaji मेथी"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Coriander Leaves",
        "english_name": "Coriander Leaves",
        "hindi_name": "हरा धनिया",
        "marathi_name": "कोथिंबीर",
        "category": "Vegetables",
        "sub_category": "Leafy",
        "perishability_class": "HIGH",
        "default_collection_window_hours": 12.0,
        "aliases": [
            "coriander leaves",
            "dhaniya",
            "dhania",
            "kothimbir",
            "kothmir",
            "हरा धनिया",
            "कोथिंबीर"
        ],
        "transliterations": [],
        "search_keywords": [
            "coriander leaves coriander leaves हरा धनिया कोथिंबीर coriander leaves dhaniya dhania kothimbir kothmir हरा धनिया कोथिंबीर"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Sweet Corn",
        "english_name": "Sweet Corn",
        "hindi_name": "स्वीट कॉर्न",
        "marathi_name": "गोड मका",
        "category": "Vegetables",
        "sub_category": "Cereals / Veg",
        "perishability_class": "HIGH",
        "default_collection_window_hours": 18.0,
        "aliases": [
            "sweet corn",
            "corn",
            "sweetcorn",
            "bhutta",
            "god maka",
            "स्वीट कॉर्न",
            "मका"
        ],
        "transliterations": [],
        "search_keywords": [
            "sweet corn sweet corn स्वीट कॉर्न गोड मका sweet corn corn sweetcorn bhutta god maka स्वीट कॉर्न मका"
        ],
        "image_url": "/uploads/commodities/sweet_corn.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Wheat",
        "english_name": "Wheat",
        "hindi_name": "गेहूं",
        "marathi_name": "गहू",
        "category": "Cereals / Food Grains",
        "sub_category": "Grains",
        "perishability_class": "LOW",
        "default_collection_window_hours": 72.0,
        "aliases": [
            "wheat",
            "gehun",
            "gehu",
            "gahu",
            "sharbati",
            "lokwan",
            "गेहूं",
            "गहू",
            "triticum",
            "kanak"
        ],
        "transliterations": [],
        "search_keywords": [
            "wheat wheat गेहूं गहू wheat gehun gehu gahu sharbati lokwan गेहूं गहू triticum kanak"
        ],
        "image_url": "/uploads/commodities/wheat.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Rice",
        "english_name": "Rice / Paddy",
        "hindi_name": "चावल / धान",
        "marathi_name": "तांदूळ / भात",
        "category": "Cereals / Food Grains",
        "sub_category": "Grains",
        "perishability_class": "LOW",
        "default_collection_window_hours": 72.0,
        "aliases": [
            "rice",
            "paddy",
            "chawal",
            "dhan",
            "tandul",
            "bhat",
            "basmati",
            "kolam",
            "चावल",
            "धान",
            "तांदूळ",
            "भात",
            "oryza sativa"
        ],
        "transliterations": [],
        "search_keywords": [
            "rice rice / paddy चावल / धान तांदूळ / भात rice paddy chawal dhan tandul bhat basmati kolam चावल धान तांदूळ भात oryza sativa"
        ],
        "image_url": "/uploads/commodities/rice.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Maize",
        "english_name": "Maize / Corn",
        "hindi_name": "मक्का",
        "marathi_name": "मका",
        "category": "Cereals / Food Grains",
        "sub_category": "Coarse Cereals",
        "perishability_class": "LOW",
        "default_collection_window_hours": 72.0,
        "aliases": [
            "maize",
            "corn",
            "makka",
            "maka",
            "makai",
            "मक्का",
            "मका",
            "zea mays"
        ],
        "transliterations": [],
        "search_keywords": [
            "maize maize / corn मक्का मका maize corn makka maka makai मक्का मका zea mays"
        ],
        "image_url": "/uploads/commodities/maize.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Barley",
        "english_name": "Barley",
        "hindi_name": "जौ",
        "marathi_name": "सातू",
        "category": "Cereals / Food Grains",
        "sub_category": "Grains",
        "perishability_class": "LOW",
        "default_collection_window_hours": 72.0,
        "aliases": [
            "barley",
            "jau",
            "jav",
            "satu",
            "जौ",
            "सातू",
            "hordeum vulgare"
        ],
        "transliterations": [],
        "search_keywords": [
            "barley barley जौ सातू barley jau jav satu जौ सातू hordeum vulgare"
        ],
        "image_url": "/uploads/commodities/barley.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Jowar",
        "english_name": "Jowar / Sorghum",
        "hindi_name": "ज्वार",
        "marathi_name": "ज्वारी",
        "category": "Cereals / Food Grains",
        "sub_category": "Millets",
        "perishability_class": "LOW",
        "default_collection_window_hours": 72.0,
        "aliases": [
            "jowar",
            "jowari",
            "jwari",
            "sorghum",
            "maldandi",
            "ज्वार",
            "ज्वारी",
            "sorghum bicolor"
        ],
        "transliterations": [],
        "search_keywords": [
            "jowar jowar / sorghum ज्वार ज्वारी jowar jowari jwari sorghum maldandi ज्वार ज्वारी sorghum bicolor"
        ],
        "image_url": "/uploads/commodities/jowar.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Bajra",
        "english_name": "Bajra / Pearl Millet",
        "hindi_name": "बाजरा",
        "marathi_name": "बाजरी",
        "category": "Cereals / Food Grains",
        "sub_category": "Millets",
        "perishability_class": "LOW",
        "default_collection_window_hours": 72.0,
        "aliases": [
            "bajra",
            "bajri",
            "pearl millet",
            "बाजरा",
            "बाजरी",
            "pennisetum glaucum"
        ],
        "transliterations": [],
        "search_keywords": [
            "bajra bajra / pearl millet बाजरा बाजरी bajra bajri pearl millet बाजरा बाजरी pennisetum glaucum"
        ],
        "image_url": "/uploads/commodities/bajra.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Ragi",
        "english_name": "Ragi / Finger Millet",
        "hindi_name": "रागी",
        "marathi_name": "नाचणी",
        "category": "Cereals / Food Grains",
        "sub_category": "Millets",
        "perishability_class": "LOW",
        "default_collection_window_hours": 72.0,
        "aliases": [
            "ragi",
            "nachni",
            "finger millet",
            "mandua",
            "रागी",
            "नाचणी",
            "eleusine coracana"
        ],
        "transliterations": [],
        "search_keywords": [
            "ragi ragi / finger millet रागी नाचणी ragi nachni finger millet mandua रागी नाचणी eleusine coracana"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Gram",
        "english_name": "Gram / Chickpea / Chana",
        "hindi_name": "चना",
        "marathi_name": "हरभरा",
        "category": "Pulses",
        "sub_category": "Bengal Gram",
        "perishability_class": "LOW",
        "default_collection_window_hours": 72.0,
        "aliases": [
            "gram",
            "chana",
            "channa",
            "chickpea",
            "harbhara",
            "harbara",
            "bengal gram",
            "चना",
            "हरभरा",
            "cicer arietinum"
        ],
        "transliterations": [],
        "search_keywords": [
            "gram gram / chickpea / chana चना हरभरा gram chana channa chickpea harbhara harbara bengal gram चना हरभरा cicer arietinum"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Kabuli Chana",
        "english_name": "Kabuli Chana / White Chickpea",
        "hindi_name": "काबुली चना",
        "marathi_name": "काबुली चणा",
        "category": "Pulses",
        "sub_category": "Chickpea",
        "perishability_class": "LOW",
        "default_collection_window_hours": 72.0,
        "aliases": [
            "kabuli chana",
            "safed chana",
            "white chickpea",
            "chole",
            "काबुली चना",
            "काबुली चणा"
        ],
        "transliterations": [],
        "search_keywords": [
            "kabuli chana kabuli chana / white chickpea काबुली चना काबुली चणा kabuli chana safed chana white chickpea chole काबुली चना काबुली चणा"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Arhar",
        "english_name": "Arhar / Tur / Pigeon Pea",
        "hindi_name": "अरहर / तुअर",
        "marathi_name": "तूर",
        "category": "Pulses",
        "sub_category": "Pigeon Pea",
        "perishability_class": "LOW",
        "default_collection_window_hours": 72.0,
        "aliases": [
            "arhar",
            "tur",
            "toor",
            "tuar",
            "pigeon pea",
            "red gram",
            "अरहर",
            "तुअर",
            "तूर",
            "cajanus cajan"
        ],
        "transliterations": [],
        "search_keywords": [
            "arhar arhar / tur / pigeon pea अरहर / तुअर तूर arhar tur toor tuar pigeon pea red gram अरहर तुअर तूर cajanus cajan"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Moong",
        "english_name": "Moong / Green Gram",
        "hindi_name": "मूंग",
        "marathi_name": "मूग",
        "category": "Pulses",
        "sub_category": "Green Gram",
        "perishability_class": "LOW",
        "default_collection_window_hours": 72.0,
        "aliases": [
            "moong",
            "mung",
            "green gram",
            "mug",
            "mugg",
            "मूंग",
            "मूग",
            "vigna radiata"
        ],
        "transliterations": [],
        "search_keywords": [
            "moong moong / green gram मूंग मूग moong mung green gram mug mugg मूंग मूग vigna radiata"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Urad",
        "english_name": "Urad / Black Gram",
        "hindi_name": "उडद",
        "marathi_name": "उडीद",
        "category": "Pulses",
        "sub_category": "Black Gram",
        "perishability_class": "LOW",
        "default_collection_window_hours": 72.0,
        "aliases": [
            "urad",
            "urid",
            "black gram",
            "udid",
            "udad",
            "उडद",
            "उडीद",
            "vigna mungo"
        ],
        "transliterations": [],
        "search_keywords": [
            "urad urad / black gram उडद उडीद urad urid black gram udid udad उडद उडीद vigna mungo"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Masoor",
        "english_name": "Masoor / Red Lentil",
        "hindi_name": "मसूर",
        "marathi_name": "मसूर",
        "category": "Pulses",
        "sub_category": "Lentils",
        "perishability_class": "LOW",
        "default_collection_window_hours": 72.0,
        "aliases": [
            "masoor",
            "masur",
            "red lentil",
            "lentil",
            "मसूर",
            "lens culinaris"
        ],
        "transliterations": [],
        "search_keywords": [
            "masoor masoor / red lentil मसूर मसूर masoor masur red lentil lentil मसूर lens culinaris"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Moth Bean",
        "english_name": "Moth Bean / Matki",
        "hindi_name": "मोठ",
        "marathi_name": "मटकी",
        "category": "Pulses",
        "sub_category": "Beans",
        "perishability_class": "LOW",
        "default_collection_window_hours": 72.0,
        "aliases": [
            "moth bean",
            "matki",
            "moth",
            "मोठ",
            "मटकी",
            "vigna aconitifolia"
        ],
        "transliterations": [],
        "search_keywords": [
            "moth bean moth bean / matki मोठ मटकी moth bean matki moth मोठ मटकी vigna aconitifolia"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Rajma",
        "english_name": "Rajma / Kidney Bean",
        "hindi_name": "राजमा",
        "marathi_name": "राजमा",
        "category": "Pulses",
        "sub_category": "Kidney Beans",
        "perishability_class": "LOW",
        "default_collection_window_hours": 72.0,
        "aliases": [
            "rajma",
            "rajmah",
            "kidney bean",
            "red kidney bean",
            "राजमा",
            "phaseolus vulgaris"
        ],
        "transliterations": [],
        "search_keywords": [
            "rajma rajma / kidney bean राजमा राजमा rajma rajmah kidney bean red kidney bean राजमा phaseolus vulgaris"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Soybean",
        "english_name": "Soybean",
        "hindi_name": "सोयाबीन",
        "marathi_name": "सोयाबीन",
        "category": "Oilseeds",
        "sub_category": "Major Oilseeds",
        "perishability_class": "LOW",
        "default_collection_window_hours": 72.0,
        "aliases": [
            "soybean",
            "soya bean",
            "soyabean",
            "soya",
            "सोयाबीन",
            "glycine max",
            "yellow soybean"
        ],
        "transliterations": [],
        "search_keywords": [
            "soybean soybean सोयाबीन सोयाबीन soybean soya bean soyabean soya सोयाबीन glycine max yellow soybean"
        ],
        "image_url": "/uploads/commodities/soybean.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Groundnut",
        "english_name": "Groundnut / Peanut",
        "hindi_name": "मूंगफली",
        "marathi_name": "शेंगदाणा",
        "category": "Oilseeds",
        "sub_category": "Major Oilseeds",
        "perishability_class": "LOW",
        "default_collection_window_hours": 72.0,
        "aliases": [
            "groundnut",
            "peanut",
            "mungfali",
            "moongphali",
            "shengdana",
            "bhuimug",
            "मूंगफली",
            "शेंगदाणा",
            "भुईमूग",
            "arachis hypogaea"
        ],
        "transliterations": [],
        "search_keywords": [
            "groundnut groundnut / peanut मूंगफली शेंगदाणा groundnut peanut mungfali moongphali shengdana bhuimug मूंगफली शेंगदाणा भुईमूग arachis hypogaea"
        ],
        "image_url": "/uploads/commodities/groundnut.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Mustard",
        "english_name": "Mustard Seed",
        "hindi_name": "सरसों",
        "marathi_name": "मोहरी",
        "category": "Oilseeds",
        "sub_category": "Oilseeds / Spices",
        "perishability_class": "LOW",
        "default_collection_window_hours": 72.0,
        "aliases": [
            "mustard",
            "sarson",
            "mohari",
            "rai",
            "rayee",
            "सरसों",
            "मोहरी",
            "राई",
            "brassica"
        ],
        "transliterations": [],
        "search_keywords": [
            "mustard mustard seed सरसों मोहरी mustard sarson mohari rai rayee सरसों मोहरी राई brassica"
        ],
        "image_url": "/uploads/commodities/mustard.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Sunflower",
        "english_name": "Sunflower Seed",
        "hindi_name": "सूरजमुखी",
        "marathi_name": "सूर्यफूल",
        "category": "Oilseeds",
        "sub_category": "Oilseeds",
        "perishability_class": "LOW",
        "default_collection_window_hours": 72.0,
        "aliases": [
            "sunflower",
            "surajmukhi",
            "suryaphool",
            "suryaphul",
            "सूरजमुखी",
            "सूर्यफूल",
            "helianthus annuus"
        ],
        "transliterations": [],
        "search_keywords": [
            "sunflower sunflower seed सूरजमुखी सूर्यफूल sunflower surajmukhi suryaphool suryaphul सूरजमुखी सूर्यफूल helianthus annuus"
        ],
        "image_url": "/uploads/commodities/sunflower.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Sesame",
        "english_name": "Sesame / Til",
        "hindi_name": "तिल",
        "marathi_name": "तीळ",
        "category": "Oilseeds",
        "sub_category": "Oilseeds",
        "perishability_class": "LOW",
        "default_collection_window_hours": 72.0,
        "aliases": [
            "sesame",
            "til",
            "teel",
            "sesamum",
            "तिल",
            "तीळ",
            "sesamum indicum"
        ],
        "transliterations": [],
        "search_keywords": [
            "sesame sesame / til तिल तीळ sesame til teel sesamum तिल तीळ sesamum indicum"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Safflower",
        "english_name": "Safflower / Kardi",
        "hindi_name": "कुसुम",
        "marathi_name": "करडई",
        "category": "Oilseeds",
        "sub_category": "Oilseeds",
        "perishability_class": "LOW",
        "default_collection_window_hours": 72.0,
        "aliases": [
            "safflower",
            "kardi",
            "kardai",
            "kusum",
            "कुसुम",
            "करडई",
            "carthamus tinctorius"
        ],
        "transliterations": [],
        "search_keywords": [
            "safflower safflower / kardi कुसुम करडई safflower kardi kardai kusum कुसुम करडई carthamus tinctorius"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Castor Seed",
        "english_name": "Castor Seed",
        "hindi_name": "अरंडी",
        "marathi_name": "एरंडी",
        "category": "Oilseeds",
        "sub_category": "Industrial Oilseeds",
        "perishability_class": "LOW",
        "default_collection_window_hours": 72.0,
        "aliases": [
            "castor",
            "castor seed",
            "arandi",
            "erandi",
            "अरंडी",
            "एरंडी",
            "ricinus communis"
        ],
        "transliterations": [],
        "search_keywords": [
            "castor seed castor seed अरंडी एरंडी castor castor seed arandi erandi अरंडी एरंडी ricinus communis"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Cotton",
        "english_name": "Cotton / Kapas",
        "hindi_name": "कपास",
        "marathi_name": "कापूस",
        "category": "Commercial / Plantation Crops",
        "sub_category": "Fiber",
        "perishability_class": "LOW",
        "default_collection_window_hours": 72.0,
        "aliases": [
            "cotton",
            "kapas",
            "kappas",
            "kapus",
            "rui",
            "कपास",
            "कापूस",
            "रुई",
            "white gold",
            "gossypium"
        ],
        "transliterations": [],
        "search_keywords": [
            "cotton cotton / kapas कपास कापूस cotton kapas kappas kapus rui कपास कापूस रुई white gold gossypium"
        ],
        "image_url": "/uploads/commodities/cotton.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Sugarcane",
        "english_name": "Sugarcane",
        "hindi_name": "गन्ना",
        "marathi_name": "ऊस",
        "category": "Commercial / Plantation Crops",
        "sub_category": "Sugar Crops",
        "perishability_class": "HIGH",
        "default_collection_window_hours": 24.0,
        "aliases": [
            "sugarcane",
            "sugar cane",
            "ganna",
            "us",
            "oos",
            "गन्ना",
            "ऊस",
            "saccharum officinarum"
        ],
        "transliterations": [],
        "search_keywords": [
            "sugarcane sugarcane गन्ना ऊस sugarcane sugar cane ganna us oos गन्ना ऊस saccharum officinarum"
        ],
        "image_url": "/uploads/commodities/sugarcane.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Mango",
        "english_name": "Mango",
        "hindi_name": "आम",
        "marathi_name": "आंबा",
        "category": "Fruits",
        "sub_category": "Tropical",
        "perishability_class": "HIGH",
        "default_collection_window_hours": 24.0,
        "aliases": [
            "mango",
            "aam",
            "amba",
            "alphonso",
            "kesar",
            "badami",
            "hapus",
            "आम",
            "आंबा",
            "हापूस",
            "mangifera indica"
        ],
        "transliterations": [],
        "search_keywords": [
            "mango mango आम आंबा mango aam amba alphonso kesar badami hapus आम आंबा हापूस mangifera indica"
        ],
        "image_url": "/uploads/commodities/mango.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Banana",
        "english_name": "Banana",
        "hindi_name": "केला",
        "marathi_name": "केळी",
        "category": "Fruits",
        "sub_category": "Tropical",
        "perishability_class": "HIGH",
        "default_collection_window_hours": 24.0,
        "aliases": [
            "banana",
            "kela",
            "keli",
            "robusta",
            "grand naine",
            "yelakki",
            "केला",
            "केळी",
            "musa"
        ],
        "transliterations": [],
        "search_keywords": [
            "banana banana केला केळी banana kela keli robusta grand naine yelakki केला केळी musa"
        ],
        "image_url": "/uploads/commodities/banana.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Grapes",
        "english_name": "Grapes",
        "hindi_name": "अंगूर",
        "marathi_name": "द्राक्षे",
        "category": "Fruits",
        "sub_category": "Berries",
        "perishability_class": "HIGH",
        "default_collection_window_hours": 18.0,
        "aliases": [
            "grapes",
            "grape",
            "angoor",
            "angur",
            "draksh",
            "draksha",
            "draksho",
            "thompson",
            "अंगूर",
            "द्राक्षे",
            "द्राक्ष",
            "vitis vinifera",
            "tas-e-ganesh"
        ],
        "transliterations": [],
        "search_keywords": [
            "grapes grapes अंगूर द्राक्षे grapes grape angoor angur draksh draksha draksho thompson अंगूर द्राक्षे द्राक्ष vitis vinifera tas-e-ganesh"
        ],
        "image_url": "/uploads/commodities/grapes.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Pomegranate",
        "english_name": "Pomegranate",
        "hindi_name": "अनार",
        "marathi_name": "डाळिंब",
        "category": "Fruits",
        "sub_category": "Tropical",
        "perishability_class": "MEDIUM",
        "default_collection_window_hours": 48.0,
        "aliases": [
            "pomegranate",
            "anaar",
            "anar",
            "dalimb",
            "dalim",
            "bhagwa",
            "aruka",
            "अनार",
            "डाळिंब",
            "punica granatum"
        ],
        "transliterations": [],
        "search_keywords": [
            "pomegranate pomegranate अनार डाळिंब pomegranate anaar anar dalimb dalim bhagwa aruka अनार डाळिंब punica granatum"
        ],
        "image_url": "/uploads/commodities/pomegranate.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Apple",
        "english_name": "Apple",
        "hindi_name": "सेब",
        "marathi_name": "सफरचंद",
        "category": "Fruits",
        "sub_category": "Temperate",
        "perishability_class": "MEDIUM",
        "default_collection_window_hours": 48.0,
        "aliases": [
            "apple",
            "seb",
            "safarchand",
            "shimla apple",
            "kinnaur",
            "सेब",
            "सफरचंद",
            "malus domestica"
        ],
        "transliterations": [],
        "search_keywords": [
            "apple apple सेब सफरचंद apple seb safarchand shimla apple kinnaur सेब सफरचंद malus domestica"
        ],
        "image_url": "/uploads/commodities/apple.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Orange",
        "english_name": "Orange / Mandarin",
        "hindi_name": "संतरा",
        "marathi_name": "संत्री",
        "category": "Fruits",
        "sub_category": "Citrus",
        "perishability_class": "MEDIUM",
        "default_collection_window_hours": 48.0,
        "aliases": [
            "orange",
            "santra",
            "santri",
            "nagpur orange",
            "mandarin",
            "संतरा",
            "संत्री",
            "citrus reticulata"
        ],
        "transliterations": [],
        "search_keywords": [
            "orange orange / mandarin संतरा संत्री orange santra santri nagpur orange mandarin संतरा संत्री citrus reticulata"
        ],
        "image_url": "/uploads/commodities/orange.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Mosambi",
        "english_name": "Mosambi / Sweet Lime",
        "hindi_name": "मौसमी",
        "marathi_name": "मोसंबी",
        "category": "Fruits",
        "sub_category": "Citrus",
        "perishability_class": "MEDIUM",
        "default_collection_window_hours": 48.0,
        "aliases": [
            "mosambi",
            "sweet lime",
            "mausami",
            "mousambi",
            "मौसमी",
            "मोसंबी",
            "citrus limetta"
        ],
        "transliterations": [],
        "search_keywords": [
            "mosambi mosambi / sweet lime मौसमी मोसंबी mosambi sweet lime mausami mousambi मौसमी मोसंबी citrus limetta"
        ],
        "image_url": "/uploads/commodities/mosambi.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Guava",
        "english_name": "Guava",
        "hindi_name": "अमरूद",
        "marathi_name": "पेरू",
        "category": "Fruits",
        "sub_category": "Tropical",
        "perishability_class": "HIGH",
        "default_collection_window_hours": 24.0,
        "aliases": [
            "guava",
            "amrood",
            "amrud",
            "peru",
            "sardar guava",
            "l-49",
            "अमरूद",
            "पेरू",
            "psidium guajava"
        ],
        "transliterations": [],
        "search_keywords": [
            "guava guava अमरूद पेरू guava amrood amrud peru sardar guava l-49 अमरूद पेरू psidium guajava"
        ],
        "image_url": "/uploads/commodities/guava.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Papaya",
        "english_name": "Papaya",
        "hindi_name": "पपीता",
        "marathi_name": "पपई",
        "category": "Fruits",
        "sub_category": "Tropical",
        "perishability_class": "HIGH",
        "default_collection_window_hours": 24.0,
        "aliases": [
            "papaya",
            "papita",
            "papai",
            "taiwan red lady",
            "पपीता",
            "पपई",
            "carica papaya"
        ],
        "transliterations": [],
        "search_keywords": [
            "papaya papaya पपीता पपई papaya papita papai taiwan red lady पपीता पपई carica papaya"
        ],
        "image_url": "/uploads/commodities/papaya.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Watermelon",
        "english_name": "Watermelon",
        "hindi_name": "तरबूज",
        "marathi_name": "टरबूज",
        "category": "Fruits",
        "sub_category": "Melons",
        "perishability_class": "HIGH",
        "default_collection_window_hours": 24.0,
        "aliases": [
            "watermelon",
            "tarbooj",
            "tarbuj",
            "tarbuz",
            "tarbooja",
            "तरबूज",
            "टरबूज",
            "citrullus lanatus"
        ],
        "transliterations": [],
        "search_keywords": [
            "watermelon watermelon तरबूज टरबूज watermelon tarbooj tarbuj tarbuz tarbooja तरबूज टरबूज citrullus lanatus"
        ],
        "image_url": "/uploads/commodities/watermelon.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Muskmelon",
        "english_name": "Muskmelon",
        "hindi_name": "खरबूजा",
        "marathi_name": "खरबूज",
        "category": "Fruits",
        "sub_category": "Melons",
        "perishability_class": "HIGH",
        "default_collection_window_hours": 24.0,
        "aliases": [
            "muskmelon",
            "cantaloupe",
            "kharbuja",
            "kharbooja",
            "kharbuj",
            "खरबूजा",
            "खरबूज",
            "cucumis melo"
        ],
        "transliterations": [],
        "search_keywords": [
            "muskmelon muskmelon खरबूजा खरबूज muskmelon cantaloupe kharbuja kharbooja kharbuj खरबूजा खरबूज cucumis melo"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Pineapple",
        "english_name": "Pineapple",
        "hindi_name": "अनानास",
        "marathi_name": "अननस",
        "category": "Fruits",
        "sub_category": "Tropical",
        "perishability_class": "HIGH",
        "default_collection_window_hours": 24.0,
        "aliases": [
            "pineapple",
            "ananas",
            "anaanaas",
            "अनानास",
            "अननस",
            "ananas comosus"
        ],
        "transliterations": [],
        "search_keywords": [
            "pineapple pineapple अनानास अननस pineapple ananas anaanaas अनानास अननस ananas comosus"
        ],
        "image_url": "/uploads/commodities/pineapple.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Lemon",
        "english_name": "Lemon / Lime",
        "hindi_name": "नींबू",
        "marathi_name": "लिंबू",
        "category": "Fruits",
        "sub_category": "Citrus",
        "perishability_class": "MEDIUM",
        "default_collection_window_hours": 48.0,
        "aliases": [
            "lemon",
            "lime",
            "nimbu",
            "neembu",
            "limbu",
            "kagzi nimbu",
            "नींबू",
            "लिंबू",
            "citrus limon"
        ],
        "transliterations": [],
        "search_keywords": [
            "lemon lemon / lime नींबू लिंबू lemon lime nimbu neembu limbu kagzi nimbu नींबू लिंबू citrus limon"
        ],
        "image_url": "/uploads/commodities/lemon.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Custard Apple",
        "english_name": "Custard Apple / Sitaphal",
        "hindi_name": "सीताफल",
        "marathi_name": "सीताफळ",
        "category": "Fruits",
        "sub_category": "Tropical",
        "perishability_class": "HIGH",
        "default_collection_window_hours": 24.0,
        "aliases": [
            "custard apple",
            "sitaphal",
            "sitaphal",
            "sharifa",
            "sitafal",
            "सीताफल",
            "सीताफळ",
            "annona squamosa"
        ],
        "transliterations": [],
        "search_keywords": [
            "custard apple custard apple / sitaphal सीताफल सीताफळ custard apple sitaphal sitaphal sharifa sitafal सीताफल सीताफळ annona squamosa"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Turmeric",
        "english_name": "Turmeric",
        "hindi_name": "हल्दी",
        "marathi_name": "हळद",
        "category": "Spices",
        "sub_category": "Rhizomes",
        "perishability_class": "LOW",
        "default_collection_window_hours": 72.0,
        "aliases": [
            "turmeric",
            "haldi",
            "hald",
            "selam haldi",
            "rajapuri",
            "हल्दी",
            "हळद",
            "curcuma longa",
            "halad"
        ],
        "transliterations": [],
        "search_keywords": [
            "turmeric turmeric हल्दी हळद turmeric haldi hald selam haldi rajapuri हल्दी हळद curcuma longa halad"
        ],
        "image_url": "/uploads/commodities/turmeric.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Coriander",
        "english_name": "Coriander Seed",
        "hindi_name": "धनिया",
        "marathi_name": "धने",
        "category": "Spices",
        "sub_category": "Seed Spices",
        "perishability_class": "LOW",
        "default_collection_window_hours": 72.0,
        "aliases": [
            "coriander",
            "coriander seed",
            "dhania",
            "dhaniya",
            "dhane",
            "धनिया",
            "धने",
            "coriandrum sativum"
        ],
        "transliterations": [],
        "search_keywords": [
            "coriander coriander seed धनिया धने coriander coriander seed dhania dhaniya dhane धनिया धने coriandrum sativum"
        ],
        "image_url": "/uploads/commodities/coriander.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Cumin",
        "english_name": "Cumin Seed",
        "hindi_name": "जीरा",
        "marathi_name": "जिरे",
        "category": "Spices",
        "sub_category": "Seed Spices",
        "perishability_class": "LOW",
        "default_collection_window_hours": 72.0,
        "aliases": [
            "cumin",
            "cumin seed",
            "jeera",
            "jira",
            "jire",
            "जीरा",
            "जिरे",
            "cuminum cyminum"
        ],
        "transliterations": [],
        "search_keywords": [
            "cumin cumin seed जीरा जिरे cumin cumin seed jeera jira jire जीरा जिरे cuminum cyminum"
        ],
        "image_url": "/uploads/commodities/cumin.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Black Pepper",
        "english_name": "Black Pepper",
        "hindi_name": "काली मिर्च",
        "marathi_name": "काळी मिरी",
        "category": "Spices",
        "sub_category": "Spices",
        "perishability_class": "LOW",
        "default_collection_window_hours": 72.0,
        "aliases": [
            "black pepper",
            "kali mirch",
            "kali mirchi",
            "kali miri",
            "miri",
            "काली मिर्च",
            "काळी मिरी",
            "piper nigrum"
        ],
        "transliterations": [],
        "search_keywords": [
            "black pepper black pepper काली मिर्च काळी मिरी black pepper kali mirch kali mirchi kali miri miri काली मिर्च काळी मिरी piper nigrum"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Cardamom",
        "english_name": "Cardamom / Elaichi",
        "hindi_name": "इलायची",
        "marathi_name": "वेलची",
        "category": "Spices",
        "sub_category": "Spices",
        "perishability_class": "LOW",
        "default_collection_window_hours": 72.0,
        "aliases": [
            "cardamom",
            "elaichi",
            "elachi",
            "velchi",
            "chhoti elaichi",
            "इलायची",
            "वेलची",
            "elettaria cardamomum"
        ],
        "transliterations": [],
        "search_keywords": [
            "cardamom cardamom / elaichi इलायची वेलची cardamom elaichi elachi velchi chhoti elaichi इलायची वेलची elettaria cardamomum"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Dry Red Chilli",
        "english_name": "Dry Red Chilli",
        "hindi_name": "सूखी लाल मिर्च",
        "marathi_name": "सुकी लाल मिरची",
        "category": "Spices",
        "sub_category": "Spices",
        "perishability_class": "LOW",
        "default_collection_window_hours": 72.0,
        "aliases": [
            "dry red chilli",
            "red chilli",
            "sukhi lal mirch",
            "suki mirchi",
            "byadgi",
            "guntur",
            "सूखी लाल मिर्च",
            "सुकी लाल मिरची",
            "लाल मिर्च"
        ],
        "transliterations": [],
        "search_keywords": [
            "dry red chilli dry red chilli सूखी लाल मिर्च सुकी लाल मिरची dry red chilli red chilli sukhi lal mirch suki mirchi byadgi guntur सूखी लाल मिर्च सुकी लाल मिरची लाल मिर्च"
        ],
        "image_url": "/uploads/commodities/dry_red_chilli.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Tea",
        "english_name": "Tea",
        "hindi_name": "चाय",
        "marathi_name": "चहा",
        "category": "Commercial / Plantation Crops",
        "sub_category": "Plantation",
        "perishability_class": "LOW",
        "default_collection_window_hours": 72.0,
        "aliases": [
            "tea",
            "chai",
            "chaha",
            "tea leaf",
            "चाय",
            "चहा",
            "camellia sinensis"
        ],
        "transliterations": [],
        "search_keywords": [
            "tea tea चाय चहा tea chai chaha tea leaf चाय चहा camellia sinensis"
        ],
        "image_url": "/uploads/commodities/tea.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Coffee",
        "english_name": "Coffee",
        "hindi_name": "कॉफ़ी",
        "marathi_name": "कॉफी",
        "category": "Commercial / Plantation Crops",
        "sub_category": "Plantation",
        "perishability_class": "LOW",
        "default_collection_window_hours": 72.0,
        "aliases": [
            "coffee",
            "arabica",
            "robusta",
            "coffee beans",
            "कॉफ़ी",
            "कॉफी",
            "coffea"
        ],
        "transliterations": [],
        "search_keywords": [
            "coffee coffee कॉफ़ी कॉफी coffee arabica robusta coffee beans कॉफ़ी कॉफी coffea"
        ],
        "image_url": "/uploads/commodities/coffee.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Jute",
        "english_name": "Jute",
        "hindi_name": "पटसन",
        "marathi_name": "ताग",
        "category": "Commercial / Plantation Crops",
        "sub_category": "Fiber",
        "perishability_class": "LOW",
        "default_collection_window_hours": 72.0,
        "aliases": [
            "jute",
            "patsan",
            "taag",
            "golden fiber",
            "पटसन",
            "ताग",
            "corchorus"
        ],
        "transliterations": [],
        "search_keywords": [
            "jute jute पटसन ताग jute patsan taag golden fiber पटसन ताग corchorus"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Marigold",
        "english_name": "Marigold",
        "hindi_name": "गेंदा",
        "marathi_name": "झेंडू",
        "category": "Flowers",
        "sub_category": "Cut Flowers",
        "perishability_class": "HIGH",
        "default_collection_window_hours": 12.0,
        "aliases": [
            "marigold",
            "genda",
            "zendu",
            "jhendu",
            "zhendu phool",
            "गेंदा",
            "झेंडू",
            "tagetes"
        ],
        "transliterations": [],
        "search_keywords": [
            "marigold marigold गेंदा झेंडू marigold genda zendu jhendu zhendu phool गेंदा झेंडू tagetes"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Rose",
        "english_name": "Rose",
        "hindi_name": "गुलाब",
        "marathi_name": "गुलाब",
        "category": "Flowers",
        "sub_category": "Cut Flowers",
        "perishability_class": "HIGH",
        "default_collection_window_hours": 12.0,
        "aliases": [
            "rose",
            "gulab",
            "gulabi",
            "taj rose",
            "गुलाब",
            "rosa"
        ],
        "transliterations": [],
        "search_keywords": [
            "rose rose गुलाब गुलाब rose gulab gulabi taj rose गुलाब rosa"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Ashwagandha",
        "english_name": "Ashwagandha / Indian Ginseng",
        "hindi_name": "अश्वगंधा",
        "marathi_name": "अश्वगंधा",
        "category": "Medicinal & Aromatic",
        "sub_category": "Medicinal Roots",
        "perishability_class": "LOW",
        "default_collection_window_hours": 72.0,
        "aliases": [
            "ashwagandha",
            "asgandh",
            "indian ginseng",
            "winter cherry",
            "अश्वगंधा",
            "withania somnifera"
        ],
        "transliterations": [],
        "search_keywords": [
            "ashwagandha ashwagandha / indian ginseng अश्वगंधा अश्वगंधा ashwagandha asgandh indian ginseng winter cherry अश्वगंधा withania somnifera"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Mint",
        "english_name": "Mint / Pudina",
        "hindi_name": "पुदीना",
        "marathi_name": "पुदिना",
        "category": "Medicinal & Aromatic",
        "sub_category": "Herbs",
        "perishability_class": "HIGH",
        "default_collection_window_hours": 12.0,
        "aliases": [
            "mint",
            "pudina",
            "pudina leaves",
            "mentha",
            "पुदीना",
            "पुदिना"
        ],
        "transliterations": [],
        "search_keywords": [
            "mint mint / pudina पुदीना पुदिना mint pudina pudina leaves mentha पुदीना पुदिना"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Foxtail Millet",
        "english_name": "Foxtail Millet / Kangni",
        "hindi_name": "कंगनी",
        "marathi_name": "कांग",
        "category": "Cereals / Food Grains",
        "sub_category": "Millets",
        "perishability_class": "LOW",
        "default_collection_window_hours": 72.0,
        "aliases": [
            "foxtail millet",
            "kangni",
            "kang",
            "kakum",
            "कंगनी",
            "कांग",
            "setaria italica"
        ],
        "transliterations": [],
        "search_keywords": [
            "foxtail millet foxtail millet / kangni कंगनी कांग foxtail millet kangni kang kakum कंगनी कांग setaria italica"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Kodo Millet",
        "english_name": "Kodo Millet",
        "hindi_name": "कोदो",
        "marathi_name": "कोद्रा",
        "category": "Cereals / Food Grains",
        "sub_category": "Millets",
        "perishability_class": "LOW",
        "default_collection_window_hours": 72.0,
        "aliases": [
            "kodo millet",
            "kodo",
            "kodra",
            "कोदो",
            "कोद्रा",
            "paspalum scrobiculatum"
        ],
        "transliterations": [],
        "search_keywords": [
            "kodo millet kodo millet कोदो कोद्रा kodo millet kodo kodra कोदो कोद्रा paspalum scrobiculatum"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Cowpea",
        "english_name": "Cowpea / Lobia / Chawli",
        "hindi_name": "लोबिया",
        "marathi_name": "चवळी",
        "category": "Pulses",
        "sub_category": "Beans",
        "perishability_class": "LOW",
        "default_collection_window_hours": 72.0,
        "aliases": [
            "cowpea",
            "lobia",
            "chawli",
            "chavali",
            "black eyed pea",
            "लोबिया",
            "चवळी",
            "vigna unguiculata"
        ],
        "transliterations": [],
        "search_keywords": [
            "cowpea cowpea / lobia / chawli लोबिया चवळी cowpea lobia chawli chavali black eyed pea लोबिया चवळी vigna unguiculata"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Horse Gram",
        "english_name": "Horse Gram / Kulthi",
        "hindi_name": "कुलथी",
        "marathi_name": "हुलगा",
        "category": "Pulses",
        "sub_category": "Pulses",
        "perishability_class": "LOW",
        "default_collection_window_hours": 72.0,
        "aliases": [
            "horse gram",
            "kulthi",
            "hulga",
            "kulti",
            "कुलथी",
            "हुलगा",
            "macrotyloma uniflorum"
        ],
        "transliterations": [],
        "search_keywords": [
            "horse gram horse gram / kulthi कुलथी हुलगा horse gram kulthi hulga kulti कुलथी हुलगा macrotyloma uniflorum"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Beetroot",
        "english_name": "Beetroot",
        "hindi_name": "चुकंदर",
        "marathi_name": "बीट",
        "category": "Vegetables",
        "sub_category": "Root Vegetables",
        "perishability_class": "MEDIUM",
        "default_collection_window_hours": 48.0,
        "aliases": [
            "beetroot",
            "beet",
            "chukandar",
            "chukander",
            "beet root",
            "चुकंदर",
            "बीट",
            "beta vulgaris"
        ],
        "transliterations": [],
        "search_keywords": [
            "beetroot beetroot चुकंदर बीट beetroot beet chukandar chukander beet root चुकंदर बीट beta vulgaris"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Drumstick",
        "english_name": "Drumstick / Moringa",
        "hindi_name": "सहजन",
        "marathi_name": "शेवगा",
        "category": "Vegetables",
        "sub_category": "Pods",
        "perishability_class": "HIGH",
        "default_collection_window_hours": 18.0,
        "aliases": [
            "drumstick",
            "moringa",
            "sahjan",
            "sehjan",
            "shevga",
            "shewaga",
            "सहजन",
            "शेवगा",
            "moringa oleifera"
        ],
        "transliterations": [],
        "search_keywords": [
            "drumstick drumstick / moringa सहजन शेवगा drumstick moringa sahjan sehjan shevga shewaga सहजन शेवगा moringa oleifera"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "French Beans",
        "english_name": "French Beans / Falguni",
        "hindi_name": "फ्रेंच बीन्स",
        "marathi_name": "फरसबी",
        "category": "Vegetables",
        "sub_category": "Beans",
        "perishability_class": "HIGH",
        "default_collection_window_hours": 18.0,
        "aliases": [
            "french beans",
            "beans",
            "farasbi",
            "faras bee",
            "green beans",
            "फ्रेंच बीन्स",
            "फरसबी"
        ],
        "transliterations": [],
        "search_keywords": [
            "french beans french beans / falguni फ्रेंच बीन्स फरसबी french beans beans farasbi faras bee green beans फ्रेंच बीन्स फरसबी"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Sweet Potato",
        "english_name": "Sweet Potato",
        "hindi_name": "शकरकंद",
        "marathi_name": "रताळे",
        "category": "Vegetables",
        "sub_category": "Tubers",
        "perishability_class": "MEDIUM",
        "default_collection_window_hours": 48.0,
        "aliases": [
            "sweet potato",
            "shakarkand",
            "ratale",
            "ratali",
            "शकरकंद",
            "रताळे",
            "ipomoea batatas"
        ],
        "transliterations": [],
        "search_keywords": [
            "sweet potato sweet potato शकरकंद रताळे sweet potato shakarkand ratale ratali शकरकंद रताळे ipomoea batatas"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Ivy Gourd",
        "english_name": "Ivy Gourd / Tindora",
        "hindi_name": "कुंदरू",
        "marathi_name": "तोंडली",
        "category": "Vegetables",
        "sub_category": "Cucurbits",
        "perishability_class": "HIGH",
        "default_collection_window_hours": 18.0,
        "aliases": [
            "ivy gourd",
            "tindora",
            "kundru",
            "tondli",
            "tindli",
            "kundroo",
            "कुंदरू",
            "तोंडली",
            "coccinia grandis"
        ],
        "transliterations": [],
        "search_keywords": [
            "ivy gourd ivy gourd / tindora कुंदरू तोंडली ivy gourd tindora kundru tondli tindli kundroo कुंदरू तोंडली coccinia grandis"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Pointed Gourd",
        "english_name": "Pointed Gourd / Parwal",
        "hindi_name": "परवल",
        "marathi_name": "परवळ",
        "category": "Vegetables",
        "sub_category": "Cucurbits",
        "perishability_class": "HIGH",
        "default_collection_window_hours": 18.0,
        "aliases": [
            "pointed gourd",
            "parwal",
            "parval",
            "patal",
            "potal",
            "परवल",
            "परवळ",
            "trichosanthes dioica"
        ],
        "transliterations": [],
        "search_keywords": [
            "pointed gourd pointed gourd / parwal परवल परवळ pointed gourd parwal parval patal potal परवल परवळ trichosanthes dioica"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Chikoo",
        "english_name": "Chikoo / Sapota",
        "hindi_name": "चीकू",
        "marathi_name": "चिकू",
        "category": "Fruits",
        "sub_category": "Tropical",
        "perishability_class": "HIGH",
        "default_collection_window_hours": 24.0,
        "aliases": [
            "chikoo",
            "chiku",
            "sapota",
            "sapodilla",
            "चीकू",
            "चिकू",
            "manilkara zapota",
            "dahanu chikoo"
        ],
        "transliterations": [],
        "search_keywords": [
            "chikoo chikoo / sapota चीकू चिकू chikoo chiku sapota sapodilla चीकू चिकू manilkara zapota dahanu chikoo"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Fig",
        "english_name": "Fig / Anjeer",
        "hindi_name": "अंजीर",
        "marathi_name": "अंजीर",
        "category": "Fruits",
        "sub_category": "Subtropical",
        "perishability_class": "HIGH",
        "default_collection_window_hours": 24.0,
        "aliases": [
            "fig",
            "anjeer",
            "anjir",
            "अंजीर",
            "ficus carica",
            "rajewadi anjeer"
        ],
        "transliterations": [],
        "search_keywords": [
            "fig fig / anjeer अंजीर अंजीर fig anjeer anjir अंजीर ficus carica rajewadi anjeer"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Jackfruit",
        "english_name": "Jackfruit",
        "hindi_name": "कटहल",
        "marathi_name": "फणस",
        "category": "Fruits",
        "sub_category": "Tropical",
        "perishability_class": "HIGH",
        "default_collection_window_hours": 24.0,
        "aliases": [
            "jackfruit",
            "kathal",
            "fanas",
            "phanas",
            "कटहल",
            "फणस",
            "artocarpus heterophyllus"
        ],
        "transliterations": [],
        "search_keywords": [
            "jackfruit jackfruit कटहल फणस jackfruit kathal fanas phanas कटहल फणस artocarpus heterophyllus"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Coconut",
        "english_name": "Coconut",
        "hindi_name": "नारियल",
        "marathi_name": "नारळ",
        "category": "Fruits",
        "sub_category": "Plantation / Fruit",
        "perishability_class": "LOW",
        "default_collection_window_hours": 72.0,
        "aliases": [
            "coconut",
            "nariyal",
            "naral",
            "shrifal",
            "नारियल",
            "नारळ",
            "cocos nucifera"
        ],
        "transliterations": [],
        "search_keywords": [
            "coconut coconut नारियल नारळ coconut nariyal naral shrifal नारियल नारळ cocos nucifera"
        ],
        "image_url": "/uploads/commodities/coconut.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Amla",
        "english_name": "Amla / Indian Gooseberry",
        "hindi_name": "आंवला",
        "marathi_name": "आवळा",
        "category": "Fruits",
        "sub_category": "Medicinal Fruit",
        "perishability_class": "MEDIUM",
        "default_collection_window_hours": 48.0,
        "aliases": [
            "amla",
            "aonla",
            "avla",
            "awla",
            "indian gooseberry",
            "आंवला",
            "आवळा",
            "phyllanthus emblica"
        ],
        "transliterations": [],
        "search_keywords": [
            "amla amla / indian gooseberry आंवला आवळा amla aonla avla awla indian gooseberry आंवला आवळा phyllanthus emblica"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Strawberry",
        "english_name": "Strawberry",
        "hindi_name": "स्ट्रॉबेरी",
        "marathi_name": "स्ट्रॉबेरी",
        "category": "Fruits",
        "sub_category": "Berries",
        "perishability_class": "HIGH",
        "default_collection_window_hours": 12.0,
        "aliases": [
            "strawberry",
            "strawberries",
            "mahabaleshwar strawberry",
            "स्ट्रॉबेरी",
            "fragaria"
        ],
        "transliterations": [],
        "search_keywords": [
            "strawberry strawberry स्ट्रॉबेरी स्ट्रॉबेरी strawberry strawberries mahabaleshwar strawberry स्ट्रॉबेरी fragaria"
        ],
        "image_url": "/uploads/commodities/strawberry.jpg",
        "image_source": "Verified Produce Photograph (Unsplash License)"
    },
    {
        "canonical_name": "Fennel",
        "english_name": "Fennel Seed / Saunf",
        "hindi_name": "सौंफ",
        "marathi_name": "बडीशेप",
        "category": "Spices",
        "sub_category": "Seed Spices",
        "perishability_class": "LOW",
        "default_collection_window_hours": 72.0,
        "aliases": [
            "fennel",
            "saunf",
            "badishep",
            "badishep",
            "fennel seed",
            "सौंफ",
            "बडीशेप",
            "foeniculum vulgare"
        ],
        "transliterations": [],
        "search_keywords": [
            "fennel fennel seed / saunf सौंफ बडीशेप fennel saunf badishep badishep fennel seed सौंफ बडीशेप foeniculum vulgare"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Ajwain",
        "english_name": "Ajwain / Carom Seeds",
        "hindi_name": "अजवाइन",
        "marathi_name": "ओवा",
        "category": "Spices",
        "sub_category": "Seed Spices",
        "perishability_class": "LOW",
        "default_collection_window_hours": 72.0,
        "aliases": [
            "ajwain",
            "carom seed",
            "ova",
            "omam",
            "अजवाइन",
            "ओवा",
            "trachyspermum ammi"
        ],
        "transliterations": [],
        "search_keywords": [
            "ajwain ajwain / carom seeds अजवाइन ओवा ajwain carom seed ova omam अजवाइन ओवा trachyspermum ammi"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Clove",
        "english_name": "Clove / Laung",
        "hindi_name": "लौंग",
        "marathi_name": "लवंग",
        "category": "Spices",
        "sub_category": "Tree Spices",
        "perishability_class": "LOW",
        "default_collection_window_hours": 72.0,
        "aliases": [
            "clove",
            "laung",
            "lavang",
            "cloves",
            "लौंग",
            "लवंग",
            "syzygium aromaticum"
        ],
        "transliterations": [],
        "search_keywords": [
            "clove clove / laung लौंग लवंग clove laung lavang cloves लौंग लवंग syzygium aromaticum"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Cinnamon",
        "english_name": "Cinnamon / Dalchini",
        "hindi_name": "दालचीनी",
        "marathi_name": "दालचिनी",
        "category": "Spices",
        "sub_category": "Tree Spices",
        "perishability_class": "LOW",
        "default_collection_window_hours": 72.0,
        "aliases": [
            "cinnamon",
            "dalchini",
            "dalchini stick",
            "दालचीनी",
            "दालचिनी",
            "cinnamomum verum"
        ],
        "transliterations": [],
        "search_keywords": [
            "cinnamon cinnamon / dalchini दालचीनी दालचिनी cinnamon dalchini dalchini stick दालचीनी दालचिनी cinnamomum verum"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Arecanut",
        "english_name": "Arecanut / Betel Nut / Supari",
        "hindi_name": "सुपारी",
        "marathi_name": "सुपारी",
        "category": "Commercial / Plantation Crops",
        "sub_category": "Plantation",
        "perishability_class": "LOW",
        "default_collection_window_hours": 72.0,
        "aliases": [
            "arecanut",
            "areca nut",
            "supari",
            "betel nut",
            "सुपारी",
            "areca catechu"
        ],
        "transliterations": [],
        "search_keywords": [
            "arecanut arecanut / betel nut / supari सुपारी सुपारी arecanut areca nut supari betel nut सुपारी areca catechu"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Betel Leaf",
        "english_name": "Betel Leaf / Paan",
        "hindi_name": "पान",
        "marathi_name": "नागवेलीचे पान",
        "category": "Commercial / Plantation Crops",
        "sub_category": "Commercial",
        "perishability_class": "HIGH",
        "default_collection_window_hours": 12.0,
        "aliases": [
            "betel leaf",
            "paan",
            "pan",
            "nagveli",
            "vidyache pan",
            "पान",
            "piper betle"
        ],
        "transliterations": [],
        "search_keywords": [
            "betel leaf betel leaf / paan पान नागवेलीचे पान betel leaf paan pan nagveli vidyache pan पान piper betle"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Jasmine",
        "english_name": "Jasmine / Mogra",
        "hindi_name": "मोगरा",
        "marathi_name": "मोगरा",
        "category": "Flowers",
        "sub_category": "Cut Flowers / Fragrant",
        "perishability_class": "HIGH",
        "default_collection_window_hours": 12.0,
        "aliases": [
            "jasmine",
            "mogra",
            "chameli",
            "bela",
            "मोगरा",
            "jasminum sambac"
        ],
        "transliterations": [],
        "search_keywords": [
            "jasmine jasmine / mogra मोगरा मोगरा jasmine mogra chameli bela मोगरा jasminum sambac"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Chrysanthemum",
        "english_name": "Chrysanthemum / Shevanti",
        "hindi_name": "गुलदाउदी",
        "marathi_name": "शेवंती",
        "category": "Flowers",
        "sub_category": "Cut Flowers",
        "perishability_class": "HIGH",
        "default_collection_window_hours": 12.0,
        "aliases": [
            "chrysanthemum",
            "shevanti",
            "guldaudi",
            "shewati",
            "गुलदाउदी",
            "शेवंती"
        ],
        "transliterations": [],
        "search_keywords": [
            "chrysanthemum chrysanthemum / shevanti गुलदाउदी शेवंती chrysanthemum shevanti guldaudi shewati गुलदाउदी शेवंती"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Tulsi",
        "english_name": "Tulsi / Holy Basil",
        "hindi_name": "तुलसी",
        "marathi_name": "तुळस",
        "category": "Medicinal & Aromatic",
        "sub_category": "Herbs",
        "perishability_class": "HIGH",
        "default_collection_window_hours": 24.0,
        "aliases": [
            "tulsi",
            "holy basil",
            "tulas",
            "shyama tulsi",
            "तुलसी",
            "तुळस",
            "ocimum tenuiflorum"
        ],
        "transliterations": [],
        "search_keywords": [
            "tulsi tulsi / holy basil तुलसी तुळस tulsi holy basil tulas shyama tulsi तुलसी तुळस ocimum tenuiflorum"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Aloe Vera",
        "english_name": "Aloe Vera / Ghritkumari",
        "hindi_name": "घृतकुमारी",
        "marathi_name": "कोरफड",
        "category": "Medicinal & Aromatic",
        "sub_category": "Succulents",
        "perishability_class": "HIGH",
        "default_collection_window_hours": 24.0,
        "aliases": [
            "aloe vera",
            "aloevera",
            "ghritkumari",
            "korfad",
            "korphad",
            "घृतकुमारी",
            "कोरफड",
            "aloe barbadensis"
        ],
        "transliterations": [],
        "search_keywords": [
            "aloe vera aloe vera / ghritkumari घृतकुमारी कोरफड aloe vera aloevera ghritkumari korfad korphad घृतकुमारी कोरफड aloe barbadensis"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    },
    {
        "canonical_name": "Lemongrass",
        "english_name": "Lemongrass / Gavati Chaha",
        "hindi_name": "लेमनग्रास",
        "marathi_name": "गवती चहा",
        "category": "Medicinal & Aromatic",
        "sub_category": "Aromatic Grass",
        "perishability_class": "HIGH",
        "default_collection_window_hours": 24.0,
        "aliases": [
            "lemongrass",
            "lemon grass",
            "gavati chaha",
            "cymbopogon",
            "गवती चहा"
        ],
        "transliterations": [],
        "search_keywords": [
            "lemongrass lemongrass / gavati chaha लेमनग्रास गवती चहा lemongrass lemon grass gavati chaha cymbopogon गवती चहा"
        ],
        "image_url": "/uploads/commodities/placeholder.svg",
        "image_source": "AgriSaathi Neutral Agricultural Placeholder"
    }
]
