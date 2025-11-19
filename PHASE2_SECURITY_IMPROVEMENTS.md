# Phase 2: High Priority Security Improvements

## Date: November 18, 2025

---

## Overview

Phase 2 focuses on preventing human error and adding defense-in-depth layers to the multi-tenant architecture.

**Priority:** 🟡 HIGH  
**Timeline:** This Week  
**Complexity:** Medium  

---

## Improvements to Implement

### 1. Mongoose Tenant Isolation Plugin 🎯
**Priority:** HIGHEST  
**Impact:** Prevents human error in queries  
**Effort:** 2-3 hours  

**Problem:**
Developers must remember to add `tenantId` to every query. Easy to forget, especially in complex queries.

**Solution:**
Auto-inject `tenantId` into all queries via Mongoose middleware.

---

### 2. Comprehensive Audit Logging 📝
**Priority:** HIGH  
**Impact:** Security monitoring and compliance  
**Effort:** 2-3 hours  

**Problem:**
Not all sensitive operations are logged. Can't detect or investigate breaches.

**Solution:**
Add audit logging to all critical operations.

---

### 3. Security Test Suite 🧪
**Priority:** HIGH  
**Impact:** Catch regressions early  
**Effort:** 3-4 hours  

**Problem:**
No automated tests for security features. Regressions won't be caught.

**Solution:**
Comprehensive security test suite with cross-tenant access tests.

---

## Implementation Plan

### Step 1: Mongoose Tenant Plugin (2-3 hours)

**Files to Create:**
- `backend/src/plugins/tenantIsolation.js`

**Files to Modify:**
- All model files to apply plugin

**Benefits:**
- Automatic tenant filtering
- Prevents human error
- Centralized logic
- Easy to maintain

---

### Step 2: Enhanced Audit Logging (2-3 hours)

**Files to Modify:**
- `backend/src/middleware/auditLogger.js` (enhance existing)
- All route files (apply middleware)

**What to Log:**
- All DELETE operations
- Permission changes
- Tenant configuration changes
- Data exports
- Failed authorization attempts
- Cross-tenant access attempts

---

### Step 3: Security Test Suite (3-4 hours)

**Files to Create:**
- `backend/tests/security/tenantIsolation.test.js`
- `backend/tests/security/authentication.test.js`
- `backend/tests/security/authorization.test.js`
- `backend/tests/security/rateLimit.test.js`

**Test Coverage:**
- Cross-tenant data access
- Authorization bypass attempts
- Rate limiting enforcement
- 2FA flows
- Audit logging

---

## Detailed Implementation

### 1. Mongoose Tenant Plugin

#### Create Plugin File

**File:** `backend/src/plugins/tenantIsolation.js`

```javascript
/**
 * Mongoose Plugin for Automatic Tenant Isolation
 * Auto-injects tenantId into all queries
 */

module.exports = function tenantIsolationPlugin(schema, options) {
  // Add pre-find hooks for all query types
  const queryTypes = [
    'find',
    'findOne',
    'findOneAndUpdate',
    'findOneAndDelete',
    'findOneAndRemove',
    'count',
    'countDocuments',
    'estimatedDocumentCount'
  ];

  queryTypes.forEach(queryType => {
    schema.pre(queryType, function() {
      // Skip if explicitly disabled
      if (this.options.skipTenantFilter) {
        return;
      }

      // Get current filter
      const filter = this.getFilter();

      // If tenantId not in filter and we have it in options
      if (!filter.tenantId && this.options.tenantId) {
        this.where({ tenantId: this.options.tenantId });
      }
    });
  });

  // Add pre-save hook
  schema.pre('save', function() {
    // Ensure tenantId is set
    if (!this.tenantId && this.$locals.tenantId) {
      this.tenantId = this.$locals.tenantId;
    }
  });

  // Add static method for tenant-aware queries
  schema.statics.findByTenant = function(tenantId, conditions = {}) {
    return this.find({ ...conditions, tenantId });
  };

  schema.statics.findOneByTenant = function(tenantId, conditions = {}) {
    return this.findOne({ ...conditions, tenantId });
  };

  // Add instance method to verify tenant ownership
  schema.methods.belongsToTenant = function(tenantId) {
    return this.tenantId.toString() === tenantId.toString();
  };
};
```

#### Apply to Models

**Example:** `backend/src/models/Client.js`

