/**
 * Local Development Server for Testing Endpoints
 * 
 * This script runs the API locally to test endpoints before deploying to production.
 */

// Import dependencies
const express = require('express');
const app = require('./src/app').app;  // Importing the Express app without serverless wrapper

// Set environment variables for local testing
process.env.NODE_ENV = 'development';
process.env.SMS_ENABLED = 'true';
process.env.NOTIFICATION_PROVIDER = 'fast2sms';

// Configure port
const PORT = process.env.PORT || 3000;

// Add a test endpoint for local testing
app.get('/test', async (req, res) => {
    try {
        console.log('Local TEST endpoint called');
        
        // Get notification utility
        const { sendSMSNotification } = require('./src/utils/notification-v2');
        
        // Send test message to the same number used in production
        const result = await sendSMSNotification(
            "8588851907",
            "Hi Divij From LOCAL SERVER, You are receiving Rs.5 message (test)",
            { studentId: "test-student", messageType: "local-test" }
        );
        
        return res.json({
            success: true,
            message: 'Local test SMS sent!',
            result,
            environment: 'local'
        });
    } catch (error) {
        console.error('LOCAL TEST ENDPOINT ERROR:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Add a debug endpoint to test SMS cost optimization
app.get('/debug/sms-template', (req, res) => {
    const { optimizeSmsText } = require('./src/utils/sms-cost-optimizer');
    
    // Original message with Unicode character
    const originalMessage = "Your fee of ₹5000 is due on 20th Aug 2025 ✓";
    
    // Optimized message
    const optimizedMessage = optimizeSmsText(originalMessage);
    
    res.json({
        original: {
            message: originalMessage,
            length: originalMessage.length,
            cost: "₹10 (2 SMS units)",
            reason: "Contains Unicode characters (₹, ✓) and exceeds 70 chars"
        },
        optimized: {
            message: optimizedMessage,
            length: optimizedMessage.length,
            cost: "₹5 (1 SMS unit)",
            reason: "Uses only GSM-7 characters and fits in 160 chars"
        }
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`
🚀 LOCAL TEST SERVER STARTED

Server running at: http://localhost:${PORT}
Environment: ${process.env.NODE_ENV}

Available Test Endpoints:
- Health Check: http://localhost:${PORT}/health
- SMS Test: http://localhost:${PORT}/test
- SMS Template Debug: http://localhost:${PORT}/debug/sms-template
- Auth Login: http://localhost:${PORT}/api/auth/login (POST)

SMS Configuration:
- Provider: ${process.env.NOTIFICATION_PROVIDER}
- Enabled: ${process.env.SMS_ENABLED}
- Cost Optimization: ENABLED (Rs. instead of ₹)

Press Ctrl+C to stop the server.
`);
});
