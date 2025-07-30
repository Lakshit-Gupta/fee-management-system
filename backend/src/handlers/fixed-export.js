const AWS = require('aws-sdk');
const ExcelJS = require('exceljs');

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'ap-south-1'
});

// Create DynamoDB DocumentClient
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.exportStudents = async (req, res) => {
  try {
    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Students');
    
    // Define columns
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 36 },
      { header: 'Registration No', key: 'registration_no', width: 20 },
      { header: 'Name', key: 'name', width: 30 },
      { header: "Father's Name", key: 'fathers_name', width: 30 },
      { header: 'Phone', key: 'phone_no', width: 15 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Course', key: 'course_name', width: 15 },
      { header: 'Batch Time', key: 'batch_time', width: 20 },
      { header: 'Joining Date', key: 'created_at', width: 15 },
      { header: 'Monthly Fee', key: 'monthly_fee', width: 15 },
      { header: 'Fee Status', key: 'fee_status', width: 15 },
      { header: 'Due Date', key: 'due_date', width: 15 },
      { header: 'Course Duration (Months)', key: 'course_duration', width: 20 }
    ];
    
    // Add header row styling
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };
    
    // Query DynamoDB for students
    const params = {
      TableName: process.env.STUDENTS_TABLE || 'Students'
    };
    
    const result = await dynamodb.scan(params).promise();
    console.log(`Retrieved ${result.Items.length} students from database`);
    
    // Add rows to worksheet
    for (const student of result.Items) {
      worksheet.addRow({
        id: student.id,
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
      });
    }
      // Set response headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=students.xlsx');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Generate buffer and send
    const buffer = await workbook.xlsx.writeBuffer();
    res.send(buffer);
    
    console.log("Excel file sent successfully");
  } catch (error) {
    console.error('Error exporting students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export students',
      error: error.message
    });
  }
};

exports.exportNotifications = async (req, res) => {
  try {
    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Notifications');
    
    // Define columns
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 36 },
      { header: 'Student ID', key: 'student_id', width: 36 },
      { header: 'Student Name', key: 'student_name', width: 30 },
      { header: 'Phone Number', key: 'phone_no', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Message', key: 'message', width: 40 },
      { header: 'Sent At', key: 'created_at', width: 20 }
    ];
    
    // Add header row styling
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };
    
    // Query DynamoDB for notification logs
    const params = {
      TableName: process.env.NOTIFICATION_LOGS_TABLE || 'NotificationLogs'
    };
    
    const result = await dynamodb.scan(params).promise();
    console.log(`Retrieved ${result.Items.length} notification logs from database`);
    
    // Add rows to worksheet
    for (const log of result.Items) {
      worksheet.addRow({
        id: log.id,
        student_id: log.student_id || '',
        student_name: log.student_name || '',
        phone_no: log.phone_no || '',
        status: log.status || '',
        message: log.message || '',
        created_at: log.created_at || ''
      });
    }
      // Set response headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=notification_logs.xlsx');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Generate buffer and send
    const buffer = await workbook.xlsx.writeBuffer();
    res.send(buffer);
    
    console.log("Notifications Excel file sent successfully");
  } catch (error) {
    console.error('Error exporting notification logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export notification logs',
      error: error.message
    });
  }
};
