# How to Add Staff Members

Your Pro/Premium tier salon needs staff members to show in the stylist dropdown.

## Option 1: Via Admin Portal (Recommended)

1. Login to admin portal as owner
2. Go to **Staff** page
3. Click **Add Staff Member**
4. Fill in details:
   - First Name
   - Last Name
   - Email
   - Phone
   - Role: **stylist** (important!)
   - Status: **active** (important!)
5. Click Save

## Option 2: Via Database Script

Run this script to add a test stylist:

```bash
cd backend
node -e "
const mongoose = require('mongoose');
require('dotenv').config();

async function addStaff() {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = require('./src/models/User');
  
  // Replace with your tenant ID
  const tenantId = '6921f9f21b06ab1942dee0ce';
  
  const staff = await User.create({
    tenantId,
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@salon.com',
    phone: '+254712345678',
    role: 'stylist',
    status: 'active',
    password: 'password123' // Will be hashed
  });
  
  console.log('Staff member created:', staff._id);
  await mongoose.connection.close();
}

addStaff();
"
```

## Important Notes

- **Role must be 'stylist'** - Not 'staff' or 'employee'
- **Status must be 'active'** - Not 'inactive' or 'pending'
- **TenantId must match** - Use the correct tenant ID from your login

## Verify Staff Exists

Check if staff exists:

```bash
cd backend
node -e "
const mongoose = require('mongoose');
require('dotenv').config();

async function checkStaff() {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = require('./src/models/User');
  
  const staff = await User.find({ 
    role: 'stylist',
    status: 'active'
  });
  
  console.log('Found', staff.length, 'staff members:');
  staff.forEach(s => {
    console.log('-', s.firstName, s.lastName, '(Tenant:', s.tenantId, ')');
  });
  
  await mongoose.connection.close();
}

checkStaff();
"
```

## After Adding Staff

1. Refresh the client portal booking page
2. The stylist dropdown should now show your staff members
3. If still not showing, check browser console for errors

---

**Current Issue:** Your tenant `6921f9f21b06ab1942dee0ce` has 0 staff members with role='stylist' and status='active'.

Add at least one staff member using the admin portal or the script above!
