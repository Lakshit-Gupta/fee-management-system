/**
 * This utility generates a secure password hash with salt
 * Use this to create a new admin password hash for the system
 * 
 * Usage:
 * node generate-password.js YourDesiredPassword
 */

const crypto = require('crypto');

// The salt should match what's in auth.js / environment variables
const SALT = process.env.PASSWORD_SALT || 'YOUR_SALT';

if (process.argv.length < 3) {
  console.error('Please provide a password to hash.');
  console.error('Usage: node generate-password.js YourPassword');
  process.exit(1);
}

const password = process.argv[2];

// Hash the password with the salt
const hash = crypto.createHash('sha256').update(password + SALT).digest('hex');

console.log('\n=== Admin Password Generator ===');
console.log('\nYour password hash:');
console.log(hash);
console.log('\nTo use this password in production:');
console.log('1. Set ADMIN_PASSWORD_HASH environment variable to this hash');
console.log('2. Ensure PASSWORD_SALT environment variable matches what was used to generate this hash');
console.log('\n=========================================\n');
