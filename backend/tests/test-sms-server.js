/**
 * Fast2SMS Test Server
 * 
 * A simplified Express server for testing Fast2SMS integration
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const express = require('express');
const axios = require('axios');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Fast2SMS Test Server is running'
  });
});

/**
 * Direct Fast2SMS test endpoint
 * 
 * Directly calls the Fast2SMS API without any intermediate layers
 * to identify issues with the integration
 */
app.get('/direct-test', async (req, res) => {
  try {
    const apiKey = process.env.FAST2SMS_API_KEY;
    const phoneNumber = 'YOUR_TEST_PHONE';
    const message = 'Direct test of Fast2SMS API with GSM-compatible message using Rs. instead of ₹ symbol';
    
    console.log(`Sending direct SMS test to ${phoneNumber}`);
    console.log(`API Key: ${apiKey ? apiKey.substring(0, 5) + '...' : 'Not set'}`);
    
    if (!apiKey) {
      return res.status(400).json({ 
        success: false, 
        error: 'FAST2SMS_API_KEY not set in .env.local' 
      });
    }
    
    // Make direct API call to Fast2SMS
    const response = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
      params: {
        authorization: apiKey,
        route: 'q',
        message: message,
        language: 'english',
        flash: '0',
        numbers: phoneNumber
      }
    });
    
    console.log('Fast2SMS Response:', JSON.stringify(response.data));
    
    return res.json({
      success: true,
      message: 'Direct Fast2SMS test',
      request: { phoneNumber, messagePreview: message },
      response: response.data
    });
    
  } catch (error) {
    console.error('DIRECT TEST ERROR:', error);
    
    // Log more information about the error
    let errorDetails = { message: error.message };
    if (error.response) {
      errorDetails.status = error.response.status;
      errorDetails.data = error.response.data;
    }
    
    return res.status(500).json({
      success: false,
      error: errorDetails
    });
  }
});

/**
 * Get wallet balance from Fast2SMS
 */
app.get('/wallet-balance', async (req, res) => {
  try {
    const apiKey = process.env.FAST2SMS_API_KEY;
    
    if (!apiKey) {
      return res.status(400).json({ 
        success: false, 
        error: 'FAST2SMS_API_KEY not set in .env.local' 
      });
    }
    
    // Check wallet balance
    const response = await axios.get('https://www.fast2sms.com/dev/wallet', {
      params: {
        authorization: apiKey
      }
    });
    
    console.log('Wallet Response:', JSON.stringify(response.data));
    
    if (response.data.return === true) {
      return res.json({
        success: true,
        balance: response.data.wallet,
        currency: 'INR'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch wallet balance',
      response: response.data
    });
    
  } catch (error) {
    console.error('WALLET CHECK ERROR:', error);
    
    let errorDetails = { message: error.message };
    if (error.response) {
      errorDetails.status = error.response.status;
      errorDetails.data = error.response.data;
    }
    
    return res.status(500).json({
      success: false,
      error: errorDetails
    });
  }
});

// Start server
const PORT = 3002; // Use a different port to avoid conflicts
app.listen(PORT, () => {
  console.log(`
 Fast2SMS Test Server
============================
 Server running at http://localhost:${PORT}
 Health check: http://localhost:${PORT}/health
 Direct SMS test: http://localhost:${PORT}/direct-test
 Wallet balance: http://localhost:${PORT}/wallet-balance

FAST2SMS_API_KEY is ${process.env.FAST2SMS_API_KEY ? 'configured' : 'NOT configured'}
SMS_ENABLED is ${process.env.SMS_ENABLED === 'true' ? 'true' : 'not enabled'}
  `);
});
