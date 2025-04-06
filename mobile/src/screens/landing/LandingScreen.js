import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const LandingScreen = ({ navigation }) => {
  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.background, { backgroundColor: '#6200EE' }]}>
          <View style={styles.content}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>CodeMentor</Text>
              <Text style={styles.tagline}>Ace your technical interviews</Text>
            </View>

            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <View style={styles.featureIconContainer}>
                  <MaterialIcons name="code" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.featureTextContainer}>
                  <Text style={styles.featureTitle}>Practice Coding Problems</Text>
                  <Text style={styles.featureDescription}>Solve hundreds of curated problems with detailed explanations</Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <View style={styles.featureIconContainer}>
                  <MaterialIcons name="person" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.featureTextContainer}>
                  <Text style={styles.featureTitle}>AI Interview Prep</Text>
                  <Text style={styles.featureDescription}>Get feedback from AI-powered mock interviews</Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <View style={styles.featureIconContainer}>
                  <MaterialIcons name="trending-up" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.featureTextContainer}>
                  <Text style={styles.featureTitle}>Track Progress</Text>
                  <Text style={styles.featureDescription}>Monitor your improvement with detailed analytics</Text>
                </View>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
              >
                <Text style={styles.loginButtonText}>Log In</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.registerButton}
                onPress={handleRegister}
              >
                <Text style={styles.registerButtonText}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    ...(Platform.OS === 'web' && {
      overflowY: 'auto',
    }),
  },
  scrollContent: {
    flexGrow: 1,
  },
  background: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  featuresList: {
    marginVertical: 40,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 24,
    alignItems: 'center',
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  buttonContainer: {
    marginBottom: 32,
  },
  loginButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  loginButtonText: {
    color: '#6200EE',
    fontWeight: 'bold',
    fontSize: 16,
  },
  registerButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default LandingScreen;