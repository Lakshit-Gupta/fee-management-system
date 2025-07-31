const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'ap-south-1'
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

const checkStudents = async () => {
  try {
    console.log('🔍 Checking all students in database...');
    
    const params = {
      TableName: process.env.STUDENTS_TABLE || 'Students'
    };

    const result = await dynamodb.scan(params).promise();
    console.log(`Found ${result.Items.length} students total`);
    
    result.Items.forEach((student, index) => {
      console.log(`\n--- Student ${index + 1} ---`);
      console.log('ID:', student.id);
      console.log('Name:', student.name);
      console.log('Phone:', student.phone_no || student.phone);
      console.log('Fee Status:', student.fees?.status);
      console.log('Due Date:', student.fees?.due_date);
      console.log('Fee Amount:', student.fees?.monthly_amount);
    });

    // Check specifically for our test student
    const testStudent = result.Items.find(s => s.phone_no === '+918588851907' || s.phone === '+918588851907');
    if (testStudent) {
      console.log('\n Found our test student for cron testing!');
      console.log('Full student data:', JSON.stringify(testStudent, null, 2));
    } else {
      console.log('\n Test student not found!');
    }
    
  } catch (error) {
    console.error(' Error checking students:', error);
  }
};

checkStudents();
