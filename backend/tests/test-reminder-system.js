/**
 * SMS Reminder System Test Script
 * 
 * This script performs a comprehensive test of the SMS reminder system:
 * 1. Creates a test student with tomorrow's due date
 * 2. Verifies the student record was created
 * 3. Manually triggers the fee reminder function
 * 4. Reports the results
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const AWS = require('aws-sdk');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'YOUR_AWS_REGION'
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const lambda = new AWS.Lambda();

// Configurations
const STUDENT_TABLE = process.env.STUDENT_TABLE || 'Students-pro';
const FEE_TABLE = process.env.FEE_TABLE || 'Students-pro'; // We store fees in the same table
const PHONE_NUMBER = process.argv[2] || 'YOUR_TEST_PHONE'; // Default or command line arg
const STUDENT_NAME = 'TEST STUDENT';

async function runTest() {
  console.log(' Starting SMS Reminder System Test');
  console.log('═════════════════════════════════════');
  console.log(`Testing with phone number: +91${PHONE_NUMBER}`);
  
  // Step 1: Create test student
  console.log('\n Step 1: Creating test student record...');
  const studentId = await createTestStudent();
  
  if (!studentId) {
    console.error(' Failed to create test student. Exiting test.');
    return;
  }
  
  // Step 2: Verify student record
  console.log('\n Step 2: Verifying student record...');
  const student = await getStudentById(studentId);
  
  if (!student) {
    console.error(' Student record verification failed. Exiting test.');
    return;
  }
  
  console.log(' Student record verified:', {
    id: student.id,
    name: student.name,
    phone: student.phone
  });
  
  // Step 3: Manually trigger fee reminder
  console.log('\n Step 3: Triggering fee reminder function...');
  const reminderResult = await triggerFeeReminder();
  
  if (!reminderResult.success) {
    console.error(' Fee reminder function failed:', reminderResult.error);
  } else {
    console.log(' Fee reminder function executed with status:', reminderResult.statusCode);
  }
  
  // Step 4: Summary
  console.log('\n Test Summary');
  console.log('═════════════════');
  console.log('1. Test student created with ID:', studentId);
  console.log('2. Phone number to receive SMS:', `+91${PHONE_NUMBER}`);
  console.log('3. Due date set to:', moment().add(1, 'days').format('YYYY-MM-DD'));
  console.log('4. Fee reminder function triggered:', reminderResult.success ? ' Success' : ' Failed');
  
  console.log('\n CHECK YOUR PHONE NOW');
  console.log('If the system is working correctly, you should receive an SMS reminder within a few minutes.');
  console.log('\n If you don\'t receive an SMS, try these troubleshooting steps:');
  console.log('1. Check if the student record was created with the correct phone number');
  console.log('2. Verify Fast2SMS API key is correctly configured');
  console.log('3. Check Lambda function logs in AWS CloudWatch');
}

async function createTestStudent() {
  const studentId = uuidv4();
  const tomorrow = moment().add(1, 'days').format('YYYY-MM-DD');
  
  // Create student record with fees included in the same record
  // Based on the actual schema used in the deployed system
  const studentParams = {
    TableName: STUDENT_TABLE,
    Item: {
      id: studentId,
      name: STUDENT_NAME,
      phone: PHONE_NUMBER,
      recordType: 'STUDENT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fees: [
        {
          id: uuidv4(),
          amount: 1000, // Amount in Rs
          dueDate: tomorrow,
          status: 'PENDING',
          description: 'TEST FEE ENTRY',
          createdAt: new Date().toISOString()
        }
      ],
      // Add other required fields based on the system's needs
      status: 'ACTIVE',
      paymentHistory: [],
      notifications: []
    }
  };
  
  try {
    await dynamoDB.put(studentParams).promise();
    console.log(' Student record created successfully with fee due date:', tomorrow);
    
    return studentId;
  } catch (error) {
    console.error(' Error creating test records:', error);
    return null;
  }
}

async function getStudentById(id) {
  const params = {
    TableName: STUDENT_TABLE,
    Key: { id }
  };
  
  try {
    const result = await dynamoDB.get(params).promise();
    return result.Item;
  } catch (error) {
    console.error(' Error fetching student:', error);
    return null;
  }
}

async function triggerFeeReminder() {
  const params = {
    FunctionName: 'YOUR_LAMBDA_FUNCTION_NAME',
    InvocationType: 'RequestResponse',
    Payload: JSON.stringify({
      source: 'manual-test',
      timestamp: new Date().toISOString()
    })
  };
  
  try {
    const result = await lambda.invoke(params).promise();
    return {
      success: true,
      statusCode: result.StatusCode,
      response: result.Payload ? JSON.parse(result.Payload) : null
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
runTest();
