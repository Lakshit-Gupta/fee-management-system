const express = require('express');
const router = express.Router();
const { sendCustomSMS, sendBulkFeeReminders } = require('../utils/notification-v2');
const Student = require('../models/Student');

// POST /api/notifications/test - Test SMS notification
router.post('/test', async (req, res) => {
    const { phoneNumber, message } = req.body;
    
    if (!phoneNumber || !message) {
        return res.status(400).json({
            success: false,
            message: 'Phone number and message are required'
        });
    }
    
    try {
        const result = await sendCustomSMS(phoneNumber, message, {
            messageType: 'test',
            source: 'api_test'
        });
        
        res.status(200).json({
            success: true,
            message: 'Test SMS notification sent',
            result: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// POST /api/notifications/broadcast - Send SMS to all students
router.post('/broadcast', async (req, res) => {
    const { message, courseFilter } = req.body;
    
    if (!message) {
        return res.status(400).json({
            success: false,
            message: 'Message is required'
        });
    }
    
    try {
        let students;
        
        if (courseFilter) {
            students = await Student.getByCourse(courseFilter);
        } else {
            students = await Student.findAll();
        }
        
        if (!students || students.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No students found'
            });
        }
        
        console.log(`Broadcasting SMS to ${students.length} students`);
        
        // Prepare students for bulk SMS
        const studentsWithPhone = students.filter(student => student.phone || student.phone_no);
        
        if (studentsWithPhone.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No students with valid phone numbers found'
            });
        }
        
        // Create recipients array for bulk SMS
        const recipients = studentsWithPhone.map(student => ({
            phone: student.phone || student.phone_no,
            message: message,
            metadata: {
                studentId: student.id,
                studentName: student.name,
                messageType: 'broadcast',
                source: 'api_broadcast'
            }
        }));
        
        // Send bulk SMS using AWS SNS
        const awsSNS = require('../utils/aws-sns');
        const result = await awsSNS.sendBulkSMS(recipients);
        
        // Calculate summary
        const successful = result.filter(r => r.success).length;
        const failed = result.filter(r => !r.success).length;
        
        res.status(200).json({
            success: true,
            message: 'Broadcast SMS sent',
            summary: {
                total: recipients.length,
                successful,
                failed,
                details: result
            }
        });
    } catch (error) {
        console.error('Error sending broadcast SMS:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// GET /api/notifications/status - Get notification status
router.get('/status', async (req, res) => {
    try {
        const smsEnabled = process.env.SMS_ENABLED === 'true';
        const awsRegion = process.env.AWS_REGION || 'YOUR_AWS_REGION';
        const senderId = process.env.SMS_SENDER_ID || 'YOUR_SMS_SENDER_ID';
        
        res.status(200).json({
            success: true,
            smsConfigured: smsEnabled,
            provider: 'AWS SNS',
            awsRegion: awsRegion,
            senderId: senderId,
            instituteName: process.env.INSTITUTE_NAME || 'Not Set',
            supportPhone: process.env.SUPPORT_PHONE ? 'Configured' : 'Not Set'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// GET /api/notifications/logs - Get all notification logs
router.get('/logs', async (req, res) => {
    try {
        const AWS = require('aws-sdk');
        const docClient = new AWS.DynamoDB.DocumentClient();
        
        const params = {
            TableName: process.env.NOTIFICATION_LOGS_TABLE || 'NotificationLogs'
        };
        
        const result = await docClient.scan(params).promise();
        
        res.status(200).json({
            success: true,
            count: result.Items.length,
            logs: result.Items
        });
    } catch (error) {
        console.error('Error fetching notification logs:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching notification logs',
            error: error.message
        });
    }
});

// Function to check for due fees and send notifications
const checkDueFees = async () => {
    try {
        const students = await Student.getStudentsWithDueFees();
        
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        
        // Filter students with fees due tomorrow
        const dueStudents = students.filter(student => {
            if (!student.fees || !student.fees.due_date) return false;
            const dueDate = new Date(student.fees.due_date);
            return dueDate.toDateString() === tomorrow.toDateString() && 
                  student.fees.status !== 'paid';
        });

        console.log(`Found ${dueStudents.length} students with fees due tomorrow`);
        
        for (const student of dueStudents) {
            const dueDate = new Date(student.fees.due_date).toLocaleDateString('en-IN');
            
            // Notify student using utility function
            await notifyStudent(
                student.phone_no,
                student.name,
                student.fees.monthly_amount,
                dueDate
            );
            
            console.log(`Notification sent to ${student.name}`);
        }
        
        // Log summary to CloudWatch instead of sending SMS to save costs
        if (dueStudents.length > 0) {
            console.log(`Summary: ${dueStudents.length} students have pending fees`);
            // No SMS notification to owner - we'll rely on database logs instead
            // This saves costs and prevents unnecessary "X students" messages
        }
    } catch (error) {
        console.error('Error in checkDueFees:', error);
    }
};

// Uncomment to enable due fees check every day at 10 AM
/*
setInterval(() => {
    const now = new Date();
    if (now.getHours() === 10 && now.getMinutes() === 0) {
        checkDueFees();
    }
}, 60 * 1000);
*/

module.exports = router;