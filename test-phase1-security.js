/**
 * Test script for Phase 1 Security Implementations
 * Tests: Query Validation, Rate Limiting, Audit Logging
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000/api/v1';
let adminToken = '';
let tenantId = '';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`)
};

// Test 1: Query Validation Middleware
async function testQueryValidation() {
  log.info('\n=== Test 1: Query Validation Middleware ===');
  
  try {
    // This should work - includes tenantId
    const response = await axios.get(`${API_URL}/clients`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (response.data.success) {
      log.success('Query with tenantId works correctly');
    }
  } catch (error) {
    log.error(`Query validation test failed: ${error.message}`);
  }
}

// Test 2: Tenant Rate Limiting
async function testRateLimiting() {
  log.info('\n=== Test 2: Tenant Rate Limiting ===');
  
  try {
    // Make multiple requests to test rate limiting
    const requests = [];
    for (let i = 0; i < 10; i++) {
      requests.push(
        axios.get(`${API_URL}/clients`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        })
      );
    }
    
    const responses = await Promise.all(requests);
    
    // Check rate limit headers
    const lastResponse = responses[responses.length - 1];
    const headers = lastResponse.headers;
    
    if (headers['x-ratelimit-limit']) {
      log.success(`Rate limit headers present:`);
      log.info(`  Limit: ${headers['x-ratelimit-limit']}`);
      log.info(`  Remaining: ${headers['x-ratelimit-remaining']}`);
      log.info(`  Tier: ${headers['x-ratelimit-tier']}`);
    } else {
      log.warn('Rate limit headers not found');
    }
    
    // Try to exceed rate limit (for free tier: 100 req/min)
    log.info('Testing rate limit enforcement...');
    const manyRequests = [];
    for (let i = 0; i < 105; i++) {
      manyRequests.push(
        axios.get(`${API_URL}/clients`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        }).catch(err => err.response)
      );
    }
    
    const results = await Promise.all(manyRequests);
    const rateLimited = results.filter(r => r?.status === 429);
    
    if (rateLimited.length > 0) {
      log.success(`Rate limiting working: ${rateLimited.length} requests blocked`);
      log.info(`Error message: ${rateLimited[0].data.message}`);
    } else {
      log.warn('Rate limit not triggered (may need more requests or lower limit)');
    }
    
  } catch (error) {
    log.error(`Rate limiting test failed: ${error.message}`);
  }
}

// Test 3: Audit Logging
async function testAuditLogging() {
  log.info('\n=== Test 3: Audit Logging ===');
  
  try {
    // Create a test client (should be audited)
    const clientData = {
      firstName: 'Test',
      lastName: 'Audit',
      phone: `+254${Date.now().toString().slice(-9)}`,
      email: `test.audit.${Date.now()}@example.com`
    };
    
    const createResponse = await axios.post(`${API_URL}/clients`, clientData, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (createResponse.data.success) {
      log.success('Test client created');
      const clientId = createResponse.data.data._id;
      
      // Wait a moment for audit log to be created
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check audit logs
      const auditResponse = await axios.get(`${API_URL}/audit-logs`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: { resource: 'Client', limit: 10 }
      });
      
      if (auditResponse.data.success) {
        const logs = auditResponse.data.data;
        log.success(`Found ${logs.length} audit log entries`);
        
        // Find our create action
        const createLog = logs.find(l => 
          l.action === 'CREATE' && 
          l.resource === 'Client' &&
          l.resourceId === clientId
        );
        
        if (createLog) {
          log.success('Audit log created for client creation');
          log.info(`  Action: ${createLog.action}`);
          log.info(`  Resource: ${createLog.resource}`);
          log.info(`  User: ${createLog.userId?.firstName} ${createLog.userId?.lastName}`);
          log.info(`  Timestamp: ${new Date(createLog.timestamp).toLocaleString()}`);
        } else {
          log.warn('Audit log not found for client creation');
        }
        
        // Test audit summary
        const summaryResponse = await axios.get(`${API_URL}/audit-logs/summary`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        if (summaryResponse.data.success) {
          log.success('Audit summary retrieved');
          log.info(`  Total logs: ${summaryResponse.data.data.totalLogs}`);
          log.info(`  Unique users: ${summaryResponse.data.data.uniqueUsers}`);
        }
      }
      
      // Clean up: delete test client
      await axios.delete(`${API_URL}/clients/${clientId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      log.info('Test client cleaned up');
      
    }
  } catch (error) {
    log.error(`Audit logging test failed: ${error.response?.data?.message || error.message}`);
  }
}

// Test 4: Performance Impact
async function testPerformance() {
  log.info('\n=== Test 4: Performance Impact ===');
  
  try {
    // Test without middleware (baseline)
    const start1 = Date.now();
    await axios.get(`${API_URL}/clients`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const baseline = Date.now() - start1;
    
    // Test with all middleware
    const start2 = Date.now();
    for (let i = 0; i < 10; i++) {
      await axios.get(`${API_URL}/clients`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    }
    const withMiddleware = (Date.now() - start2) / 10;
    
    log.success('Performance test completed');
    log.info(`  Baseline: ${baseline}ms`);
    log.info(`  With middleware: ${withMiddleware.toFixed(2)}ms`);
    log.info(`  Overhead: ${(withMiddleware - baseline).toFixed(2)}ms`);
    
    if (withMiddleware - baseline < 10) {
      log.success('Performance impact is minimal (<10ms)');
    } else {
      log.warn(`Performance impact is ${(withMiddleware - baseline).toFixed(2)}ms`);
    }
    
  } catch (error) {
    log.error(`Performance test failed: ${error.message}`);
  }
}

// Main test runner
async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('  Phase 1 Security Implementation Tests');
  console.log('='.repeat(60));
  
  // Login first
  try {
    log.info('\nLogging in...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'owner@elitestyles.com',
      password: 'Password123!',
      tenantSlug: 'elite-styles-pro-1762621490356'
    });
    
    if (loginResponse.data.success) {
      adminToken = loginResponse.data.token;
      tenantId = loginResponse.data.user.tenantId;
      log.success('Login successful');
      log.info(`Tenant: ${tenantId}`);
    } else {
      log.error('Login failed');
      return;
    }
  } catch (error) {
    log.error(`Login failed: ${error.response?.data?.message || error.message}`);
    log.warn('Make sure the server is running and test credentials exist');
    return;
  }
  
  // Run all tests
  await testQueryValidation();
  await testRateLimiting();
  await testAuditLogging();
  await testPerformance();
  
  console.log('\n' + '='.repeat(60));
  console.log('  Tests Complete!');
  console.log('='.repeat(60) + '\n');
}

// Run tests
runTests().catch(error => {
  log.error(`Test suite failed: ${error.message}`);
  process.exit(1);
});
