/**
 * Serverless Lambda function for sending automated fee reminders 
 * Triggered by AWS EventBridge (CloudWatch Events) schedule
 */
const Student = require('../models/Student');
const { sendFeeReminder, sendBulkFeeReminders } = require('../utils/notification-v2');
const { notifyStudent, notifyOwner } = require('../utils/notification');
const NotificationLog = require('../utils/notification-logs');

// Main handler function that gets triggered by EventBridge schedule
exports.handler = async (event, context) => {
    console.log('Starting automated fee reminder service...');
    console.log('Event:', JSON.stringify(event));
    
    try {
        // Get all students with pending fees
        const students = await Student.getStudentsWithDueFees();
        console.log(`Found ${students.length} students with pending fees`);
        
        // Set up date ranges for notifications
        const today = new Date();
        
        // Students with fees due tomorrow
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        
        // Students with fees due in 3 days
        const threeDaysLater = new Date(today);
        threeDaysLater.setDate(today.getDate() + 3);
        
        // Students with fees already overdue
        const overdue = students.filter(student => {
            if (!student.fees || !student.fees.due_date) return false;
            const dueDate = new Date(student.fees.due_date);
            return dueDate < today && student.fees.status !== 'paid';
        });
        
        // Students with fees due tomorrow
        const dueTomorrow = students.filter(student => {
            if (!student.fees || !student.fees.due_date) return false;
            const dueDate = new Date(student.fees.due_date);
            return dueDate.toDateString() === tomorrow.toDateString() && 
                   student.fees.status !== 'paid';
        });
        
        // Students with fees due in 3 days
        const dueInThreeDays = students.filter(student => {
            if (!student.fees || !student.fees.due_date) return false;
            const dueDate = new Date(student.fees.due_date);
            return dueDate.toDateString() === threeDaysLater.toDateString() && 
                   student.fees.status !== 'paid';
        });
        
        console.log(`Found: ${overdue.length} overdue, ${dueTomorrow.length} due tomorrow, ${dueInThreeDays.length} due in 3 days`);
        
        // Combine all students who need notifications
        const studentsToNotify = [...dueTomorrow, ...dueInThreeDays, ...overdue];
        
        let successCount = 0;
        let failCount = 0;
        let notifications = [];
        
        // Group students by phone number to avoid duplicate messages
        const studentsByPhone = {};
        studentsToNotify.forEach(student => {
            // Skip students without a phone number
            if (!student.phone_no) {
                console.log(`⚠️ Student ${student.name} has no phone number. Skipping.`);
                return;
            }
            
            // Normalize the phone number format (remove '+' if present)
            const phoneNumber = student.phone_no.toString().replace(/^\+/, '');
            
            if (!studentsByPhone[phoneNumber]) {
                studentsByPhone[phoneNumber] = [];
            }
            studentsByPhone[phoneNumber].push(student);
        });
        
        // Count the total number of duplicates we're preventing
        let duplicateCount = 0;
        Object.values(studentsByPhone).forEach(group => {
            if (group.length > 1) {
                duplicateCount += group.length - 1;
            }
        });
        
        console.log(`Grouped ${studentsToNotify.length} students into ${Object.keys(studentsByPhone).length} unique phone numbers`);
        if (duplicateCount > 0) {
            console.log(`📱 Prevented ${duplicateCount} duplicate messages to the same phone numbers`);
        }
        
        // Send only one notification per phone number
        for (const [phoneNumber, students] of Object.entries(studentsByPhone)) {
            try {
                // Use the first student's information for the notification
                // We could build a combined message, but for simplicity we'll just use the first student
                const student = students[0];
                const dueDate = new Date(student.fees.due_date).toLocaleDateString('en-IN');
                
                // Notify student
                const result = await notifyStudent(
                    phoneNumber,
                    student.name,
                    student.fees.monthly_amount,
                    student.course_name,
                    dueDate
                );
                // Create a notification log for the primary student
                const notificationData = {
                    studentId: student.id,
                    studentName: student.name,
                    phoneNumber: phoneNumber,
                    status: 'sent',
                    type: 'fee_reminder',
                    message: `Fee reminder for ${student.course_name} - Due on ${dueDate}`,
                    templateName: 'fee_reminder_sms',
                    metadata: {
                        amount: student.fees.monthly_amount,
                        course: student.course_name,
                        dueDate: dueDate,
                        relatedStudents: students.length > 1 ? students.map(s => s.id).filter(id => id !== student.id) : []
                    },
                    responseData: result
                };
                
                // Log the notification to DynamoDB
                await NotificationLog.create(notificationData);
                
                notifications.push(notificationData);
                successCount++;
                console.log(`Notification sent to ${student.name} (${student.phone_no})`);
            } catch (error) {                const notificationData = {
                    studentId: student.id,
                    studentName: student.name,
                    phoneNumber: student.phone_no,
                    status: 'failed',
                    type: 'fee_reminder',
                    message: `Fee reminder for ${student.course_name} - Due on ${new Date(student.fees.due_date).toLocaleDateString('en-IN')}`,
                    templateName: 'fee_reminder_sms',
                    metadata: {
                        amount: student.fees.monthly_amount,
                        course: student.course_name,
                        dueDate: new Date(student.fees.due_date).toLocaleDateString('en-IN'),
                        error: error.message
                    }
                };
                
                // Log the failed notification to DynamoDB
                await NotificationLog.create(notificationData);
                
                notifications.push(notificationData);
                failCount++;
                console.error(`Failed to notify ${student.name}:`, error);
            }
            
            // Add a small delay between notifications to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Log summary to CloudWatch instead of sending SMS to save costs
        if (studentsToNotify.length > 0) {
            const totalAmount = studentsToNotify.reduce((sum, s) => sum + (s.fees.monthly_amount || 0), 0);
            console.log(`Summary: ${studentsToNotify.length} students have fees due around ${tomorrow.toLocaleDateString('en-IN')}`);
            console.log(`Total pending amount: Rs.${totalAmount}`);
            
            // No SMS notification to owner - we'll rely on database logs instead
            // This saves costs and prevents unnecessary "X students" messages
        }
        
        const result = {
            totalStudents: studentsToNotify.length,
            successfulNotifications: successCount,
            failedNotifications: failCount,
            timestamp: new Date().toISOString(),
            notifications: notifications
        };
        
        console.log('Automated fee reminder completed:', result);
        return {
            statusCode: 200,
            body: JSON.stringify(result)
        };
        
    } catch (error) {
        console.error('Error in automated fee reminder:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error.message,
                stack: error.stack
            })
        };
    }
};
