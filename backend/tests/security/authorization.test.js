const request = require('supertest');
const app = require('../../src/app');
const testSetup = require('../helpers/testSetup');

/**
 * Authorization Security Tests
 * Tests role-based and permission-based access control
 */
describe('Authorization Security Tests', () => {
  let tenant;
  let adminUser, managerUser, staffUser;
  let adminToken, managerToken, staffToken;
  let client, service, booking;

  beforeAll(async () => {
    await testSetup.connectDB();
  });

  afterAll(async () => {
    await testSetup.disconnectDB();
  });

  beforeEach(async () => {
    await testSetup.cleanup();
    tenant = await testSetup.createTestTenant();

    // Create users with different roles
    adminUser = await testSetup.createTestUser(tenant._id, { role: 'owner' });
    
    managerUser = await testSetup.createTestUser(tenant._id, {
      role: 'manager',
      permissions: {
        canViewCommunications: true,
        canViewMarketing: false,
        canDeleteBookings: true,
        canDeleteClients: true,
        canManageStaff: false,
        canManageServices: false,
        canManageInventory: false,
        canViewReports: true
      }
    });

    staffUser = await testSetup.createLimitedUser(tenant._id, {
      view_bookings: true,
      view_clients: true
    });

    // Generate tokens
    adminToken = testSetup.generateUserToken(adminUser);
    managerToken = testSetup.generateUserToken(managerUser);
    staffToken = testSetup.generateUserToken(staffUser);

    // Create test data
    client = await testSetup.createTestClient(tenant._id);
    service = await testSetup.createTestService(tenant._id);
    booking = await testSetup.createTestBooking(tenant._id, client._id, service._id);
  });

  describe('Role-Based Access Control', () => {
    test('Owner should access all resources', async () => {
      const endpoints = [
        '/api/v1/users',
        '/api/v1/clients',
        '/api/v1/bookings',
        '/api/v1/services',
        '/api/v1/reports/dashboard'
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
      }
    });

    test('Manager should NOT access user management', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(403);
    });

    test('Stylist should NOT manage bookings', async () => {
      // Stylists can create bookings, but cannot delete them without permission
      const response = await request(app)
        .delete(`/api/v1/bookings/${booking._id}`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Permission-Based Access Control', () => {
    test('User with view_bookings can view bookings', async () => {
      const response = await request(app)
        .get('/api/v1/bookings')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
    });

    test('User without canDeleteBookings cannot delete booking', async () => {
      // Users can create/update bookings, but need specific permission to delete
      const response = await request(app)
        .delete(`/api/v1/bookings/${booking._id}`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(403);
    });

    test('User without manage_services cannot update service', async () => {
      const response = await request(app)
        .put(`/api/v1/services/${service._id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: 'Updated Service' });

      expect(response.status).toBe(403);
    });

    test('User without manage_permissions cannot update roles', async () => {
      const response = await request(app)
        .put(`/api/v1/users/${staffUser._id}/role`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ role: 'admin' });

      expect(response.status).toBe(403);
    });
  });

  describe('Resource Ownership', () => {
    let clientToken;

    beforeEach(() => {
      clientToken = testSetup.generateClientToken(client);
    });

    test('Client can view own profile', async () => {
      const response = await request(app)
        .get('/api/v1/client/profile')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data._id.toString()).toBe(client._id.toString());
    });

    test('Client can view own bookings', async () => {
      const response = await request(app)
        .get('/api/v1/client/bookings')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every(b => b.clientId === client._id.toString())).toBe(true);
    });

    test('Client cannot view other client profiles', async () => {
      const otherClient = await testSetup.createTestClient(tenant._id);

      // Clients should not be able to access admin endpoints at all
      const response = await request(app)
        .get(`/api/v1/clients/${otherClient._id}`)
        .set('Authorization', `Bearer ${clientToken}`);

      // Should be 401 because client token is not valid for admin routes
      expect(response.status).toBe(401);
    });

    test('Client cannot access admin endpoints', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${clientToken}`);

      // Should be 401 because client token is not valid for admin routes
      expect(response.status).toBe(401);
    });
  });

  describe('Privilege Escalation Prevention', () => {
    test('Stylist cannot promote themselves to owner', async () => {
      const response = await request(app)
        .put(`/api/v1/users/${staffUser._id}/role`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ role: 'owner' });

      expect(response.status).toBe(403);
    });

    test('Manager cannot grant themselves manage_permissions', async () => {
      const response = await request(app)
        .put(`/api/v1/users/${managerUser._id}/permissions`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          permissions: { manage_permissions: true }
        });

      expect(response.status).toBe(403);
    });

    test('User cannot modify another user with higher privileges', async () => {
      const response = await request(app)
        .put(`/api/v1/users/${adminUser._id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ firstName: 'Hacked' });

      expect(response.status).toBe(403);
    });
  });

  describe('Delete Operations Authorization', () => {
    test('Owner can delete users', async () => {
      const response = await request(app)
        .delete(`/api/v1/users/${staffUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    test('Manager cannot delete users', async () => {
      const response = await request(app)
        .delete(`/api/v1/users/${staffUser._id}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(403);
    });

    test('Manager can delete clients', async () => {
      const response = await request(app)
        .delete(`/api/v1/clients/${client._id}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(200);
    });

    test('Stylist cannot delete anything', async () => {
      const deleteEndpoints = [
        `/api/v1/clients/${client._id}`,
        `/api/v1/bookings/${booking._id}`,
        `/api/v1/services/${service._id}`
      ];

      for (const endpoint of deleteEndpoints) {
        const response = await request(app)
          .delete(endpoint)
          .set('Authorization', `Bearer ${staffToken}`);

        expect(response.status).toBe(403);
      }
    });
  });

  describe('Report Access Control', () => {
    test('Owner can access all reports', async () => {
      const response = await request(app)
        .get('/api/v1/reports/financial')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    test('Manager can view reports', async () => {
      const response = await request(app)
        .get('/api/v1/reports/dashboard')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(200);
    });

    test('Stylist without view_reports cannot access reports', async () => {
      const response = await request(app)
        .get('/api/v1/reports/dashboard')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(403);
    });

    test('Client cannot access any reports', async () => {
      const clientToken = testSetup.generateClientToken(client);

      const response = await request(app)
        .get('/api/v1/reports/dashboard')
        .set('Authorization', `Bearer ${clientToken}`);

      // Should be 401 because client token is not valid for admin routes
      expect(response.status).toBe(401);
    });
  });

  describe('Data Export Authorization', () => {
    test('Owner can export data', async () => {
      const response = await request(app)
        .get('/api/v1/reports/bookings/export')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    test('Manager with view_reports can export', async () => {
      const response = await request(app)
        .get('/api/v1/reports/bookings/export')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(200);
    });

    test('Stylist cannot export data', async () => {
      const response = await request(app)
        .get('/api/v1/reports/bookings/export')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(403);
    });
  });
});
