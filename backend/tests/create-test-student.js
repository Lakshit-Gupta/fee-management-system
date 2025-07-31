/**
 * Create Test Student for SMS Reminder Testing
 * 
 * This script adds a test student with the specified phone number
 * and sets a due date that will trigger the reminder.
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'YOUR_AWS_REGION'
});

const dynamodb = new AWS.DynamoDB.DocumentClient();
const STUDENTS_TABLE = process.env.STUDENTS_TABLE || 'Students-local';
const FEES_TABLE = process.env.FEES_TABLE || 'Fees-local';

async function createTestStudent() {
  const studentId = uuidv4();
  const phoneNumber = 'YOUR_TEST_PHONE'; // Your phone number
  
  // Set due date to tomorrow for testing
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const dueDate = tomorrow.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  
  console.log('Creating test student with due date:', dueDate);
  
  const studentParams = {
    TableName: STUDENTS_TABLE,
    Item: {
      id: studentId,
      name: 'Test Student (SMS)',
      phone_no: phoneNumber,
      email: 'test@example.com',
      registration_no: `TEST${Math.floor(100000 + Math.random() * 900000)}`,
      course_name: 'Test SMS Course',
      status: 'active',
      created_at: new Date().toISOString()
    }
  };
  
  const feeParams = {
    TableName: FEES_TABLE,
    Item: {
      id: uuidv4(),
      student_id: studentId,
      monthly_amount: 5000,
      due_date: dueDate,
      status: 'pending',
      description: 'Test Fee for SMS Reminder',
      created_at: new Date().toISOString()
    }
  };
  
  try {
    // Create student record
    console.log('Creating student record...');
    await dynamodb.put(studentParams).promise();
    console.log('Student record created!');
    
    // Create fee record
    console.log('Creating fee record...');
    await dynamodb.put(feeParams).promise();
    console.log('Fee record created!');
    
    console.log('\n SUCCESS: Test student created with the following details:');
    console.log('- Student ID:', studentId);
    console.log('- Name: Test Student (SMS)');
    console.log('- Phone:', phoneNumber);
    console.log('- Due Date:', dueDate);
    console.log('- Amount:', 5000);
    
    return {
      success: true,
      studentId,
      phoneNumber,
      dueDate
    };
  } catch (error) {
    console.error(' ERROR creating test student:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the function
createTestStudent();
