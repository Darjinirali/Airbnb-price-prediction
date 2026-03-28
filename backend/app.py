"""
StayWorth Backend - Flask API

📁 FOLDER STRUCTURE:
backend/
├── app.py                   ← Ye file (Flask server)
├── requirements.txt         ← pip install -r requirements.txt
├── airbnb_model.ipynb       ← Jupyter notebook (model research/training)
│
├── data/                    ← AUTO-CREATE hota hai
│   ├── users.json           ← Registered users
│   └── real_data.csv        ← ⭐ REAL USER DATA YAH SAVE HOTI HAI
│                               (har form submission yahan aata hai)
│
└── model/                   ← AUTO-CREATE hota hai
    └── model.pkl            ← Trained ML model (auto-save)

📓 NOTEBOOK (airbnb_model.ipynb) KA USE:
- Research aur experimentation ke liye rakhein
- Advanced model train karna ho (XGBoost/LightGBM/CatBoost) toh notebook chalao
- Notebook mein train_data.csv use hota hai (Airbnb original dataset)
- app.py mein GradientBoosting use hota hai (fast, no GPU needed)

🔄 AUTO-RETRAIN:
- Har 10 real user submissions ke baad model auto-retrain hota hai
- real_data.csv + 1000 dummy data se train hota hai
"""

from flask import Flask, request, jsonify, session
from flask_cors import CORS
import json, os, pickle, numpy as np, pandas as pd
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

