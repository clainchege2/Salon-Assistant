# Critical Security Fixes - Implementation Guide

## Quick Start: Top 5 Critical Fixes

These fixes address the most severe security and performance issues. Implement in order.

---

## Fix #1: Query Validation Middleware (2 hours)

**Create:** `backend/src/middleware/tenantIsolation.js`

```javascript
const mongoose = require('mongoose');
const logger = require('../config/logger');

// Global plugin to enforce tenant isolation
exports.enforceTenantIsolation = () => {
  mongoose.plugin(function(schema) {
    // Skip for Tenant model itself
    if (schema.path('slug')) return;
    
    // Intercept all find queries
    schema.pre(/^find/, function() {
      const query = this.getQuery();
      
      if (query.tenantId === undefined && !this._skipTenantCheck) {
        logger.error('SECURITY VIOLATION: Query missing tenantId filter', {
          model: this.model.modelName,
          query: JSON.stringify(query)
        });
        throw new Error('Security: All queries must include tenantId');
      }
    });
    
    // Intercept save operations
    schema.pre('save', function() {
      if (!this.tenantId && !this._skipTenantCheck) {
        logger.error('SECURITY VIOLATION: Document missing tenantId', {
          model: this.constructor.modelName
        });
        throw new Error('Security: All documents must have tenantId');
      }
    });
  });
};

// For system-level queries that need to bypass tenant check
exports.skipTenantCheck = (query) => {
  query._skipTenantCheck = true;
  return query;
};
```

**Update:** `backend/src/config/database.js`

```javascript
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    
    // Enable tenant isolation
    const { enforceTenantIsolation } = require('../middleware/tenantIsolation');
    enforceTenantIsolation();
    
    logger.info(`MongoDB Connected with tenant isolation enabled`);
  } catch (error) {
    logger.error(`Error: ${error.message}`);
    process.exit(1);
  }
};
```

---

## Fix #2: Tenant-Level Rate Limiting (3 hours)

**Create:** `backend/src/middleware/tenantRateLimiter.js`

```javascript
const Tenant = require('../models/Tenant');
const logger = require('../config/logger');

// In-memory store (use Redis in production)
const tenantRequestCounts = new Map();

const TIER_LIMITS = {
  free: { requests: 100, window: 60000 }, // 100 req/min
  pro: { requests: 500, window: 60000 },
  premium: { requests: 2000, window: 60000 }
};

exports.tenantRateLimiter = async (req, res, next) => {
  try {
    const tenantId = req.tenantId?.toString();
    
    if (!tenantId) {
      return next(); // Skip if no tenant (public endpoints)
    }
    
    const now = Date.now();
    
    // Get or create tenant data
    if (!tenantRequestCounts.has(tenantId)) {
      tenantRequestCounts.set(tenantId, {
        count: 0,
        resetTime: now + 60000,
        tier: 'free'
      });
    }
    
    const tenantData = tenantRequestCounts.get(tenantId);
    
    // Reset if window expired
    if (now > tenantData.resetTime) {
      tenantData.count = 0;
      tenantData.resetTime = now + 60000;
      
      // Refresh tier info every reset
      const tenant = await Tenant.findById(tenantId).select('subscriptionTier');
      if (tenant) {
        tenantData.tier = tenant.subscriptionTier;
      }
    }
    
    const limit = TIER_LIMITS[tenantData.tier]?.requests || 100;
    
    // Check limit
    if (tenantData.count >= limit) {
      logger.warn(`Tenant rate limit exceeded`, {
        tenantId,
        tier: tenantData.tier,
        count: tenantData.count,
        limit
      });
      
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded for your subscription tier',
        currentTier: tenantData.tier,
        limit,
        upgradeRequired: tenantData.tier === 'free',
        retryAfter: Math.ceil((tenantData.resetTime - now) / 1000)
      });
    }
    
    // Increment counter
    tenantData.count++;
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', limit - tenantData.count);
    res.setHeader('X-RateLimit-Reset', tenantData.resetTime);
    
    next();
  } catch (error) {
    logger.error('Rate limiter error:', error);
    next(); // Don't block on error
  }
};

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [tenantId, data] of tenantRequestCounts.entries()) {
    if (now > data.resetTime + 300000) { // 5 minutes after reset
      tenantRequestCounts.delete(tenantId);
    }
  }
}, 300000);
```

**Update:** `backend/src/server.js`

```javascript
const { tenantRateLimiter } = require('./middleware/tenantRateLimiter');

// Apply after auth middleware
app.use('/api/', protect, tenantRateLimiter);
```

---

## Fix #3: Audit Logging (4 hours)

**Create:** `backend/src/models/AuditLog.js`

