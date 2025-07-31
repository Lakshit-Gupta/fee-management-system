const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Secure credentials with environment variables support
// In production, add these to your environment variables
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'YOUR_ADMIN_EMAIL';
// Password: Admin@123 (securely hashed with salt)
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || 'YOUR_PASSWORD_HASH'; // Legacy hash without salt
const SALT = process.env.PASSWORD_SALT || 'YOUR_SALT'; // Add a salt for better security
const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_JWT_SECRET';

// Helper function to hash passwords with salt
const hashPassword = (password) => {
  // For backward compatibility, we support both salted and unsalted hashes
  // New passwords should use the salted version
  return crypto.createHash('sha256').update(password + SALT).digest('hex');
};

// Helper to check if a password is valid against legacy or new hashing
const validatePassword = (password, storedHash) => {
  // Try salted hash first (new method)
  const saltedHash = crypto.createHash('sha256').update(password + SALT).digest('hex');
  if (saltedHash === storedHash) return true;
  
  // If salted hash doesn't match, try legacy hash (without salt)
  const legacyHash = crypto.createHash('sha256').update(password).digest('hex');
  return legacyHash === storedHash;
};

// Simple rate limiting
const loginAttempts = {};
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds

// Login endpoint
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || 'unknown';
    
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }
    
    // Check for rate limiting
    const attemptKey = `${ipAddress}:${email.toLowerCase()}`;
    const now = Date.now();
    
    // Initialize or get existing attempts
    if (!loginAttempts[attemptKey]) {
      loginAttempts[attemptKey] = { count: 0, lastAttempt: now, lockedUntil: 0 };
    }
    
    const attempt = loginAttempts[attemptKey];
    
    // Check if account is locked
    if (attempt.lockedUntil > now) {
      const remainingTime = Math.ceil((attempt.lockedUntil - now) / 1000 / 60);
      return res.status(429).json({ 
        success: false, 
        message: `Too many failed attempts. Please try again in ${remainingTime} minutes.` 
      });
    }
    
    // Check credentials using our validation function that supports both hash formats
    const isValidPassword = validatePassword(password, ADMIN_PASSWORD_HASH);
    
    if (email === ADMIN_EMAIL && isValidPassword) {
      // Reset login attempts on success
      loginAttempts[attemptKey] = { count: 0, lastAttempt: now, lockedUntil: 0 };
      
      // Create JWT token with shorter expiration for security
      const token = jwt.sign(
        { email, role: 'admin' },
        JWT_SECRET,
        { expiresIn: '8h' }
      );
      
      // Send success response
      return res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          email,
          name: 'Admin',
          role: 'admin'
        }
      });
    } else {
      // Increment failed attempt counter
      attempt.count += 1;
      attempt.lastAttempt = now;
      
      // Check if we should lock the account
      if (attempt.count >= MAX_ATTEMPTS) {
        attempt.lockedUntil = now + LOCKOUT_TIME;
        return res.status(429).json({
          success: false,
          message: `Too many failed attempts. Account locked for ${LOCKOUT_TIME/60000} minutes.`
        });
      }
      
      // Invalid credentials
      return res.status(401).json({
        success: false,
        message: `Invalid email or password. ${MAX_ATTEMPTS - attempt.count} attempts remaining.`
      });
    }
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Verify token endpoint (useful for frontend to check if token is valid)
router.post('/verify', (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }
    
    // Verify token
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }
      
      return res.json({
        success: true,
        message: 'Token is valid',
        user: {
          email: decoded.email,
          name: 'Admin',
          role: decoded.role
        }
      });
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;