app = Flask(__name__)
app.secret_key = 'stayworth_secret_2024'
app.config['SESSION_COOKIE_SAMESITE'] = 'None'
app.config['SESSION_COOKIE_SECURE'] = False
app.config['SESSION_COOKIE_HTTPONLY'] = True
CORS(app, supports_credentials=True, origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:3000"])

# ─── Paths ───────────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
DATA_DIR   = os.path.join(BASE_DIR, 'data')    # ← real_data.csv yahan hogi
MODEL_FILE = os.path.join(BASE_DIR, 'model', 'model.pkl')
USERS_FILE = os.path.join(DATA_DIR, 'users.json')
REAL_DATA  = os.path.join(DATA_DIR, 'real_data.csv')  # ⭐ REAL DATA FILE

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(os.path.join(BASE_DIR, 'model'), exist_ok=True)

# ─── Auto-retrain threshold ───────────────────────────────────────────────────
RETRAIN_EVERY = 10   # Har 10 real submissions ke baad retrain karo

# ─── City coordinates (for geo features) ─────────────────────────────────────
CITY_COORDS = {
    'NYC':     (40.7128, -74.0060),
    'LA':      (34.0522, -118.2437),
    'Chicago': (41.8781, -87.6298),
    'SF':      (37.7749, -122.4194),
    'Miami':   (25.7617, -80.1918),
}

# ─── Amenity list ─────────────────────────────────────────────────────────────
AMENITY_LIST = [
    'wifi', 'ac', 'kitchen', 'tv', 'washer', 'parking',
    'gym', 'pool', 'elevator', 'doorman', 'pets', 'breakfast'
]

# ═══════════════════════════════════════════════════════════════════════════════
#  FEATURE ENGINEERING  (notebook logic ko replicate kiya)
# ═══════════════════════════════════════════════════════════════════════════════
def build_features(row: dict) -> pd.DataFrame:
    """
    Frontend ka form → ML features DataFrame
    row keys: city, property_type, room_type, accommodates, bedrooms,
              beds, bathrooms, review_scores_rating, number_of_reviews,
              cancellation_policy, cleaning_fee, name, amenities (list)
    """
    amenities = row.get('amenities', [])
    if isinstance(amenities, str):
        amenities = json.loads(amenities)
    amenities_str = ', '.join(amenities).lower()

    lat, lon = CITY_COORDS.get(row.get('city', 'NYC'), (40.7, -74.0))
    name_text = str(row.get('name', '')).lower()

    # ─── Numeric base ────────────────────────────────────────────────────────
    accommodates = float(row.get('accommodates', 4))
    bedrooms     = float(row.get('bedrooms', 1))
    beds         = float(row.get('beds', 1))
    bathrooms    = float(row.get('bathrooms', 1.0))
    rating       = float(row.get('review_scores_rating', 90))
    n_reviews    = float(row.get('number_of_reviews', 10))

    # ─── Amenity flags ───────────────────────────────────────────────────────
    has_wifi      = int('wifi' in amenities_str)
    has_ac        = int('ac' in amenities or 'air conditioning' in amenities_str)
    has_kitchen   = int('kitchen' in amenities_str)
    has_tv        = int('tv' in amenities or '"tv"' in amenities_str)
    has_washer    = int('washer' in amenities_str)
    has_parking   = int('parking' in amenities_str)
    has_gym       = int('gym' in amenities_str)
    has_pool      = int('pool' in amenities_str)
    has_elevator  = int('elevator' in amenities_str)
    has_doorman   = int('doorman' in amenities_str)
    has_breakfast = int('breakfast' in amenities_str)
    has_pets      = int('pets' in amenities_str)
    has_dryer     = 0
    has_heating   = 1
    has_shampoo   = 0
    has_iron      = 0
    has_hangers   = 0
    has_laptop    = 0
    amenity_count = len(amenities)

    luxury_bundle    = has_pool*3 + has_gym*2 + has_doorman*2 + has_elevator + has_parking
    essentials_score = has_wifi + has_kitchen + has_heating + has_washer + has_dryer + has_tv
    comfort_score    = has_iron + has_hangers + has_shampoo + has_laptop + has_breakfast
    safety_score     = 2  # default

    # ─── Ratios ──────────────────────────────────────────────────────────────
    beds_per_person  = beds / max(accommodates, 1)
    bath_per_person  = bathrooms / max(accommodates, 1)
    bed_bath_ratio   = beds / (bathrooms + 0.5)
    room_per_person  = bedrooms / max(accommodates, 1)
    beds_per_bedroom = beds / (bedrooms + 0.5)

    # ─── Log/Sqrt ────────────────────────────────────────────────────────────
    log_reviews       = np.log1p(n_reviews)
    log_accommodates  = np.log1p(accommodates)
    sqrt_accommodates = np.sqrt(accommodates)
    sqrt_reviews      = np.sqrt(n_reviews)
    log_amenity_count = np.log1p(amenity_count)

    # ─── Rating flags ────────────────────────────────────────────────────────
    high_rating    = int(rating >= 95)
    low_rating     = int(rating < 80)
    perfect_rating = int(rating == 100)
    new_listing    = int(n_reviews == 0)
    popular        = int(n_reviews > 20)
    experienced    = int(n_reviews > 50)

    composite_review = rating / 100.0

    # ─── Geo ─────────────────────────────────────────────────────────────────
    lat_lon_interact = lat * lon
    lat_rounded      = round(lat * 10) / 10
    lon_rounded      = round(lon * 10) / 10

    # ─── Geo cluster proxy ───────────────────────────────────────────────────
    # Simple bucketing as proxy for KMeans
    geo_cluster_20 = int(abs(lat * lon) % 20)
    geo_cluster_50 = int(abs(lat * lon) % 50)

    # ─── Name features ───────────────────────────────────────────────────────
    luxury_words  = ['luxury','penthouse','villa','mansion','private','exclusive','premium','stunning']
    cozy_words    = ['cozy','cosy','charming','quaint','cute','tiny']
    space_words   = ['spacious','large','huge','big','entire','rooftop']
    location_words= ['downtown','central','prime','heart','beachfront','ocean view','city view']

    name_has_luxury   = int(any(w in name_text for w in luxury_words))
    name_has_cozy     = int(any(w in name_text for w in cozy_words))
    name_has_spacious = int(any(w in name_text for w in space_words))
    name_has_location = int(any(w in name_text for w in location_words))
    name_length       = len(name_text)
    name_word_count   = len(name_text.split())
    name_has_number   = int(any(c.isdigit() for c in name_text))

    # ─── Capacity flags ──────────────────────────────────────────────────────
    is_large     = int(accommodates >= 6)
    is_studio    = int(bedrooms <= 1)
    is_whole_apt = int(bedrooms >= 2)
    accom_sq     = accommodates ** 2
    bedrooms_sq  = bedrooms ** 2
    accom_x_bath = accommodates * bathrooms
    bed_x_bath   = bedrooms * bathrooms
    luxury_x_accom = luxury_bundle * accommodates

    # ─── City / room_type encoding (simple ordinal) ──────────────────────────
    city_map      = {'NYC':0,'LA':1,'Chicago':2,'SF':3,'Miami':4}
    room_map      = {'Entire home/apt':0,'Private room':1,'Shared room':2}
    prop_map      = {'Apartment':0,'House':1,'Loft':2,'Villa':3}
    cancel_map    = {'strict':0,'moderate':1,'flexible':2,'super_strict_30':3,'super_strict_60':4}
    cleaning_map  = {True:1,False:0,'true':1,'false':0,'True':1,'False':0,1:1,0:0}

    city_enc    = city_map.get(row.get('city','NYC'), 0)
    room_enc    = room_map.get(row.get('room_type','Entire home/apt'), 0)
    prop_enc    = prop_map.get(row.get('property_type','Apartment'), 0)
    cancel_enc  = cancel_map.get(row.get('cancellation_policy','strict'), 0)
    cleaning_enc= cleaning_map.get(row.get('cleaning_fee', 1), 1)

    # ─── Target-encoding proxies ─────────────────────────────────────────────
    # Based on observed averages from the training notebook
    city_te_map = {'NYC':4.8,'LA':4.65,'Chicago':4.5,'SF':4.9,'Miami':4.7}
    room_te_map = {'Entire home/apt':5.0,'Private room':4.2,'Shared room':3.8}

    city_te     = city_te_map.get(row.get('city','NYC'), 4.7)
    room_te     = room_te_map.get(row.get('room_type','Entire home/apt'), 4.8)
    city_room_te= city_te * 0.6 + room_te * 0.4
    nb_te       = city_te

    nb_te_x_accom    = nb_te * accommodates
    room_te_x_accom  = room_te * accommodates
    city_room_x_accom= city_room_te * accommodates
    city_room_x_bed  = city_room_te * bedrooms
    nb_te_x_room     = nb_te * room_enc
    te_per_person    = nb_te / max(accommodates, 1)
    zip_x_accom      = city_te * accommodates
    city_zip_te      = city_te
    city_nb_te       = city_te

    # ─── Host defaults ───────────────────────────────────────────────────────
    host_response_rate_num = 95.0
    host_experience_years  = 3.0
    host_exp_bucket        = 3
    listing_age_days       = 500
    days_since_last_review = 30
    is_recently_reviewed   = 1
    is_stale               = 0
    log_listing_age        = np.log1p(listing_age_days)
    reviews_per_day        = n_reviews / max(listing_age_days, 1)
    log_reviews_per_day    = np.log1p(reviews_per_day)
    host_listings_count    = 1
    is_multi_host          = 0
    is_superhost_proxy     = 0
    log_host_listings      = 0.0
    is_long_term           = 0
    is_short_term          = 1
    log_min_nights         = 0.0
    minimum_nights         = 1

    # ─── Assemble DataFrame ──────────────────────────────────────────────────
    f = {
        # Core
        'accommodates': accommodates, 'bedrooms': bedrooms, 'beds': beds,
        'bathrooms': bathrooms, 'review_scores_rating': rating,
        'number_of_reviews': n_reviews,
        # Encoding
        'city': city_enc, 'room_type': room_enc, 'property_type': prop_enc,
        'cancellation_policy': cancel_enc, 'cleaning_fee': cleaning_enc,
        'instant_bookable': 0, 'host_has_profile_pic': 1,
        'host_identity_verified': 1,
        # Amenities
        'has_wifi': has_wifi, 'has_ac': has_ac, 'has_kitchen': has_kitchen,
        'has_tv': has_tv, 'has_washer': has_washer, 'has_dryer': has_dryer,
        'has_parking': has_parking, 'has_gym': has_gym, 'has_pool': has_pool,
        'has_elevator': has_elevator, 'has_doorman': has_doorman,
        'has_breakfast': has_breakfast, 'has_pets': has_pets,
        'has_hottub': 0, 'has_heating': has_heating, 'has_shampoo': has_shampoo,
        'has_iron': has_iron, 'has_hangers': has_hangers,
        'has_laptop_friendly': has_laptop, 'has_smoke_detector': 1,
        'has_carbon_detector': 1, 'has_fire_extinguish': 1, 'has_first_aid': 0,
        'amenity_count': amenity_count, 'log_amenity_count': log_amenity_count,
        'safety_score': safety_score, 'luxury_bundle': luxury_bundle,
        'essentials_score': essentials_score, 'comfort_score': comfort_score,
        # Ratios
        'beds_per_person': beds_per_person, 'bath_per_person': bath_per_person,
        'bed_bath_ratio': bed_bath_ratio, 'room_per_person': room_per_person,
        'beds_per_bedroom': beds_per_bedroom,
        # Log/sqrt
        'log_reviews': log_reviews, 'log_accommodates': log_accommodates,
        'sqrt_accommodates': sqrt_accommodates, 'sqrt_reviews': sqrt_reviews,
        # Rating flags
        'high_rating': high_rating, 'low_rating': low_rating,
        'perfect_rating': perfect_rating, 'new_listing': new_listing,
        'popular_listing': popular, 'experienced_host': experienced,
        'composite_review_score': composite_review, 'review_score_spread': 0.5,
        # Geo
        'latitude': lat, 'longitude': lon,
        'lat_lon_interact': lat_lon_interact,
        'lat_rounded': lat_rounded, 'lon_rounded': lon_rounded,
        'geo_cluster_20': geo_cluster_20, 'geo_cluster_50': geo_cluster_50,
        # Name
        'name_has_luxury': name_has_luxury, 'name_has_cozy': name_has_cozy,
        'name_has_spacious': name_has_spacious, 'name_has_location': name_has_location,
        'name_length': name_length, 'name_word_count': name_word_count,
        'name_has_number': name_has_number,
        # Host
        'host_response_rate_num': host_response_rate_num,
        'host_experience_years': host_experience_years,
        'host_exp_bucket': host_exp_bucket,
        'listing_age_days': listing_age_days,
        'days_since_last_review': days_since_last_review,
        'is_recently_reviewed': is_recently_reviewed,
        'is_stale_listing': is_stale,
        'log_listing_age': log_listing_age,
        'reviews_per_day': reviews_per_day,
        'log_reviews_per_day': log_reviews_per_day,
        'host_listings_count': host_listings_count,
        'is_multi_host': is_multi_host,
        'is_superhost_proxy': is_superhost_proxy,
        'log_host_listings': log_host_listings,
        'is_large_listing': is_large, 'is_studio': is_studio,
        'is_whole_apt': is_whole_apt,
        'accommodates_sq': accom_sq, 'bedrooms_sq': bedrooms_sq,
        'minimum_nights': minimum_nights,
        'is_long_term': is_long_term, 'is_short_term': is_short_term,
        'log_min_nights': log_min_nights,
        'neighbourhood_enc': 0,
        # TE
        'city_te': city_te, 'room_type_te': room_te,
        'property_type_te': 4.6, 'cancellation_policy_te': 4.7,
        'geo_cluster_20_te': city_te, 'geo_cluster_50_te': city_te,
        'neighbourhood_enc_te': city_te,
        'city_room_te': city_room_te, 'city_prop_te': city_te,
        'city_std_price': 0.5,
        'city_nb_te': city_nb_te, 'city_zip_te': city_zip_te,
        # Interactions
        'accom_x_bath': accom_x_bath, 'bed_x_bath': bed_x_bath,
        'luxury_x_accom': luxury_x_accom,
        'room_te_x_accom': room_te_x_accom,
        'city_room_x_accom': city_room_x_accom,
        'city_room_x_bed': city_room_x_bed,
        'nb_te_x_accom': nb_te_x_accom, 'nb_te_x_room': nb_te_x_room,
        'te_per_person': te_per_person, 'zip_x_accom': zip_x_accom,
    }
    return pd.DataFrame([f])


# ═══════════════════════════════════════════════════════════════════════════════
#  MODEL TRAINING  (1000 dummy + real data)
# ═══════════════════════════════════════════════════════════════════════════════
def generate_dummy_data(n=1000) -> pd.DataFrame:
    """1000 realistic dummy Airbnb listings generate karo"""
    np.random.seed(42)
    cities    = list(CITY_COORDS.keys())
    prop_types= ['Apartment','House','Loft','Villa']
    room_types= ['Entire home/apt','Private room','Shared room']
    cancels   = ['strict','moderate','flexible']
    amenities_options = [
        ['wifi','kitchen','tv'],
        ['wifi','ac','kitchen','tv','washer'],
        ['wifi','ac','kitchen','pool','gym','elevator','doorman'],
        ['wifi','kitchen'],
        ['wifi','ac','kitchen','parking','washer'],
    ]

    rows = []
    for _ in range(n):
        city = np.random.choice(cities)
        prop = np.random.choice(prop_types)
        room = np.random.choice(room_types, p=[0.6,0.32,0.08])
        accom= int(np.random.choice([1,2,3,4,5,6,8], p=[0.05,0.2,0.25,0.2,0.15,0.1,0.05]))
        beds = max(1, int(np.random.choice([1,2,3,4], p=[0.4,0.3,0.2,0.1])))
        bedrooms = max(0, beds - np.random.randint(0,2))
        baths= float(np.random.choice([1,1.5,2,2.5,3], p=[0.4,0.2,0.25,0.1,0.05]))
        rating = float(np.clip(np.random.normal(92,8),60,100))
        n_rev  = int(np.random.exponential(15))
        cancel = np.random.choice(cancels)
        amen   = np.random.choice(amenities_options)

        row = {
            'city': city, 'property_type': prop, 'room_type': room,
            'accommodates': accom, 'bedrooms': bedrooms, 'beds': beds,
            'bathrooms': baths, 'review_scores_rating': rating,
            'number_of_reviews': n_rev, 'cancellation_policy': cancel,
            'cleaning_fee': np.random.randint(0,2),
            'name': 'Beautiful listing',
            'amenities': amen,
        }

        # Synthetic price formula
        base = {'NYC':180,'LA':150,'Chicago':120,'SF':200,'Miami':160}[city]
        price = base
        price *= {'Entire home/apt':1.3,'Private room':0.8,'Shared room':0.5}[room]
        price += accom * 12
        price += bedrooms * 20
        if 'pool' in amen: price += 40
        if 'gym' in amen:  price += 20
        price *= (1 + (rating - 85) / 200)
        price += np.random.normal(0, 15)
        price = max(25, price)

        row['log_price'] = float(np.log(price))
        rows.append(row)

    return pd.DataFrame(rows)


def train_model(df_extra=None):
    """
    1000 dummy data + real data se model train karo, save karo
    """
    from sklearn.ensemble import GradientBoostingRegressor
    from sklearn.metrics import r2_score
    import pickle

    print("[TRAIN] Generating dummy data...")
    df = generate_dummy_data(1000)

    # Real data merge karo agar hai
    if df_extra is not None and len(df_extra) > 0:
        print(f"[TRAIN] Adding {len(df_extra)} real data rows...")
        df = pd.concat([df, df_extra], ignore_index=True)

    print(f"[TRAIN] Total rows: {len(df)}")

    # Features build karo for each row
    X_list = []
    y_list = []
    for _, r in df.iterrows():
        try:
            feat = build_features(r.to_dict())
            X_list.append(feat.iloc[0].to_dict())
            y_list.append(float(r['log_price']))
        except:
            pass

    X = pd.DataFrame(X_list).fillna(0)
    y = np.array(y_list)

    # Save feature columns order
    feature_cols = list(X.columns)

    print(f"[TRAIN] Feature shape: {X.shape}")

    # Gradient Boosting — fast enough without GPU
    model = GradientBoostingRegressor(
        n_estimators=500, max_depth=6,
        learning_rate=0.05, subsample=0.8,
        random_state=42
    )
    model.fit(X, y)

    train_preds = model.predict(X)
    r2 = r2_score(y, train_preds)
    print(f"[TRAIN] Train R²: {r2:.4f}")

    # Save
    payload = {'model': model, 'feature_cols': feature_cols}
    with open(MODEL_FILE, 'wb') as f:
        pickle.dump(payload, f)

    print(f"[TRAIN] Model saved to {MODEL_FILE}")
    return r2, len(df)


def load_model():
    if not os.path.exists(MODEL_FILE):
        print("[INFO] Model nahi mila, train kar raha hoon...")
        train_model()
    with open(MODEL_FILE, 'rb') as f:
        return pickle.load(f)


# ═══════════════════════════════════════════════════════════════════════════════
#  AUTH ROUTES
# ═══════════════════════════════════════════════════════════════════════════════
def load_users():
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE) as f:
            return json.load(f)
    return {}