```javascript
const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT']
  },
  resource: {
    type: String,
    required: true // e.g., 'Client', 'Booking', 'User'
  },
  resourceId: String,
  changes: mongoose.Schema.Types.Mixed, // What changed
  ip: String,
  userAgent: String,
  statusCode: Number,
  errorMessage: String,
  timestamp: {
    type: Date,
    default: Date.now,
    expires: 7776000 // Auto-delete after 90 days
  }
}, {
  timestamps: false
});

// Indexes for efficient querying
auditLogSchema.index({ tenantId: 1, timestamp: -1 });
auditLogSchema.index({ tenantId: 1, userId: 1, timestamp: -1 });
auditLogSchema.index({ tenantId: 1, resource: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // TTL index

module.exports = mongoose.model('AuditLog', auditLogSchema);
```

**Create:** `backend/src/middleware/auditLogger.js`

```javascript
const AuditLog = require('../models/AuditLog');
const logger = require('../config/logger');

const ACTION_MAP = {
  POST: 'CREATE',
  GET: 'READ',
  PUT: 'UPDATE',
  PATCH: 'UPDATE',
  DELETE: 'DELETE'
};

exports.auditLog = (resource) => {
  return async (req, res, next) => {
    // Store original methods
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);
    
    // Capture response
    let responseData;
    res.json = function(data) {
      responseData = data;
      return originalJson(data);
    };
    res.send = function(data) {
      responseData = data;
      return originalSend(data);
    };
    
    // Log after response
    res.on('finish', async () => {
      try {
        if (!req.user || !req.tenantId) return;
        
        const action = ACTION_MAP[req.method] || req.method;
        
        await AuditLog.create({
          tenantId: req.tenantId,
          userId: req.user._id,
          action,
          resource,
          resourceId: req.params.id,
          changes: req.method !== 'GET' ? req.body : undefined,
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.get('user-agent'),
          statusCode: res.statusCode,
          errorMessage: res.statusCode >= 400 ? responseData?.message : undefined,
          timestamp: new Date()
        });
      } catch (error) {
        logger.error('Audit log failed:', error);
        // Don't throw - logging failure shouldn't break the app
      }
    });
    
    next();
  };
};

// Query audit logs
exports.getAuditLogs = async (req, res) => {
  try {
    const { startDate, endDate, userId, resource, action } = req.query;
    
    const filter = { tenantId: req.tenantId };
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    
    if (userId) filter.userId = userId;
    if (resource) filter.resource = resource;
    if (action) filter.action = action;
    
    const logs = await AuditLog.find(filter)
      .populate('userId', 'firstName lastName email')
      .sort({ timestamp: -1 })
      .limit(1000);
    
    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    logger.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve audit logs'
    });
  }
};
```

**Update routes to use audit logging:**

```javascript
// backend/src/routes/clients.js
const { auditLog } = require('../middleware/auditLogger');

router.post('/', protect, auditLog('Client'), createClient);
router.put('/:id', protect, auditLog('Client'), updateClient);
router.delete('/:id', protect, auditLog('Client'), deleteClient);
```

---

## Fix #4: Field-Level Encryption (6 hours)

**Install dependencies:**
```bash
npm install crypto-js
```

**Create:** `backend/src/utils/encryption.js`

```javascript
const crypto = require('crypto');
const logger = require('../config/logger');

// Generate key: node -e "console.log(crypto.randomBytes(32).toString('hex'))"
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY || '0'.repeat(64), 'hex');
const ALGORITHM = 'aes-256-gcm';

exports.encrypt = (text) => {
  try {
    if (!text) return null;
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  } catch (error) {
    logger.error('Encryption error:', error);
    throw new Error('Encryption failed');
  }
};

exports.decrypt = (encrypted, iv, authTag) => {
  try {
    if (!encrypted || !iv || !authTag) return null;
    
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      ENCRYPTION_KEY,
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    logger.error('Decryption error:', error);
    return null;
  }
};

// Helper for encrypting multiple fields
exports.encryptFields = (obj, fields) => {
  const encrypted = {};
  
  fields.forEach(field => {
    if (obj[field]) {
      const result = exports.encrypt(obj[field]);
      encrypted[`${field}_encrypted`] = result.encrypted;
      encrypted[`${field}_iv`] = result.iv;
      encrypted[`${field}_authTag`] = result.authTag;
    }
  });
  
  return encrypted;
};

// Helper for decrypting multiple fields
exports.decryptFields = (obj, fields) => {
  const decrypted = {};
  
  fields.forEach(field => {
    if (obj[`${field}_encrypted`]) {
      decrypted[field] = exports.decrypt(
        obj[`${field}_encrypted`],
        obj[`${field}_iv`],
        obj[`${field}_authTag`]
      );
    }
  });
  
  return decrypted;
};
```

