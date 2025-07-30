/**
 * Direct SMS API Test
 * 
 * This script tests the Fast2SMS API directly without going through the Lambda function.
 * It helps identify if there are issues with the API key or configuration.
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const axios = require('axios');

// Constants
const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY;
const PHONE_NUMBER = process.argv[2] || '8588851907';

if (!FAST2SMS_API_KEY) {
  console.error('❌ ERROR: FAST2SMS_API_KEY environment variable is not set!');
  console.log('   Please check your .env.local file or set the variable.');
  process.exit(1);
}

async function testSMS() {
  console.log('🚀 Testing Fast2SMS API directly');
  console.log(`📱 Sending test SMS to: +91${PHONE_NUMBER}`);
  console.log(`🔑 API Key present: ${FAST2SMS_API_KEY ? 'YES' : 'NO'}`);
  
  // Print the masked API key for verification
  const maskedKey = FAST2SMS_API_KEY.substring(0, 4) + '...' + 
                    FAST2SMS_API_KEY.substring(FAST2SMS_API_KEY.length - 4);
  console.log(`   Key starts with: ${maskedKey}`);

  // Prepare the message
  const message = `TEST MSG: This is a test SMS sent at ${new Date().toLocaleTimeString()} to verify the Fast2SMS integration.`;
  
  try {
    // Log the API request details
    console.log('\n📤 Sending API request:');
    console.log(`   URL: https://www.fast2sms.com/dev/bulkV2`);
    console.log(`   Method: GET`);
    console.log(`   Message: ${message}`);
    
    // Make the API request - using GET method as required by Fast2SMS
    const response = await axios({
      method: 'get',
      url: 'https://www.fast2sms.com/dev/bulkV2',
      params: {
        authorization: FAST2SMS_API_KEY,
        route: 'v3',
        sender_id: 'TXTIND',
        message: message,
        language: 'english',
        flash: 0,
        numbers: PHONE_NUMBER,
      }
    });
    
    // Log the API response
    console.log('\n📥 API Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.return === true) {
      console.log('\n✅ SUCCESS: SMS sent successfully!');
      console.log(`   Message ID: ${response.data.message_id}`);
      console.log(`   Request ID: ${response.data.request_id}`);
    } else {
      console.log('\n❌ FAILURE: SMS sending failed!');
      console.log(`   Message: ${response.data.message}`);
    }
    
  } catch (error) {
    console.error('\n❌ ERROR making API request:');
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      // The request was made but no response was received
      console.error('   No response received from API');
      console.error(error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('   Error message:', error.message);
    }
  }
}

// Run the test
testSMS();
