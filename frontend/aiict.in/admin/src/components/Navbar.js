// Create file at: src/components/Navbar.js
import React from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';

const AppNavbar = () => {
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem('authToken') !== null;
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    // Clear all auth-related items
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('authTokenExpiry');
    
    // Redirect to login page
    navigate('/login');
  };

  return (
    <Navbar bg="primary" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">Fee Management System</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          {isAuthenticated ? (
            <>
              <Nav className="me-auto">
                <Nav.Link as={Link} to="/">Dashboard</Nav.Link>
                <Nav.Link as={Link} to="/students">Students</Nav.Link>
                <Nav.Link as={Link} to="/fees">Fees</Nav.Link>
                <Nav.Link as={Link} to="/reminders">Reminders</Nav.Link>
              </Nav>
              <Nav>
                <Navbar.Text className="me-3">
                  Signed in as: {user.name || user.email}
                </Navbar.Text>
                <Button variant="outline-light" onClick={handleLogout}>
                  Logout
                </Button>
              </Nav>
            </>
          ) : (
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/login">Login</Nav.Link>
            </Nav>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;