**Update:** `backend/src/models/Client.js`

```javascript
const { encrypt, decrypt } = require('../utils/encryption');

// Add encrypted fields to schema
const clientSchema = new mongoose.Schema({
  // ... existing fields ...
  
  // Encrypted phone
  phone_encrypted: String,
  phone_iv: String,
  phone_authTag: String,
  
  // Encrypted email
  email_encrypted: String,
  email_iv: String,
  email_authTag: String,
  
  // Virtual for phone (for backward compatibility)
  phone: {
    type: String,
    set: function(value) {
      if (value) {
        const encrypted = encrypt(value);
        this.phone_encrypted = encrypted.encrypted;
        this.phone_iv = encrypted.iv;
        this.phone_authTag = encrypted.authTag;
      }
      return undefined; // Don't store plain text
    },
    get: function() {
      if (this.phone_encrypted) {
        return decrypt(this.phone_encrypted, this.phone_iv, this.phone_authTag);
      }
      return null;
    }
  }
});

// Enable virtuals in JSON
clientSchema.set('toJSON', { virtuals: true });
clientSchema.set('toObject', { virtuals: true });
```

---

## Fix #5: Query Performance Monitoring (3 hours)

**Create:** `backend/src/middleware/queryMonitor.js`

```javascript
const mongoose = require('mongoose');
const logger = require('../config/logger');

const SLOW_QUERY_THRESHOLD = 1000; // ms
const queryStats = new Map();

exports.enableQueryMonitoring = () => {
  mongoose.set('debug', function(collectionName, method, query, doc, options) {
    const startTime = Date.now();
    const tenantId = query.tenantId;
    
    // Return a function that will be called after query completes
    return function() {
      const duration = Date.now() - startTime;
      
      // Log slow queries
      if (duration > SLOW_QUERY_THRESHOLD) {
        logger.warn('SLOW_QUERY', {
          collection: collectionName,
          method,
          duration,
          tenantId,
          query: JSON.stringify(query),
          timestamp: new Date()
        });
      }
      
      // Track stats per tenant
      if (tenantId) {
        if (!queryStats.has(tenantId)) {
          queryStats.set(tenantId, {
            count: 0,
            totalDuration: 0,
            slowQueries: 0
          });
        }
        
        const stats = queryStats.get(tenantId);
        stats.count++;
        stats.totalDuration += duration;
        if (duration > SLOW_QUERY_THRESHOLD) {
          stats.slowQueries++;
        }
      }
    };
  });
  
  // Set query timeout
  mongoose.set('maxTimeMS', 10000); // 10 second timeout
};

// Get query stats for a tenant
exports.getQueryStats = (tenantId) => {
  const stats = queryStats.get(tenantId);
  if (!stats) return null;
  
  return {
    totalQueries: stats.count,
    averageDuration: stats.totalDuration / stats.count,
    slowQueries: stats.slowQueries,
    slowQueryRate: stats.slowQueries / stats.count
  };
};

// Reset stats periodically
setInterval(() => {
  queryStats.clear();
}, 3600000); // Reset every hour
```

**Update:** `backend/src/config/database.js`

```javascript
const { enableQueryMonitoring } = require('../middleware/queryMonitor');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 100,
      minPoolSize: 10,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    // Enable monitoring
    if (process.env.NODE_ENV !== 'test') {
      enableQueryMonitoring();
    }
    
    logger.info(`MongoDB Connected with monitoring enabled`);
  } catch (error) {
    logger.error(`Error: ${error.message}`);
    process.exit(1);
  }
};
```

---

## Environment Variables to Add

```env
# Encryption
ENCRYPTION_KEY=your_64_character_hex_key_here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=5000

# Database
MONGODB_URI=mongodb://localhost:27017/hairvia
```

---

## Testing the Fixes

```javascript
// Test tenant isolation
try {
  await Client.find({ phone: '1234567890' }); // Should throw error
} catch (error) {
  console.log('✅ Tenant isolation working');
}

// Test rate limiting
// Make 101 requests rapidly - should get 429 error

// Test audit logging
// Check AuditLog collection after operations

// Test encryption
const client = await Client.create({
  tenantId: 'xxx',
  firstName: 'Test',
  lastName: 'User',
  phone: '1234567890'
});
console.log(client.phone); // Should show decrypted
console.log(client.phone_encrypted); // Should show encrypted

// Test query monitoring
// Check logs for slow query warnings
```

---

## Deployment Checklist

- [ ] Generate encryption key
- [ ] Update environment variables
- [ ] Run database migrations if needed
- [ ] Test in staging environment
- [ ] Monitor error logs after deployment
- [ ] Verify audit logs are being created
- [ ] Check rate limiting is working
- [ ] Confirm encryption/decryption works
- [ ] Monitor query performance

