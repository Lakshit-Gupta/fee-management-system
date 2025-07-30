const AWS = require('aws-sdk');
const uuid = require('uuid');

// Configure AWS
AWS.config.update({
  region: 'ap-south-1'
});

const dynamodb = new AWS.DynamoDB.DocumentClient();
const tableName = 'Students-pro';

async function removeTestStudent() {
  try {
    // Find the test student by name
    const params = {
      TableName: tableName,
      FilterExpression: "contains(#name, :nameValue)",
      ExpressionAttributeNames: {
        "#name": "name"
      },
      ExpressionAttributeValues: {
        ":nameValue": "TEST STUDENT"
      }
    };

    const result = await dynamodb.scan(params).promise();
    
    if (result.Items.length === 0) {
      console.log("No test students found.");
      return;
    }
    
    console.log(`Found ${result.Items.length} test students.`);
    
    // Delete each test student
    for (const student of result.Items) {
      const deleteParams = {
        TableName: tableName,
        Key: {
          id: student.id
        }
      };
      
      await dynamodb.delete(deleteParams).promise();
      console.log(`Deleted test student with ID: ${student.id}`);
    }
    
    console.log("All test students have been removed successfully.");
  } catch (error) {
    console.error("Error:", error);
  }
}

removeTestStudent();
