# Email Setup - Quick Start

**Time Required:** 5 minutes  
**For:** 2FA verification codes

---

## 🚀 Quick Setup (Gmail)

### 1. Get Gmail App Password

1. Go to: https://myaccount.google.com/apppasswords
2. Sign in to your Google account
3. Click "Select app" → Choose "Mail"
4. Click "Select device" → Choose "Other" → Type "HairVia"
5. Click "Generate"
6. **Copy the 16-character password** (spaces don't matter)

**Note:** If you don't see this option, enable 2-Step Verification first at https://myaccount.google.com/security

---

### 2. Update .env File

Open `backend/.env` and add:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
```

Replace with your actual email and the app password you just generated.

---

### 3. Restart Server

```bash
cd backend
# Stop server (Ctrl+C if running)
npm start
```

---

### 4. Test It

**Option A: Test Script**
```bash
cd backend
node test-email.js your-email@example.com
```

**Option B: Register New Account**
1. Go to http://localhost:3000
2. Click "Sign up"
3. Use your real email
4. Check inbox for verification code

---

## ✅ Success Indicators

You'll know it's working when:
- ✅ Test script says "Email sent successfully"
- ✅ You receive email in your inbox
- ✅ Server logs show "Email sent successfully"
- ✅ Registration sends verification code to email

---

## ❌ Troubleshooting

### "Invalid login" error
- You're using your regular Gmail password
- **Solution:** Use the 16-character App Password instead

### Can't find App Passwords option
- 2-Step Verification not enabled
- **Solution:** Enable it at https://myaccount.google.com/security

### Email goes to spam
- Normal for first few emails
- **Solution:** Mark as "Not Spam" and add sender to contacts

### Still seeing console logs only
- .env not updated or server not restarted
- **Solution:** Double-check .env and restart server

---

## 📧 What Happens Now

With email configured:
1. **Registration:** Users get verification code via email
2. **Login (if 2FA enabled):** Code sent to email
3. **Password Reset:** Code sent to email
4. **Console:** Still logs for debugging (in development)

---

## 🔐 Security Notes

- ✅ App Password is safer than regular password
- ✅ Can revoke App Password anytime
- ✅ Never commit .env file to git
- ✅ Use different credentials for production

---

## 📚 Need More Help?

See `EMAIL_SETUP_COMPLETE_GUIDE.md` for:
- Alternative email providers (SendGrid, Mailgun, AWS SES)
- Production recommendations
- Advanced configuration
- Detailed troubleshooting

---

**That's it!** Your 2FA emails should now work. Test it by registering a new account.

