/**
 * API Handler for manually triggering fee reminders
 * This is useful for testing and admin-initiated batch reminders
 */
const express = require('express');
const router = express.Router();
const { handler: feeReminderHandler } = require('../lambda/feeReminder');
const Student = require('../models/Student');
const { sendFeeReminder } = require('../utils/notification-v2');
const NotificationLog = require('../utils/notification-logs');

// POST /api/reminders/send-batch - Manually trigger batch reminders
router.post('/send-batch', async (req, res) => {
    try {
        console.log('Manually triggering batch fee reminders');
        
        // Execute the same handler as the scheduled function
        const result = await feeReminderHandler({
            source: 'manual-api-trigger',
            timestamp: new Date().toISOString()
        });
        
        return res.status(200).json({
            success: true,
            message: 'Batch reminders triggered successfully',
            result: JSON.parse(result.body)
        });
    } catch (error) {
        console.error('Error triggering batch reminders:', error);
        return res.status(500).json({
            success: false,
            message: 'Error triggering batch reminders',
            error: error.message
        });
    }
});

// POST /api/reminders/filter - Send reminders with custom filter
router.post('/filter', async (req, res) => {
    try {
        const { dueInDays, courseName } = req.body;
        
        if (!dueInDays && !courseName) {
            return res.status(400).json({
                success: false,
                message: 'Filter criteria required (dueInDays or courseName)'
            });
        }
        
        // Get students with pending fees
        const students = await Student.getStudentsWithDueFees();
        let filteredStudents = [...students];
        
        // Apply course filter if specified
        if (courseName) {
            filteredStudents = filteredStudents.filter(student => 
                student.course_name.toLowerCase() === courseName.toLowerCase()
            );
        }
        
        // Apply due date filter if specified
        if (dueInDays) {
            const today = new Date();
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() + parseInt(dueInDays));
            
            filteredStudents = filteredStudents.filter(student => {
                if (!student.fees || !student.fees.due_date) return false;
                const dueDate = new Date(student.fees.due_date);
                return dueDate.toDateString() === targetDate.toDateString();
            });
        }
        
        console.log(`Found ${filteredStudents.length} students matching filter criteria`);
        
        // Send notifications to filtered students
        let successCount = 0;
        let failCount = 0;
        let notifications = [];
        
        for (const student of filteredStudents) {
            try {
                const dueDate = new Date(student.fees.due_date).toLocaleDateString('en-IN');
                
                // Send notification
                const result = await notifyStudent(
                    student.phone_no,
                    student.name,
                    student.fees.monthly_amount,
                    student.course_name,
                    dueDate
                );
                
                // Log the notification
                await NotificationLog.create({
                    studentId: student.id,
                    studentName: student.name,
                    phoneNumber: student.phone_no,
                    status: 'sent',
                    type: 'filtered_fee_reminder',
                    message: `Fee reminder for ${student.course_name} - Due on ${dueDate}`,
                    templateName: 'fee_reminder_sms',
                    metadata: {
                        amount: student.fees.monthly_amount,
                        course: student.course_name,
                        dueDate: dueDate,
                        filter: { dueInDays, courseName }
                    },
                    responseData: result
                });
                
                notifications.push({
                    studentId: student.id,
                    studentName: student.name,
                    status: 'sent'
                });
                
                successCount++;
            } catch (error) {
                notifications.push({
                    studentId: student.id,
                    studentName: student.name,
                    status: 'failed',
                    error: error.message
                });
                
                failCount++;
            }
            
            // Add a small delay between notifications
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        return res.status(200).json({
            success: true,
            message: 'Filtered reminders sent',
            totalStudents: filteredStudents.length,
            successCount: successCount,
            failCount: failCount,
            notifications: notifications
        });
    } catch (error) {
        console.error('Error sending filtered reminders:', error);
        return res.status(500).json({
            success: false,
            message: 'Error sending filtered reminders',
            error: error.message
        });
    }
});

// GET /api/reminders/notification-history - Get notification history
router.get('/notification-history', async (req, res) => {
    try {
        const { studentId, startDate, endDate } = req.query;
        
        let logs = [];
        
        if (studentId) {
            logs = await NotificationLog.getByStudentId(studentId);
        } else if (startDate) {
            logs = await NotificationLog.getByDateRange(startDate, endDate);
        } else {
            return res.status(400).json({
                success: false,
                message: 'Filter criteria required (studentId or dateRange)'
            });
        }
        
        return res.status(200).json({
            success: true,
            count: logs.length,
            logs: logs
        });
    } catch (error) {
        console.error('Error fetching notification history:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching notification history',
            error: error.message
        });
    }
});

module.exports = router;
