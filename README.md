# StayWorth — Rental Price Estimator

## Folder Structure
```
stayworth/
├── backend/
│   ├── app.py              ← Flask API (main file)
│   ├── requirements.txt    ← Python dependencies
│   ├── data/
│   │   ├── users.json      ← User accounts (auto-created)
│   │   └── real_data.csv   ← Real submissions (auto-created)
│   └── model/
│       └── model.pkl       ← Trained ML model (auto-created)
│
└── frontend/
    ├── src/
    │   ├── context/
    │   │   └── AuthContext.tsx   ← Login/Register state
    │   ├── components/
    │   │   ├── Navbar.tsx        ← Top navigation
    │   │   └── AuthModal.tsx     ← Login/Register modal
    │   ├── pages/
    │   │   ├── Home.tsx          ← Landing page
    │   │   └── Estimate.tsx      ← Form + Price + Charts
    │   ├── App.tsx
    │   ├── main.tsx
    │   └── index.css
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── index.html
```

---

## Setup — Step by Step

### 1. Backend Setup

```bash
cd stayworth/backend

# Virtual environment banao (recommended)
python -m venv venv

# Activate karo
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Dependencies install karo
pip install -r requirements.txt

# Backend start karo
python app.py
```

✅ Backend `http://localhost:5000` pe chalega
✅ Pehli baar automatically 1000 dummy data se model train hoga

---

### 2. Frontend Setup

```bash
cd stayworth/frontend

# Dependencies install karo
npm install

# Dev server start karo
npm run dev
```

✅ Frontend `http://localhost:5173` pe chalega

---

## Features

### 🔐 Login / Register
- Sign up with name, email, password
- Password show/hide toggle
- Session-based auth (Flask sessions)
- Switch between login/register in modal

### 💰 Price Estimation
- Form: city, property type, room type, guests, beds, bathrooms
- Rating score, reviews, listing name, amenities
- Real-time prediction from ML model

### 📊 5 Interactive Charts
| Tab | Chart Shows |
|-----|------------|
| Cities | Price comparison across NYC/LA/Chicago/SF/Miami |
| Bedrooms | How bedrooms affect price |
| Guests | How accommodates affects price |
| Amenity | Impact of each amenity on price |
| Room Type | Entire home vs Private vs Shared |

### 🤖 Auto-Retrain
- Har 10 real user submissions ke baad model auto-retrain hota hai
- Dummy data (1000) + real data se train hota hai
- `/train` endpoint se manual retrain bhi kar sakte ho

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | New user register |
| POST | `/login` | User login |
| POST | `/logout` | User logout |
| GET  | `/me` | Current user info |
| POST | `/predict` | Price predict karo |
| POST | `/save_data` | Real data save + auto-retrain |
| POST | `/graphs` | Chart data fetch karo |
| POST | `/train` | Manual model retrain |
| GET  | `/status` | Model + data status |

---

## How Auto-Retrain Works

```
User submits form
      ↓
/predict → price dikhao
      ↓
/save_data → real_data.csv mein save karo
      ↓
10 entries ho gaye?
      ↓ YES
auto train_model(dummy_1000 + real_data)
      ↓
model.pkl update ho jata hai
      ↓
Next prediction improved model use karega
```

---

## Notebook Se Model Ka Connection

Aapki Jupyter notebook (`airbnb_v3_80plus_FIXED`) ki same feature engineering
backend ke `build_features()` function mein replicate ki gayi hai:

- ✅ Amenity flags (wifi, ac, kitchen, pool, gym...)
- ✅ Luxury bundle, essentials score
- ✅ Ratio features (beds/person, bath/person)
- ✅ Log/sqrt transforms
- ✅ Rating flags (high_rating, perfect_rating)
- ✅ Geo features (lat/lon interact, clusters)
- ✅ Name text features (luxury, cozy, spacious keywords)
- ✅ Target encoding proxies (city_te, room_type_te)
- ✅ Interaction features (nb_te_x_accom, city_room_te...)

---

## Troubleshooting

**Backend CORS error?**
- Make sure `flask-cors` installed hai: `pip install flask-cors`

**Model nahi bana?**
- Check karo `backend/model/` folder exist kare
- `python app.py` chalao — auto-train ho jayega

**Frontend API error?**
- Backend `localhost:5000` pe chalna chahiye pehle
- `axios.defaults.withCredentials = true` already set hai

**Login session kho gaya?**
- Flask session cookie-based hai
- Browser mein cookies enabled honी chahiye
