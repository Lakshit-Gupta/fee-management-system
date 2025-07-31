const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({
    region: process.env.AWS_REGION || 'YOUR_AWS_REGION'
});

// Create DynamoDB table if it doesn't exist
const dynamodb = new AWS.DynamoDB();

const createTableIfNotExists = async () => {
    try {
        await dynamodb.describeTable({ TableName: 'Students' }).promise();
        console.log('Students table already exists');
    } catch (error) {
        if (error.code === 'ResourceNotFoundException') {
            // Create table using the setup script
            const { createStudentTable } = require('./dynamodb-setup');
            await createStudentTable();
            console.log('Students table created successfully');
        } else {
            throw error;
        }
    }
};

module.exports = { createTableIfNotExists };