const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const { notifyOwner, notifyStudent, notifyPaymentConfirmation } = require('../utils/notification');

// GET /api/fees/due - SELECT students with due fees
router.get('/due', async (req, res) => {
    try {
        const dueStudents = await Student.getStudentsWithDueFees();
        res.status(200).json({
            success: true,
            students: dueStudents,
            count: dueStudents.length
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
});

// PUT /api/fees/:id/status - UPDATE fee status
router.put('/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    try {
        const paidDate = status === 'paid' ? new Date().toISOString() : null;
        const updatedStudent = await Student.updateFeeStatus(id, status, paidDate);
        
        // Send confirmation SMS if fee marked as paid
        if (status === 'paid' && updatedStudent) {
            try {
                await notifyPaymentConfirmation(
                    updatedStudent.phone_no,
                    updatedStudent.name,
                    updatedStudent.fees.monthly_amount,
                    new Date().toLocaleDateString('en-IN')
                );
            } catch (notificationError) {
                console.error('Failed to send payment confirmation:', notificationError);
            }
        }
        
        res.status(200).json({ 
            success: true,
            message: 'Fee status updated successfully', 
            student: updatedStudent 
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            message: error.message 
        });
    }
});

// POST /api/fees/send-reminder/:id - Send manual fee reminder
router.post('/send-reminder/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const student = await Student.findById(id);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        const dueDate = new Date(student.fees.due_date).toLocaleDateString('en-IN');
        const result = await notifyStudent(
            student.phone_no,
            student.name,
            student.fees.monthly_amount,
            dueDate
        );
        
        res.status(200).json({
            success: true,
            message: 'Reminder sent successfully',
            notificationResult: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Function to check for students with fees due tomorrow (Enhanced)
const checkDueFees = async (event, context) => {
    console.log('Starting daily fee check...');
    
    try {
        const students = await Student.getStudentsWithDueFees();
        console.log(`Found ${students.length} students with pending fees`);
        
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        
        // Filter students with fees due tomorrow
        const dueStudents = students.filter(student => {
            const dueDate = new Date(student.fees.due_date);
            return dueDate.toDateString() === tomorrow.toDateString() && 
                   student.fees.status !== 'paid';
        });
        
        console.log(`Found ${dueStudents.length} students with fees due tomorrow`);
        
        let successCount = 0;
        let failCount = 0;
        
        // Send notifications to students
        for (const student of dueStudents) {
            try {
                const dueDate = new Date(student.fees.due_date).toLocaleDateString('en-IN');
                
                // Notify student
                await notifyStudent(
                    student.phone_no,
                    student.name,
                    student.fees.monthly_amount,
                    dueDate
                );
                
                successCount++;
                console.log(`Notification sent to ${student.name} (${student.phone_no})`);
            } catch (error) {
                failCount++;
                console.error(`Failed to notify ${student.name}:`, error);
            }
        }
        
        // Log summary to CloudWatch instead of sending SMS to save costs
        if (dueStudents.length > 0) {
            const totalAmount = dueStudents.reduce((sum, s) => sum + (s.fees.monthly_amount || 0), 0);
            console.log(`Summary: ${dueStudents.length} students have fees due around ${tomorrow.toLocaleDateString('en-IN')}`);
            console.log(`Total pending amount: Rs.${totalAmount}`);
            
            // No SMS notification to owner - we'll rely on database logs instead
            // This saves costs and prevents unnecessary "X students" messages
        }
        
        const result = {
            totalDueStudents: dueStudents.length,
            successfulNotifications: successCount,
            failedNotifications: failCount,
            timestamp: new Date().toISOString(),
            students: dueStudents.map(s => ({
                id: s.id,
                name: s.name,
                phone: s.phone_no,
                amount: s.fees.monthly_amount,
                dueDate: s.fees.due_date
            }))
        };
        
        console.log('Daily fee check completed:', result);
        return result;
        
    } catch (error) {
        console.error('Error in daily fee check:', error);
        throw error;
    }
};

module.exports = router;
module.exports.checkDueFees = checkDueFees;