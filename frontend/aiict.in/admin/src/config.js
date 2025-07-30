// Create file at: src/config.js
export const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:4000/dev'  // Development server
  : 'https://aolxvz3d1a.execute-api.ap-south-1.amazonaws.com/live';  // Production server