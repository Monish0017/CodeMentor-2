import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';

// Server URL configuration
const SERVERURL = 'http://localhost:5000';

const InterviewListScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('new'); // 'new' or 'history'
  const [pastInterviews, setPastInterviews] = useState([]);
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

  const fetchPastInterviews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await AsyncStorage.getItem('token');
      
      const response = await axios.get(`${SERVERURL}/api/interview/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setPastInterviews(response.data.interviews);
      } else {
        setError(response.data.message || 'Failed to fetch interview history');
      }
    } catch (err) {
      console.error('Error fetching interview history:', err);
      setError('Failed to load interview history. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchPastInterviews();
    }
  }, [activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'history') {
      await fetchPastInterviews();
    }
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

  const renderPastInterviews = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200EE" />
          <Text style={styles.loadingText}>Loading interview history...</Text>
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchPastInterviews}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    if (pastInterviews.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>You haven't completed any interviews yet</Text>
          <TouchableOpacity 
            style={styles.startButton}
            onPress={() => setActiveTab('new')}
          >
            <Text style={styles.startButtonText}>Start Your First Interview</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {pastInterviews.map((item) => (
          <TouchableOpacity 
            key={item._id} 
            style={styles.card}
            onPress={() => navigation.navigate('InterviewSession', { interviewId: item._id })}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.type} Interview</Text>
              <View style={[
                styles.difficultyBadge, 
                item.difficulty === 'Beginner' ? styles.easyBadge : 
                item.difficulty === 'Intermediate' ? styles.mediumBadge : 
                styles.hardBadge
              ]}>
                <Text style={styles.difficultyText}>{item.difficulty}</Text>
              </View>
            </View>
            <View style={styles.cardFooter}>
              <Text style={styles.cardMetadata}>Date: {new Date(item.createdAt).toLocaleDateString()}</Text>
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreText}>Score: {item.overallScore || 'N/A'}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Mock Interviews</Text>
        <Text style={styles.headerSubtitle}>Prepare with AI-powered mock interviews</Text>
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'new' && styles.activeTab]}
            onPress={() => setActiveTab('new')}
          >
            <Text style={[styles.tabText, activeTab === 'new' && styles.activeTabText]}>
              New Interview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'history' && styles.activeTab]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
              Past Interviews
            </Text>
          </TouchableOpacity>
        </View>

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
          {activeTab === 'new' ? renderInterviewSetup() : renderPastInterviews()}
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
  },
  header: {
    backgroundColor: '#6200EE',
    padding: 20,
    paddingBottom: 20,
    zIndex: 2,
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
    marginTop: -5,
    zIndex: 1,
  },
  listContainer: {
    padding: 16,
    paddingTop: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  easyBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  mediumBadge: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
  },
  hardBadge: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardMetadata: {
    fontSize: 14,
    color: '#888888',
  },
  startButton: {
    backgroundColor: '#6200EE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#757575',
  },
  errorContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    color: '#F44336',
    marginBottom: 8,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#6200EE',
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    margin: 16,
    marginTop: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#6200EE',
  },
  tabText: {
    fontWeight: '600',
    color: '#666666',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 16,
    textAlign: 'center',
  },
  scoreBadge: {
    backgroundColor: 'rgba(98, 0, 238, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6200EE',
  },
  setupForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 20,
    margin: 16,
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
  typeCardsContainer: {
    padding: 16,
  },
  typeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  typeIcon: {
    marginBottom: 16,
  },
  typeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  typeDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  difficultySection: {
    padding: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  difficultyCards: {
    flexDirection: 'column',
    gap: 12,
  },
  difficultyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedDifficultyCard: {
    borderColor: '#6200EE',
    backgroundColor: 'rgba(98, 0, 238, 0.05)',
  },
  difficultyLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  selectedDifficultyLabel: {
    color: '#6200EE',
  },
  difficultyDescription: {
    fontSize: 14,
    color: '#666666',
  },
});

export default InterviewListScreen;