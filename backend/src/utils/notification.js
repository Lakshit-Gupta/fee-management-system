/**
 * Legacy compatibility layer for notification.js
 * 
 * This file redirects legacy notification functions to the new notification-v2.js implementation
 * It ensures backward compatibility with code that imports from the old file
 */
const { 
    sendSMSNotification,
    sendFeeReminder,
    sendFamilyReminder,
    sendBulkFeeReminders,
    sendCustomSMS 
} = require('./notification-v2');

/**
 * Legacy notifyStudent function - redirects to the new sendCustomSMS function
 * 
 * @param {string} phoneNumber - Student phone number
 * @param {string} studentName - Student name
 * @param {number} amount - Fee amount
 * @param {string} courseName - Course name
 * @param {string} dueDate - Due date
 * @returns {Promise<object>} Result of sending notification
 */
async function notifyStudent(phoneNumber, studentName, amount, courseName, dueDate) {
    console.log('Legacy notifyStudent function called - redirecting to sendCustomSMS');
    
    // Create a formatted message
    const message = `Fee Reminder: Hi ${studentName}, your fee of Rs.${amount} for ${courseName} is due on ${dueDate}. Please settle your pending dues. Reply STOP to opt out.`;
    
    // Send using the new function
    return sendCustomSMS(phoneNumber, message, {
        studentName,
        amount,
        courseName,
        dueDate,
        type: 'fee_reminder'
    });
}

/**
 * Legacy notifyOwner function - redirects to sendCustomSMS
 * The legacy function expected (ownerPhone, message, dueDate, totalAmount) parameters
 */
async function notifyOwner(ownerPhone, message, dueDate, totalAmount) {
    console.log('Legacy notifyOwner function called - redirecting to sendCustomSMS');
    // Create a proper formatted message instead of sending raw message
    const formattedMessage = `Admin Notification: ${message} have fees due on ${dueDate || 'upcoming days'}. Total pending amount: Rs.${totalAmount || 0}`;
    return sendCustomSMS(ownerPhone, formattedMessage, {type: 'owner_notification', totalAmount, dueDate});
}

/**
 * Legacy notifyPaymentConfirmation function
 */
async function notifyPaymentConfirmation(phoneNumber, studentName, amount, courseName, receiptId) {
    console.log('Legacy notifyPaymentConfirmation called - redirecting to sendCustomSMS');
    
    // Create a formatted payment confirmation message
    const message = `Payment Confirmation: Payment of Rs.${amount} received for ${studentName}'s ${courseName} course. Receipt ID: ${receiptId}. Thank you!`;
    
    // Send using the new function
    return sendCustomSMS(phoneNumber, message, {
        studentName,
        amount,
        courseName,
        receiptId,
        type: 'payment_confirmation'
    });
}

module.exports = {
    notifyStudent,
    notifyOwner,
    notifyPaymentConfirmation,
    // Also export the new functions for convenience
    sendCustomSMS,
    sendSMSNotification,
    sendFeeReminder
};
