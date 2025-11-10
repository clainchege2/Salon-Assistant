const { spawn } = require('child_process');
const axios = require('axios');

async function waitForServer(url, timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      await axios.get(url);
      return true;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return false;
}

async function runTests() {
  console.log('🚀 Starting Hair Salon Assistant Tests...\n');

  // Start the server
  console.log('Starting server...');
  const server = spawn('node', ['src/app.js'], {
    stdio: 'pipe',
    env: { ...process.env, NODE_ENV: 'test' }
  });

  server.stdout.on('data', (data) => {
    console.log(`Server: ${data}`);
  });

  server.stderr.on('data', (data) => {
    console.error(`Server Error: ${data}`);
  });

  // Wait for server to start
  const serverReady = await waitForServer('http://localhost:3000/health');
  
  if (!serverReady) {
    console.error('❌ Server failed to start within 30 seconds');
    server.kill();
    process.exit(1);
  }

  console.log('✅ Server is running\n');

  try {
    // Run API tests
    const testAPI = require('./test/testAPI');
    await testAPI();
    
    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Tests failed:', error.message);
  } finally {
    // Clean up
    server.kill();
    process.exit(0);
  }
}

runTests();