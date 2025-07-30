// Create file at: src/pages/Reminders.js
import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Row, Col, Alert, Table, Spinner, Dropdown } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../config';
import { ExportService } from '../services/api';

const Reminders = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [notificationLogs, setNotificationLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [formData, setFormData] = useState({
    daysAhead: 3,
    courseFilter: '',
    includePending: true,
    includeOverdue: true
  });

  useEffect(() => {
    fetchNotificationLogs();
  }, []);

  const fetchNotificationLogs = async () => {
    try {
      setLogsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/notifications/logs`);
      const data = await response.json();
      setNotificationLogs(data.logs || []);
    } catch (error) {
      console.error('Error fetching notification logs:', error);
      toast.error('Failed to load notification logs');
    } finally {
      setLogsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setResult({
        success: true,
        sentCount: 12,
        failedCount: 2,
        totalAmount: 150000
      });
      setLoading(false);
    }, 2000);
    
    // Actual API call would be:
    // fetch(`${API_BASE_URL}/api/reminders/batch`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(formData)
    // })
    //   .then(res => res.json())
    //   .then(data => setResult(data))
    //   .catch(err => {
    //     console.error(err);
    //     setResult({ success: false, message: err.message });
    //   })
    //   .finally(() => setLoading(false));
  };

  const handleExportNotifications = (format) => {
    try {
      switch(format) {
        case 'csv':
          ExportService.exportNotificationsCSV();
          toast.success('Exporting notification logs as CSV...');
          break;
        case 'json':
          ExportService.exportNotificationsJSON();
          toast.success('Exporting notification logs as JSON...');
          break;
        default:
          ExportService.exportNotificationsCSV();
          toast.success('Exporting notification logs as CSV...');
      }
    } catch (error) {
      console.error('Error exporting notifications:', error);
      toast.error(`Failed to export: ${error.message}`);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="reminders">
      <h1 className="mb-4">Fee Reminders</h1>
      
      <Row>
        <Col md={6}>
          <Card>
            <Card.Header>Send Batch Reminders</Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Days Ahead</Form.Label>
                  <Form.Control
                    type="number"
                    name="daysAhead"
                    value={formData.daysAhead}
                    onChange={handleInputChange}
                    min="0"
                    max="30"
                  />
                  <Form.Text className="text-muted">
                    Send reminders for fees due in this many days
                  </Form.Text>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Course Filter (Optional)</Form.Label>
                  <Form.Control
                    type="text"
                    name="courseFilter"
                    value={formData.courseFilter}
                    onChange={handleInputChange}
                    placeholder="Leave empty for all courses"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Include Pending Fees"
                    name="includePending"
                    checked={formData.includePending}
                    onChange={handleInputChange}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Include Overdue Fees"
                    name="includeOverdue"
                    checked={formData.includeOverdue}
                    onChange={handleInputChange}
                  />
                </Form.Group>
                
                <Button 
                  variant="primary" 
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Reminders'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          {result && (
            <Card>
              <Card.Header>Reminder Results</Card.Header>
              <Card.Body>
                {result.success ? (
                  <>
                    <Alert variant="success">
                      Reminders sent successfully!
                    </Alert>
                    <p><strong>Sent:</strong> {result.sentCount} reminders</p>
                    <p><strong>Failed:</strong> {result.failedCount} reminders</p>
                    <p><strong>Total Amount:</strong> ₹{result.totalAmount?.toLocaleString('en-IN')}</p>
                  </>
                ) : (
                  <Alert variant="danger">
                    Error: {result.message}
                  </Alert>
                )}
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      <Card className="mt-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Notification Logs</h5>
          <Dropdown>
            <Dropdown.Toggle variant="success" size="sm" id="export-notifications-dropdown">
              <i className="fas fa-download me-1"></i> Export
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => handleExportNotifications('csv')}>
                <i className="fas fa-file-csv me-2"></i> CSV
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handleExportNotifications('json')}>
                <i className="fas fa-file-code me-2"></i> JSON
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Card.Header>
        <Card.Body>
          {logsLoading ? (
            <div className="text-center my-3">
              <Spinner animation="border" variant="primary" size="sm" />
              <p>Loading notification logs...</p>
            </div>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Student</th>
                  <th>Message</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {notificationLogs.length > 0 ? (
                  notificationLogs.map((log) => (
                    <tr key={log.id}>
                      <td>{formatDate(log.created_at)}</td>
                      <td>{log.student_name}</td>
                      <td>{log.message}</td>
                      <td>
                        <span className={`badge ${
                          log.status === 'success' ? 'bg-success' : 
                          log.status === 'pending' ? 'bg-warning' : 'bg-danger'
                        }`}>
                          {log.status?.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center">No notification logs found</td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default Reminders;