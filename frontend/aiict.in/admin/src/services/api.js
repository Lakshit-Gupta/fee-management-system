import { API_BASE_URL } from '../config';

// Helper function for handling API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${response.status}`);
  }
  return await response.json();
};

// Auth header helper
const authHeader = () => {
  const token = localStorage.getItem('authToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Student API services
export const StudentService = {
  // Get all students
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/api/students`, {
      headers: {
        ...authHeader()
      }
    });
    return handleResponse(response);
  },

  // Get student by ID
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/students/${id}`, {
      headers: {
        ...authHeader()
      }
    });
    return handleResponse(response);
  },

  // Create a new student
  create: async (studentData) => {
    // Transform frontend form data to match backend expectations
    const payload = {
      name: studentData.name,
      fathersName: studentData.fathers_name,
      registrationNo: studentData.registration_no || Date.now().toString(), // Generate if not provided
      phoneNo: studentData.phone_no,
      courseName: studentData.course_name,
      batchTime: studentData.batch_time,
      monthlyAmount: Number(studentData.monthly_fee),
      courseDuration: Number(studentData.course_duration || 12),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString() // Default to 30 days from now
    };

    const response = await fetch(`${API_BASE_URL}/api/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader()
      },
      body: JSON.stringify(payload)
    });
    return handleResponse(response);
  },

  // Update student
  update: async (id, studentData) => {
    // Transform frontend data to match backend expectations
    const payload = {
      name: studentData.name,
      fathersName: studentData.fathers_name,
      phoneNo: studentData.phone_no,
      courseName: studentData.course_name,
      batchTime: studentData.batch_time,
      monthlyAmount: Number(studentData.monthly_fee),
      courseDuration: Number(studentData.course_duration || 12),
      dueDate: studentData.due_date
    };

    const response = await fetch(`${API_BASE_URL}/api/students/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader()
      },
      body: JSON.stringify(payload)
    });
    return handleResponse(response);
  }
};

// Fee API services
export const FeeService = {
  // Get due fees
  getDueFees: async () => {
    const response = await fetch(`${API_BASE_URL}/api/fees/due`, {
      headers: {
        ...authHeader()
      }
    });
    return handleResponse(response);
  },

  // Update fee status
  updateStatus: async (id, status) => {
    const response = await fetch(`${API_BASE_URL}/api/fees/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader()
      },
      body: JSON.stringify({ status })
    });
    return handleResponse(response);
  },

  // Send fee reminder
  sendReminder: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/fees/send-reminder/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader()
      }
    });
    return handleResponse(response);
  }
};

// Export API services
export const ExportService = {
  // CSV and JSON exports only
  exportStudentsCSV: () => {
    window.open(`${API_BASE_URL}/api/export-v2/students/csv`, '_blank');
  },
  
  exportStudentsJSON: () => {
    window.open(`${API_BASE_URL}/api/export-v2/students/json`, '_blank');
  },
  
  exportNotificationsCSV: () => {
    window.open(`${API_BASE_URL}/api/export-v2/notifications/csv`, '_blank');
  },
  
  exportNotificationsJSON: () => {
    window.open(`${API_BASE_URL}/api/export-v2/notifications/json`, '_blank');
  },
  
  // Helper function to trigger download with proper error handling
  downloadFile: async (url, filename) => {
    try {
      const response = await fetch(url, {
        headers: {
          ...authHeader()
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  }
};

// Dashboard statistics
export const StatsService = {
  getDashboardStats: async () => {
    try {
      // Use the dedicated stats API endpoint we fixed
      const response = await fetch(`${API_BASE_URL}/api/stats`, {
        headers: {
          ...authHeader()
        }
      });
      const data = await handleResponse(response);
      
      // Return the data from the backend
      return {
        totalStudents: data.totalStudents || 0,
        pendingFees: data.pendingFees || 0,
        totalRevenue: data.totalRevenue || 0,
        recentReminders: data.recentReminders || 0,
        dueStudentsTomorrow: data.dueStudentsTomorrow || []
      };
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      throw error;
    }
  }
};

export default {
  StudentService,
  FeeService,
  StatsService,
  ExportService
};
