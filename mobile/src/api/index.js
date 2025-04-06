import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base API URL - should be in .env in a real app
export const API_URL = 'http://localhost:5000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 seconds timeout
});

// Add request interceptor to attach auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 errors (could implement token refresh here)
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Token is invalid or expired
      // In a complete implementation, we'd try to refresh the token here
      // For now, just logout the user
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('user');
      // Could dispatch a logout action here if using Redux
    }
    
    return Promise.reject(error);
  }
);

// Authentication APIs
export const authAPI = {
  login: async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Login failed' };
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post('/api/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Registration failed' };
    }
  },

  loginWithGoogle: async (googleData) => {
    try {
      const response = await api.post('/api/auth/login', {
        email: googleData.email,
        googleId: googleData.id,
        authType: 'google'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Google login failed' };
    }
  },

  registerWithGoogle: async (googleData) => {
    try {
      const response = await api.post('/api/auth/register', {
        name: googleData.name,
        email: googleData.email,
        googleId: googleData.id,
        profilePicture: googleData.picture,
        authType: 'google'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Google registration failed' };
    }
  }
};

// Dashboard APIs
export const dashboardAPI = {
  getUserStats: async () => {
    try {
      const response = await api.get('/api/leaderboard/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch user stats' };
    }
  },

  getRecentInterviews: async () => {
    try {
      const response = await api.get('/api/interview/recent');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch recent interviews' };
    }
  },

  getRecentChallenges: async () => {
    try {
      const response = await api.get('/api/problems/recent');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch recent challenges' };
    }
  }
};

// Leaderboard APIs
export const leaderboardAPI = {
  getLeaderboard: async (timeFrame = 'weekly') => {
    try {
      const response = await api.get(`/api/leaderboard?timeFrame=${timeFrame}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch leaderboard' };
    }
  },

  getUserRank: async (timeFrame = 'weekly') => {
    try {
      const response = await api.get(`/api/leaderboard/rank?timeFrame=${timeFrame}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch user rank' };
    }
  }
};

// Interview APIs
export const interviewAPI = {
  startInterview: async (type, difficulty) => {
    try {
      const response = await api.post('/api/interview/start', { type, difficulty });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to start interview' };
    }
  },

  getInterview: async (interviewId) => {
    try {
      const response = await api.get(`/api/interview/${interviewId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch interview' };
    }
  },

  submitAnswer: async (interviewId, questionId, answer) => {
    try {
      const response = await api.post('/api/interview/submit', {
        interviewId,
        questionId,
        answer
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to submit answer' };
    }
  },

  getInterviewFeedback: async (interviewId) => {
    try {
      const response = await api.post('/api/interview/feedback', { interviewId });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get interview feedback' };
    }
  }
};

// Notification APIs
export const notificationAPI = {
  getJobNotifications: async () => {
    try {
      const response = await api.get('/api/notifications/job');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch job notifications' };
    }
  },

  markAsRead: async (notificationId) => {
    try {
      const response = await api.put(`/api/notifications/job/${notificationId}/read`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to mark notification as read' };
    }
  }
};

export default api;