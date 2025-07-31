/**
 * Trigger Fee Reminder Manually
 * 
 * This script manually invokes the Lambda function that sends SMS reminders.
 * Useful for testing without waiting for the scheduled cron job.
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'YOUR_AWS_REGION'
});

const lambda = new AWS.Lambda();

async function triggerFeeReminder() {
  console.log('Manually triggering fee reminder Lambda function...');
  
  const params = {
    FunctionName: 'YOUR_LAMBDA_FUNCTION_NAME',
    InvocationType: 'RequestResponse', // Wait for result
    Payload: JSON.stringify({
      source: 'manual-trigger',
      timestamp: new Date().toISOString()
    })
  };
  
  try {
    const result = await lambda.invoke(params).promise();
    
    console.log('\n Lambda function executed with status:', result.StatusCode);
    
    if (result.Payload) {
      const payload = JSON.parse(result.Payload);
      console.log('Response:', JSON.stringify(payload, null, 2));
    }
    
    return {
      success: true,
      statusCode: result.StatusCode,
      response: result.Payload ? JSON.parse(result.Payload) : null
    };
  } catch (error) {
    console.error(' ERROR triggering Lambda function:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the function
triggerFeeReminder();
