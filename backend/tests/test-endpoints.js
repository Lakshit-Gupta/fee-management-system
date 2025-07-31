/**
 * API Endpoint Verification Script
 * For production deployment verification
 */

const axios = require('axios');
const chalk = require('chalk'); // For colorful console output

// Configure API base URL
const API_BASE_URL = 'https://v9xret02rk.execute-api.ap-south-1.amazonaws.com/pro';

// Test credentials
const TEST_ADMIN = {
  email: 'admin@aiict.in',
  password: 'Admin123!' // Replace with actual test password
};

// Initialize storage for auth token
let authToken = '';

// Utility for pretty printing
const print = {
  title: (text) => console.log(chalk.cyan.bold(`\n=== ${text} ===`)),
  success: (text) => console.log(chalk.green(` ${text}`)),
  error: (text) => console.log(chalk.red(` ${text}`)),
  info: (text) => console.log(chalk.yellow(` ${text}`)),
  json: (obj) => console.log(JSON.stringify(obj, null, 2)),
  header: () => console.log(chalk.cyan.bold('\n API ENDPOINT VERIFICATION')),
  divider: () => console.log(chalk.gray('--------------------------------------------------')),
  summary: (results) => {
    const total = results.length;
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = total - passed;
    
    console.log(chalk.cyan.bold('\n=== TEST SUMMARY ==='));
    console.log(chalk.white(`Total Tests: ${total}`));
    console.log(chalk.green(`Passed: ${passed}`));
    console.log(chalk.red(`Failed: ${failed}`));
    console.log(chalk.cyan.bold('\n=== RESULTS ==='));
    
    results.forEach(result => {
      if (result.status === 'passed') {
        console.log(chalk.green(` ${result.name}: PASSED`));
      } else {
        console.log(chalk.red(` ${result.name}: FAILED - ${result.error}`));
      }
    });
  }
};

// Test results collector
const results = [];

// Helper function for API requests
async function apiRequest(endpoint, method = 'GET', data = null, authRequired = false) {
  try {
    const headers = authRequired ? { Authorization: `Bearer ${authToken}` } : {};
    
    const response = await axios({
      method,
      url: `${API_BASE_URL}${endpoint}`,
      data,
      headers,
      validateStatus: () => true // Don't throw on error status codes
    });
    
    return { 
      success: response.status >= 200 && response.status < 300,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      status: error.response?.status || 500
    };
  }
}

// Test suite functions
async function testPublicEndpoints() {
  print.title('Testing Public Endpoints');
  
  // Test health endpoint
  try {
    print.info('Testing /health endpoint...');
    const health = await apiRequest('/health');
    
    if (health.success) {
      print.success('Health endpoint is working');
      print.json(health.data);
      results.push({ name: 'Health Endpoint', status: 'passed' });
    } else {
      print.error(`Health endpoint failed: ${health.status}`);
      results.push({ name: 'Health Endpoint', status: 'failed', error: `Status ${health.status}` });
    }
  } catch (error) {
    print.error(`Error testing health endpoint: ${error.message}`);
    results.push({ name: 'Health Endpoint', status: 'failed', error: error.message });
  }
  
  // Test SMS endpoint
  try {
    print.info('Testing /test endpoint (SMS)...');
    const smsTest = await apiRequest('/test');
    
    if (smsTest.success) {
      print.success('SMS test endpoint is working');
      print.json(smsTest.data);
      results.push({ name: 'SMS Test Endpoint', status: 'passed' });
    } else {
      print.error(`SMS test endpoint failed: ${smsTest.status}`);
      results.push({ name: 'SMS Test Endpoint', status: 'failed', error: `Status ${smsTest.status}` });
    }
  } catch (error) {
    print.error(`Error testing SMS endpoint: ${error.message}`);
    results.push({ name: 'SMS Test Endpoint', status: 'failed', error: error.message });
  }
}