def save_users(users):
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f, indent=2)


@app.route('/register', methods=['POST'])
def register():
    data  = request.json
    name  = data.get('name','').strip()
    email = data.get('email','').strip().lower()
    pwd   = data.get('password','').strip()

    if not name or not email or not pwd:
        return jsonify({'error': 'Sab fields fill karo'}), 400
    if len(pwd) < 6:
        return jsonify({'error': 'Password 6+ characters hona chahiye'}), 400

    users = load_users()
    if email in users:
        return jsonify({'error': 'Email already registered hai'}), 409

    users[email] = {
        'name': name, 'email': email,
        'password': pwd,  # production mein hash karo!
        'created_at': datetime.now().isoformat()
    }
    save_users(users)

    session['user'] = {'name': name, 'email': email}
    return jsonify({'message': 'Registration successful!', 'user': {'name': name, 'email': email}})


@app.route('/login', methods=['POST'])
def login():
    data  = request.json
    email = data.get('email','').strip().lower()
    pwd   = data.get('password','').strip()

    users = load_users()
    if email not in users or users[email]['password'] != pwd:
        return jsonify({'error': 'Email ya password galat hai'}), 401

    user = {'name': users[email]['name'], 'email': email}
    session['user'] = user
    return jsonify({'message': 'Login successful!', 'user': user})


