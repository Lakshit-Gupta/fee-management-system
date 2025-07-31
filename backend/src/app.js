const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const studentRoutes = require('./handlers/student');
const feeRoutes = require('./handlers/fees');
const notificationRoutes = require('./handlers/notifications');
const reminderRoutes = require('./handlers/reminders');
const statsRoutes = require('./handlers/stats');
const exportRoutes = require('./handlers/export');
const multiExportHandler = require('./handlers/multi-export');
const authRoutes = require('./handlers/auth');
const authMiddleware = require('./utils/auth-middleware');
const { createTableIfNotExists } = require('./utils/database');
const reminderJob = require('./jobs/reminderJob');
const axios = require('axios');

// Validate required environment variables
const requiredEnvVars = ['AWS_REGION', 'AISENSY_API_KEY', 'AISENSY_PARTNER_ID'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.warn(`⚠️ Missing environment variables: ${missingVars.join(', ')}`);
    console.warn('Some features may not work correctly!');
}

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*', // Restrict in production
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(helmet()); // Security headers
app.use(express.json({ limit: '1mb' })); // Limit payload size
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Parse cookies for auth

// Create DynamoDB table if it doesn't exist
createTableIfNotExists()
  .then(() => console.log('DynamoDB table checked/created successfully'))
  .catch(err => console.error('Error with DynamoDB table setup:', err));

// Authentication Routes (unprotected)
app.use('/api/auth', authRoutes);

// Protected API Routes (require authentication)
app.use('/api/students', authMiddleware, studentRoutes);
app.use('/api/fees', authMiddleware, feeRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/reminders', authMiddleware, reminderRoutes);
app.use('/api/stats', authMiddleware, statsRoutes);
app.use('/api/export', authMiddleware, exportRoutes);

// CSV and JSON export endpoints only (protected)
app.get('/api/export-v2/students/csv', authMiddleware, multiExportHandler.exportStudentsCSV);
app.get('/api/export-v2/students/json', authMiddleware, multiExportHandler.exportStudentsJSON);
app.get('/api/export-v2/notifications/csv', authMiddleware, multiExportHandler.exportNotificationsCSV);
app.get('/api/export-v2/notifications/json', authMiddleware, multiExportHandler.exportNotificationsJSON);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Enhanced logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Body:`, 
        req.method === 'GET' ? '(GET request)' : JSON.stringify(req.body).substring(0, 200));
    
    // Capture original send to log responses
    const originalSend = res.send;
    res.send = function(data) {
        console.log(`[${new Date().toISOString()}] Response ${res.statusCode}:`, 
            data ? data.toString().substring(0, 200) + '...' : 'No data');
        return originalSend.apply(res, arguments);
    };
    
    next();
});
app.get('/test', async (req, res) => {
    try {
        const axios = require('axios');
        const phoneNumber = 'YOUR_TEST_PHONE';
        const message = 'Testing from Production - Your fee of Rs.5000 is due on 30/07/2025. Pay now: YOUR_PAYMENT_URL';
        const apiKey = process.env.FAST2SMS_API_KEY;
        
        console.log('TEST ENDPOINT: Sending SMS to', phoneNumber);
        
        if (!apiKey) {
            console.error('FAST2SMS_API_KEY not set in environment');
            return res.status(500).json({ 
                success: false, 
                error: 'SMS service configuration error' 
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
        
        console.log('Fast2SMS API Response:', JSON.stringify(response.data));
        
        return res.json({
            success: true,
            message: 'SMS sent successfully',
            result: {
                phoneNumber: phoneNumber,
                message: message,
                status: response.data.return ? 'sent' : 'failed',
                timestamp: new Date().toISOString(),
                fast2sms: response.data
            }
        });
    } catch (err) {
        console.error('TEST ENDPOINT ERROR:', err);
        
        // Get more details about the error
        let errorDetails = { message: err.message };
        if (err.response) {
            errorDetails.status = err.response.status;
            errorDetails.data = err.response.data;
        }
        
        res.status(500).json({ 
            success: false, 
            error: errorDetails 
        });
    }
});
// Initialize jobs (add this near the bottom of your file, before app.listen)
if (process.env.NODE_ENV === 'production') {
  // Only run scheduled jobs in production
  reminderJob.init();
  console.log('Scheduled jobs initialized');
}

// SMS sending function
async function sendSMS({ to, message }) {
    const apiKey = process.env.FAST2SMS_API_KEY;
    const url = 'https://www.fast2sms.com/dev/bulkV2';

    const params = {
        authorization: apiKey,
        route: 'q',
        message,
        numbers: to,
        flash: '0'
    };

    try {
        const response = await axios.get(url, { params });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || error.message);
    }
}

// Export for Lambda
module.exports.handler = serverless(app);

// Also export the Express app for local server
module.exports.app = app;

// Also export the Express app for local server
module.exports.app = app;