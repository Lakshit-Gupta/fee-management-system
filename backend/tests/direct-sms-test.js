/**
 * SMS Test Script - Send a test SMS to verify the SMS integration
 * 
 * This script directly uses the Fast2SMS API to send a test message
 * It bypasses any layers that might be causing issues in the main application
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const axios = require('axios');

async function sendTestSMS() {
    // Phone number from our test
    const phoneNumber = 'YOUR_TEST_PHONE';
    const message = 'Direct test SMS - Your fee of Rs.5000 is due on 30/07/2025. Please settle your pending dues. Reply STOP to opt out.';
    const apiKey = process.env.FAST2SMS_API_KEY;

    console.log('--- SMS TEST ---');
    console.log(`Phone: ${phoneNumber}`);
    console.log(`Message: ${message}`);
    console.log(`API Key: ${apiKey ? apiKey.substring(0, 5) + '...' : 'Not set'}`);
    
    if (!apiKey) {
        console.error(' ERROR: FAST2SMS_API_KEY not set in .env.local');
        process.exit(1);
    }
    
    try {
        // Send SMS using Fast2SMS API
        const response = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
            params: {
                authorization: apiKey,
                route: 'q', // Quick SMS route
                message: message,
                language: 'english',
                flash: '0',
                numbers: phoneNumber
            }
        });
        
        console.log('\n--- API RESPONSE ---');
        console.log(JSON.stringify(response.data, null, 2));
        
        if (response.data.return === true) {
            console.log('\n SUCCESS: SMS sent successfully!');
            console.log('Request ID:', response.data.request_id);
            console.log('Message ID:', response.data.message_id);
        } else {
            console.log('\n ERROR: Fast2SMS API returned an error');
            console.log(response.data);
        }
    } catch (error) {
        console.error('\n ERROR sending SMS:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Response:', error.response.data);
        }
    }
}

// Run the test
sendTestSMS();