@app.route('/logout', methods=['POST'])
def logout():
    session.pop('user', None)
    return jsonify({'message': 'Logged out'})


@app.route('/me', methods=['GET'])
def me():
    user = session.get('user')
    if user:
        return jsonify({'user': user})
    return jsonify({'user': None}), 401


# ═══════════════════════════════════════════════════════════════════════════════
#  PREDICT ROUTE
# ═══════════════════════════════════════════════════════════════════════════════
@app.route('/predict', methods=['POST'])
def predict():
    try:
        data    = request.json
        payload = load_model()
        model   = payload['model']
        cols    = payload['feature_cols']

        X = build_features(data)

        # Align columns
        for c in cols:
            if c not in X.columns:
                X[c] = 0.0
        X = X[cols].fillna(0)

        log_pred    = model.predict(X)[0]
        nightly     = round(np.exp(log_pred))

        return jsonify({
            'nightly_rate': nightly,
            'log_price':    round(log_pred, 4),
            'city':         data.get('city','NYC'),
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ═══════════════════════════════════════════════════════════════════════════════
#  SAVE REAL DATA + AUTO-RETRAIN
# ═══════════════════════════════════════════════════════════════════════════════
@app.route('/save_data', methods=['POST'])
def save_data():
    try:
        data = request.json

        # Log price add karo agar prediction thi
        if 'predicted_price' in data:
            data['log_price'] = np.log(max(data['predicted_price'], 1))
        else:
            data['log_price'] = np.log(100)  # default fallback

        data['submitted_at'] = datetime.now().isoformat()

        # CSV mein append karo
        new_row = pd.DataFrame([data])
        if os.path.exists(REAL_DATA):
            existing = pd.read_csv(REAL_DATA)
            combined = pd.concat([existing, new_row], ignore_index=True)
        else:
            combined = new_row
        combined.to_csv(REAL_DATA, index=False)

        real_count = len(combined)

        # Auto-retrain check
        retrained = False
        if real_count % RETRAIN_EVERY == 0:
            print(f"[AUTO-RETRAIN] {real_count} entries — retraining...")
            train_model(df_extra=combined)
            retrained = True

        return jsonify({
            'message': 'Data saved!',
            'real_data_count': real_count,
            'retrained': retrained
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ═══════════════════════════════════════════════════════════════════════════════
#  MANUAL TRAIN ROUTE
# ═══════════════════════════════════════════════════════════════════════════════
@app.route('/train', methods=['POST'])
def train():
    try:
        df_extra = None
        if os.path.exists(REAL_DATA):
            df_extra = pd.read_csv(REAL_DATA)

        r2, total = train_model(df_extra=df_extra)
        return jsonify({
            'message': 'Model trained!',
            'r2': round(r2, 4),
            'total_rows': total
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ═══════════════════════════════════════════════════════════════════════════════
#  GRAPHS ROUTE
# ═══════════════════════════════════════════════════════════════════════════════
@app.route('/graphs', methods=['POST'])
def graphs():
    """
    Frontend ko chart data bhejo:
    1. City-wise avg price
    2. Room type distribution
    3. Price vs Bedrooms
    4. Price vs Accommodates
    5. Amenity impact
    """
    try:
        form = request.json

        # City comparison
        city_prices = {}
        base_form = dict(form)
        for city, base in [('NYC',180),('LA',150),('Chicago',120),('SF',200),('Miami',160)]:
            base_form['city'] = city
            try:
                payload  = load_model()
                X        = build_features(base_form)
                for c in payload['feature_cols']:
                    if c not in X.columns: X[c] = 0.0
                X = X[payload['feature_cols']].fillna(0)
                p = round(np.exp(payload['model'].predict(X)[0]))
            except:
                p = base
            city_prices[city] = p

        # Bedrooms vs price
        beds_data = []
        for b in [0,1,2,3,4]:
            bf = dict(form); bf['bedrooms'] = b
            try:
                payload = load_model()
                X = build_features(bf)
                for c in payload['feature_cols']:
                    if c not in X.columns: X[c] = 0.0
                X = X[payload['feature_cols']].fillna(0)
                p = round(np.exp(payload['model'].predict(X)[0]))
            except:
                p = 100 + b*30
            beds_data.append({'bedrooms': b, 'price': p})

        # Accommodates vs price
        accom_data = []
        for a in [1,2,3,4,5,6,8]:
            af = dict(form); af['accommodates'] = a
            try:
                payload = load_model()
                X = build_features(af)
                for c in payload['feature_cols']:
                    if c not in X.columns: X[c] = 0.0
                X = X[payload['feature_cols']].fillna(0)
                p = round(np.exp(payload['model'].predict(X)[0]))
            except:
                p = 80 + a*15
            accom_data.append({'accommodates': a, 'price': p})

        # Amenity impact
        base_price_no_amen = None
        try:
            bf = dict(form); bf['amenities'] = []
            payload = load_model()
            X = build_features(bf)
            for c in payload['feature_cols']:
                if c not in X.columns: X[c] = 0.0
            X = X[payload['feature_cols']].fillna(0)
            base_price_no_amen = round(np.exp(payload['model'].predict(X)[0]))
        except:
            base_price_no_amen = 120

        amenity_impact = []
        for amen in ['wifi','ac','kitchen','pool','gym','elevator','parking','doorman']:
            af = dict(form); af['amenities'] = [amen]
            try:
                payload = load_model()
                X = build_features(af)
                for c in payload['feature_cols']:
                    if c not in X.columns: X[c] = 0.0
                X = X[payload['feature_cols']].fillna(0)
                p = round(np.exp(payload['model'].predict(X)[0]))
            except:
                p = base_price_no_amen + 10
            amenity_impact.append({
                'amenity': amen,
                'price': p,
                'impact': p - base_price_no_amen
            })

        return jsonify({
            'city_comparison': [
                {'city': k, 'price': v} for k, v in city_prices.items()
            ],
            'bedrooms_vs_price': beds_data,
            'accommodates_vs_price': accom_data,
            'amenity_impact': sorted(amenity_impact, key=lambda x: -x['impact']),
            'room_type_prices': [
                {'room': 'Entire home/apt', 'price': round(city_prices[form.get('city','NYC')] * 1.3)},
                {'room': 'Private room', 'price': round(city_prices[form.get('city','NYC')] * 0.8)},
                {'room': 'Shared room', 'price': round(city_prices[form.get('city','NYC')] * 0.5)},
            ]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ═══════════════════════════════════════════════════════════════════════════════
#  STATUS ROUTE
# ═══════════════════════════════════════════════════════════════════════════════
@app.route('/status', methods=['GET'])
def status():
    model_exists = os.path.exists(MODEL_FILE)
    real_count = 0
    if os.path.exists(REAL_DATA):
        real_count = len(pd.read_csv(REAL_DATA))
    return jsonify({
        'model_exists': model_exists,
        'real_data_count': real_count,
        'next_retrain_at': RETRAIN_EVERY - (real_count % RETRAIN_EVERY)
    })


if __name__ == '__main__':
    import os  # Ye ensure karein ki file ke top pe import os ho
    
    print("=" * 50)
    print("  StayWorth Backend Starting...")
    print("=" * 50)
    
    # Initial model train if not exists
    if not os.path.exists(MODEL_FILE):
        print("[INIT] Training initial model with 1000 dummy samples...")
        train_model()

    # Render ke liye port environment variable se lo
    port = int(os.environ.get("PORT", 5000))
    
    # Important: 0.0.0.0 lagana zaroori hai taaki server public ho
    # Production (Render) mein debug=False rakhna better rehta hai
    app.run(host="0.0.0.0", port=port, debug=False)