const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'YOUR_AWS_REGION'
});

// Create DynamoDB DocumentClient
const dynamodb = new AWS.DynamoDB.DocumentClient();

// Helper function to get students data
const getStudentsData = async () => {
  const params = {
    TableName: process.env.STUDENTS_TABLE || 'Students'
  };
  
  const result = await dynamodb.scan(params).promise();
  console.log(`Retrieved ${result.Items.length} students from database`);
  
  return result.Items.map(student => ({
    id: student.id || '',
    registration_no: student.registration_no || '',
    name: student.name || '',
    fathers_name: student.fathers_name || '',
    phone_no: student.phone_no || student.phone || '',
    email: student.email || '',
    course_name: student.course_name || student.course || '',
    batch_time: student.batch_time || student.batchTime || '',
    created_at: student.created_at || '',
    monthly_fee: student.fees?.monthly_amount || '',
    fee_status: student.fees?.status || '',
    due_date: student.fees?.due_date || '',
    course_duration: student.course_duration || ''
  }));
};

// Helper function to get notification logs data
const getNotificationLogsData = async () => {
  const params = {
    TableName: process.env.NOTIFICATION_LOGS_TABLE || 'NotificationLogs'
  };
  
  const result = await dynamodb.scan(params).promise();
  console.log(`Retrieved ${result.Items.length} notification logs from database`);
  
  return result.Items.map(log => ({
    id: log.id || '',
    student_id: log.student_id || '',
    student_name: log.student_name || '',
    phone_no: log.phone_no || '',
    status: log.status || '',
    message: log.message || '',
    created_at: log.created_at || ''
  }));
};

// CSV Export for Students
exports.exportStudentsCSV = async (req, res) => {
  try {
    const students = await getStudentsData();
    
    // Create CSV content
    const headers = [
      'ID', 'Registration No', 'Name', "Father's Name", 'Phone', 'Email',
      'Course', 'Batch Time', 'Joining Date', 'Monthly Fee', 'Fee Status', 'Due Date', 'Course Duration'
    ];
    
    let csvContent = headers.join(',') + '\n';
    
    students.forEach(student => {
      const row = [
        `"${student.id}"`,
        `"${student.registration_no}"`,
        `"${student.name}"`,
        `"${student.fathers_name}"`,
        `"${student.phone_no}"`,
        `"${student.email}"`,
        `"${student.course_name}"`,
        `"${student.batch_time}"`,
        `"${student.created_at}"`,
        `"${student.monthly_fee}"`,
        `"${student.fee_status}"`,
        `"${student.due_date}"`,
        `"${student.course_duration}"`
      ];
      csvContent += row.join(',') + '\n';
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=students.csv');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    res.send(csvContent);
    console.log("CSV file sent successfully");
  } catch (error) {
    console.error('Error exporting students as CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export students as CSV',
      error: error.message
    });
  }
};

// JSON Export for Students
exports.exportStudentsJSON = async (req, res) => {
  try {
    const students = await getStudentsData();
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=students.json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    res.json({
      export_date: new Date().toISOString(),
      total_count: students.length,
      students: students
    });
    
    console.log("JSON file sent successfully");
  } catch (error) {
    console.error('Error exporting students as JSON:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export students as JSON',
      error: error.message
    });
  }
};

// CSV Export for Notifications
exports.exportNotificationsCSV = async (req, res) => {
  try {
    const logs = await getNotificationLogsData();
    
    // Create CSV content
    const headers = ['ID', 'Student ID', 'Student Name', 'Phone Number', 'Status', 'Message', 'Sent At'];
    
    let csvContent = headers.join(',') + '\n';
    
    logs.forEach(log => {
      const row = [
        `"${log.id}"`,
        `"${log.student_id}"`,
        `"${log.student_name}"`,
        `"${log.phone_no}"`,
        `"${log.status}"`,
        `"${(log.message || '').replace(/"/g, '""')}"`, // Escape quotes in message
        `"${log.created_at}"`
      ];
      csvContent += row.join(',') + '\n';
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=notification_logs.csv');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    res.send(csvContent);
    console.log("Notifications CSV file sent successfully");
  } catch (error) {
    console.error('Error exporting notifications as CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export notifications as CSV',
      error: error.message
    });
  }
};

// JSON Export for Notifications
exports.exportNotificationsJSON = async (req, res) => {
  try {
    const logs = await getNotificationLogsData();
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=notification_logs.json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    res.json({
      export_date: new Date().toISOString(),
      total_count: logs.length,
      notification_logs: logs
    });
    
    console.log("Notifications JSON file sent successfully");
  } catch (error) {
    console.error('Error exporting notifications as JSON:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export notifications as JSON',
      error: error.message
    });
  }
};
