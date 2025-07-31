/**
 * Simple local server for testing
 */
// Load environment variables from .env.local file
require('dotenv').config({ path: '.env.local' });

const express = require('express');
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
    message: 'Local server is running'
  });
});

// Test endpoint for SMS
app.get('/test', async (req, res) => {
  try {
    const axios = require('axios');
    const phoneNumber = 'YOUR_TEST_PHONE';
    const message = 'TEST: Testing from Local Server - Your fee of Rs.5000 is due on 30/07/2025. Pay now: YOUR_PAYMENT_URL';
    const apiKey = process.env.FAST2SMS_API_KEY;
    
    console.log('TEST ENDPOINT: Sending real SMS to', phoneNumber);
    console.log('Message:', message);
    console.log('API Key configured:', !!apiKey);
    
    if (!apiKey) {
      return res.status(400).json({ 
        success: false, 
        error: 'FAST2SMS_API_KEY not set in environment' 
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
  } catch (error) {
    console.error('TEST ENDPOINT ERROR:', error);
    
    // Get more details about the error
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

// Authentication endpoint mock
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'YOUR_ADMIN_EMAIL' && password === 'YOUR_ADMIN_PASSWORD') {
    res.json({
      success: true,
      token: 'mock-jwt-token',
      user: { email, role: 'admin' }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

// Token refresh endpoint
app.post('/api/auth/refresh', (req, res) => {
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    res.json({
      success: true,
      token: 'refreshed-mock-jwt-token'
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// Mock student data
const students = [
  { id: '1', name: 'Student One', phone: 'PHONE_NUMBER_1', email: 'student1@example.com', grade: '12th', status: 'active' },
  { id: '2', name: 'Student Two', phone: 'PHONE_NUMBER_2', email: 'student2@example.com', grade: '10th', status: 'active' },
  { id: '3', name: 'Student Three', phone: 'PHONE_NUMBER_3', email: 'student3@example.com', grade: '11th', status: 'inactive' }
];

// Student Management Endpoints
app.get('/api/students', (req, res) => {
  res.json({ success: true, data: students });
});

app.post('/api/students', (req, res) => {
  const newStudent = { id: `${students.length + 1}`, ...req.body };
  students.push(newStudent);
  res.status(201).json({ success: true, data: newStudent });
});

app.get('/api/students/:id', (req, res) => {
  const student = students.find(s => s.id === req.params.id);
  if (student) {
    res.json({ success: true, data: student });
  } else {
    res.status(404).json({ success: false, message: 'Student not found' });
  }
});

app.put('/api/students/:id', (req, res) => {
  const index = students.findIndex(s => s.id === req.params.id);
  if (index !== -1) {
    students[index] = { ...students[index], ...req.body };
    res.json({ success: true, data: students[index] });
  } else {
    res.status(404).json({ success: false, message: 'Student not found' });
  }
});

app.delete('/api/students/:id', (req, res) => {
  const index = students.findIndex(s => s.id === req.params.id);
  if (index !== -1) {
    const student = students.splice(index, 1)[0];
    res.json({ success: true, message: 'Student deleted successfully', data: student });
  } else {
    res.status(404).json({ success: false, message: 'Student not found' });
  }
});

// Mock fee data
const fees = [
  { id: '1', studentId: '1', amount: 15000, dueDate: '2025-08-15', description: 'Tuition Fee - Quarter 3', status: 'pending', remindersSent: 0 },
  { id: '2', studentId: '1', amount: 5000, dueDate: '2025-07-30', description: 'Activity Fee', status: 'paid', remindersSent: 2 },
  { id: '3', studentId: '2', amount: 12000, dueDate: '2025-09-01', description: 'Tuition Fee - Quarter 3', status: 'pending', remindersSent: 1 }
];

// Fee Management Endpoints
app.get('/api/fees', (req, res) => {
  res.json({ success: true, data: fees });
});

app.post('/api/fees', (req, res) => {
  const newFee = { id: `${fees.length + 1}`, ...req.body, remindersSent: 0 };
  fees.push(newFee);
  res.status(201).json({ success: true, data: newFee });
});

app.get('/api/fees/:id', (req, res) => {
  const fee = fees.find(f => f.id === req.params.id);
  if (fee) {
    res.json({ success: true, data: fee });
  } else {
    res.status(404).json({ success: false, message: 'Fee not found' });
  }
});

app.put('/api/fees/:id', (req, res) => {
  const index = fees.findIndex(f => f.id === req.params.id);
  if (index !== -1) {
    fees[index] = { ...fees[index], ...req.body };
    res.json({ success: true, data: fees[index] });
  } else {
    res.status(404).json({ success: false, message: 'Fee not found' });
  }
});

app.delete('/api/fees/:id', (req, res) => {
  const index = fees.findIndex(f => f.id === req.params.id);
  if (index !== -1) {
    const fee = fees.splice(index, 1)[0];
    res.json({ success: true, message: 'Fee deleted successfully', data: fee });
  } else {
    res.status(404).json({ success: false, message: 'Fee not found' });
  }
});

app.get('/api/fees/student/:studentId', (req, res) => {
  const studentFees = fees.filter(f => f.studentId === req.params.studentId);
  res.json({ success: true, data: studentFees });
});

// Mock notification logs
const notificationLogs = [
  { id: '1', studentId: '1', phone: 'PHONE_NUMBER_1', message: 'Your fee payment of Rs.15000 is due on 2025-08-15', status: 'delivered', timestamp: '2025-07-25T12:30:00Z' },
  { id: '2', studentId: '1', phone: 'PHONE_NUMBER_1', message: 'Reminder: Your fee payment of Rs.15000 is due on 2025-08-15', status: 'delivered', timestamp: '2025-07-26T10:15:00Z' },
  { id: '3', studentId: '2', phone: 'PHONE_NUMBER_2', message: 'Your fee payment of Rs.12000 is due on 2025-09-01', status: 'delivered', timestamp: '2025-07-26T09:45:00Z' }
];

// Notification/Reminder Endpoints
app.post('/api/reminders/send', (req, res) => {
  const { studentId, message } = req.body;
  const student = students.find(s => s.id === studentId);
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }
  
  const newLog = {
    id: `${notificationLogs.length + 1}`,
    studentId,
    phone: student.phone,
    message,
    status: 'delivered',
    timestamp: new Date().toISOString()
  };
  
  notificationLogs.push(newLog);
  
  res.json({
    success: true,
    message: 'Reminder sent successfully',
    data: newLog
  });
});

app.get('/api/reminders/status', (req, res) => {
  res.json({
    success: true,
    data: {
      active: true,
      lastRun: '2025-07-26T08:00:00Z',
      nextScheduledRun: '2025-07-27T08:00:00Z',
      sentToday: 3
    }
  });
});

app.get('/api/reminders/logs', (req, res) => {
  res.json({
    success: true,
    data: notificationLogs
  });
});

// Export Endpoints
app.get('/api/export/students', (req, res) => {
  res.json({
    success: true,
    message: 'Student export initiated',
    downloadUrl: 'http://localhost:3001/downloads/students.xlsx'
  });
});

app.get('/api/export/fees', (req, res) => {
  res.json({
    success: true,
    message: 'Fees export initiated',
    downloadUrl: 'http://localhost:3001/downloads/fees.xlsx'
  });
});

// Start server
const PORT = 3001; // Explicitly set to 3001 to avoid conflicts
app.listen(PORT, () => {
  console.log(`
Simple Test Server Running
============================
Local server running at http://localhost:${PORT}
Health endpoint: http://localhost:${PORT}/health
Test SMS endpoint: http://localhost:${PORT}/test
Mock auth endpoint: http://localhost:${PORT}/api/auth/login

This is a simplified test server with mock responses.
  `);
});
