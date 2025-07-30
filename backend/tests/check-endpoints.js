/**
 * Simple API Endpoint Check
 */
const https = require('https');

// API Base URL
const API_BASE = 'https://v9xret02rk.execute-api.ap-south-1.amazonaws.com/pro';

// Endpoints to check
const endpoints = [
  { path: '/test', method: 'GET', name: 'SMS Test Endpoint' },
  { path: '/health', method: 'GET', name: 'Health Check' },
  { path: '/api/auth/login', method: 'POST', name: 'Authentication', body: { email: 'admin@aiict.in', password: 'admin123' } }
];

// Function to make HTTP request
function makeRequest(endpoint) {
  return new Promise((resolve) => {
    console.log(`\nTesting ${endpoint.name}: ${endpoint.method} ${API_BASE}${endpoint.path}`);
    
    const options = {
      hostname: API_BASE.replace('https://', '').split('/')[0],
      path: '/pro' + endpoint.path,
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        try {
          const jsonData = JSON.parse(data);
          console.log('Response:', JSON.stringify(jsonData, null, 2));
          resolve({ success: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, data: jsonData });
        } catch (e) {
          console.log('Response (raw):', data);
          resolve({ success: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, data });
        }
      });
    });
    
    req.on('error', (error) => {
      console.error(`Error with ${endpoint.name}:`, error.message);
      resolve({ success: false, error: error.message });
    });
    
    req.on('timeout', () => {
      console.error(`Timeout with ${endpoint.name}`);
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });
    
    if (endpoint.body) {
      req.write(JSON.stringify(endpoint.body));
    }
    
    req.end();
  });
}

// Main function to test all endpoints
async function testEndpoints() {
  console.log('🔍 API ENDPOINT CHECK');
  console.log('====================');
  console.log(`API Base: ${API_BASE}`);
  
  let passed = 0;
  let failed = 0;
  
  for (const endpoint of endpoints) {
    const result = await makeRequest(endpoint);
    if (result.success) {
      console.log(`✅ ${endpoint.name}: PASSED`);
      passed++;
    } else {
      console.log(`❌ ${endpoint.name}: FAILED`);
      failed++;
    }
  }
  
  console.log('\n=== SUMMARY ===');
  console.log(`Total: ${endpoints.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
}

// Run tests
testEndpoints().catch(console.error);
