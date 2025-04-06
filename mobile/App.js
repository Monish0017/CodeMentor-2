import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import { Platform, StyleSheet, View } from 'react-native';
import { ClerkProvider } from "@clerk/clerk-expo";
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

// Create a token cache for Clerk 
const tokenCache = {
  async getToken(key) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key, value) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

// Get the publishable key
const publishableKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || 
  "pk_test_dGVuZGVyLXZlcnZldC02MS5jbGVyay5hY2NvdW50cy5kZXYk";

export default function App() {
  return (
    <ClerkProvider 
      publishableKey={publishableKey}
      tokenCache={tokenCache}
      appearance={{
        variables: {
          colorPrimary: '#6200EE',
        }
      }}
    >
      <View style={styles.container}>
        <SafeAreaProvider>
          <ThemeProvider>
            <AuthProvider>
              <NavigationContainer>
                <AppNavigator />
              </NavigationContainer>
            </AuthProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </View>
    </ClerkProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Add web-specific styling to enable scrolling
    ...(Platform.OS === 'web' && {
      overflowY: 'auto',
      height: '100vh',
    }),
  },
});