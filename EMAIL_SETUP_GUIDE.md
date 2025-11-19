# Email Setup Guide for 2FA Testing

## 🎯 Quick Setup (5 minutes)

### Step 1: Get Gmail App Password

1. Go to your Google Account: https://myaccount.google.com/
2. Click **Security** in the left menu
3. Under "How you sign in to Google", click **2-Step Verification**
   - If not enabled, enable it first
4. Scroll down and click **App passwords**
5. Select:
   - App: **Mail**
   - Device: **Other (Custom name)** → Type "HairVia Backend"
6. Click **Generate**
7. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

### Step 2: Update Backend .env File

Open `backend/.env` and add:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=abcdefghijklmnop
```

**Example:**
```env
EMAIL_USER=john.doe@gmail.com
EMAIL_PASS=xyzw abcd efgh ijkl
```

### Step 3: Restart Backend

```bash
cd backend
npm start
```

### Step 4: Test Email Verification

1. Go to signup: `http://localhost:3000/signup`
2. Fill the form
3. Select **Email** as verification method
4. Submit
5. Check your email inbox for the verification code!

---

## 📧 What You'll Receive

**Subject:** Your HairVia Verification Code

**Body:**
```
🎨 HairVia

Your verification code is: 123456

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.
```

---

## 🔍 Troubleshooting

### Issue: "Invalid login" error

**Solution:** Make sure you're using an **App Password**, not your regular Gmail password.

### Issue: Not receiving emails

**Possible causes:**
1. Check spam/junk folder
2. Verify EMAIL_USER and EMAIL_PASS in .env
3. Make sure 2-Step Verification is enabled on your Google account
4. Check backend console for error messages

### Issue: "Less secure app access"

**Solution:** Use App Passwords instead. Google no longer supports "less secure apps".

---

## 🎨 Error Message Improvements

The error messages are now:
- ✅ Smaller and more compact
- ✅ User-friendly language
- ✅ Clear visual feedback

**Before:**
```
Invalid code. 4 attempts remaining.
```

**After:**
```
❌ 4 tries left
```

---

## 🧪 Testing Both Methods

### Test SMS (Console Only):
```
Verification Method: SMS
→ Code appears in backend console
```

### Test Email (Real Email):
```
Verification Method: Email
→ Code sent to your inbox
→ Also appears in backend console
```

---

## 🔐 Security Notes

### App Password Security:
- ✅ More secure than regular password
- ✅ Can be revoked anytime
- ✅ Limited to specific app
- ✅ Doesn't give full account access

### Best Practices:
1. Never commit .env file to git
2. Use different app passwords for different apps
3. Revoke unused app passwords
4. Keep app passwords secret

---

## 📝 Alternative Email Providers

### SendGrid (Production Recommended)
```env
# Install: npm install @sendgrid/mail
SENDGRID_API_KEY=your-api-key
FROM_EMAIL=noreply@yourdomain.com
```

### AWS SES (Production Recommended)
```env
# Install: npm install aws-sdk
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
FROM_EMAIL=noreply@yourdomain.com
```

### Mailgun
```env
# Install: npm install mailgun-js
MAILGUN_API_KEY=your-api-key
MAILGUN_DOMAIN=your-domain
FROM_EMAIL=noreply@yourdomain.com
```

---

## ✅ Verification Checklist

- [ ] Gmail 2-Step Verification enabled
- [ ] App Password generated
- [ ] .env file updated with EMAIL_USER and EMAIL_PASS
- [ ] Backend restarted
- [ ] Test signup with email verification
- [ ] Email received in inbox
- [ ] Code works for verification
- [ ] Error messages are user-friendly

---

## 🎉 Success!

Once set up, you'll have:
- ✅ Real email verification codes
- ✅ Professional-looking emails
- ✅ User-friendly error messages
- ✅ Both SMS (console) and Email options

**Ready to test!** 🚀

---

**Need Help?**
- Gmail App Passwords: https://support.google.com/accounts/answer/185833
- Nodemailer Docs: https://nodemailer.com/
- HairVia Support: Check backend console logs
