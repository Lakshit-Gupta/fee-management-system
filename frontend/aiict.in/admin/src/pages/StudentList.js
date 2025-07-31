import React, { useState, useEffect } from 'react';
import { Table, Button, Form, InputGroup, Card, Alert, Spinner, Dropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { StudentService, FeeService, ExportService } from '../services/api';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStudent, setEditingStudent] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch students using our service
      const data = await StudentService.getAll();
      setStudents(data.students || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to load students. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendReminder = async (studentId) => {
    try {
      const student = students.find(s => s.id === studentId);
      if (!student) return;
      
      toast.info(`Sending reminder to ${student.name}...`);
      
      // Use our service to send the reminder
      await FeeService.sendReminder(studentId);
      
      toast.success(`Reminder sent successfully to ${student.name}`);
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast.error(`Failed to send reminder: ${error.message}`);
    }
  };

  const updateFeeStatus = async (studentId, status) => {
    try {
      // Use our service to update fee status
      await FeeService.updateStatus(studentId, status);
      
      // Update local state
      setStudents(students.map(student => 
        student.id === studentId 
          ? {...student, fees: {...student.fees, status}} 
          : student
      ));
      
      toast.success('Fee status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(`Failed to update status: ${error.message}`);
    }
  };

  const handleExportStudents = (format) => {
    try {
      switch(format) {
        case 'csv':
          ExportService.exportStudentsCSV();
          toast.success('Exporting student data as CSV...');
          break;
        case 'json':
          ExportService.exportStudentsJSON();
          toast.success('Exporting student data as JSON...');
          break;
        default:
          ExportService.exportStudentsCSV();
          toast.success('Exporting student data as CSV...');
      }
    } catch (error) {
      console.error('Error exporting students:', error);
      toast.error(`Failed to export: ${error.message}`);
    }
  };

  const filteredStudents = students.filter(student => 
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.phone_no?.includes(searchTerm) ||
    student.registration_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.course_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN');
  };

  return (
    <div className="student-list">
      <h1 className="mb-4">Student Management</h1>
      
      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Students ({students.length})</h5>
            <div className="d-flex gap-2">
              <Dropdown>
                <Dropdown.Toggle variant="success" id="export-dropdown">
                  <i className="fas fa-download me-2"></i> Export Data
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => handleExportStudents('csv')}>
                    <i className="fas fa-file-csv me-2"></i> CSV
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleExportStudents('json')}>
                    <i className="fas fa-file-code me-2"></i> JSON
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
              <Link to="/students/add">
                <Button variant="primary">
                  Add New Student
                </Button>
              </Link>
            </div>
          </div>
          
          <InputGroup>
            <Form.Control
              placeholder="Search students by name, phone, registration no, or course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button variant="outline-secondary">Search</Button>
          </InputGroup>
        </Card.Body>
      </Card>
      
      {loading && (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading students...</p>
        </div>
      )}
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {!loading && !error && (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Name</th>
              <th>Reg. No</th>
              <th>Phone</th>
              <th>Course</th>
              <th>Batch Time</th>
              <th>Monthly Fee</th>
              <th>Status</th>
              <th>Due Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <tr key={student.id}>
                  <td>{student.name}</td>
                  <td>{student.registration_no}</td>
                  <td>{student.phone_no}</td>
                  <td>{student.course_name}</td>
                  <td>{student.batch_time}</td>
                  <td>₹{student.fees?.monthly_amount?.toLocaleString('en-IN') || 'N/A'}</td>
                  <td>
                    <span className={`badge ${
                      student.fees?.status === 'paid' ? 'bg-success' : 
                      student.fees?.status === 'pending' ? 'bg-warning' : 'bg-danger'
                    }`}>
                      {student.fees?.status?.toUpperCase() || 'N/A'}
                    </span>
                  </td>
                  <td>{formatDate(student.fees?.due_date)}</td>
                  <td>
                    <div className="d-flex gap-1">
                      <Link to={`/students/edit/${student.id}`} className="btn btn-sm btn-primary">
                        Edit
                      </Link>
                      
                      <Button 
                        size="sm" 
                        variant="success" 
                        onClick={() => updateFeeStatus(student.id, 'paid')}
                        disabled={student.fees?.status === 'paid'}
                      >
                        Mark Paid
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="outline-dark" 
                        style={{background: '#25D366'}}
                        onClick={() => sendReminder(student.id)}
                        disabled={loading || student.fees?.status === 'paid'}
                        title="Send WhatsApp Reminder"
                      >
                        SMS
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="text-center">
                  {searchTerm ? 'No matching students found' : 'No students added yet'}
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      )}
    </div>
  );
};

export default StudentList;