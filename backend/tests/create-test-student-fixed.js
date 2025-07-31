/**
 * Create Test Student (Schema Compatible)
 * 
 * This script creates a test student with the correct schema for the production system.
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

// Table name
const STUDENT_TABLE = process.env.STUDENTS_TABLE || 'Students-pro';

// Phone number (default or from command line)
const PHONE_NUMBER = process.argv[2] || '8588851907';
const STUDENT_NAME = 'TEST STUDENT';

async function createTestStudentCorrectSchema() {
  console.log('Creating test student with correct schema...');
  console.log(`Phone number: ${PHONE_NUMBER}`);
  
  const tomorrow = moment().add(1, 'days').format('YYYY-MM-DD');
  const studentId = uuidv4();
  
  // Create student with schema matching what the Lambda function expects
  const student = {
    id: studentId,
    name: STUDENT_NAME,
    phone_no: PHONE_NUMBER,  // Notice: phone_no not phone
    registration_no: `TEST-${Math.floor(Math.random() * 10000)}`,
    fathers_name: 'Test Father',
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
    console.log(' Test student created successfully:');
    console.log('   ID:', studentId);
    console.log('   Name:', STUDENT_NAME);
    console.log('   Phone:', PHONE_NUMBER);
    console.log('   Fee amount:', 1000);
    console.log('   Due date:', tomorrow);
    console.log('\n The next scheduled fee reminder should send an SMS to this number!');
    console.log('   (According to the scheduled cron job running every 10 minutes)');
    
    return student;
  } catch (error) {
    console.error(' Error creating test student:', error);
    throw error;
  }
}

// Run the function
createTestStudentCorrectSchema();
