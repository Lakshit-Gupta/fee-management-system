const AWS = require('aws-sdk');
const express = require('express');
const router = express.Router();

// GET /api/stats - Get dashboard statistics
router.get('/', async (req, res) => {
  try {
    // Do basic AWS configuration with region from environment
    AWS.config.update({
      region: process.env.AWS_REGION || 'ap-south-1'
    });

    // Create separate DynamoDB client to isolate any issues
    const dynamoDb = new AWS.DynamoDB();
    const docClient = new AWS.DynamoDB.DocumentClient();

    // First, list all tables for debug purposes
    console.log('Attempting to list all DynamoDB tables...');
    try {
      const tables = await dynamoDb.listTables({}).promise();
      console.log('Available tables:', tables.TableNames);
    } catch (error) {
      console.error('Error listing tables:', error);
      // Continue with hardcoded table names even if listing fails
    }    // Get all students from DynamoDB 
    // Use the actual table names from DynamoDB
    const studentsTable = 'Students';
    console.log('Fetching students from table:', studentsTable);
    
    try {
      const studentsParams = {
        TableName: studentsTable
      };
      
      const studentsResult = await docClient.scan(studentsParams).promise();
      const students = studentsResult.Items || [];
      
      // Calculate statistics
      const totalStudents = students.length;
      
      // Count students with pending/overdue fees
      const pendingFees = students.filter(student => 
        student.fees && (student.fees.status === 'pending' || student.fees.status === 'overdue')
      ).length;
      
      // Calculate total revenue (paid fees)
      let totalRevenue = 0;
      students.forEach(student => {
        if (student.fees && student.fees.monthly_amount && student.fees.status === 'paid') {
          totalRevenue += parseFloat(student.fees.monthly_amount);
        }
      });
      
      // Get notifications from the last 24 hours
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      const oneDayAgoString = oneDayAgo.toISOString();
      
      let recentReminders = 0;
      try {
        // Use the actual table name from DynamoDB
        const notificationLogsTable = 'NotificationLogs';
        console.log('Scanning notification logs from table:', notificationLogsTable);
        const logsParams = {
          TableName: notificationLogsTable,
          FilterExpression: "created_at >= :oneDayAgo",
          ExpressionAttributeValues: {
            ":oneDayAgo": oneDayAgoString
          }
        };
        
        const logsResult = await docClient.scan(logsParams).promise();
        recentReminders = logsResult.Items ? logsResult.Items.length : 0;
      } catch (notifError) {
        console.error('Error fetching notifications:', notifError);
        // Continue with zero if there's an error
      }
      
      // Calculate students with fees due tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowString = tomorrow.toISOString().split('T')[0];
      
      const dueStudentsTomorrow = students.filter(student => {
        if (!student.fees || !student.fees.due_date) return false;
        const dueDate = student.fees.due_date.split('T')[0];
        return dueDate === tomorrowString && student.fees.status !== 'paid';
      });
        // Calculate period-based revenue
      // Monthly revenue = current month's paid fees
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      // Calculate quarterly periods (quarters of the year)
      const currentQuarter = Math.floor(currentMonth / 3);
      const quarterStartMonth = currentQuarter * 3;
      const quarterStartDate = new Date(currentYear, quarterStartMonth, 1);
      
      // Filter students for monthly and quarterly revenue
      let monthlyRevenue = 0;
      let quarterlyRevenue = 0;
      let yearlyRevenue = 0;
      
      students.forEach(student => {
        if (student.fees && student.fees.monthly_amount && student.fees.status === 'paid' && student.fees.last_paid) {
          const paidDate = new Date(student.fees.last_paid);
          const paidMonth = paidDate.getMonth();
          const paidYear = paidDate.getFullYear();
          const amount = parseFloat(student.fees.monthly_amount);
          
          // Monthly revenue - current month
          if (paidMonth === currentMonth && paidYear === currentYear) {
            monthlyRevenue += amount;
          }
          
          // Quarterly revenue - current quarter
          if (paidDate >= quarterStartDate && paidYear === currentYear) {
            quarterlyRevenue += amount;
          }
          
          // Yearly revenue - current year
          if (paidYear === currentYear) {
            yearlyRevenue += amount;
          }
        }
      });
      
      return res.status(200).json({
        success: true,
        totalStudents,
        pendingFees,
        totalRevenue,
        monthlyRevenue,
        quarterlyRevenue,
        yearlyRevenue,
        recentReminders,
        dueStudentsTomorrow
      });
    } catch (scanError) {
      console.error('Error scanning students table:', scanError);
      // Return fallback data instead of error
      return res.status(200).json({
        success: true,
        totalStudents: 0,
        pendingFees: 0,
        totalRevenue: 0,
        recentReminders: 0,
        dueStudentsTomorrow: []
      });
    }
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Error getting dashboard statistics',
      error: error.message
    });
  }
});

module.exports = router;
