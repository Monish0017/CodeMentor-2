import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import { Platform, StyleSheet, View } from 'react-native';

// Define the App component before exporting
const App = () => {
  return (
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
  );
};

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

// Export the component directly
export default App;