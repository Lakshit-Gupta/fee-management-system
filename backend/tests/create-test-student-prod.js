/**
 * Create Test Student with Correct Schema (Live Version)
 * 
 * Creates a student with the exact schema expected by the Lambda function
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'ap-south-1'
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Table name based on serverless.yml
const STUDENT_TABLE = 'Students-pro';

// Phone number (default or from command line)
const PHONE_NUMBER = process.argv[2] || '8588851907';
const STUDENT_NAME = 'TEST STUDENT';

async function createTestStudent() {
  console.log('Creating test student with production schema...');
  console.log(`Phone number: ${PHONE_NUMBER}`);
  
  const tomorrow = moment().add(1, 'days').format('YYYY-MM-DD');
  const studentId = uuidv4();
  
  // Create student with schema matching what the Lambda function expects
  const student = {
    id: studentId,
    name: STUDENT_NAME,
    phone_no: PHONE_NUMBER,  // IMPORTANT: phone_no not phone
    fathers_name: 'Test Father',
    registration_no: `TEST-${Math.floor(Math.random() * 10000)}`,
    course_name: 'Test Course',
    batch_time: 'Morning',
    course_duration: 6,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    fees: {  // Notice: fees is an object, not an array
      monthly_amount: 1000,
      status: 'pending', // lowercase 'pending', not 'PENDING'
      due_date: tomorrow
    }
  };
  
  const params = {
    TableName: STUDENT_TABLE,
    Item: student
  };
  
  try {
    await dynamoDB.put(params).promise();
    console.log('✅ Test student created successfully:');
    console.log('   ID:', studentId);
    console.log('   Name:', STUDENT_NAME);
    console.log('   Phone:', PHONE_NUMBER);
    console.log('   Fee amount:', 1000);
    console.log('   Due date:', tomorrow);
    console.log('\n📱 The Lambda function should now send an SMS when it runs!');
    console.log('   (Cron job is scheduled to run every 10 minutes)');
    
    return student;
  } catch (error) {
    console.error('❌ Error creating test student:', error);
    throw error;
  }
}

// Run the function
createTestStudent();
