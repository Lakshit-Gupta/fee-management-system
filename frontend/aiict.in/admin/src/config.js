// Create file at: src/config.js
export const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:4000/dev'  // Development server
  : 'YOUR_PRODUCTION_API_ENDPOINT';  // Production server