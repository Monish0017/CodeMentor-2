import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerUser, loginUser, logoutUser, googleLogin } from '../api/auth';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);

  // Add Google Auth configuration
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: Constants.manifest.extra.googleClientId, // Make sure to add this to app.config.js or app.json
    androidClientId: Constants.manifest.extra.androidClientId,
    iosClientId: Constants.manifest.extra.iosClientId,
  });

  useEffect(() => {
    // Check if user is already logged in
    const bootstrapAsync = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const user = await AsyncStorage.getItem('userData');
        
        if (token) {
          setUserToken(token);
          setUserData(user ? JSON.parse(user) : null);
        }
      } catch (e) {
        console.error('Failed to load auth state:', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const signIn = async (email, password) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await loginUser({ email, password });
      setUserToken(response.token);
      setUserData(response);
      return { success: true };
    } catch (e) {
      setError(e.message || 'An error occurred during login');
      return { 
        success: false, 
        error: e.message || 'An error occurred during login'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (name, email, password) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await registerUser({ name, email, password });
      setUserToken(response.token);
      setUserData(response);
      return { success: true };
    } catch (e) {
      setError(e.message || 'An error occurred during registration');
      return { 
        success: false, 
        error: e.message || 'An error occurred during registration'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await logoutUser();
      setUserToken(null);
      setUserData(null);
    } catch (e) {
      // Still clear state even if API call fails
      setUserToken(null);
      setUserData(null);
      setError(e.message || 'An error occurred during logout');
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await promptAsync();
      
      if (result.type === 'success') {
        const { authentication } = result;
        const idToken = authentication.idToken;
        
        const response = await googleLogin(idToken);
        setUserToken(response.token);
        setUserData(response);
        return { success: true };
      } else {
        return { 
          success: false, 
          error: 'Google sign-in was cancelled or failed'
        };
      }
    } catch (e) {
      setError(e.message || 'An error occurred during Google login');
      return { 
        success: false, 
        error: e.message || 'An error occurred during Google login'
      };
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isLoading, 
        userToken, 
        userData, 
        error,
        signIn, 
        signUp,
        signOut,
        signInWithGoogle
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};