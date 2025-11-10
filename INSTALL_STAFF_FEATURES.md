# 🚀 Quick Install Guide - Staff Features

## Step-by-Step Installation

### 1️⃣ Install Mobile Dependencies
```bash
cd mobile
npm install
```

This installs:
- `expo-camera@~14.0.0`
- `expo-barcode-scanner@~12.9.0`

### 2️⃣ Reseed Database with Materials
```bash
cd backend
node ../seed-complete-data.js
```

This adds 10 materials with barcodes ready for scanning.

### 3️⃣ Start Backend
```bash
cd backend
npm run dev
```

### 4️⃣ Start Mobile App
```bash
cd mobile
npm start
```

Then scan QR code with Expo Go app.

---

## ✅ Verify Installation

### Test Stylist View
1. Login as: `stylist@elegantstyles.com` / `Password123!`
2. Should see "My Schedule" instead of full dashboard
3. No prices visible in bookings
4. "Pick Materials" button available

### Test Barcode Scanning
1. Tap "Pick Materials"
2. Tap "Scan Barcode"
3. Allow camera permission
4. Scan barcode: `8901234567890`
5. Material should be added to list

### Test Owner View
1. Login as: `owner@elegantstyles.com` / `Password123!`
2. Should see full dashboard with stats
3. Prices visible everywhere
4. All features unlocked

---

## 🐛 Troubleshooting

### Camera Permission Denied
**iOS:** Settings → HairVia → Enable Camera
**Android:** Settings → Apps → HairVia → Permissions → Camera

### Barcode Not Scanning
- Ensure good lighting
- Hold phone steady
- Use test barcodes from STAFF_FEATURES.md

### Materials Not Found
- Run seed script again: `node seed-complete-data.js`
- Check MongoDB connection
- Verify tenant ID matches

---

## 📝 Test Barcodes

Print or display these on screen to test:

```
8901234567890 - Braiding Hair - Black
8901234567893 - Edge Control Gel
8901234567894 - Heat Protectant Spray
```

---

## 🎉 Done!

Your staff-focused features are now ready to use!
