import Constants from 'expo-constants';

// Helper function to get environment variables with proper fallbacks
export const getEnvVariable = (key, defaultValue = '') => {
  // First try to get from process.env (direct env or dotenv)
  if (process.env[key]) {
    return process.env[key];
  }
  
  // Then try to get from Constants
  if (Constants.expoConfig?.extra && key in Constants.expoConfig.extra) {
    return Constants.expoConfig.extra[key] || defaultValue;
  }
  
  // Fallback to default
  return defaultValue;
};

// Export common environment variables
export const API_URL = getEnvVariable('API_URL', 'https://codementor-b244.onrender.com');
export const GOOGLE_CLIENT_ID = getEnvVariable('GOOGLE_CLIENT_ID', '');
export const GOOGLE_ANDROID_CLIENT_ID = getEnvVariable('ANDROID_GOOGLE_CLIENT_ID', '');
export const GOOGLE_IOS_CLIENT_ID = getEnvVariable('IOS_GOOGLE_CLIENT_ID', '');
