/**
 * Notification System v4 - Fast2SMS
 * 
 * Enhanced notification system using Fast2SMS for SMS delivery
 * Simple SMS solution with no DLT requirements (₹5 per SMS)
 */

const fast2SMS = require('./fast2sms');
const NotificationLog = require('./simple-logs');

// Provider preference - Fast2SMS is now the primary provider
const PRIMARY_PROVIDER = process.env.NOTIFICATION_PROVIDER || 'fast2sms';

/**
 * Send an SMS notification using Fast2SMS
 * 
 * @param {string} phoneNumber - The recipient's phone number
 * @param {string} message - The SMS message content
 * @param {object} metadata - Additional metadata for logging
 * @returns {Promise<object>} Result of the send operation
 */
async function sendSMSNotification(phoneNumber, message, metadata = {}) {
    try {
        console.log(`Sending SMS notification via Fast2SMS:`, {
            phone: phoneNumber,
            messageLength: message.length,
            provider: 'fast2sms'
        });
        
        // Send SMS via Fast2SMS
        const result = await fast2SMS.sendSMS(phoneNumber, message, metadata);
        
        return result;
    } catch (error) {
        console.error('Error in SMS notification system:', error.message);
        return {
            success: false,
            error: error.message,
            provider: 'fast2sms'
        };
    }
}

/**
 * Send a fee reminder SMS
 * 
 * @param {object} student - The student object
 * @param {object} feeData - Fee reminder data (optional)
 * @returns {Promise<object>} Result of the send operation
 */
async function sendFeeReminder(student, feeData = {}) {
    if (!student || !student.phone) {
        console.error('Cannot send fee reminder: Invalid student data or missing phone number');
        return { success: false, error: 'Invalid student data' };
    }
    
    try {
        console.log(`Sending fee reminder to: ${student.phone}`);
        console.log('Student data:', {
            name: student.name,
            course: student.course,
            amount: student.pendingAmount,
            dueDate: student.dueDate
        });
        
        // Use the Fast2SMS service to send fee reminder
        const result = await fast2SMS.sendFeeReminder(student, feeData);
        
        return result;
    } catch (error) {
        console.error('Error sending fee reminder:', error.message);
        return {
            success: false,
            error: error.message,
            provider: 'fast2sms'
        };
    }
}

/**
 * Send family reminder SMS
 * 
 * @param {object} student - The student object
 * @param {string} familyPhone - Family member's phone number
 * @param {object} feeData - Fee reminder data (optional)
 * @returns {Promise<object>} Result of the send operation
 */
async function sendFamilyReminder(student, familyPhone, feeData = {}) {
    if (!student || !familyPhone) {
        console.error('Cannot send family reminder: Invalid data');
        return { success: false, error: 'Invalid data' };
    }
    
    try {
        console.log(`Sending family reminder to: ${familyPhone} for student: ${student.name}`);
        
        // Use the Fast2SMS service to send family reminder
        const result = await fast2SMS.sendFamilyReminder(student, familyPhone, feeData);
        
        return result;
    } catch (error) {
        console.error('Error sending family reminder:', error.message);
        return {
            success: false,
            error: error.message,
            provider: 'fast2sms'
        };
    }
}

/**
 * Send bulk notifications to multiple students
 * 
 * @param {Array} students - Array of student objects
 * @param {object} feeData - Common fee data (optional)
 * @returns {Promise<object>} Summary of bulk send operation
 */
async function sendBulkFeeReminders(students, feeData = {}) {
    if (!Array.isArray(students) || students.length === 0) {
        return { success: false, error: 'Invalid students array' };
    }
    
    try {
        console.log(`Sending bulk fee reminders to ${students.length} students...`);
        
        // Prepare recipients for bulk SMS
        const recipients = students
            .filter(student => student.phone) // Only include students with phone numbers
            .map(student => ({
                phone: student.phone,
                message: fast2SMS.generateFeeReminderMessage(student, feeData),
                metadata: {
                    studentId: student.id,
                    studentName: student.name,
                    messageType: 'fee_reminder',
                    amount: student.pendingAmount,
                    dueDate: student.dueDate,
                    course: student.course
                }
            }));
        
        if (recipients.length === 0) {
            return { success: false, error: 'No students with valid phone numbers' };
        }
        
        // Send bulk SMS
        const results = await fast2SMS.sendBulkSMS(recipients);
        
        // Calculate summary
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        
        console.log(`Bulk SMS completed. Success: ${successful}, Failed: ${failed}`);
        
        return {
            success: true,
            summary: {
                total: recipients.length,
                successful,
                failed,
                details: results
            }
        };
    } catch (error) {
        console.error('Error sending bulk fee reminders:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Send custom SMS message
 * 
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} message - Custom message content
 * @param {object} metadata - Additional metadata
 * @returns {Promise<object>} Result of the send operation
 */
async function sendCustomSMS(phoneNumber, message, metadata = {}) {
    return sendSMSNotification(phoneNumber, message, metadata);
}

module.exports = {
    sendSMSNotification,
    sendFeeReminder,
    sendFamilyReminder,
    sendBulkFeeReminders,
    sendCustomSMS,
    // Legacy compatibility - map old function names to new ones
    sendWhatsAppNotification: sendSMSNotification, // For backward compatibility
    // Export Fast2SMS service for direct access if needed
    fast2SMS
};
