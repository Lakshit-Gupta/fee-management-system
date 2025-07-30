/**
 * Fast2SMS Service for SMS Notifications
 * 
 * This module provides functionality for sending SMS messages through Fast2SMS.
 * Uses Quick SMS API (₹5 per SMS) - No DLT approval required.
 */

const axios = require('axios');
const NotificationLog = require('./simple-logs');

class Fast2SMSService {
    constructor() {
        this.apiUrl = 'https://www.fast2sms.com/dev/bulkV2';
        this.walletUrl = 'https://www.fast2sms.com/dev/wallet';
        this.apiKey = process.env.FAST2SMS_API_KEY;
        this.isEnabled = process.env.SMS_ENABLED === 'true';
        
        if (!this.isEnabled) {
            console.log('SMS notifications are disabled');
        }
        
        if (!this.apiKey) {
            console.warn('⚠️ FAST2SMS_API_KEY not configured');
        }
    }

    /**
     * Verify Fast2SMS service access
     */
    async verifyServiceAccess() {
        try {
            const balance = await this.checkWalletBalance();
            if (balance.success) {
                console.log('✅ Fast2SMS service verified');
                console.log(`   Wallet Balance: ₹${balance.balance}`);
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Fast2SMS service verification failed:', error.message);
            return false;
        }
    }

    /**
     * Check wallet balance
     */
    async checkWalletBalance() {
        try {
            const response = await axios.get(this.walletUrl, {
                params: {
                    authorization: this.apiKey
                }
            });

            if (response.data.return === true) {
                return {
                    success: true,
                    balance: response.data.wallet,
                    currency: 'INR'
                };
            }
            
            throw new Error('Failed to fetch wallet balance');
        } catch (error) {
            console.error('Error checking Fast2SMS balance:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Send SMS message via Fast2SMS Quick SMS API
     * 
     * @param {string} phoneNumber - Destination phone number
     * @param {string} message - The SMS message content
     * @param {object} metadata - Additional metadata for logging
     * @returns {Promise<object>} Response with success status and message details
     */
    async sendSMS(phoneNumber, message, metadata = {}) {
        if (!this.isEnabled) {
            console.log('SMS disabled. Would send SMS:', { phone: phoneNumber, message });
            return { success: false, message: 'SMS service disabled' };
        }

        if (!this.apiKey) {
            console.error('Fast2SMS API key not configured');
            return { success: false, error: 'API key not configured' };
        }

        try {
            // Format phone number for Fast2SMS (10-digit format)
            const formattedPhone = this.formatPhoneNumber(phoneNumber);
            
            // Validate phone number
            if (!this.isValidPhoneNumber(formattedPhone)) {
                throw new Error(`Invalid phone number format: ${phoneNumber}`);
            }

            // Prepare Fast2SMS parameters
            const params = {
                authorization: this.apiKey,
                message: message,
                language: 'english',
                route: 'q', // Quick SMS route - ₹5 per SMS, no DLT required
                numbers: formattedPhone,
                flash: 0 // Regular SMS (not flash)
            };

            console.log(`Sending SMS to ${formattedPhone} via Fast2SMS...`);
            console.log('Message preview:', message.substring(0, 100) + '...');

            // Send SMS via Fast2SMS API - using GET method with query parameters as documented
            const response = await axios.get(this.apiUrl, {
                params: params
            });
            
            console.log('Fast2SMS API Response:', response.data);

            if (response.data.return === true) {
                console.log('SMS sent successfully via Fast2SMS:', response.data.request_id);
                
                // Log the notification
                await this._logNotification({
                    phoneNumber: formattedPhone,
                    message,
                    status: 'sent',
                    provider: 'fast2sms',
                    messageId: response.data.request_id,
                    metadata
                });
                
                return { 
                    success: true, 
                    messageId: response.data.request_id,
                    provider: 'fast2sms',
                    response: response.data
                };
            } else {
                throw new Error(`Fast2SMS Error: ${JSON.stringify(response.data)}`);
            }

        } catch (error) {
            console.error('Error sending SMS via Fast2SMS:', error.message);
            
            // Log more details about the error
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
            }
            
            // Log the failed notification
            await this._logNotification({
                phoneNumber,
                message,
                status: 'failed',
                provider: 'fast2sms',
                error: error.message,
                metadata
            });
            
            return { 
                success: false, 
                error: error.message,
                provider: 'fast2sms'
            };
        }
    }

    /**
     * Send fee reminder SMS
     * 
     * @param {object} student - The student object
     * @param {object} feeData - Fee reminder data
     * @returns {Promise<object>} Response with success status and message details
     */
    async sendFeeReminder(student, feeData = {}) {
        if (!student || !student.phone) {
            console.error('Cannot send fee reminder: Invalid student data or missing phone number');
            return { success: false, error: 'Invalid student data' };
        }

        // Generate fee reminder message
        const message = this.generateFeeReminderMessage(student, feeData);
        
        // Prepare metadata for logging
        const metadata = {
            studentId: student.id,
            studentName: student.name,
            messageType: 'fee_reminder',
            amount: feeData.amount || student.pendingAmount,
            dueDate: feeData.dueDate || student.dueDate,
            course: feeData.courseName || student.course
        };

        return this.sendSMS(student.phone, message, metadata);
    }

    /**
     * Send family reminder SMS
     * 
     * @param {object} student - The student object
     * @param {string} familyPhone - Family member's phone number
     * @param {object} feeData - Fee reminder data
     * @returns {Promise<object>} Response with success status and message details
     */
    async sendFamilyReminder(student, familyPhone, feeData = {}) {
        if (!student || !familyPhone) {
            console.error('Cannot send family reminder: Invalid data');
            return { success: false, error: 'Invalid data' };
        }

        // Generate family reminder message
        const message = this.generateFamilyReminderMessage(student, feeData);
        
        // Prepare metadata for logging
        const metadata = {
            studentId: student.id,
            studentName: student.name,
            messageType: 'family_reminder',
            familyPhone: familyPhone,
            amount: feeData.amount || student.pendingAmount,
            dueDate: feeData.dueDate || student.dueDate,
            course: feeData.courseName || student.course
        };

        return this.sendSMS(familyPhone, message, metadata);
    }

    /**
     * Generate fee reminder message text
     */
    generateFeeReminderMessage(student, feeData = {}) {
        const studentName = student.name || 'Student';
        const course = feeData.courseName || student.course || 'Course';
        const amount = feeData.amount || student.pendingAmount || 'N/A';
        const dueDate = feeData.dueDate || student.dueDate || 'soon';

        // GSM-compatible message (no Unicode symbols like ₹) - 1 SMS unit only
        return `AIICT Fee Reminder: Hi ${studentName}, your fee of Rs.${amount} for ${course} is due on ${dueDate}. Please settle your pending dues. Reply STOP to opt out.`;
    }

    /**
     * Generate family reminder message text
     */
    generateFamilyReminderMessage(student, feeData = {}) {
        const studentName = student.name || 'Student';
        const course = feeData.courseName || student.course || 'Course';
        const amount = feeData.amount || student.pendingAmount || 'N/A';
        const dueDate = feeData.dueDate || student.dueDate || 'soon';

        // GSM-compatible message (no Unicode symbols like ₹) - 1 SMS unit only
        return `AIICT Fee Reminder: Fee of Rs.${amount} for ${studentName}'s ${course} course is due on ${dueDate}. Please settle the pending dues. Reply STOP to opt out.`;
    }

    /**
     * Format phone number for Fast2SMS (10-digit format)
     */
    formatPhoneNumber(phoneNumber) {
        if (!phoneNumber) return null;
        
        // Remove all non-digit characters
        let cleaned = phoneNumber.toString().replace(/\D/g, '');
        
        // If number starts with 91, remove it to get 10 digits
        if (cleaned.startsWith('91') && cleaned.length === 12) {
            return cleaned.substring(2);
        }
        
        // If number is already 10 digits
        if (cleaned.length === 10) {
            return cleaned;
        }
        
        // If number has +91 prefix, extract 10 digits
        if (cleaned.startsWith('91')) {
            return cleaned.substring(2);
        }
        
        // Return last 10 digits if longer
        if (cleaned.length > 10) {
            return cleaned.slice(-10);
        }
        
        return cleaned;
    }

    /**
     * Validate phone number format (10 digits for Fast2SMS)
     */
    isValidPhoneNumber(phoneNumber) {
        if (!phoneNumber) return false;
        
        // Check if it's exactly 10 digits
        const phoneRegex = /^\d{10}$/;
        return phoneRegex.test(phoneNumber);
    }

    /**
     * Private method to log notifications to the database
     */
    async _logNotification(notification) {
        try {
            if (NotificationLog && typeof NotificationLog.create === 'function') {
                await NotificationLog.create({
                    phoneNumber: notification.phoneNumber,
                    studentId: notification.metadata?.studentId,
                    studentName: notification.metadata?.studentName,
                    type: notification.metadata?.messageType || 'sms',
                    message: notification.message,
                    status: notification.status,
                    messageId: notification.messageId,
                    provider: notification.provider,
                    responseData: notification.response || { error: notification.error },
                    metadata: notification.metadata || {}
                });
            }
        } catch (logError) {
            console.error('Error logging notification:', logError);
        }
    }

    /**
     * Send bulk SMS to multiple recipients
     * 
     * @param {Array} recipients - Array of {phone, message, metadata} objects
     * @returns {Promise<Array>} Array of results for each recipient
     */
    async sendBulkSMS(recipients) {
        if (!Array.isArray(recipients)) {
            throw new Error('Recipients must be an array');
        }

        console.log(`Sending bulk SMS to ${recipients.length} recipients via Fast2SMS...`);
        
        const results = [];
        
        // Process in smaller batches to avoid overwhelming Fast2SMS
        const batchSize = 5; // Smaller batch size for Fast2SMS
        for (let i = 0; i < recipients.length; i += batchSize) {
            const batch = recipients.slice(i, i + batchSize);
            
            const batchPromises = batch.map(async (recipient) => {
                try {
                    const result = await this.sendSMS(
                        recipient.phone, 
                        recipient.message, 
                        recipient.metadata || {}
                    );
                    return {
                        phone: recipient.phone,
                        ...result
                    };
                } catch (error) {
                    return {
                        phone: recipient.phone,
                        success: false,
                        error: error.message
                    };
                }
            });
            
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
            
            // Delay between batches (Fast2SMS rate limiting)
            if (i + batchSize < recipients.length) {
                await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
            }
        }
        
        const successCount = results.filter(r => r.success).length;
        const failedCount = results.filter(r => !r.success).length;
        const totalCost = successCount * 5; // ₹5 per SMS
        
        console.log(`Bulk SMS completed. Success: ${successCount}, Failed: ${failedCount}, Total Cost: ₹${totalCost}`);
        
        return results;
    }
}

module.exports = new Fast2SMSService();
