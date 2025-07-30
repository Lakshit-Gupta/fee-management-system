import React, { useState, useEffect } from 'react';
import { Table, Button, Form, InputGroup, Row, Col, Card, Alert, Spinner } from 'react-bootstrap';
import { StudentService, FeeService } from '../services/api';
import { toast } from 'react-toastify';

const FeeManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchFeeData();
  }, []);

  const fetchFeeData = async () => {
    try {
      setLoading(true);
      
      // Get all students to show their fee information
      const data = await StudentService.getAll();
      setStudents(data.students || []);
    } catch (err) {
      console.error('Error fetching fee data:', err);
      setError('Failed to load fee data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Transform students data to fee records for the table
  const fees = students.map(student => ({
    id: student.id,
    studentName: student.name,
    amount: student.fees?.monthly_amount || 0,
    dueDate: student.fees?.due_date || null,
    status: student.fees?.status || 'pending',
    paidDate: student.fees?.last_paid || null
  }));

  const filteredFees = filter === 'all' 
    ? fees 
    : fees.filter(fee => fee.status === filter);

  const markAsPaid = async (feeId) => {
    try {
      await FeeService.updateStatus(feeId, 'paid');
      
      // Update the local state
      setStudents(students.map(student => {
        if (student.id === feeId) {
          return {
            ...student,
            fees: {
              ...student.fees,
              status: 'paid',
              last_paid: new Date().toISOString()
            }
          };
        }
        return student;
      }));
      
      toast.success('Fee marked as paid successfully');
    } catch (error) {
      console.error('Error marking fee as paid:', error);
      toast.error(`Failed to update fee status: ${error.message}`);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN');
  };
  return (
    <div className="fee-management">
      <h1 className="mb-4">Fee Management</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Row className="mb-4">
        <Col md={3}>
          <Card>
            <Card.Body>
              <Card.Title>Total Due</Card.Title>
              <Card.Text className="h2">
                ₹{fees
                  .filter(fee => fee.status !== 'paid')
                  .reduce((total, fee) => total + fee.amount, 0)
                  .toLocaleString('en-IN')}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={9}>
          <Form.Group>
            <Form.Label>Filter by Status</Form.Label>
            <Form.Select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Fees</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>
      
      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading fee data...</p>
        </div>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Student Name</th>
              <th>Amount</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Paid Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFees.length > 0 ? (
              filteredFees.map(fee => (
                <tr key={fee.id}>
                  <td>{fee.id.substring(0, 8)}...</td>
                  <td>{fee.studentName}</td>
                  <td>₹{fee.amount.toLocaleString('en-IN')}</td>
                  <td>{formatDate(fee.dueDate)}</td>
                  <td>
                    <span className={`badge bg-${fee.status === 'paid' ? 'success' : fee.status === 'pending' ? 'warning' : 'danger'}`}>
                      {fee.status.toUpperCase()}
                    </span>
                  </td>
                  <td>{formatDate(fee.paidDate)}</td>
                  <td>
                    <Button 
                      size="sm" 
                      variant="success" 
                      onClick={() => markAsPaid(fee.id)}
                      disabled={fee.status === 'paid'}
                    >
                      Mark as Paid
                    </Button>
                    {' '}
                    <Button 
                      size="sm" 
                      variant="outline-dark" 
                      style={{background: '#25D366'}}
                      onClick={async () => {
                        try {
                          await FeeService.sendReminder(fee.id);
                          toast.success(`Reminder sent to ${fee.studentName}`);
                        } catch (error) {
                          toast.error(`Failed to send reminder: ${error.message}`);
                        }
                      }}
                      disabled={fee.status === 'paid'}
                      title="Send WhatsApp Reminder"
                    >
                      📱
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center">
                  {filter !== 'all' ? 'No fees match the selected filter' : 'No fee records found'}
                </td>
              </tr>            )}
          </tbody>
        </Table>
      )}
    </div>
  );
};

export default FeeManagement;