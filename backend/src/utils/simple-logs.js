/**
 * Notification Logs Utility - Simple File-based Logging
 * Tracks sent notifications for analytics and auditing
 */
const fs = require('fs').promises;
const path = require('path');

// Create logs directory if it doesn't exist
const LOGS_DIR = path.join(__dirname, '../../logs');
const LOGS_FILE = path.join(LOGS_DIR, 'notifications.jsonl');

const NotificationLog = {
    /**
     * Record a notification in the log file
     * @param {object} notification - The notification data to record
     * @returns {Promise<object>} The logged notification
     */
    async create(notification) {
        try {
            // Ensure logs directory exists
            await fs.mkdir(LOGS_DIR, { recursive: true });
            
            // Create log entry with timestamp
            const logEntry = {
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                phoneNumber: notification.phoneNumber,
                studentId: notification.studentId,
                studentName: notification.studentName,
                type: notification.type || 'sms',
                message: notification.message,
                status: notification.status,
                messageId: notification.messageId,
                provider: notification.provider || 'fast2sms',
                responseData: notification.responseData || {},
                metadata: notification.metadata || {}
            };
            
            // Append to log file (JSONL format - one JSON object per line)
            await fs.appendFile(LOGS_FILE, JSON.stringify(logEntry) + '\n');
            
            console.log(`Notification logged: ${logEntry.id}`);
            return logEntry;
        } catch (error) {
            console.error('Error logging notification:', error);
            // Don't fail the SMS sending if logging fails
            return { error: error.message };
        }
    },

    /**
     * Get recent notifications from log file
     * @param {number} limit - Number of recent notifications to retrieve
     * @returns {Promise<Array>} Array of recent notifications
     */
    async getRecent(limit = 50) {
        try {
            const data = await fs.readFile(LOGS_FILE, 'utf8');
            const lines = data.trim().split('\n').filter(line => line);
            
            // Get last N lines and parse them
            const recentLines = lines.slice(-limit);
            return recentLines.map(line => {
                try {
                    return JSON.parse(line);
                } catch (e) {
                    return null;
                }
            }).filter(Boolean);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return []; // File doesn't exist yet
            }
            console.error('Error reading notification logs:', error);
            return [];
        }
    },

    /**
     * Get daily statistics
     * @returns {Promise<object>} Daily SMS statistics
     */
    async getDailyStats() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const allLogs = await this.getRecent(500);
            
            const todayLogs = allLogs.filter(log => 
                log.timestamp && log.timestamp.startsWith(today)
            );
            
            const stats = {
                date: today,
                total: todayLogs.length,
                successful: todayLogs.filter(log => log.status === 'sent').length,
                failed: todayLogs.filter(log => log.status === 'failed').length,
                cost: todayLogs.filter(log => log.status === 'sent').length * 5 // ₹5 per SMS
            };
            
            return stats;
        } catch (error) {
            console.error('Error calculating daily stats:', error);
            return { date: new Date().toISOString().split('T')[0], total: 0, successful: 0, failed: 0, cost: 0 };
        }
    }
};

module.exports = NotificationLog;
