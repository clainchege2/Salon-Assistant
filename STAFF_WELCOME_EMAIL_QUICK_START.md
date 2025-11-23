# Staff Welcome Email - Quick Start Guide

## 🚀 Quick Overview

When you add a staff member, they automatically receive a welcome email with:
- Tenant slug
- Email (username)
- Temporary password
- Login instructions

They must change their password on first login.

---

## 📧 For Owners: Adding Staff

### Step 1: Navigate to Staff Page
Click "Staff" in the sidebar

### Step 2: Add Staff Member
1. Click "Add Staff Member" button
2. Fill in:
   - First Name
   - Last Name
   - Email (they'll receive credentials here)
   - Phone (optional)
   - Role (Stylist or Manager)
3. Click "Add Staff Member"

### Step 3: Confirmation
- Success message appears
- Email sent automatically
- If email fails, temp password shown for manual sharing

### Resending Email
- Find staff member in list
- Click "📧 Email" button
- Confirm action
- New temp password generated and sent

---

## 🔐 For Staff: First Login

### Step 1: Check Email
Look for email with subject: "Welcome to [Salon Name] - Your Staff Account"

### Step 2: Note Credentials
- Tenant Slug: `your-salon-slug`
- Email: `your-email@example.com`
- Temporary Password: `abc123def456`

### Step 3: Login
1. Go to admin portal
2. Enter tenant slug
3. Enter email
4. Enter temporary password
5. Complete 2FA if enabled

### Step 4: Change Password
1. Automatically redirected to Change Password page
2. Enter current (temporary) password
3. Enter new password (min 8 characters)
4. Confirm new password
5. Click "Change Password"

### Step 5: Login Again
1. Redirected to login page
2. Login with new password
3. Access granted!

---

## 🔧 Configuration

### Email Service Required

Add to `.env`:
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
ADMIN_PORTAL_URL=http://localhost:3001
```

### Gmail Setup
1. Enable 2FA on Gmail account
2. Generate App Password
3. Use App Password in EMAIL_PASS

See `EMAIL_SETUP_COMPLETE_GUIDE.md` for details.

---

## 🧪 Testing

### Quick Test
```bash
cd backend
node test-staff-welcome.js
```

### Manual Test
1. Add staff member
2. Check email inbox
3. Login with temp password
4. Change password
5. Login with new password

---

## ❓ Troubleshooting

### Email Not Received
- Check spam folder
- Verify email service configured
- Check console for temp password
- Use "Resend Email" button

### Can't Login
- Verify tenant slug is correct
- Check email is correct
- Ensure using temp password from latest email
- Complete 2FA if enabled

### Password Change Not Working
- Ensure current password is correct
- New password must be 8+ characters
- Passwords must match
- Try logging out and back in

---

## 📚 Documentation

- **Complete Guide:** `STAFF_WELCOME_EMAIL_COMPLETE.md`
- **Session Summary:** `SESSION_STAFF_WELCOME_EMAIL.md`
- **Email Setup:** `EMAIL_SETUP_COMPLETE_GUIDE.md`
- **Test Script:** `backend/test-staff-welcome.js`

---

## 🎯 Key Points

✅ **Secure** - Passwords encrypted, sent via TLS
✅ **Automatic** - No manual password creation
✅ **Professional** - Beautiful email template
✅ **Forced Security** - Must change password
✅ **Easy Resend** - One-click email resend

---

## 🔒 Security Notes

- Temporary passwords are 12 characters
- Passwords hashed with bcrypt
- Email encrypted in transit (TLS)
- Old password invalidated on resend
- Forced password change on first login
- Minimum 8 characters for new password

---

## 📞 Support

If you encounter issues:
1. Check documentation files
2. Run test script
3. Check console logs
4. Verify email configuration
5. Contact system administrator

---

**Quick Start Complete! 🎉**

You're ready to onboard staff members securely.