```javascript
const tenantIsolationPlugin = require('../plugins/tenantIsolation');

// ... schema definition ...

// Apply plugin
clientSchema.plugin(tenantIsolationPlugin);

module.exports = mongoose.model('Client', clientSchema);
```

#### Usage in Controllers

```javascript
// Old way (manual)
const clients = await Client.find({ tenantId: req.tenantId });

// New way (automatic)
const clients = await Client.find().setOptions({ tenantId: req.tenantId });

// Or use helper method
const clients = await Client.findByTenant(req.tenantId);
```

---

### 2. Enhanced Audit Logging

#### Enhance Middleware

**File:** `backend/src/middleware/auditLogger.js`

```javascript
const AuditLog = require('../models/AuditLog');
const logger = require('../config/logger');

/**
 * Enhanced audit logging middleware
 * Logs all sensitive operations
 */
exports.auditLog = (action, resource) => {
  return async (req, res, next) => {
    // Store original methods
    const originalJson = res.json;
    const originalSend = res.send;
    const startTime = Date.now();

    // Capture response
    let responseBody;
    res.json = function(data) {
      responseBody = data;
      return originalJson.call(this, data);
    };

    res.send = function(data) {
      responseBody = data;
      return originalSend.call(this, data);
    };

    // Continue to next middleware
    res.on('finish', async () => {
      try {
        const duration = Date.now() - startTime;

        // Determine if this was successful
        const success = res.statusCode >= 200 && res.statusCode < 300;

        // Extract changes for UPDATE actions
        let changes = null;
        if (action === 'UPDATE' && req.body) {
          changes = req.body;
        }

        // Create audit log
        await AuditLog.create({
          tenantId: req.tenantId,
          userId: req.user?._id,
          action,
          resource,
          resourceId: req.params.id || req.body?.id,
          changes,
          metadata: {
            method: req.method,
            endpoint: req.originalUrl,
            userAgent: req.get('user-agent'),
            ip: req.ip,
            duration,
            statusCode: res.statusCode
          },
          errorMessage: success ? null : responseBody?.message,
          timestamp: new Date()
        });

        // Log critical actions
        if (['DELETE', 'BULK_DELETE', 'EXPORT'].includes(action)) {
          logger.warn('Critical action performed', {
            action,
            resource,
            userId: req.user?._id,
            tenantId: req.tenantId,
            success
          });
        }

      } catch (error) {
        logger.error('Audit logging error:', error);
        // Don't fail the request if audit logging fails
      }
    });

    next();
  };
};

/**
 * Log failed authorization attempts
 */
exports.logAuthFailure = async (req, reason) => {
  try {
    await AuditLog.create({
      tenantId: req.tenantId || null,
      userId: req.user?._id || null,
      action: 'AUTH_FAILURE',
      resource: 'Authentication',
      metadata: {
        reason,
        endpoint: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('user-agent')
      },
      timestamp: new Date()
    });

    logger.warn('Authorization failure', {
      reason,
      userId: req.user?._id,
      endpoint: req.originalUrl
    });
  } catch (error) {
    logger.error('Failed to log auth failure:', error);
  }
};

/**
 * Log cross-tenant access attempts
 */
exports.logCrossTenantAttempt = async (req, attemptedTenantId) => {
  try {
    await AuditLog.create({
      tenantId: req.tenantId,
      userId: req.user?._id,
      action: 'CROSS_TENANT_ATTEMPT',
      resource: 'TenantIsolation',
      metadata: {
        attemptedTenantId,
        actualTenantId: req.tenantId,
        endpoint: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('user-agent')
      },
      errorMessage: 'Attempted to access data from different tenant',
      timestamp: new Date()
    });

    logger.error('Cross-tenant access attempt detected!', {
      userId: req.user?._id,
      attemptedTenantId,
      actualTenantId: req.tenantId
    });
  } catch (error) {
    logger.error('Failed to log cross-tenant attempt:', error);
  }
};
```

#### Apply to Routes

**Example:** `backend/src/routes/clients.js`

```javascript
const { auditLog } = require('../middleware/auditLogger');

// Apply audit logging to sensitive operations
router.route('/')
  .get(getClients)
  .post(auditLog('CREATE', 'Client'), createClient);

router.route('/:id')
  .get(getClient)
  .put(auditLog('UPDATE', 'Client'), updateClient)
  .delete(
    checkPermission('canDeleteClients'),
    auditLog('DELETE', 'Client'),
    deleteClient
  );
```

