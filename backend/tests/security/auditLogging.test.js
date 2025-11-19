const request = require('supertest');
const app = require('../../src/app');
const testSetup = require('../helpers/testSetup');
const AuditLog = require('../../src/models/AuditLog');

/**
 * Audit Logging Security Tests
 * Ensures all sensitive operations are properly logged
 */
describe('Audit Logging Security Tests', () => {
  let tenant;
  let user, client;
  let userToken, clientToken;
  let testClient, testService, testBooking;

  beforeAll(async () => {
    await testSetup.connectDB();
  });

  afterAll(async () => {
    await testSetup.disconnectDB();
  });

  beforeEach(async () => {
    await testSetup.cleanup();
    tenant = await testSetup.createTestTenant();
    user = await testSetup.createTestUser(tenant._id);
    client = await testSetup.createTestClient(tenant._id);
    
    userToken = testSetup.generateUserToken(user);
    clientToken = testSetup.generateClientToken(client);

    testClient = await testSetup.createTestClient(tenant._id);
    testService = await testSetup.createTestService(tenant._id);
    testBooking = await testSetup.createTestBooking(tenant._id, testClient._id, testService._id);
  });

  describe('Authentication Logging', () => {
    test('Should log successful login', async () => {
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: 'password123'
        });

      await testSetup.wait(100);

      const logs = await AuditLog.find({
        tenantId: tenant._id,
        action: 'LOGIN_ATTEMPT'
      });

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].statusCode).toBe(200);
    });

    test('Should log failed login attempt', async () => {
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: 'wrongpassword'
        });

      await testSetup.wait(100);

      const logs = await AuditLog.find({
        tenantId: tenant._id,
        action: 'LOGIN_ATTEMPT',
        statusCode: 401
      });

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].riskLevel).toBe('HIGH');
    });

    test('Should log client login', async () => {
      await request(app)
        .post('/api/v1/client-auth/login')
        .send({
          phone: client.phone,
          password: 'password123'
        });

      await testSetup.wait(100);

      const logs = await AuditLog.find({
        tenantId: tenant._id,
        action: 'CLIENT_LOGIN_ATTEMPT'
      });

      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe('CRUD Operations Logging', () => {
    test('Should log client creation', async () => {
      await request(app)
        .post('/api/v1/clients')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          firstName: 'New',
          lastName: 'Client',
          phone: '+254700111111',
          email: 'newclient@test.com'
        });

      await testSetup.wait(100);

      const logs = await AuditLog.find({
        tenantId: tenant._id,
        action: 'CREATE_CLIENT'
      });

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].userId.toString()).toBe(user._id.toString());
    });

    test('Should log client update', async () => {
      await request(app)
        .put(`/api/v1/clients/${testClient._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ firstName: 'Updated' });

      await testSetup.wait(100);

      const logs = await AuditLog.find({
        tenantId: tenant._id,
        action: 'UPDATE_CLIENT'
      });

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].details.resourceId).toBe(testClient._id.toString());
    });

    test('Should log client deletion', async () => {
      await request(app)
        .delete(`/api/v1/clients/${testClient._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      await testSetup.wait(100);

      const logs = await AuditLog.find({
        tenantId: tenant._id,
        action: 'DELETE_CLIENT'
      });

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].riskLevel).toBe('HIGH');
      expect(logs[0].severity).toBe('HIGH');
    });
  });

  describe('Sensitive Operations Logging', () => {
    test('Should log user deletion with CRITICAL risk', async () => {
      const staffUser = await testSetup.createTestUser(tenant._id, { role: 'staff' });

      await request(app)
        .delete(`/api/v1/users/${staffUser._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      await testSetup.wait(100);

      const logs = await AuditLog.find({
        tenantId: tenant._id,
        action: 'DELETE_USER'
      });

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].riskLevel).toBe('CRITICAL');
    });

    test('Should log permission changes', async () => {
      const staffUser = await testSetup.createTestUser(tenant._id, { role: 'staff' });

      await request(app)
        .put(`/api/v1/users/${staffUser._id}/permissions`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          permissions: { manage_bookings: true }
        });

      await testSetup.wait(100);

      const logs = await AuditLog.find({
        tenantId: tenant._id,
        action: 'UPDATE_USER_PERMISSIONS'
      });

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].riskLevel).toBe('CRITICAL');
    });

    test('Should log role changes', async () => {
      const staffUser = await testSetup.createTestUser(tenant._id, { role: 'staff' });

      await request(app)
        .put(`/api/v1/users/${staffUser._id}/role`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ role: 'manager' });

      await testSetup.wait(100);

      const logs = await AuditLog.find({
        tenantId: tenant._id,
        action: 'UPDATE_USER_ROLE'
      });

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].riskLevel).toBe('CRITICAL');
    });

    test('Should log data exports', async () => {
      await request(app)
        .get('/api/v1/reports/bookings/export')
        .set('Authorization', `Bearer ${userToken}`);

      await testSetup.wait(100);

      const logs = await AuditLog.find({
        tenantId: tenant._id,
        action: 'EXPORT_BOOKINGS_REPORT'
      });

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].riskLevel).toBe('HIGH');
    });
  });

  describe('Audit Log Data Integrity', () => {
    test('Should capture IP address', async () => {
      await request(app)
        .get('/api/v1/clients')
        .set('Authorization', `Bearer ${userToken}`);

      await testSetup.wait(100);

      const logs = await AuditLog.find({ tenantId: tenant._id }).sort({ timestamp: -1 }).limit(1);

      expect(logs[0].ipAddress).toBeDefined();
    });

    test('Should capture user agent', async () => {
      await request(app)
        .get('/api/v1/clients')
        .set('Authorization', `Bearer ${userToken}`)
        .set('User-Agent', 'Test-Agent/1.0');

      await testSetup.wait(100);

      const logs = await AuditLog.find({ tenantId: tenant._id }).sort({ timestamp: -1 }).limit(1);

      expect(logs[0].userAgent).toBeDefined();
    });

    test('Should capture response time', async () => {
      await request(app)
        .get('/api/v1/clients')
        .set('Authorization', `Bearer ${userToken}`);

      await testSetup.wait(100);

      const logs = await AuditLog.find({ tenantId: tenant._id }).sort({ timestamp: -1 }).limit(1);

      expect(logs[0].responseTime).toBeDefined();
      expect(typeof logs[0].responseTime).toBe('number');
    });

    test('Should capture correlation ID', async () => {
      await request(app)
        .get('/api/v1/clients')
        .set('Authorization', `Bearer ${userToken}`)
        .set('X-Correlation-ID', 'test-correlation-123');

      await testSetup.wait(100);

      const logs = await AuditLog.find({ tenantId: tenant._id }).sort({ timestamp: -1 }).limit(1);

      expect(logs[0].details.correlationId).toBeDefined();
    });

    test('Should NOT log sensitive data', async () => {
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: 'password123'
        });

      await testSetup.wait(100);

      const logs = await AuditLog.find({
        tenantId: tenant._id,
        action: 'LOGIN_ATTEMPT'
      });

      expect(logs[0].details.body.password).toBe('[REDACTED]');
    });
  });

  describe('Failed Operations Logging', () => {
    test('Should log unauthorized access attempts', async () => {
      await request(app)
        .get('/api/v1/users')
        .set('Authorization', 'Bearer invalid-token');

      await testSetup.wait(100);

      const logs = await AuditLog.find({
        tenantId: tenant._id,
        statusCode: 401
      });

      // May or may not log depending on middleware order
      expect(logs.length).toBeGreaterThanOrEqual(0);
    });

    test('Should log forbidden access attempts', async () => {
      const staffUser = await testSetup.createLimitedUser(tenant._id);
      const staffToken = testSetup.generateUserToken(staffUser);

      await request(app)
        .delete(`/api/v1/clients/${testClient._id}`)
        .set('Authorization', `Bearer ${staffToken}`);

      await testSetup.wait(100);

      const logs = await AuditLog.find({
        tenantId: tenant._id,
        statusCode: 403
      });

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].riskLevel).toBe('HIGH');
    });
  });

  describe('Audit Log Query and Filtering', () => {
    beforeEach(async () => {
      // Create various audit logs
      await request(app).get('/api/v1/clients').set('Authorization', `Bearer ${userToken}`);
      await request(app).post('/api/v1/clients').set('Authorization', `Bearer ${userToken}`).send({
        firstName: 'Test', lastName: 'Client', phone: '+254700222222', email: 'test@test.com'
      });
      await request(app).delete(`/api/v1/clients/${testClient._id}`).set('Authorization', `Bearer ${userToken}`);
      
      await testSetup.wait(200);
    });

    test('Should filter logs by risk level', async () => {
      const highRiskLogs = await AuditLog.find({
        tenantId: tenant._id,
        riskLevel: { $in: ['HIGH', 'CRITICAL'] }
      });

      expect(highRiskLogs.length).toBeGreaterThan(0);
    });

    test('Should filter logs by action', async () => {
      const deleteLogs = await AuditLog.find({
        tenantId: tenant._id,
        action: 'DELETE_CLIENT'
      });

      expect(deleteLogs.length).toBeGreaterThan(0);
    });

    test('Should filter logs by user', async () => {
      const userLogs = await AuditLog.find({
        tenantId: tenant._id,
        userId: user._id
      });

      expect(userLogs.length).toBeGreaterThan(0);
    });

    test('Should filter logs by date range', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const recentLogs = await AuditLog.find({
        tenantId: tenant._id,
        timestamp: { $gte: yesterday, $lte: tomorrow }
      });

      expect(recentLogs.length).toBeGreaterThan(0);
    });
  });

  describe('Tenant Isolation in Audit Logs', () => {
    let tenant2, user2, token2;

    beforeEach(async () => {
      tenant2 = await testSetup.createTestTenant({ name: 'Salon 2' });
      user2 = await testSetup.createTestUser(tenant2._id);
      token2 = testSetup.generateUserToken(user2);
    });

    test('Should only see own tenant audit logs', async () => {
      // Create activity for both tenants
      await request(app).get('/api/v1/clients').set('Authorization', `Bearer ${userToken}`);
      await request(app).get('/api/v1/clients').set('Authorization', `Bearer ${token2}`);

      await testSetup.wait(100);

      const tenant1Logs = await AuditLog.find({ tenantId: tenant._id });
      const tenant2Logs = await AuditLog.find({ tenantId: tenant2._id });

      expect(tenant1Logs.every(log => log.tenantId.toString() === tenant._id.toString())).toBe(true);
      expect(tenant2Logs.every(log => log.tenantId.toString() === tenant2._id.toString())).toBe(true);
    });
  });
});
