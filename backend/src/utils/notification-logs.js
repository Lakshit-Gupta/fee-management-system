/**
 * Simple Notification Logs Utility
 * 
 * Creates and manages notification logs in DynamoDB
 */

const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

AWS.config.update({
    region: process.env.AWS_REGION || 'YOUR_AWS_REGION'
});

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.NOTIFICATION_LOGS_TABLE || 'NotificationLogs-pro';

const NotificationLog = {
    async create(notificationData) {
        // Add missing fields if not provided
        const log = {
            id: uuidv4(),
            student_id: notificationData.studentId || null,
            student_name: notificationData.studentName || null,
            phone_number: notificationData.phoneNumber || null,
            message: notificationData.message || null,
            status: notificationData.status || 'sent',
            type: notificationData.type || 'sms',
            message_id: notificationData.messageId || null,
            provider: notificationData.provider || 'fast2sms',
            template_name: notificationData.templateName || null,
            created_at: new Date().toISOString(),
            metadata: notificationData.metadata || {},
            response_data: notificationData.responseData || {}
        };
        
        const params = {
            TableName: TABLE_NAME,
            Item: log
        };
        
        try {
            await dynamodb.put(params).promise();
            return log;
        } catch (error) {
            console.error('Error creating notification log:', error);
            // Don't throw - this is just a logging function and should not disrupt main flow
            return null;
        }
    },
    
    async getByStudentId(studentId) {
        const params = {
            TableName: TABLE_NAME,
            IndexName: 'StudentIdIndex',
            KeyConditionExpression: 'student_id = :studentId',
            ExpressionAttributeValues: {
                ':studentId': studentId
            },
            ScanIndexForward: false // Sort by created_at in descending order (newest first)
        };
        
        try {
            const result = await dynamodb.query(params).promise();
            return result.Items;
        } catch (error) {
            console.error('Error retrieving notification logs:', error);
            return [];
        }
    }
};

module.exports = NotificationLog;
