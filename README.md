# 🛒 Koyamon Mart

> Premium hyperlocal e-commerce platform for Padikkal, Velimukku, Malappuram.

## Overview
Koyamon Mart is a hyperlocal grocery & essentials delivery web app serving a 10KM radius around Padikkal. Fresh vegetables, fruits, dairy, snacks, stationery and more — delivered fast.

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | HTML5, Tailwind CSS, Vanilla JS |
| Backend | Node.js, Express.js |
| Database | MongoDB (local → Atlas for production) |
| Auth | OTP-based (phone), JWT for admin |
| Payments | Razorpay (COD + UPI + Cards) |
| Images | Cloudinary |
| SMS | MSG91 |

## Pages
**Customer**
- `/` — Homepage (featured products, categories, offers)
- `/login` — OTP login / guest checkout
- `/category` — All categories bento grid
- `/product` — Product detail with variants
- `/cart` — Cart with delivery fee tiers
- `/checkout` — OTP + guest, address, payment
- `/order-confirm` — Confirmation + live status
- `/order-tracking` — Real-time tracking timeline
- `/profile` — Order history, reorder, credits
- `/search` — Live search + filters
- `/about` — Story, contact, FAQ

**Admin** (JWT protected)
- `/admin/dashboard` — Stats, live order queue
- `/admin/inventory` — Stock & price management
- `/admin/notifications` — Broadcast alerts

## Delivery Logic
- 🎉 First order — **FREE**
- 📦 Order ≥ ₹500 — **FREE**
- 📍 Otherwise — ₹15 base + ₹8/km (Haversine distance)
- 🚫 Max 10KM radius

## Setup

### Backend
```bash
cd backend
npm install
cp .env.example .env   # Fill in your keys
npm run dev
```

### Environment Variables (backend/.env)
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/koyamon-mart
JWT_SECRET=your_secret
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
CLOUDINARY_CLOUD_NAME=xxxxx
MSG91_AUTH_KEY=xxxxx
STORE_LAT=11.1234
STORE_LNG=76.1234
```

### Frontend
Open `frontend/index.html` in a browser, or serve with:
```bash
npx serve frontend
```

## Languages
Bilingual — English 🇬🇧 and Malayalam 🇮🇳 toggle on all customer pages.

---
© 2024 Koyamon Mart · Padikkal, Velimukku, Malappuram, Kerala
