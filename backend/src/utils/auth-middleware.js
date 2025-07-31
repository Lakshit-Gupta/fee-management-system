const jwt = require('jsonwebtoken');

// JWT secret (should match the one in auth.js)
const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_JWT_SECRET';

/**
 * Middleware to authenticate JWT tokens
 * This will protect routes by verifying the JWT token in the request header
 */
const authMiddleware = (req, res, next) => {
  // Get token from header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN format
  
  // Check for token in query or cookies as fallbacks (less secure)
  const queryToken = req.query.token;
  const cookieToken = req.cookies && req.cookies.token;
  
  // Use the first available token
  const finalToken = token || queryToken || cookieToken;
  
  // If no token is provided through any source
  if (!finalToken) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication required.'
    });
  }
  
  try {
    // Verify the token with stricter options
    const decoded = jwt.verify(finalToken, JWT_SECRET, {
      algorithms: ['HS256'], // Restrict to specific algorithm
      ignoreExpiration: false // Always check expiration
    });
    
    // Check if token is about to expire (within 30 minutes)
    const tokenExp = decoded.exp * 1000; // Convert to milliseconds
    const thirtyMinutes = 30 * 60 * 1000;
    const isExpiringSoon = tokenExp - Date.now() < thirtyMinutes;
    
    // Attach user info to request for use in route handlers
    req.user = decoded;
    req.tokenExpiringSoon = isExpiringSoon;
    
    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    let message = 'Authentication failed.';
    
    // Provide more specific messages for common errors
    if (error.name === 'TokenExpiredError') {
      message = 'Your session has expired. Please log in again.';
    } else if (error.name === 'JsonWebTokenError') {
      message = 'Invalid authentication token.';
    }
    
    return res.status(401).json({
      success: false,
      message,
      error: error.message
    });
  }
};

module.exports = authMiddleware;