---

### 3. Security Test Suite

#### Test Structure

```
backend/tests/
├── security/
│   ├── tenantIsolation.test.js
│   ├── authentication.test.js
│   ├── authorization.test.js
│   ├── rateLimit.test.js
│   └── auditLog.test.js
├── helpers/
│   ├── testSetup.js
│   └── testData.js
└── package.json
```

#### Example Test File

**File:** `backend/tests/security/tenantIsolation.test.js`

```javascript
const request = require('supertest');
const app = require('../../src/server');
const { setupTestDB, createTenant, createUser, createClient } = require('../helpers/testSetup');

describe('Tenant Isolation Security Tests', () => {
  let tenant1, tenant2, user1, user2, client1, token1, token2;

  beforeAll(async () => {
    await setupTestDB();
  });

  beforeEach(async () => {
    // Create two tenants
    tenant1 = await createTenant('Salon A');
    tenant2 = await createTenant('Salon B');

    // Create users for each tenant
    user1 = await createUser(tenant1, 'owner');
    user2 = await createUser(tenant2, 'owner');

    // Create client in tenant1
    client1 = await createClient(tenant1);

    // Get auth tokens
    token1 = await getAuthToken(user1);
    token2 = await getAuthToken(user2);
  });

  describe('Cross-Tenant Data Access Prevention', () => {
    test('should not allow accessing another tenant\'s clients', async () => {
      const res = await request(app)
        .get(`/api/v1/clients/${client1._id}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.data).toBeUndefined();
    });

    test('should not allow updating another tenant\'s clients', async () => {
      const res = await request(app)
        .put(`/api/v1/clients/${client1._id}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ firstName: 'Hacked' });

      expect(res.status).toBe(404);
    });

    test('should not allow deleting another tenant\'s clients', async () => {
      const res = await request(app)
        .delete(`/api/v1/clients/${client1._id}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(404);
    });
  });

  describe('Analytics Tenant Isolation', () => {
    test('should only return own tenant\'s analytics', async () => {
      const res = await request(app)
        .get('/api/analytics/overview')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      // Verify data belongs to tenant1
    });
  });

  describe('Audit Logging', () => {
    test('should log cross-tenant access attempts', async () => {
      await request(app)
        .get(`/api/v1/clients/${client1._id}`)
        .set('Authorization', `Bearer ${token2}`);

      // Check audit log
      const AuditLog = require('../../src/models/AuditLog');
      const log = await AuditLog.findOne({
        action: 'CROSS_TENANT_ATTEMPT',
        userId: user2._id
      });

      expect(log).toBeDefined();
    });
  });
});
```

---

## Testing Plan

### Unit Tests
- Mongoose plugin functionality
- Audit logging middleware
- Helper functions

### Integration Tests
- Cross-tenant access prevention
- Authorization enforcement
- Rate limiting
- Audit log creation

### Security Tests
- Penetration testing scenarios
- Authorization bypass attempts
- SQL injection attempts
- XSS attempts

---

## Success Criteria

- [ ] Mongoose plugin applied to all models
- [ ] All queries use automatic tenant filtering
- [ ] Audit logging on all sensitive operations
- [ ] 100% test coverage for security features
- [ ] All tests passing
- [ ] No performance degradation
- [ ] Documentation complete

---

## Timeline

**Day 1 (4 hours):**
- Create Mongoose tenant plugin
- Apply to all models
- Test plugin functionality

**Day 2 (4 hours):**
- Enhance audit logging middleware
- Apply to all routes
- Test audit logging

**Day 3 (4 hours):**
- Create security test suite
- Write all test cases
- Run and verify tests

**Total:** 12 hours over 3 days

---

## Risk Assessment

**Risks:**
- Plugin might break existing queries
- Performance impact from audit logging
- Tests might be flaky

**Mitigation:**
- Thorough testing before deployment
- Performance benchmarking
- Staged rollout
- Rollback plan ready

---

## Next Steps

1. Review and approve this plan
2. Create Mongoose tenant plugin
3. Test plugin thoroughly
4. Enhance audit logging
5. Create test suite
6. Run all tests
7. Deploy to staging
8. Monitor for 24 hours
9. Deploy to production

---

**Status:** 📋 READY TO START  
**Assigned To:** Development Team  
**Due Date:** End of Week
