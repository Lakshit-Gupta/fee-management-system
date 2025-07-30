// Create file at: src/components/ProtectedRoute.js
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

const ProtectedRoute = ({ children }) => {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('authToken');
      const expiryTime = localStorage.getItem('authTokenExpiry');
      
      // Check if token exists
      if (!token) {
        setIsVerifying(false);
        return;
      }
      
      // Check if token has expired based on local expiry time
      if (expiryTime && new Date(expiryTime) <= new Date()) {
        // Token has expired locally
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('authTokenExpiry');
        setIsVerifying(false);
        return;
      }
      
      try {
        // Verify token with backend
        const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ token })
        });
        
        const data = await response.json();
        
        if (data.success) {
          setIsAuthenticated(true);
        } else {
          // Token is invalid according to backend, clear storage
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          localStorage.removeItem('authTokenExpiry');
        }
      } catch (error) {
        console.error('Token verification error:', error);
        // On network errors, we'll assume token is valid if it exists
        // This allows the app to work offline if needed
        setIsAuthenticated(true);
      }
      
      setIsVerifying(false);
    };
    
    verifyToken();
  }, []);
  
  // Show loading state while verifying
  if (isVerifying) {
    return <div className="d-flex justify-content-center p-5">
      <div className="spinner-border" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>;
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // If authenticated, render the protected component
  return children;
};

export default ProtectedRoute;