import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/environment.js';

// Create axios instance with base configuration
const authApi = axios.create({
  baseURL: `${API_BASE_URL}/auth`,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add interceptor to include auth token in requests
authApi.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Register a new user
export const registerUser = async (userData) => {
  try {
    const response = await authApi.post('/register', userData);
    
    // Store token and user data
    if (response.data.token) {
      await AsyncStorage.setItem('userToken', response.data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data));
    }
    
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data;
    } else {
      throw { message: 'Network error. Please check your connection.' };
    }
  }
};

// Login user with email and password
export const loginUser = async (credentials) => {
  try {
    const response = await authApi.post('/login', credentials);
    
    // Store token and user data
    if (response.data.token) {
      await AsyncStorage.setItem('userToken', response.data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data));
    }
    
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data;
    } else {
      throw { message: 'Network error. Please check your connection.' };
    }
  }
};

// Google OAuth login
export const googleLogin = async (idToken) => {
  try {
    const response = await authApi.post('/google', { idToken });
    
    // Store token and user data
    if (response.data.token) {
      await AsyncStorage.setItem('userToken', response.data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
    }
    
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data;
    } else {
      throw { message: 'Network error. Please check your connection.' };
    }
  }
};

// Logout user
export const logoutUser = async () => {
  try {
    // Clear stored data
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
    
    return { success: true };
  } catch (error) {
    throw { message: 'Error during logout process.' };
  }
};

// Get current user data
export const getCurrentUser = async () => {
  try {
    const response = await authApi.get('/me');
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response.data;
    } else {
      throw { message: 'Network error. Please check your connection.' };
    }
  }
};