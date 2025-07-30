const AWS = require('aws-sdk');
const express = require('express');
const ExcelJS = require('exceljs');
const router = express.Router();

// GET /api/export/students - Export students data as Excel file
router.get('/students', async (req, res) => {
  try {
    // Configure AWS
    AWS.config.update({
      region: process.env.AWS_REGION || 'ap-south-1'
    });

    const docClient = new AWS.DynamoDB.DocumentClient();
    
    // Get all students
    const studentsTable = 'Students';
    const studentsResult = await docClient.scan({ TableName: studentsTable }).promise();
    const students = studentsResult.Items || [];

    // Create Excel workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Students');

    // Define columns
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 20 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Course', key: 'course', width: 20 },
      { header: 'Batch Time', key: 'batchTime', width: 15 },
      { header: 'Monthly Fee', key: 'monthlyFee', width: 15 },
      { header: 'Fee Status', key: 'feeStatus', width: 15 },
      { header: 'Due Date', key: 'dueDate', width: 15 },
      { header: 'Course Duration (Months)', key: 'courseDuration', width: 20 },
      { header: 'Registration Date', key: 'createdAt', width: 20 }
    ];

    // Add rows
    students.forEach(student => {
      worksheet.addRow({
        id: student.id || student.studentId,
        name: student.name,
        email: student.email,
        phone: student.phone,
        course: student.course,
        batchTime: student.batchTime,
        monthlyFee: student.fees && student.fees.monthly_amount,
        feeStatus: student.fees && student.fees.status,
        dueDate: student.fees && student.fees.due_date,
        courseDuration: student.courseDuration || 'N/A',
        createdAt: student.created_at
      });
    });

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="students.xlsx"');

    // Write to buffer and send
    await workbook.xlsx.write(res);
    res.end();
    
  } catch (error) {
    console.error('Error exporting students data:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting students data',
      error: error.message
    });
  }
});

// GET /api/export/notifications - Export notification logs as Excel file
router.get('/notifications', async (req, res) => {
  try {
    // Configure AWS
    AWS.config.update({
      region: process.env.AWS_REGION || 'ap-south-1'
    });

    const docClient = new AWS.DynamoDB.DocumentClient();
    
    // Get all notification logs
    const notificationLogsTable = 'NotificationLogs';
    const logsResult = await docClient.scan({ TableName: notificationLogsTable }).promise();
    const logs = logsResult.Items || [];

    // Create Excel workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Notification Logs');

    // Define columns
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 20 },
      { header: 'Student ID', key: 'studentId', width: 20 },
      { header: 'Student Name', key: 'studentName', width: 25 },
      { header: 'Message', key: 'message', width: 50 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Created At', key: 'createdAt', width: 20 }
    ];

    // Add rows
    logs.forEach(log => {
      worksheet.addRow({
        id: log.id,
        studentId: log.student_id,
        studentName: log.student_name,
        message: log.message,
        status: log.status,
        createdAt: log.created_at
      });
    });

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="notification_logs.xlsx"');

    // Write to buffer and send
    await workbook.xlsx.write(res);
    res.end();
    
  } catch (error) {
    console.error('Error exporting notification logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting notification logs',
      error: error.message
    });
  }
});

module.exports = router;
