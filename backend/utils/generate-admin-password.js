/**
 * Password Generator for AIICT Admin Panel
 * 
 * Run this script to generate a new password:
 * node generate-admin-password.js [new-password]
 * 
 * If no password is provided, a secure random password will be generated.
 */

const crypto = require('crypto');

// Configuration (should match auth.js)
const SALT = process.env.PASSWORD_SALT || 'aiict_salt_2025';
const DEFAULT_PASSWORD_LENGTH = 12;

// Generate a secure random password if none provided
function generateSecurePassword(length = DEFAULT_PASSWORD_LENGTH) {
  // Characters to use in the password (alphanumeric + special chars)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+';
  let password = '';
  
  // Generate random bytes and map to characters
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    const randomIndex = randomBytes[i] % chars.length;
    password += chars.charAt(randomIndex);
  }
  
  return password;
}

// Hash a password with salt
function hashPassword(password, salt) {
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

// Main execution
const newPassword = process.argv[2] || generateSecurePassword();
const hashedPassword = hashPassword(newPassword, SALT);

console.log('\n=== AIICT Admin Password Generator ===\n');

if (!process.argv[2]) {
  console.log(`Generated secure password: ${newPassword}`);
  console.log('SAVE THIS PASSWORD! It will not be shown again.\n');
} else {
  console.log(`Using provided password: ${newPassword}\n`);
}

console.log('Password hash:');
console.log(hashedPassword);

console.log('\nTo update your password:');
console.log('1. Edit src/handlers/auth.js and update ADMIN_PASSWORD_HASH with this hash');
console.log('   OR');
console.log('2. Set the ADMIN_PASSWORD_HASH environment variable in serverless.yml');
console.log('\nLogin credentials:');
console.log('Email: admin@aiict.in (or the email set in your environment)');
console.log(`Password: ${newPassword}\n`);

console.log('=== Remember to deploy your changes! ===\n');
