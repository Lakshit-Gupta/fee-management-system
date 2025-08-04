import React, { useState } from 'react';
import { Form, Button, Card, Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../config';

const AddStudent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Course options for dropdown
  const courseOptions = [
    'Basic Computer', 'Web Development', 'App Development', 
    'Data Science', 'AI & Machine Learning', 'Digital Marketing',
    'Graphic Design', 'Video Editing', 'Full Stack Development'
  ];
    
  // Generate batch time options from 7 AM to 7 PM in 1-hour intervals
  const generateBatchTimeOptions = () => {
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
  
  const batchTimeOptions = generateBatchTimeOptions();
  
  const [formData, setFormData] = useState({
    name: '',
    fathers_name: '',
    phone_no: '',
    email: '',
    address: '',
    course_name: '',
    batch_time: '',
    joining_date: '',
    monthly_fee: '',
    registration_fee: '0',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Generate a registration number based on name and current date
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      
      // Create initials from name
      const initials = formData.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase();
      
      // Calculate due date
      const dueDate = calculateDueDate(formData.joining_date);
      
      // Final data with registration number
      const studentData = {
        ...formData,
        registration_no: `INST-${year}${month}-${initials}`,
        monthlyAmount: parseFloat(formData.monthly_fee),
        registrationFee: parseFloat(formData.registration_fee),
        dueDate: dueDate // Added at top level for backend processing
      };
      
      // API call to create student
      const response = await fetch(`${API_BASE_URL}/api/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(studentData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add student');
      }
      
      await response.json();
      toast.success('Student added successfully!');
      navigate('/students');
    } catch (err) {
      console.error('Error adding student:', err);
      setError(err.message || 'Failed to add student. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate the due date (30 days from joining date)
  const calculateDueDate = (joiningDate) => {
    if (!joiningDate) {
      console.warn('No joining date provided, using current date + 30 days');
      // Fallback to current date + 30 days if no joining date
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    }
    
    // Create a new date object from the joining date string
    const date = new Date(joiningDate);
    
    // Validate the joining date
    if (isNaN(date.getTime())) {
      console.error('Invalid joining date provided:', joiningDate);
      // Fallback to current date + 30 days
      const fallbackDate = new Date();
      fallbackDate.setDate(fallbackDate.getDate() + 30);
      return fallbackDate.toISOString().split('T')[0];
    }
    
    // Log the original joining date for debugging
    console.log('Original joining date:', joiningDate);
    console.log('Parsed joining date:', date.toISOString());
    
    // Add 30 days to the joining date for the due date
    date.setDate(date.getDate() + 30);
    
    // Log the calculated due date
    console.log('Calculated due date:', date.toISOString().split('T')[0]);
    
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  };
  
  return (
    <Container>
      <h1 className="mb-4">Add New Student</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Card>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Student Name*</Form.Label>
                  <Form.Control
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter student name"
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Father's Name*</Form.Label>
                  <Form.Control
                    name="fathers_name"
                    value={formData.fathers_name}
                    onChange={handleInputChange}
                    placeholder="Enter father's name"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone Number*</Form.Label>
                  <Form.Control
                    name="phone_no"
                    value={formData.phone_no}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email (optional)"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter address"
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Course*</Form.Label>
                  <Form.Select
                    name="course_name"
                    value={formData.course_name}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Course</option>
                    {courseOptions.map((course, index) => (
                      <option key={index} value={course}>
                        {course}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
                <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Batch Time*</Form.Label>
                  <Form.Select
                    name="batch_time"
                    value={formData.batch_time}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Batch Time</option>
                    {batchTimeOptions.map((time, index) => (
                      <option key={index} value={time}>
                        {time}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Joining Date*</Form.Label>
                  <Form.Control
                    type="date"
                    name="joining_date"
                    value={formData.joining_date}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Monthly Fee (₹)*</Form.Label>
                  <Form.Control
                    type="number"
                    name="monthly_fee"
                    value={formData.monthly_fee}
                    onChange={handleInputChange}
                    placeholder="Enter monthly fee amount"
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Registration Fee (₹)</Form.Label>
                  <Form.Control
                    type="number"
                    name="registration_fee"
                    value={formData.registration_fee}
                    onChange={handleInputChange}
                    placeholder="Enter registration fee (if any)"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <div className="d-flex justify-content-between mt-4">
              <Button variant="secondary" onClick={() => navigate('/students')}>
                Cancel
              </Button>
              
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner as="span" size="sm" animation="border" role="status" className="me-2" />
                    Saving...
                  </>
                ) : 'Add Student'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AddStudent;