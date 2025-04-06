import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useEffect } from 'react';

import DrawerNavigator from './DrawerNavigator';
import LandingScreen from '../screens/landing/LandingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import InterviewSessionScreen from '../screens/interview/InterviewSessionScreen';
import { useAuth } from '../context/AuthContext';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();

  if (authLoading) {
    // We might want to show a loading screen here
    return null;
  }

  return (
    <Stack.Navigator 
      screenOptions={{ headerShown: false }} 
      initialRouteName={isAuthenticated ? 'Main' : 'Landing'}
    >
      {!isAuthenticated ? (
        // Auth screens - Landing page is first
        <>
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        // Main app screens
        <>
          <Stack.Screen name="Main" component={DrawerNavigator} />
          <Stack.Screen name="InterviewSession" component={InterviewSessionScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;