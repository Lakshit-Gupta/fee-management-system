const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const { notifyWelcomeStudent } = require('../utils/notification');

// POST /api/students - Create new student
router.post('/', async (req, res) => {
    const { 
        name, 
        fathersName, 
        registrationNo, 
        phoneNo, 
        courseName, 
        batchTime, 
        monthlyAmount, 
        dueDate,
        joining_date,  // Extract joining_date from the request
        courseDuration 
    } = req.body;
    
    // Log incoming request for debugging
    console.log('Creating student with data:', { 
        name, courseName, batchTime, dueDate, joining_date 
    });
    
    try {
        const newStudent = await Student.create({ 
            name, 
            fathersName, 
            registrationNo, 
            phoneNo, 
            courseName, 
            batchTime,
            monthlyAmount,
            dueDate,
            joining_date,  // Pass joining_date to Student model
            courseDuration
        });
        
        // Send welcome SMS to new student
        try {
            await notifyWelcomeStudent(
                phoneNo,
                name,
                courseName,
                batchTime
            );
        } catch (notificationError) {
            console.error('Failed to send welcome message:', notificationError);
            // Don't fail the student creation if notification fails
        }
        
        res.status(201).json({ 
            success: true,
            message: 'Student added successfully', 
            student: newStudent 
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            message: error.message 
        });
    }
});

// GET /api/students - Get all students
router.get('/', async (req, res) => {
    try {
        const students = await Student.findAll();
        res.status(200).json({
            success: true,
            students: students
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
});

// GET /api/students/:id - Get student by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const student = await Student.findById(id);
        if (student) {
            res.status(200).json({
                success: true,
                student: student
            });
        } else {
            res.status(404).json({ 
                success: false,
                message: 'Student not found' 
            });
        }
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
});

// PUT /api/students/:id - Update student
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { 
        name, 
        fathersName, 
        registrationNo, 
        phoneNo, 
        courseName, 
        batchTime,
        monthlyAmount,
        dueDate,
        feeStatus,
        courseDuration 
    } = req.body;
    
    try {
        // First get the existing student to preserve values not being updated
        const existingStudent = await Student.findById(id);
        if (!existingStudent) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        // Build update object with all possible fields
        const updateData = { 
            name: name || existingStudent.name, 
            fathersName: fathersName || existingStudent.fathers_name, 
            registrationNo: registrationNo || existingStudent.registration_no, 
            phoneNo: phoneNo || existingStudent.phone_no, 
            courseName: courseName || existingStudent.course_name, 
            courseDuration: courseDuration !== undefined ? courseDuration : (existingStudent.course_duration || 6),
            batchTime: batchTime || existingStudent.batch_time
        };
        
        // Update the basic student information
        const updatedStudent = await Student.update(id, updateData);
        
        // Handle fee updates if provided
        if (monthlyAmount) {
            await Student.updateFeeAmount(id, monthlyAmount);
        }
            
        if (feeStatus) {
            await Student.updateFeeStatus(id, feeStatus);
        }
            
        if (dueDate) {
            await Student.updateFeeDueDate(id, dueDate);
        }
        
        // Get the fully updated student
        const finalStudent = await Student.findById(id);
        
        res.status(200).json({
            success: true,
            message: 'Student updated successfully',
            student: finalStudent
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            message: error.message 
        });
    }
});

// DELETE /api/students/:id - Delete student
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        await Student.delete(id);
        res.status(200).json({ 
            success: true,
            message: 'Student deleted successfully' 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
});

module.exports = router;