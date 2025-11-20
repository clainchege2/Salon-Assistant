const request = require('supertest');
const app = require('../../src/app');
const testSetup = require('../helpers/testSetup');

/**
 * Tenant Isolation Security Tests
 * Ensures complete data isolation between tenants
 */
describe('Tenant Isolation Security Tests', () => {
  let tenant1, tenant2;
  let user1, user2;
  let client1, client2;
  let service1, service2;
  let booking1, booking2;
  let token1, token2;

  beforeAll(async () => {
    await testSetup.connectDB();
  });

  afterAll(async () => {
    await testSetup.disconnectDB();
  });

  beforeEach(async () => {
    await testSetup.cleanup();

    // Create two separate tenants
    tenant1 = await testSetup.createTestTenant({ businessName: 'Salon 1' });
    tenant2 = await testSetup.createTestTenant({ businessName: 'Salon 2' });

    // Create users for each tenant
    user1 = await testSetup.createTestUser(tenant1._id);
    user2 = await testSetup.createTestUser(tenant2._id);

    // Create clients for each tenant
    client1 = await testSetup.createTestClient(tenant1._id);
    client2 = await testSetup.createTestClient(tenant2._id);

    // Create services for each tenant
    service1 = await testSetup.createTestService(tenant1._id);
    service2 = await testSetup.createTestService(tenant2._id);

    // Create bookings for each tenant
    booking1 = await testSetup.createTestBooking(tenant1._id, client1._id, service1._id);
    booking2 = await testSetup.createTestBooking(tenant2._id, client2._id, service2._id);

    // Generate tokens
    token1 = testSetup.generateUserToken(user1);
    token2 = testSetup.generateUserToken(user2);
  });

  describe('Cross-Tenant Data Access Prevention', () => {
    test('Should NOT access clients from another tenant', async () => {
      const response = await request(app)
        .get(`/api/v1/clients/${client2._id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(404);
    });

    test('Should NOT access bookings from another tenant', async () => {
      const response = await request(app)
        .get(`/api/v1/bookings/${booking2._id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(404);
    });

    test('Should NOT access services from another tenant', async () => {
      const response = await request(app)
        .get(`/api/v1/services/${service2._id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(404);
    });

    test('Should NOT access users from another tenant', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${user2._id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Cross-Tenant Modification Prevention', () => {
    test('Should NOT update client from another tenant', async () => {
      const response = await request(app)
        .put(`/api/v1/clients/${client2._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ firstName: 'Hacked' });

      expect(response.status).toBe(404);
    });

    test('Should NOT update booking from another tenant', async () => {
      const response = await request(app)
        .put(`/api/v1/bookings/${booking2._id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ status: 'cancelled' });

      expect(response.status).toBe(404);
    });

    test('Should NOT delete service from another tenant', async () => {
      const response = await request(app)
        .delete(`/api/v1/services/${service2._id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(404);
    });

    test('Should NOT delete user from another tenant', async () => {
      const response = await request(app)
        .delete(`/api/v1/users/${user2._id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(404);
    });
  });

  describe('List Operations Isolation', () => {
    test('Should only see own tenant clients', async () => {
      const response = await request(app)
        .get('/api/v1/clients')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]._id).toBe(client1._id.toString());
    });

    test('Should only see own tenant bookings', async () => {
      const response = await request(app)
        .get('/api/v1/bookings')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]._id).toBe(booking1._id.toString());
    });

    test('Should only see own tenant services', async () => {
      const response = await request(app)
        .get('/api/v1/services')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]._id).toBe(service1._id.toString());
    });

    test('Should only see own tenant users', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]._id).toBe(user1._id.toString());
    });
  });

  describe('Token Manipulation Prevention', () => {
    test('Should reject token with modified tenantId', async () => {
      // Create a token with tenant2's ID but user1's data
      const maliciousToken = testSetup.generateUserToken({
        ...user1.toObject(),
        tenantId: tenant2._id
      });

      const response = await request(app)
        .get('/api/v1/clients')
        .set('Authorization', `Bearer ${maliciousToken}`);

      // Should either reject or return empty results
      expect([401, 403, 200]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.data).toHaveLength(0);
      }
    });

    test('Should reject expired token', async () => {
      const expiredToken = testSetup.generateUserToken(user1, { expiresIn: '0s' });
      
      await testSetup.wait(1000);

      const response = await request(app)
        .get('/api/v1/clients')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
    });
  });

  describe('Client Portal Isolation', () => {
    let clientToken1, clientToken2;

    beforeEach(() => {
      clientToken1 = testSetup.generateClientToken(client1);
      clientToken2 = testSetup.generateClientToken(client2);
    });

    test('Client should NOT access another tenant bookings', async () => {
      const response = await request(app)
        .get(`/api/v1/client-bookings/${booking2._id}`)
        .set('Authorization', `Bearer ${clientToken1}`);

      expect(response.status).toBe(404);
    });

    test('Client should only see own bookings', async () => {
      const response = await request(app)
        .get('/api/v1/client-bookings')
        .set('Authorization', `Bearer ${clientToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every(b => b.clientId === client1._id.toString())).toBe(true);
    });

    test('Client should NOT access another client profile', async () => {
      const response = await request(app)
        .get(`/api/v1/clients/${client2._id}`)
        .set('Authorization', `Bearer ${clientToken1}`);

      // Client tokens are not valid for admin endpoints, should return 401
      // This is more secure than 403 as it doesn't reveal the endpoint exists
      expect(response.status).toBe(401);
    });
  });

  describe('Audit Log Isolation', () => {
    test('Should only see own tenant audit logs', async () => {
      // Create some activity
      await request(app)
        .get('/api/v1/clients')
        .set('Authorization', `Bearer ${token1}`);

      await request(app)
        .get('/api/v1/clients')
        .set('Authorization', `Bearer ${token2}`);

      // Check audit logs for tenant1
      const response = await request(app)
        .get('/api/v1/audit-logs')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every(log => 
        log.tenantId === tenant1._id.toString()
      )).toBe(true);
    });
  });
});
