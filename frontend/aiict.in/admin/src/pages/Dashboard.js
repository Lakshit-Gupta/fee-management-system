import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Alert, Spinner, Table, Button } from 'react-bootstrap';
import { StatsService, FeeService } from '../services/api';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingFees: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    quarterlyRevenue: 0,
    yearlyRevenue: 0,
    recentReminders: 0,
    dueStudentsTomorrow: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch dashboard statistics from our service
        const data = await StatsService.getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        
        // Fallback to empty data
        setStats({
          totalStudents: 0,
          pendingFees: 0,
          totalRevenue: 0,
          monthlyRevenue: 0,
          quarterlyRevenue: 0,
          yearlyRevenue: 0,
          recentReminders: 0,
          dueStudentsTomorrow: []
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  const handleMarkAsPaid = async (student) => {
    try {
      await FeeService.updateStatus(student.id, 'paid');
      toast.success(`Marked ${student.name}'s fee as paid`);
      
      // Remove this student from the list
      setStats(prevStats => ({
        ...prevStats,
        dueStudentsTomorrow: prevStats.dueStudentsTomorrow.filter(s => s.id !== student.id)
      }));
    } catch (error) {
      toast.error(`Failed to update fee status: ${error.message}`);
    }
  };

  const handleSendReminder = async (student) => {
    try {
      await FeeService.sendReminder(student.id);
      toast.success(`Reminder sent to ${student.name}`);
    } catch (error) {
      toast.error(`Failed to send reminder: ${error.message}`);
    }
  };

  return (
    <div className="dashboard">
      <h1 className="mb-4">Dashboard</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading dashboard data...</p>
        </div>
      ) : (
        <>
          {/* First row of stats */}
          <Row>
            <Col md={3}>
              <Card className="mb-4">
                <Card.Body className="text-center">
                  <Card.Title>Total Students</Card.Title>
                  <Card.Text className="h1">{stats.totalStudents}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={3}>
              <Card className="mb-4">
                <Card.Body className="text-center">
                  <Card.Title>Pending Fees</Card.Title>
                  <Card.Text className="h1 text-warning">{stats.pendingFees}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={3}>
              <Card className="mb-4">
                <Card.Body className="text-center">
                  <Card.Title>Total Revenue</Card.Title>
                  <Card.Text className="h1 text-success">₹{stats.totalRevenue?.toLocaleString('en-IN') || '0'}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={3}>
              <Card className="mb-4">
                <Card.Body className="text-center">
                  <Card.Title>Recent Reminders</Card.Title>
                  <Card.Text className="h1 text-primary">{stats.recentReminders}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Period-based Revenue row */}
          <h4 className="mb-3">Period Revenue Analysis</h4>
          <Row>
            <Col md={4}>
              <Card className="mb-4">
                <Card.Body className="text-center">
                  <Card.Title>This Month</Card.Title>
                  <Card.Text className="h2 text-success">₹{stats.monthlyRevenue?.toLocaleString('en-IN') || '0'}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={4}>
              <Card className="mb-4">
                <Card.Body className="text-center">
                  <Card.Title>This Quarter</Card.Title>
                  <Card.Text className="h2 text-success">₹{stats.quarterlyRevenue?.toLocaleString('en-IN') || '0'}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={4}>
              <Card className="mb-4">
                <Card.Body className="text-center">
                  <Card.Title>This Year</Card.Title>
                  <Card.Text className="h2 text-success">₹{stats.yearlyRevenue?.toLocaleString('en-IN') || '0'}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Students with fees due */}
          <Row className="mt-4">
            <Col>
              <Card>
                <Card.Header as="h5">
                  <div className="d-flex justify-content-between align-items-center">
                    Students with Fees Due Tomorrow
                    <span className="badge bg-warning">{stats.dueStudentsTomorrow?.length || 0}</span>
                  </div>
                </Card.Header>
                <Card.Body>
                  {stats.dueStudentsTomorrow?.length > 0 ? (
                    <Table striped bordered hover responsive>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Phone</th>
                          <th>Course</th>
                          <th>Monthly Fee</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.dueStudentsTomorrow.map(student => (
                          <tr key={student.id}>
                            <td>{student.name}</td>
                            <td>{student.phone_no}</td>
                            <td>{student.course_name}</td>
                            <td>₹{student.fees?.monthly_amount?.toLocaleString('en-IN') || '0'}</td>
                            <td>
                              <Button 
                                size="sm" 
                                variant="success" 
                                onClick={() => handleMarkAsPaid(student)}
                              >
                                Mark as Paid
                              </Button>
                              {' '}
                              <Button 
                                size="sm" 
                                variant="outline-dark" 
                                style={{background: '#25D366'}}
                                onClick={() => handleSendReminder(student)}
                                title="Send WhatsApp Reminder"
                              >
                                📱
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <p className="text-center my-3">
                      No students have fees due tomorrow. All caught up! 👍
                    </p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default Dashboard;