async function testAuthentication() {
  print.title('Testing Authentication');
  
  try {
    print.info('Testing /api/auth/login endpoint...');
    const auth = await apiRequest('/api/auth/login', 'POST', TEST_ADMIN);
    
    if (auth.success && auth.data.token) {
      print.success('Authentication successful');
      authToken = auth.data.token;
      results.push({ name: 'Authentication', status: 'passed' });
    } else {
      print.error(`Authentication failed: ${auth.status}`);
      print.json(auth.data);
      results.push({ name: 'Authentication', status: 'failed', error: `Status ${auth.status}` });
    }
  } catch (error) {
    print.error(`Error testing authentication: ${error.message}`);
    results.push({ name: 'Authentication', status: 'failed', error: error.message });
  }
}

async function testStudentEndpoints() {
  print.title('Testing Student Endpoints');
  
  if (!authToken) {
    print.error('Authentication required for student endpoints');
    results.push({ name: 'Student Endpoints', status: 'failed', error: 'No authentication token' });
    return;
  }
  
  try {
    print.info('Testing /api/students endpoint...');
    const students = await apiRequest('/api/students', 'GET', null, true);
    
    if (students.success) {
      print.success('Student listing endpoint is working');
      print.info(`Found ${students.data.students?.length || 0} students`);
      results.push({ name: 'Student Listing', status: 'passed' });
    } else {
      print.error(`Student listing failed: ${students.status}`);
      results.push({ name: 'Student Listing', status: 'failed', error: `Status ${students.status}` });
    }
  } catch (error) {
    print.error(`Error testing student endpoints: ${error.message}`);
    results.push({ name: 'Student Listing', status: 'failed', error: error.message });
  }
}

async function testFeeEndpoints() {
  print.title('Testing Fee Endpoints');
  
  if (!authToken) {
    print.error('Authentication required for fee endpoints');
    results.push({ name: 'Fee Endpoints', status: 'failed', error: 'No authentication token' });
    return;
  }
  
  try {
    print.info('Testing /api/fees endpoint...');
    const fees = await apiRequest('/api/fees', 'GET', null, true);
    
    if (fees.success) {
      print.success('Fee listing endpoint is working');
      print.info(`Found ${fees.data.fees?.length || 0} fee records`);
      results.push({ name: 'Fee Listing', status: 'passed' });
    } else {
      print.error(`Fee listing failed: ${fees.status}`);
      results.push({ name: 'Fee Listing', status: 'failed', error: `Status ${fees.status}` });
    }
  } catch (error) {
    print.error(`Error testing fee endpoints: ${error.message}`);
    results.push({ name: 'Fee Listing', status: 'failed', error: error.message });
  }
}

async function testReminderEndpoints() {
  print.title('Testing Reminder Endpoints');
  
  if (!authToken) {
    print.error('Authentication required for reminder endpoints');
    results.push({ name: 'Reminder Endpoints', status: 'failed', error: 'No authentication token' });
    return;
  }
  
  try {
    print.info('Testing /api/reminders/status endpoint...');
    const reminderStatus = await apiRequest('/api/reminders/status', 'GET', null, true);
    
    if (reminderStatus.success) {
      print.success('Reminder status endpoint is working');
      print.json(reminderStatus.data);
      results.push({ name: 'Reminder Status', status: 'passed' });
    } else {
      print.error(`Reminder status failed: ${reminderStatus.status}`);
      results.push({ name: 'Reminder Status', status: 'failed', error: `Status ${reminderStatus.status}` });
    }
  } catch (error) {
    print.error(`Error testing reminder endpoints: ${error.message}`);
    results.push({ name: 'Reminder Status', status: 'failed', error: error.message });
  }
}

// Main test function
async function runTests() {
  print.header();
  print.info(`Testing API at: ${API_BASE_URL}`);
  print.divider();
  
  await testPublicEndpoints();
  await testAuthentication();
  await testStudentEndpoints();
  await testFeeEndpoints();
  await testReminderEndpoints();
  
  print.divider();
  print.summary(results);
}

// Run tests
runTests().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
