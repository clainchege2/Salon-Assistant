# Email Setup Guide for 2FA

**Date:** November 22, 2025  
**Purpose:** Configure real email sending for 2FA verification codes

---

## 🎯 Quick Setup (Gmail)

### Step 1: Enable 2-Step Verification
1. Go to https://myaccount.google.com/security
2. Click "2-Step Verification"
3. Follow the prompts to enable it

### Step 2: Generate App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Other (Custom name)"
3. Name it "HairVia App"
4. Click "Generate"
5. **Copy the 16-character password** (you won't see it again)

### Step 3: Update .env File
Add these lines to `backend/.env`:

```env
# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-char-app-password
```

**Example:**
```env
EMAIL_USER=hairvia.app@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
```

### Step 4: Restart Server
```bash
cd backend
# Stop the server (Ctrl+C)
npm start
```

---

## 📧 Alternative Email Providers

### Option 1: Gmail (Recommended for Testing)
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_SERVICE=gmail
```

**Pros:**
- Easy to set up
- Free
- Reliable
- Good for development/testing

**Cons:**
- Daily sending limit (500 emails/day)
- Not ideal for production at scale

---

### Option 2: SendGrid (Recommended for Production)
```env
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com
```

**Setup:**
1. Sign up at https://sendgrid.com
2. Free tier: 100 emails/day
3. Get API key from Settings > API Keys
4. Verify sender email

**Pros:**
- Professional
- High deliverability
- Detailed analytics
- Scalable

**Cons:**
- Requires account setup
- Domain verification recommended

---

### Option 3: Mailgun
```env
EMAIL_SERVICE=mailgun
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=your-domain.com
EMAIL_FROM=noreply@yourdomain.com
```

**Setup:**
1. Sign up at https://mailgun.com
2. Free tier: 5,000 emails/month
3. Get API key from Settings
4. Add and verify domain

---

### Option 4: AWS SES (For AWS Users)
```env
EMAIL_SERVICE=ses
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
EMAIL_FROM=noreply@yourdomain.com
```

**Setup:**
1. Enable SES in AWS Console
2. Verify email/domain
3. Request production access (starts in sandbox)
4. Create IAM user with SES permissions

---

## 🔧 Current Implementation

The app uses **nodemailer** which supports multiple providers. The current code in `backend/src/services/twoFactorService.js` is configured for Gmail but can be adapted.

### For Gmail (Current Setup):
```javascript
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

### For Other SMTP Providers:
```javascript
const transporter = nodemailer.createTransport({
  host: 'smtp.example.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

---

## 🧪 Testing Email Setup

### Test 1: Check Configuration
```bash
cd backend
node -e "console.log('EMAIL_USER:', process.env.EMAIL_USER); console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***configured***' : 'NOT SET');"
```

### Test 2: Register New Account
1. Go to http://localhost:3000
2. Click "Sign up"
3. Fill in registration form with **your real email**
4. Submit
5. Check your email inbox for verification code

### Test 3: Check Server Logs
Look for:
```
=== 2FA EMAIL ===
To: your-email@example.com
...
Email sent successfully
```

---

## 🐛 Troubleshooting

### Issue: "Invalid login" or "Username and Password not accepted"
**Solution:** You're using your regular Gmail password instead of an App Password
- Generate an App Password (see Step 2 above)
- Use the 16-character code, not your regular password

### Issue: "Less secure app access"
**Solution:** Gmail no longer supports this. Use App Passwords instead.

### Issue: Emails going to spam
**Solutions:**
1. Add sender to contacts
2. Mark as "Not Spam"
3. For production: Set up SPF, DKIM, DMARC records
4. Use a professional email service (SendGrid, Mailgun)

### Issue: "Connection timeout"
**Solutions:**
1. Check firewall settings
2. Try port 465 (SSL) instead of 587 (TLS)
3. Check if your network blocks SMTP

### Issue: Still seeing console logs only
**Check:**
1. `.env` file has EMAIL_USER and EMAIL_PASS
2. Server was restarted after adding credentials
3. No typos in variable names
4. Values don't have quotes (just the raw values)

---

## 📝 Environment Variables Reference

### Required for Email:
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Optional (with defaults):
```env
EMAIL_SERVICE=gmail                    # Default: gmail
EMAIL_FROM="HairVia" <noreply@hairvia.com>  # Default: uses EMAIL_USER
EMAIL_PORT=587                         # Default: 587
EMAIL_SECURE=false                     # Default: false (true for port 465)
```

---

## 🔐 Security Best Practices

### DO:
- ✅ Use App Passwords (not regular passwords)
- ✅ Keep credentials in .env (never commit)
- ✅ Use environment-specific configs
- ✅ Rotate credentials periodically
- ✅ Use professional email service for production

### DON'T:
- ❌ Commit .env file to git
- ❌ Use personal email for production
- ❌ Share credentials
- ❌ Use regular Gmail password
- ❌ Hardcode credentials in code

---

## 📊 Email Sending Limits

### Gmail:
- **Free:** 500 emails/day
- **Google Workspace:** 2,000 emails/day

### SendGrid:
- **Free:** 100 emails/day
- **Essentials:** $19.95/month for 50,000 emails
- **Pro:** $89.95/month for 100,000 emails

### Mailgun:
- **Free:** 5,000 emails/month (first 3 months)
- **Foundation:** $35/month for 50,000 emails
- **Growth:** $80/month for 100,000 emails

### AWS SES:
- **Free Tier:** 62,000 emails/month (if sending from EC2)
- **Paid:** $0.10 per 1,000 emails

---

## 🚀 Production Recommendations

### For Small Scale (< 1,000 users):
- **Gmail** with App Password
- Simple, free, reliable
- Good for MVP/testing

### For Medium Scale (1,000 - 10,000 users):
- **SendGrid** or **Mailgun**
- Professional features
- Better deliverability
- Analytics included

### For Large Scale (10,000+ users):
- **AWS SES** or **SendGrid Pro**
- Scalable
- Cost-effective at volume
- Advanced features

---

## 📧 Email Template Customization

The current email template is in `backend/src/services/twoFactorService.js`:

```javascript
html: `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #667eea;">🎨 HairVia</h2>
    <p style="font-size: 16px; line-height: 1.6;">
      ${message.replace(/\n/g, '<br>')}
    </p>
    ...
  </div>
`
```

You can customize:
- Colors
- Logo
- Branding
- Footer text
- Links

---

## ✅ Verification Checklist

After setup, verify:
- [ ] EMAIL_USER is set in .env
- [ ] EMAIL_PASS is set in .env (App Password, not regular password)
- [ ] Server restarted after adding credentials
- [ ] Test registration sends email
- [ ] Email arrives in inbox (check spam)
- [ ] Verification code works
- [ ] Server logs show "Email sent successfully"

---

## 🆘 Need Help?

### Check Server Logs:
```bash
# Look for email-related logs
cd backend
npm start
# Watch for "Email sent successfully" or error messages
```

### Test Email Manually:
Create `backend/test-email.js`:
```javascript
require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.sendMail({
  from: process.env.EMAIL_USER,
  to: 'your-test-email@example.com',
  subject: 'Test Email',
  text: 'If you receive this, email is working!'
}).then(() => {
  console.log('✅ Email sent successfully!');
  process.exit(0);
}).catch(err => {
  console.error('❌ Email failed:', err.message);
  process.exit(1);
});
```

Run: `node backend/test-email.js`

---

## 📚 Additional Resources

- **Nodemailer Docs:** https://nodemailer.com/
- **Gmail App Passwords:** https://support.google.com/accounts/answer/185833
- **SendGrid Docs:** https://docs.sendgrid.com/
- **Mailgun Docs:** https://documentation.mailgun.com/
- **AWS SES Docs:** https://docs.aws.amazon.com/ses/

---

**Status:** Ready to configure  
**Estimated Setup Time:** 5-10 minutes  
**Recommended:** Start with Gmail for testing

