const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Tenant = require('../../src/models/Tenant');
const User = require('../../src/models/User');
const Client = require('../../src/models/Client');
const Service = require('../../src/models/Service');
const Booking = require('../../src/models/Booking');
const AuditLog = require('../../src/models/AuditLog');

/**
 * Test Setup Helper
 * Provides utilities for security testing
 */
class TestSetup {
  constructor() {
    this.testTenants = [];
    this.testUsers = [];
    this.testClients = [];
    this.testServices = [];
    this.testBookings = [];
  }

  /**
   * Connect to test database
   */
  async connectDB() {
    const mongoURI = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/salon-test';
    
    // Remove deprecated options - they're no longer needed in Mongoose 6+
    await mongoose.connect(mongoURI);
  }

  /**
   * Disconnect from database
   */
  async disconnectDB() {
    await mongoose.connection.close();
  }

  /**
   * Clean up all test data
   */
  async cleanup() {
    await Promise.all([
      AuditLog.deleteMany({}),
      Booking.deleteMany({}),
      Service.deleteMany({}),
      Client.deleteMany({}),
      User.deleteMany({}),
      Tenant.deleteMany({})
    ]);
    
    this.testTenants = [];
    this.testUsers = [];
    this.testClients = [];
    this.testServices = [];
    this.testBookings = [];
  }

  /**
   * Create test tenant
   */
  async createTestTenant(overrides = {}) {
    const tenantData = {
      businessName: 'Test Salon',
      slug: `test-salon-${Date.now()}`,
      contactEmail: 'test@testsalon.com',
      contactPhone: '+254700000000',
      address: {
        street: '123 Test Street',
        city: 'Test City',
        country: 'Kenya'
      },
      subscription: {
        tier: 'premium',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      },
      status: 'active',
      ...overrides
    };

    const tenant = await Tenant.create(tenantData);
    this.testTenants.push(tenant);
    return tenant;
  }

  /**
   * Create test user (admin/staff)
   */
  async createTestUser(tenantId, overrides = {}) {
    const userData = {
      tenantId,
      firstName: 'Test',
      lastName: 'User',
      email: `testuser${Date.now()}@test.com`,
      password: 'password123', // Don't pre-hash - let model handle it
      phone: '+254700000001',
      role: 'owner',
      permissions: {
        view_bookings: true,
        manage_bookings: true,
        view_clients: true,
        manage_clients: true,
        view_users: true,
        manage_users: true,
        view_services: true,
        manage_services: true,
        view_reports: true,
        manage_permissions: true
      },
      twoFactorEnabled: false,
      status: 'active',
      ...overrides
    };

    const user = await User.create(userData);
    this.testUsers.push(user);
    return user;
  }

  /**
   * Create test client
   */
  async createTestClient(tenantId, overrides = {}) {
    const clientData = {
      tenantId,
      firstName: 'Test',
      lastName: 'Client',
      phone: `+25470000${Date.now().toString().slice(-4)}`,
      email: `testclient${Date.now()}@test.com`,
      password: 'password123', // Don't pre-hash - let model handle it
      dateOfBirth: new Date('1990-01-01'),
      accountStatus: 'active',
      twoFactorEnabled: false,
      ...overrides
    };

    const client = await Client.create(clientData);
    this.testClients.push(client);
    return client;
  }

  /**
   * Create test service
   */
  async createTestService(tenantId, overrides = {}) {
    const serviceData = {
      tenantId,
      name: 'Test Service',
      description: 'Test service description',
      category: 'braids',
      duration: 60,
      price: 1000,
      status: 'active',
      ...overrides
    };

    const service = await Service.create(serviceData);
    this.testServices.push(service);
    return service;
  }

  /**
   * Create test booking
   */
  async createTestBooking(tenantId, clientId, serviceId, overrides = {}) {
    const bookingData = {
      tenantId,
      clientId,
      type: 'reserved',
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: 'confirmed',
      services: [{
        serviceId,
        serviceName: 'Test Service',
        price: 1000,
        duration: 60
      }],
      totalPrice: 1000,
      totalDuration: 60,
      ...overrides
    };

    const booking = await Booking.create(bookingData);
    this.testBookings.push(booking);
    return booking;
  }

  /**
   * Generate JWT token for user
   */
  generateUserToken(user, options = {}) {
    return jwt.sign(
      { 
        id: user._id,
        tenantId: user.tenantId,
        role: user.role
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: options.expiresIn || '1h' }
    );
  }

  /**
   * Generate JWT token for client
   */
  generateClientToken(client) {
    return jwt.sign(
      { 
        id: client._id,
        tenantId: client.tenantId,
        type: 'client'
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  }

  /**
   * Create user with limited permissions
   */
  async createLimitedUser(tenantId, permissions = {}) {
    return this.createTestUser(tenantId, {
      role: 'stylist',
      permissions: {
        view_bookings: false,
        manage_bookings: false,
        view_clients: false,
        manage_clients: false,
        view_users: false,
        manage_users: false,
        view_services: false,
        manage_services: false,
        view_reports: false,
        manage_permissions: false,
        ...permissions
      }
    });
  }

  /**
   * Wait for async operations
   */
  async wait(ms = 100) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new TestSetup();
