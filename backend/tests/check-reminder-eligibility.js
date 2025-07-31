/**
 * Check Reminder Eligibility
 * 
 * This script scans the Students table and reports which students
 * are eligible for fee reminders based on tomorrow's due dates.
 * Use this to confirm that your test student will be included in
 * the automated reminders.
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const AWS = require('aws-sdk');
const moment = require('moment');

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'YOUR_AWS_REGION'
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Table name
const STUDENT_TABLE = 'Students-pro';

async function checkReminders() {
  console.log(' Checking for students with fees due tomorrow...');
  
  const tomorrow = moment().add(1, 'days').format('YYYY-MM-DD');
  console.log(`   Looking for due date: ${tomorrow}`);
  
  try {
    // Scan the table to find all students
    const result = await dynamoDB.scan({
      TableName: STUDENT_TABLE
    }).promise();
    
    if (!result.Items || result.Items.length === 0) {
      console.log(' No student records found!');
      return;
    }
    
    console.log(` Found ${result.Items.length} total student records`);
    
    // Filter for students with fees due tomorrow
    const studentsWithDueFees = result.Items.filter(student => {
      if (student.recordType !== 'STUDENT' || !student.fees) return false;
      
      // Check if any fee is due tomorrow
      return student.fees.some(fee => 
        fee.dueDate === tomorrow && fee.status === 'PENDING'
      );
    });
    
    console.log(`\n Results: ${studentsWithDueFees.length} students have fees due tomorrow`);
    
    if (studentsWithDueFees.length === 0) {
      console.log(' No students found with fees due tomorrow!');
      console.log('   Double-check that the test student was created with the correct due date.');
      return;
    }
    
    // Display the students eligible for reminders
    console.log('\n Students eligible for fee reminders:');
    studentsWithDueFees.forEach((student, index) => {
      console.log(`\n${index + 1}. Student ID: ${student.id}`);
      console.log(`   Name: ${student.name}`);
      console.log(`   Phone: +91${student.phone}`);
      
      // Find and display due fees
      const dueFees = student.fees.filter(fee => 
        fee.dueDate === tomorrow && fee.status === 'PENDING'
      );
      
      console.log(`   Due Fees: ${dueFees.length}`);
      dueFees.forEach((fee, i) => {
        console.log(`   - Fee #${i + 1}: Rs. ${fee.amount} (Due: ${fee.dueDate})`);
      });
    });
    
    console.log('\n These students should receive SMS reminders when the cron job runs!');
    console.log('   The cron job should run every 10 minutes as configured.');
    
  } catch (error) {
    console.error(' Error checking reminders:', error);
  }
}

// Run the check
checkReminders();
