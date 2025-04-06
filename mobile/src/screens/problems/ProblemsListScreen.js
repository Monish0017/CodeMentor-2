import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

const ProblemsListScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <MaterialIcons name="laptop" size={80} color="#6200EE" style={styles.icon} />
          
          <Text style={styles.title}>Coding Problems</Text>
          
          <Text style={styles.message}>
            For the best experience with our interactive code editor, please open this application in a web browser.
          </Text>
          
          <Text style={styles.details}>
            Our mobile app provides limited functionality for coding problems. Visit our website to:
          </Text>
          
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <MaterialIcons name="code" size={24} color="#6200EE" style={styles.featureIcon} />
              <Text style={styles.featureText}>Access our full interactive code editor</Text>
            </View>
            
            <View style={styles.featureItem}>
              <MaterialIcons name="assignment" size={24} color="#6200EE" style={styles.featureIcon} />
              <Text style={styles.featureText}>Solve and submit coding challenges</Text>
            </View>
            
            <View style={styles.featureItem}>
              <MaterialIcons name="assessment" size={24} color="#6200EE" style={styles.featureIcon} />
              <Text style={styles.featureText}>Test your solutions with our auto-grader</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Text style={styles.buttonText}>Return to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 18,
    color: '#333333',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 26,
  },
  details: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 24,
    textAlign: 'center',
  },
  featuresList: {
    alignSelf: 'stretch',
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  },
  button: {
    backgroundColor: '#6200EE',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProblemsListScreen;