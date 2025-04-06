import api from './index';
import AsyncStorage from '@react-native-async-storage/async-storage';

const APP_URL = "http://localhost:5000"

export const login = async (email, password) => {
  try {
    const response = await api.post(`${APP_URL}/api/auth/login`, { email, password });
    
    // Store auth data
    await AsyncStorage.setItem('userToken', response.data.token);
    await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    
    return { success: true, user: response.data.user };
  } catch (error) {
    console.error('Login error:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || 'Login failed. Please check your credentials and try again.' 
    };
  }
};

export const register = async (userData) => {
  try {
    const response = await api.post(`${APP_URL}/api/auth/register`, userData);
    
    // Store auth data
    await AsyncStorage.setItem('userToken', response.data.token);
    await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    
    return { success: true, user: response.data.user };
  } catch (error) {
    console.error('Registration error:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || 'Registration failed. Please try again.' 
    };
  }
};

export const googleAuth = async (googleData, isRegistration = false) => {
  try {
    // Based on whether this is login or registration
    const endpoint = isRegistration ? `${APP_URL}/api/auth/register` : `${APP_URL}/api/auth/login`;
    
    // Prepare data for API request
    const data = isRegistration ? {
      name: googleData.name,
      email: googleData.email,
      googleId: googleData.id,
      profilePicture: googleData.picture,
      authType: 'google'
    } : {
      email: googleData.email,
      googleId: googleData.id,
      authType: 'google'
    };
    
    const response = await api.post(endpoint, data);
    
    // Store auth data
    await AsyncStorage.setItem('userToken', response.data.token);
    await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    
    return { success: true, user: response.data.user };
  } catch (error) {
    console.error('Google auth error:', error);
    
    // Check if this is a "user doesn't exist" error - need to register
    if (!isRegistration && error.response?.status === 401) {
      return {
        success: false,
        error: 'Google account not registered. Please sign up first.',
        needsRegistration: true,
        googleData
      };
    }
    
    return { 
      success: false, 
      error: error.response?.data?.message || 'Google authentication failed. Please try again.' 
    };
  }
};

export const logout = async () => {
  try {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('user');
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: 'Failed to logout. Please try again.' };
  }
};