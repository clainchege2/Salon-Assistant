# Security Test Suite

Comprehensive security tests for the Hairvia Salon Management System.

## Overview

This test suite validates all security implementations including:
- Tenant isolation
- Authentication & authorization
- Audit logging
- Rate limiting
- Permission-based access control

## Prerequisites

### 1. MongoDB Test Database

Ensure MongoDB is running and accessible:
```bash
# Default test database
mongodb://localhost:27017/salon-test
```

Or set custom test database:
```bash
export MONGO_URI_TEST="mongodb://localhost:27017/your-test-db"
```

### 2. Install Dependencies

```bash
cd backend
npm install
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Security Tests Only
```bash
npm run test:security
```

### Run Specific Test File
```bash
npm test tests/security/tenantIsolation.test.js
```

### Watch Mode (for development)
```bash
npm run test:watch
```

## Test Structure

```
backend/tests/
├── setup.js                          # Global test configuration
├── helpers/
│   └── testSetup.js                  # Test utilities and helpers
└── security/
    ├── tenantIsolation.test.js       # Tenant data isolation tests
    ├── authentication.test.js        # Login, 2FA, token validation
    ├── authorization.test.js         # Role & permission tests
    └── auditLogging.test.js          # Audit trail verification
```

## Test Coverage

### 1. Tenant Isolation Tests (`tenantIsolation.test.js`)

**Purpose:** Ensure complete data isolation between tenants

**Test Cases:**
- ✅ Cross-tenant data access prevention (clients, bookings, services, users)
- ✅ Cross-tenant modification prevention
- ✅ List operations isolation
- ✅ Token manipulation prevention
- ✅ Client portal isolation
- ✅ Audit log isolation

**Expected Results:**
- All cross-tenant access attempts return 404
- List operations only return own tenant data
- Malicious token modifications are rejected

### 2. Authentication Tests (`authentication.test.js`)

**Purpose:** Validate login security and token management

**Test Cases:**
- ✅ Admin login with valid/invalid credentials
- ✅ Client login with phone/password
- ✅ Failed login attempt tracking
- ✅ Account lockout after max attempts
- ✅ Token validation (valid, expired, malformed)
- ✅ 2FA flow (when enabled)
- ✅ Password security (hashing, strength)
- ✅ Session management
- ✅ Rate limiting on auth endpoints

**Expected Results:**
- Valid credentials return JWT token
- Invalid credentials return 401
- Passwords are hashed in database
- Failed attempts are tracked
- Accounts lock after 5 failed attempts

### 3. Authorization Tests (`authorization.test.js`)

**Purpose:** Verify role-based and permission-based access control

**Test Cases:**
- ✅ Role-based access (admin, manager, staff)
- ✅ Permission-based access (view/manage resources)
- ✅ Resource ownership (clients accessing own data)
- ✅ Privilege escalation prevention
- ✅ Delete operations authorization
- ✅ Report access control
- ✅ Data export authorization

**Expected Results:**
- Users can only access resources they have permissions for
- Staff cannot promote themselves
- Clients can only access own data
- Unauthorized access returns 403

### 4. Audit Logging Tests (`auditLogging.test.js`)

**Purpose:** Ensure all sensitive operations are logged

**Test Cases:**
- ✅ Authentication logging (login/logout)
- ✅ CRUD operations logging
- ✅ Sensitive operations (delete, permission changes)
- ✅ Data integrity (IP, user agent, response time)
- ✅ Failed operations logging
- ✅ Audit log querying and filtering
- ✅ Tenant isolation in logs

**Expected Results:**
- All sensitive operations create audit logs
- Logs contain complete context (who, what, when, where)
- Sensitive data is redacted
- High-risk operations are flagged
- Logs are tenant-isolated

## Test Data

Each test creates isolated test data:
- **Tenants:** Test salon instances
- **Users:** Admin, manager, staff with different permissions
- **Clients:** Test client accounts
- **Services:** Test salon services
- **Bookings:** Test appointments

All test data is cleaned up after each test.

## Environment Variables

```bash
# Required
NODE_ENV=test
JWT_SECRET=test-jwt-secret-key
MONGO_URI_TEST=mongodb://localhost:27017/salon-test

