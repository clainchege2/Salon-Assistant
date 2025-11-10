# Hairvia API Documentation

Base URL: `https://api.hairvia.com/api/v1`

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### Register New Salon
```http
POST /auth/register
```

**Request Body:**
```json
{
  "businessName": "Elegant Hair Salon",
  "email": "owner@eleganthair.com",
  "phone": "+254712345678",
  "password": "SecurePass123!",
  "firstName": "Jane",
  "lastName": "Doe",
  "country": "Kenya"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "owner@eleganthair.com",
    "role": "owner",
    "tenantId": "507f1f77bcf86cd799439012",
    "businessName": "Elegant Hair Salon"
  }
}
```

#### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "owner@eleganthair.com",
  "password": "SecurePass123!",
  "tenantSlug": "elegant-hair-salon-1699123456"
}
```

**Response:** Same as register

#### Refresh Token
```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Bookings

#### Get All Bookings
```http
GET /bookings?status=pending&startDate=2024-01-01&endDate=2024-12-31
```

**Query Parameters:**
- `status` (optional): pending, confirmed, in-progress, completed, cancelled, no-show
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `clientId` (optional): Filter by client
- `stylistId` (optional): Filter by stylist

**Response:**
```json
{
  "success": true,
  "count": 25,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "clientId": {
        "_id": "507f1f77bcf86cd799439012",
        "firstName": "Mary",
        "lastName": "Wanjiku",
        "phone": "+254712345678"
      },
      "type": "reserved",
      "status": "pending",
      "scheduledDate": "2024-01-15T10:00:00.000Z",
      "services": [
        {
          "serviceName": "Box Braids",
          "price": 3500,
          "duration": 180
        }
      ],
      "totalPrice": 3500,
      "totalDuration": 180,
      "customerInstructions": "Medium size braids, shoulder length"
    }
  ]
}
```

#### Create Booking
```http
POST /bookings
```

**Request Body:**
```json
{
  "clientId": "507f1f77bcf86cd799439012",
  "type": "reserved",
  "scheduledDate": "2024-01-15T10:00:00.000Z",
  "services": [
    {
      "serviceId": "507f1f77bcf86cd799439013",
      "serviceName": "Box Braids",
      "price": 3500,
      "duration": 180,
      "customization": "Medium size"
    }
  ],
  "stylistId": "507f1f77bcf86cd799439014",
  "customerInstructions": "Medium size braids, shoulder length"
}
```

#### Update Booking
```http
PUT /bookings/:id
```

**Request Body:**
```json
{
  "status": "completed",
  "materialsUsed": [
    {
      "itemName": "Braiding Hair",
      "quantity": 8,
      "unit": "packs"
    }
  ],
  "followUpRequired": true,
  "followUpNote": "Check if client is satisfied after 2 weeks"
}
```

#### Delete Booking (Owner Only)
```http
DELETE /bookings/:id
```

---

### Clients

#### Get All Clients
```http
GET /clients?category=vip
```

**Query Parameters:**
- `category` (optional): new, vip, usual, longtime-no-see

#### Create Client
```http
POST /clients
```

**Request Body:**
```json
{
  "firstName": "Mary",
  "lastName": "Wanjiku",
  "email": "mary@example.com",
  "phone": "+254712345678",
  "marketingConsent": {
    "sms": true,
    "email": true
  },
  "preferences": {
    "allergies": "None",
    "notes": "Prefers natural hair products"
  }
}
```

---

### Communications

#### Get Communications
```http
GET /communications?status=new&type=feedback
```

**Query Parameters:**
- `status` (optional): new, read, replied, resolved
- `type` (optional): feedback, inquiry, complaint, follow-up
- `clientId` (optional): Filter by client

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "clientId": {
        "firstName": "Mary",
        "lastName": "Wanjiku"
      },
      "type": "feedback",
      "subject": "Great service!",
      "message": "I loved my braids, thank you!",
      "status": "new",
      "createdAt": "2024-01-15T14:30:00.000Z"
    }
  ]
}
```

#### Create Communication (from customer portal)
```http
POST /communications
```

**Request Body:**
```json
{
  "clientId": "507f1f77bcf86cd799439012",
  "type": "feedback",
  "subject": "Great service!",
  "message": "I loved my braids, thank you!",
  "relatedBookingId": "507f1f77bcf86cd799439013"
}
```

#### Reply to Communication
```http
PUT /communications/:id/reply
```

**Request Body:**
```json
{
  "message": "Thank you for your feedback! We're glad you loved your braids."
}
```

---

### Services

#### Get All Services
```http
GET /services?category=braids&isActive=true
```

#### Create Service (Owner Only)
```http
POST /services
```

**Request Body:**
```json
{
  "name": "Box Braids",
  "description": "Classic box braids in various sizes",
  "category": "braids",
  "price": 3500,
  "duration": 180,
  "images": [
    {
      "url": "https://res.cloudinary.com/...",
      "publicId": "services/box-braids-1"
    }
  ],
  "materialsRequired": [
    {
      "itemName": "Braiding Hair",
      "estimatedQuantity": 8,
      "unit": "packs"
    }
  ]
}
```

---

### Marketing

#### Get Marketing Campaigns
```http
GET /marketing?status=scheduled
```

#### Create Marketing Campaign
```http
POST /marketing
```

**Request Body:**
```json
{
  "title": "New Year Special",
  "message": "Get 20% off all braiding services this January!",
  "type": "promotion",
  "targetAudience": {
    "categories": ["vip", "usual"]
  },
  "channel": "both",
  "scheduledFor": "2024-01-01T08:00:00.000Z",
  "expiresAt": "2024-01-31T23:59:59.000Z",
  "offerDetails": {
    "discountPercentage": 20,
    "validUntil": "2024-01-31T23:59:59.000Z",
    "termsAndConditions": "Valid for braiding services only"
  }
}
```

---

### Admin Portal (Developer Access)

#### Get System Statistics
```http
GET /admin/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalTenants": 150,
    "activeTenants": 142,
    "suspendedTenants": 5,
    "delistedTenants": 3,
    "totalUsers": 450,
    "totalBookings": 12500
  }
}
```

#### Get All Tenants
```http
GET /admin/tenants?status=active&country=Kenya
```

#### Suspend Tenant
```http
PUT /admin/tenants/:id/suspend
```

**Request Body:**
```json
{
  "reason": "Non-payment for 3 months"
}
```

#### Delist Tenant
```http
PUT /admin/tenants/:id/delist
```

**Request Body:**
```json
{
  "reason": "Violation of terms of service"
}
```

#### Reactivate Tenant
```http
PUT /admin/tenants/:id/reactivate
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

### Common Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Server Error

## Rate Limits
- Standard endpoints: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes

## Webhooks (Future Feature)
Webhooks will be available for:
- New bookings
- Booking cancellations
- New communications
- Payment events
