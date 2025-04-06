import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';

// Server URL configuration
const SERVERURL = 'https://codementor-b244.onrender.com';

const InterviewListScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Interview setup states
  const [type, setType] = useState('Technical');
  const [difficulty, setDifficulty] = useState('Intermediate');
  
  const sampleInterviewTypes = [
    { id: 'technical', title: 'Technical Interview', description: 'Covers programming concepts, algorithms and data structures', icon: 'code' },
    { id: 'behavioral', title: 'Behavioral Interview', description: 'Focuses on soft skills, past experiences and problem-solving approach', icon: 'people' },
    { id: 'system-design', title: 'System Design Interview', description: 'Tests your ability to design scalable systems and architecture', icon: 'architecture' }
  ];
  
  const difficultyLevels = [
    { id: 'beginner', label: 'Beginner', description: 'For junior developers (0-1 years experience)' },
    { id: 'intermediate', label: 'Intermediate', description: 'For mid-level developers (2-4 years experience)' },
    { id: 'advanced', label: 'Advanced', description: 'For senior developers (5+ years experience)' }
  ];

  const onRefresh = () => {
    setRefreshing(true);
    setRefreshing(false);
  };

  const startInterview = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await AsyncStorage.getItem('token');
      
      const response = await axios.post(`${SERVERURL}/api/interview/start`, 
        { type, difficulty },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      if (response.data.success) {
        navigation.navigate('InterviewSession', { 
          interviewId: response.data.interviewId,
          questions: response.data.questions,
          type,
          difficulty
        });
      } else {
        Alert.alert("Error", response.data.message || "Failed to start interview");
      }
    } catch (err) {
      console.error('Error starting interview:', err);
      Alert.alert("Error", "Failed to start interview. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderInterviewSetup = () => {
    return (
      <View style={styles.setupForm}>
        <Text style={styles.setupTitle}>Start a New Interview</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Interview Type</Text>
          <View style={styles.optionsContainer}>
            {['Technical', 'Behavioral', 'System Design'].map((option) => (
              <TouchableOpacity 
                key={option}
                style={[
                  styles.optionButton, 
                  type === option && styles.selectedOptionButton
                ]}
                onPress={() => setType(option)}
              >
                <Text style={[
                  styles.optionText,
                  type === option && styles.selectedOptionText
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Difficulty</Text>
          <View style={styles.optionsContainer}>
            {['Beginner', 'Intermediate', 'Advanced'].map((option) => (
              <TouchableOpacity 
                key={option}
                style={[
                  styles.optionButton, 
                  difficulty === option && styles.selectedOptionButton
                ]}
                onPress={() => setDifficulty(option)}
              >
                <Text style={[
                  styles.optionText,
                  difficulty === option && styles.selectedOptionText
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.startInterviewButton}
          onPress={startInterview}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <MaterialIcons name="play-arrow" size={20} color="#FFFFFF" />
              <Text style={styles.startInterviewButtonText}>Start Interview</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Mock Interviews</Text>
        <Text style={styles.headerSubtitle}>Prepare with AI-powered mock interviews</Text>
      </View>
      
      <View style={styles.contentContainer}>
        <ScrollView 
          style={styles.mainScrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
            />
          }
        >
          {renderInterviewSetup()}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  mainScrollView: {
    flex: 1,
    ...(Platform.OS === 'web' && {
      overflowY: 'auto',
    }),
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 0, // Removed padding here to eliminate the gap
  },
  header: {
    backgroundColor: '#6200EE',
    padding: 20,
    paddingBottom: 20,

  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  setupForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 20,
    margin: 16,
    marginTop: 10, // Reduced top margin to minimize gap
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  setupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 20,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  optionButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    marginHorizontal: 4,
    backgroundColor: '#F5F5F5',
  },
  selectedOptionButton: {
    borderColor: '#6200EE',
    backgroundColor: 'rgba(98, 0, 238, 0.1)',
  },
  optionText: {
    color: '#666666',
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#6200EE',
    fontWeight: 'bold',
  },
  startInterviewButton: {
    backgroundColor: '#6200EE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 24,
  },
  startInterviewButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default InterviewListScreen;