# Optional
SILENT_TESTS=true  # Suppress console logs during tests
```

## Troubleshooting

### Tests Failing to Connect to Database

**Problem:** `MongooseError: Connection failed`

**Solution:**
```bash
# Ensure MongoDB is running
mongod --dbpath /path/to/data

# Or use Docker
docker run -d -p 27017:27017 mongo:latest
```

### Tests Timing Out

**Problem:** Tests exceed 10 second timeout

**Solution:**
- Check database connection speed
- Increase timeout in `jest.config.js`:
```javascript
testTimeout: 30000  // 30 seconds
```

### Port Already in Use

**Problem:** `EADDRINUSE: address already in use`

**Solution:**
- Tests should not start the server
- If needed, use different port for tests
- Kill existing processes on port 5000

### Cleanup Issues

**Problem:** Test data persists between runs

**Solution:**
```bash
# Manually clean test database
mongo salon-test --eval "db.dropDatabase()"
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Security Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:latest
        ports:
          - 27017:27017
    
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: cd backend && npm install
      
      - name: Run security tests
        run: cd backend && npm run test:security
        env:
          MONGO_URI_TEST: mongodb://localhost:27017/salon-test
          JWT_SECRET: test-secret
```

## Coverage Goals

Target coverage for security-critical code:
- **Authentication:** 95%+
- **Authorization:** 95%+
- **Tenant Isolation:** 100%
- **Audit Logging:** 90%+

View coverage report:
```bash
npm test
# Open coverage/lcov-report/index.html
```

## Best Practices

### Writing New Tests

1. **Use testSetup helper:**
```javascript
const testSetup = require('../helpers/testSetup');

beforeEach(async () => {
  await testSetup.cleanup();
  const tenant = await testSetup.createTestTenant();
  const user = await testSetup.createTestUser(tenant._id);
});
```

2. **Clean up after tests:**
```javascript
afterEach(async () => {
  await testSetup.cleanup();
});
```

3. **Use descriptive test names:**
```javascript
test('Should NOT access clients from another tenant', async () => {
  // Test implementation
});
```

4. **Test both positive and negative cases:**
```javascript
test('Should allow admin to delete users', async () => { /* ... */ });
test('Should NOT allow staff to delete users', async () => { /* ... */ });
```

### Security Test Checklist

When adding new features, ensure tests cover:
- ✅ Tenant isolation
- ✅ Authentication requirements
- ✅ Authorization checks
- ✅ Audit logging
- ✅ Input validation
- ✅ Error handling
- ✅ Rate limiting (if applicable)

## Maintenance

### Updating Tests

When modifying security features:
1. Update relevant test files
2. Run full test suite
3. Update this documentation
4. Review coverage report

### Adding New Tests

1. Create test file in appropriate directory
2. Follow existing test structure
3. Use testSetup helpers
4. Add documentation to this README
5. Update coverage goals if needed

## Support

For issues or questions:
1. Check troubleshooting section
2. Review test output for specific errors
3. Ensure all prerequisites are met
4. Check MongoDB connection

## Security Considerations

**Important:** These tests use:
- Test database (not production)
- Weak passwords for speed
- Disabled 2FA for simplicity
- Mock data

**Never:**
- Run tests against production database
- Use production credentials
- Commit sensitive test data
- Skip security tests in CI/CD

## Next Steps

After running tests:
1. Review coverage report
2. Fix any failing tests
3. Address security gaps
4. Update documentation
5. Deploy with confidence

---

**Last Updated:** November 19, 2025  
**Test Suite Version:** 1.0.0  
**Maintained By:** Development Team
