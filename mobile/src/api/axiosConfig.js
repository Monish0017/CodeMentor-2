import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL for API requests
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Add request interceptor to include auth token with every request
api.interceptors.request.use(
  async (config) => {
    // Try to get the token from AsyncStorage
    const token = await AsyncStorage.getItem('userToken');
    
    // If token exists, add it to the Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for global error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle unauthorized errors (401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Clear stored tokens and user data
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      
      // You could redirect to login screen here or handle through context
      // For now, just reject the promise
      return Promise.reject(error);
    }
    
    return Promise.reject(error);
  }
);

export default api;
