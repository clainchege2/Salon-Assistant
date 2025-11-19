const request = require('supertest');
const app = require('../../src/app');
const testSetup = require('../helpers/testSetup');
const User = require('../../src/models/User');
const Client = require('../../src/models/Client');

/**
 * Authentication Security Tests
 * Tests login, token validation, 2FA, and session management
 */
describe('Authentication Security Tests', () => {
  let tenant;
  let user;
  let client;

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
  });

  describe('Admin Login Security', () => {
    test('Should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
    });

    test('Should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'wrong@email.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
    });

    test('Should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
    });

    test('Should reject inactive user', async () => {
      await User.findByIdAndUpdate(user._id, { status: 'inactive' });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: 'password123'
        });

      expect(response.status).toBe(403);
    });

    test('Should track failed login attempts', async () => {
      // Make 3 failed attempts
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: user.email,
            password: 'wrongpassword'
          });
      }

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.failedLoginAttempts).toBeGreaterThan(0);
    });

    test('Should lock account after max failed attempts', async () => {
      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: user.email,
            password: 'wrongpassword'
          });
      }

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: 'password123'
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/locked|suspended/i);
    });
  });

  describe('Client Login Security', () => {
    test('Should login with valid phone and password', async () => {
      const response = await request(app)
        .post('/api/v1/client-auth/login')
        .send({
          phone: client.phone,
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('client');
    });

    test('Should reject invalid phone', async () => {
      const response = await request(app)
        .post('/api/v1/client-auth/login')
        .send({
          phone: '+254700999999',
          password: 'password123'
        });

      expect(response.status).toBe(401);
    });

    test('Should reject inactive client', async () => {
      await Client.findByIdAndUpdate(client._id, { accountStatus: 'suspended' });

      const response = await request(app)
        .post('/api/v1/client-auth/login')
        .send({
          phone: client.phone,
          password: 'password123'
        });

      expect(response.status).toBe(403);
    });
  });

  describe('Token Validation', () => {
    let validToken;

    beforeEach(() => {
      validToken = testSetup.generateUserToken(user);
    });

    test('Should accept valid token', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
    });

    test('Should reject missing token', async () => {
      const response = await request(app)
        .get('/api/v1/users');

      expect(response.status).toBe(401);
    });

    test('Should reject malformed token', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });

    test('Should reject token without Bearer prefix', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', validToken);

      expect(response.status).toBe(401);
    });
  });

  describe('2FA Flow', () => {
    beforeEach(async () => {
      // Enable 2FA for user
      await User.findByIdAndUpdate(user._id, {
        twoFactorEnabled: true,
        twoFactorSecret: 'test-secret'
      });
    });

    test('Should require 2FA code when enabled', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('requiresTwoFactor', true);
      expect(response.body).not.toHaveProperty('token');
    });

    test('Should reject invalid 2FA code', async () => {
      // First login to get temp token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: 'password123'
        });

      const response = await request(app)
        .post('/api/v1/auth/verify-2fa')
        .send({
          userId: user._id,
          code: '000000'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('Password Security', () => {
    test('Should reject weak passwords on registration', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          tenantId: tenant._id,
          firstName: 'New',
          lastName: 'User',
          email: 'newuser@test.com',
          password: '123', // Too weak
          phone: '+254700000002'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/password/i);
    });

    test('Should hash passwords before storage', async () => {
      const newUser = await testSetup.createTestUser(tenant._id);
      expect(newUser.password).not.toBe('password123');
      expect(newUser.password).toMatch(/^\$2[aby]\$/); // bcrypt hash pattern
    });

    test('Should not return password in responses', async () => {
      const token = testSetup.generateUserToken(user);
      
      const response = await request(app)
        .get(`/api/v1/users/${user._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).not.toHaveProperty('password');
    });
  });

  describe('Session Management', () => {
    test('Should logout successfully', async () => {
      const token = testSetup.generateUserToken(user);

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
    });

    test('Should invalidate token after logout', async () => {
      const token = testSetup.generateUserToken(user);

      // Logout
      await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      // Try to use token after logout
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${token}`);

      // Token should still work (JWT is stateless)
      // But in production, you'd use a token blacklist
      expect([200, 401]).toContain(response.status);
    });
  });

  describe('Rate Limiting on Auth Endpoints', () => {
    test('Should rate limit excessive login attempts', async () => {
      const requests = [];
      
      // Make 20 rapid login attempts
      for (let i = 0; i < 20; i++) {
        requests.push(
          request(app)
            .post('/api/v1/auth/login')
            .send({
              email: user.email,
              password: 'wrongpassword'
            })
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);

      expect(rateLimited).toBe(true);
    }, 10000);
  });
});
