import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { StudentService } from '../services/api';

const EditStudent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // For course dropdown
  const courseOptions = [
    'Basic Computer', 'Web Development', 'App Development', 
    'Data Science', 'AI & Machine Learning', 'Digital Marketing',
    'Graphic Design', 'Video Editing', 'Full Stack Development'
  ];  // For batch time dropdown (7am to 7pm in 1-hour intervals)
  const generateTimeSlots = () => {
    const options = [];
    for (let hour = 7; hour <= 19; hour++) {
      if (hour === 12) {
        options.push("12:00 PM");
      } else if (hour < 12) {
        options.push(`${hour}:00 AM`);
      } else {
        options.push(`${hour - 12}:00 PM`);
      }
    }
    return options;
  };

  const batchTimeOptions = generateTimeSlots();

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await StudentService.getById(id);
        if (data && data.student) {
          setStudent({
            name: data.student.name || '',
            fathers_name: data.student.fathers_name || '',
            registration_no: data.student.registration_no || '',
            phone_no: data.student.phone_no || '',
            email: data.student.email || '',
            course_name: data.student.course_name || '',
            batch_time: data.student.batch_time || '',
            monthly_fee: data.student.fees?.monthly_amount || '',
            course_duration: data.student.course_duration || 12,
            due_date: data.student.fees?.due_date ? new Date(data.student.fees.due_date).toISOString().split('T')[0] : ''
          });
        } else {
          setError('Student not found');
        }
      } catch (err) {
        console.error('Error fetching student:', err);
        setError('Failed to load student details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchStudent();
    }
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setStudent({ ...student, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      
      await StudentService.update(id, student);
      toast.success('Student updated successfully!');
      navigate('/students');
    } catch (err) {
      console.error('Error updating student:', err);
      setError('Failed to update student. Please try again.');
      toast.error('Failed to update student');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading student details...</p>
      </div>
    );
  }

  if (error && !student) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <div className="edit-student">
      <h1 className="mb-4">Edit Student</h1>
      
      <Card>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Full Name*</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={student?.name || ''}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Father's Name</Form.Label>
              <Form.Control
                type="text"
                name="fathers_name"
                value={student?.fathers_name || ''}
                onChange={handleInputChange}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Registration Number*</Form.Label>
              <Form.Control
                type="text"
                name="registration_no"
                value={student?.registration_no || ''}
                onChange={handleInputChange}
                disabled // Registration number should not be changed after creation
                required
              />
              <Form.Text className="text-muted">
                Cannot be changed after creation
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Phone Number*</Form.Label>
              <Form.Control
                type="text"
                name="phone_no"
                value={student?.phone_no || ''}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={student?.email || ''}
                onChange={handleInputChange}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Course*</Form.Label>
              <Form.Select
                name="course_name"
                value={student?.course_name || ''}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Course</option>
                {courseOptions.map(course => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Batch Time*</Form.Label>
              <Form.Select
                name="batch_time"
                value={student?.batch_time || ''}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Batch Time</option>
                {batchTimeOptions.map(time => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Monthly Fee (₹)*</Form.Label>
              <Form.Control
                type="number"
                name="monthly_fee"
                value={student?.monthly_fee || ''}
                onChange={handleInputChange}
                min="0"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Course Duration (months)*</Form.Label>
              <Form.Control
                type="number"
                name="course_duration"
                value={student?.course_duration || 12}
                onChange={handleInputChange}
                min="1"
                max="48"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Next Fee Due Date*</Form.Label>
              <Form.Control
                type="date"
                name="due_date"
                value={student?.due_date || ''}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            
            <div className="d-flex justify-content-between">
              <Button variant="secondary" onClick={() => navigate('/students')}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Update Student'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default EditStudent;
