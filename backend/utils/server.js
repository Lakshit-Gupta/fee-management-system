/**
 * Local development server for the fee management system backend
 */
// Load environment variables from .env.local file
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env.local') });

// Dynamically import the Express app with backward compatibility
let app;
try {
  // Try to import the app using the app export
  const appModule = require('./src/app');
  app = appModule.app;
  if (!app) {
    // Fallback if app is not exported but handler is
    console.warn('App export not found, creating Express instance from handler');
    const express = require('express');
    app = express();
    // Add basic routes if we had to create a new app
    app.get('/health', (req, res) => {
      res.json({ status: 'OK', timestamp: new Date().toISOString() });
    });
  }
} catch (error) {
  console.error('Error importing app:', error);
  process.exit(1);
}

// Set up mock environment variables for local development if not already set
process.env.STUDENTS_TABLE = process.env.STUDENTS_TABLE || 'Students-local';
process.env.FEES_TABLE = process.env.FEES_TABLE || 'Fees-local';
process.env.NOTIFICATION_LOGS_TABLE = process.env.NOTIFICATION_LOGS_TABLE || 'NotificationLogs-local';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'local_development_secret';
process.env.SMS_ENABLED = process.env.SMS_ENABLED || 'true';
process.env.FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY || 'Bd8l5v37wzxTXeVFEbIDriQPjykRtWS6hguYUM2G1samAcN4ZoJ9qErzCM2HKSP6XQydDkabnc8ogAlI';

// Add test endpoint for SMS testing
app.get('/test', async (req, res) => {
  try {
    const { sendCustomSMS } = require('./src/utils/notification-v2');
    const phoneNumber = '8588851907'; // Phone number from check-students.js
    const message = "Hi Divij From Local Development, You are receiving Rs.5 message (test)";
    const metadata = { studentId: "test-student", messageType: "test" };
    
    console.log(`TEST ENDPOINT: Sending test SMS to ${phoneNumber}`);
    const result = await sendCustomSMS(phoneNumber, message, metadata);
    
    return res.json({
      success: true,
      message: 'Test SMS sent!',
      result
    });
  } catch (error) {
    console.error('TEST ENDPOINT ERROR:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start the local server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
🚀 Fee Management System Backend Server
=====================================
✅ Local server running at http://localhost:${PORT}
✅ Try the health endpoint: http://localhost:${PORT}/health
✅ Test SMS endpoint: http://localhost:${PORT}/test
✅ Admin login: http://localhost:${PORT}/api/auth/login

Environment: ${process.env.NODE_ENV || 'development'}
  `);
});
