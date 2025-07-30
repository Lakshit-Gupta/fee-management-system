// Create file at: src/pages/Login.js
import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Container, Alert, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

const Login = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if user is already logged in on component mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    
    if (token) {
      // Verify token validity
      fetch(`${API_BASE_URL}/api/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            // Token is valid, redirect to dashboard
            navigate('/');
          } else {
            // Token is invalid, clear it
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
          }
        })
        .catch(err => {
          console.error('Token verification failed:', err);
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        });
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  // Track login attempts
  const [failedAttempts, setFailedAttempts] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Add a delay if there were previous failed attempts (prevents brute forcing)
    if (failedAttempts > 0) {
      // Exponential backoff - wait longer for each failed attempt
      const delay = Math.min(2000 * Math.pow(1.5, failedAttempts - 1), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    // Use the real authentication API
    fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
      cache: 'no-cache' // Prevent caching of login responses
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // Reset failed attempts counter
          setFailedAttempts(0);
          
          // Store token and user info
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          // Store token expiry time (based on 8h expiry)
          const expiryTime = new Date();
          expiryTime.setHours(expiryTime.getHours() + 8);
          localStorage.setItem('authTokenExpiry', expiryTime.toISOString());
          
          // Redirect to dashboard
          navigate('/');
        } else {
          // Increment failed attempts counter
          setFailedAttempts(prevAttempts => prevAttempts + 1);
          setError(data.message || 'Login failed. Check your credentials.');
        }
      })
      .catch(err => {
        console.error('Login error:', err);
        setError('Login failed. Please check your internet connection and try again.');
        // Still increment failed attempts on network error
        setFailedAttempts(prevAttempts => prevAttempts + 1);
      })
      .finally(() => setLoading(false));
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={6}>
          <Card>
            <Card.Header as="h4" className="text-center">Login</Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={credentials.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-4">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={credentials.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    required
                  />
                </Form.Group>
                
                <div className="d-grid">
                  <Button 
                    variant="primary" 
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Logging in...' : 'Login'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;