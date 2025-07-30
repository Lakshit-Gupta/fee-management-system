import React, { useState } from 'react';
import { Form, Button, Card, Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { StudentService } from '../services/api';
import { toast } from 'react-toastify';

const AddStudent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
    // Course options for dropdown
  const courses = [
    'Web Development',
    'Data Science',
    'Mobile App Development',
    'UI/UX Design',
    'Digital Marketing',
    'Cybersecurity',
    'Cloud Computing',
    'Machine Learning',
    'Full Stack Development',
    'Network Administration'
  ];
  
  // Batch time options
  const batchTimes = [];
  for (let hour = 7; hour <= 19; hour++) {
    const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
    const period = hour < 12 ? 'AM' : 'PM';
    
    // 1-hour batches
    batchTimes.push(`${formattedHour}:00 ${period} - ${formattedHour + (hour === 11 || hour === 23 ? -11 : 1)}:00 ${hour === 11 ? 'PM' : (hour === 23 ? 'AM' : period)}`);
    
    // 2-hour batches
    if (hour <= 17) {  // Only add 2-hour batches up to 5 PM
      const endHour = (hour + 2) % 12 === 0 ? 12 : (hour + 2) % 12;
      const endPeriod = (hour + 2) < 12 ? 'AM' : 'PM';
      batchTimes.push(`${formattedHour}:00 ${period} - ${endHour}:00 ${endPeriod}`);
    }
  }

  const [formData, setFormData] = useState({
    name: '',
    fathers_name: '',
    phone_no: '',
    registration_no: '',
    email: '',
    address: '',
    course_name: '',
    batch_time: '',
    joining_date: '',
    monthly_fee: '',
    registration_fee: '0',
    course_duration: '6', // Default 6 months
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
    
    // Validate form
    if (!formData.name || !formData.phone_no || !formData.course_name || !formData.monthly_fee) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }
    
    try {
      // Generate registration number if not provided
      if (!formData.registration_no) {
        formData.registration_no = `REG-${Date.now().toString().slice(-6)}`;
      }
      
      // Use the service to add a student
      await StudentService.create(formData);
      toast.success('Student added successfully!');
      navigate('/students');
    } catch (err) {
      console.error('Error adding student:', err);
      setError(err.message || 'Failed to add student. Please try again.');
    } finally {
      setLoading(false);
    }
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
            
            <Row>              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Course*</Form.Label>
                  <Form.Select
                    name="course_name"
                    value={formData.course_name}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Course</option>
                    {courses.map((course, index) => (
                      <option key={index} value={course}>{course}</option>
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
                    {batchTimes.map((time, index) => (
                      <option key={index} value={time}>{time}</option>
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
                  />                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Course Duration (Months)*</Form.Label>
                  <Form.Control
                    type="number"
                    name="course_duration"
                    value={formData.course_duration}
                    onChange={handleInputChange}
                    min="1"
                    max="36"
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