import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { dashboardAPI } from '../../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Server URL configuration - similar to webapp
const SERVERURL = 'http://localhost:5000'; // Change this to your actual backend URL for production

// Direct API calls to backend
const dashboardDirectApi = {
  getUserStats: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${SERVERURL}/api/leaderboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        return { success: true, stats: response.data.stats };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch stats' };
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to load user stats' 
      };
    }
  },
  
  getRecentInterviews: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${SERVERURL}/api/interview/recent`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        return { success: true, interviews: response.data.interviews };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch interviews' };
      }
    } catch (error) {
      console.error('Error fetching recent interviews:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to load interviews' 
      };
    }
  },
  
  getRecentChallenges: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${SERVERURL}/api/problems/recent`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        return { success: true, recentChallenges: response.data.recentChallenges };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch challenges' };
      }
    } catch (error) {
      console.error('Error fetching recent challenges:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to load challenges' 
      };
    }
  }
};

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    problemsSolved: 0,
    interviewsCompleted: 0,
    streak: 0,
    rank: 0
  });
  const [recentInterviews, setRecentInterviews] = useState([]);
  const [recentChallenges, setRecentChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch user stats - direct API call
      const statsResponse = await dashboardDirectApi.getUserStats();
      if (statsResponse.success) {
        setStats(statsResponse.stats);
      } else {
        console.error('Failed to fetch stats:', statsResponse.error);
      }
      
      // Fetch recent interviews - direct API call
      const interviewsResponse = await dashboardDirectApi.getRecentInterviews();
      if (interviewsResponse.success) {
        setRecentInterviews(interviewsResponse.interviews);
      } else {
        console.error('Failed to fetch interviews:', interviewsResponse.error);
      }
      
      // Fetch recent challenges - direct API call
      const challengesResponse = await dashboardDirectApi.getRecentChallenges();
      if (challengesResponse.success) {
        setRecentChallenges(challengesResponse.recentChallenges);
      } else {
        console.error('Failed to fetch challenges:', challengesResponse.error);
      }
      
      // If all requests failed, set a general error
      if (!statsResponse.success && !interviewsResponse.success && !challengesResponse.success) {
        setError('Failed to load dashboard data. Please try again.');
        
        // Use sample data as fallback
        setStats({
          problemsSolved: 25,
          interviewsCompleted: 8,
          streak: 7,
          rank: 42
        });
        
        // Sample recent activities (as fallback)
        setRecentActivities([
          { id: '1', type: 'problem', title: 'Two Sum', difficulty: 'Easy', timestamp: '2 hours ago' },
          { id: '2', type: 'interview', title: 'Frontend Interview', score: '85%', timestamp: 'Yesterday' },
          { id: '3', type: 'problem', title: 'Valid Parentheses', difficulty: 'Medium', timestamp: '3 days ago' },
          { id: '4', type: 'interview', title: 'Data Structures Interview', score: '92%', timestamp: 'Last week' },
        ]);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
      
      // Use sample data as fallback
      setStats({
        problemsSolved: 25,
        interviewsCompleted: 8,
        streak: 7,
        rank: 42
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  // Format timestamp for display
  const formatTimestamp = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 60) {
      return diffMins <= 1 ? 'Just now' : `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    } else if (diffDays < 7) {
      return diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Merge interviews and problems for activity feed
  const recentActivities = [
    ...recentInterviews.map(interview => ({
      id: interview.id,
      type: 'interview',
      title: `${interview.type} Interview`,
      difficulty: interview.difficulty,
      score: interview.score,
      timestamp: interview.date
    })),
    ...recentChallenges.map(challenge => ({
      id: challenge.id,
      type: 'problem',
      title: challenge.title,
      difficulty: challenge.difficulty,
      timestamp: challenge.timestamp
    }))
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <View style={styles.container}>
      {/* Header Section - styled like leaderboard */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.welcomeText}>Welcome back, {user?.name || 'User'}!</Text>
      </View>
      
      {/* Content Section - with negative margin to overlap header */}
      <View style={styles.contentContainer}>
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6200EE" />
            <Text style={styles.loadingText}>Loading dashboard data...</Text>
          </View>
        ) : (
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={fetchDashboardData}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {/* Stats Cards */}
            <View style={styles.statsContainer}>
              <View style={styles.statsCard}>
                <Text style={styles.statsValue}>{stats.problemsSolved}</Text>
                <Text style={styles.statsLabel}>Problems Solved</Text>
              </View>
              <View style={styles.statsCard}>
                <Text style={styles.statsValue}>{stats.interviewsCompleted}</Text>
                <Text style={styles.statsLabel}>Interviews</Text>
              </View>
              <View style={styles.statsCard}>
                <Text style={styles.statsValue}>{stats.streak}</Text>
                <Text style={styles.statsLabel}>Day Streak</Text>
              </View>
              <View style={styles.statsCard}>
                <Text style={styles.statsValue}>#{stats.rank}</Text>
                <Text style={styles.statsLabel}>Ranking</Text>
              </View>
            </View>
            
            {/* Quick Actions */}
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionContainer}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigation.navigate('Problems')}
              >
                <Text style={styles.actionIcon}>📝</Text>
                <Text style={styles.actionText}>Solve Problem</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigation.navigate('Interview')}
              >
                <Text style={styles.actionIcon}>🤖</Text>
                <Text style={styles.actionText}>Start Interview</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigation.navigate('Leaderboard')}
              >
                <Text style={styles.actionIcon}>🏆</Text>
                <Text style={styles.actionText}>Leaderboard</Text>
              </TouchableOpacity>
            </View>
            
            {/* Recent Activity */}
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {recentActivities.length === 0 ? (
              <View style={styles.emptyActivityContainer}>
                <Text style={styles.emptyActivityText}>No recent activity</Text>
                <Text style={styles.emptyActivitySubtext}>Try solving a problem or taking an interview</Text>
              </View>
            ) : (
              recentActivities.map((activity) => (
                <TouchableOpacity 
                  key={activity.id} 
                  style={styles.activityCard}
                  onPress={() => {
                    if (activity.type === 'problem') {
                      navigation.navigate('ProblemDetail', { problemId: activity.id });
                    } else {
                      navigation.navigate('InterviewSession', { interviewId: activity.id });
                    }
                  }}
                >
                  <View style={styles.activityIconContainer}>
                    <Text style={styles.activityIcon}>
                      {activity.type === 'problem' ? '📝' : '🤖'}
                    </Text>
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <View style={styles.activityMetaRow}>
                      <Text style={[
                        styles.difficultyBadge,
                        activity.difficulty === 'Easy' ? styles.easyBadge : 
                        activity.difficulty === 'Medium' ? styles.mediumBadge : 
                        styles.hardBadge
                      ]}>
                        {activity.difficulty}
                      </Text>
                      {activity.score && (
                        <Text style={styles.scoreBadge}>Score: {activity.score}</Text>
                      )}
                    </View>
                    <Text style={styles.activityTime}>{formatTimestamp(activity.timestamp)}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#6200EE',
    padding: 20,
    paddingBottom: 30,
    zIndex: 2, // Ensure the header appears above the list
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  contentContainer: {
    flex: 1,
    marginTop: -15, // Create overlap with header like in leaderboard
    zIndex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 20, // Extra padding to ensure first item is fully visible
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    width: '48%',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6200EE',
    marginBottom: 8,
  },
  statsLabel: {
    fontSize: 14,
    color: '#666666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
    marginTop: 8,
  },
  quickActionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    width: '31%',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(98, 0, 238, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activityIcon: {
    fontSize: 20,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  activityMeta: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#999999',
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
    padding: 16,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 8,
    marginBottom: 16,
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
  activityMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    fontSize: 12,
    marginRight: 8,
    overflow: 'hidden',
  },
  easyBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    color: '#4CAF50',
  },
  mediumBadge: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    color: '#FFC107',
  },
  hardBadge: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    color: '#F44336',
  },
  scoreBadge: {
    fontSize: 12,
    color: '#6200EE',
  },
  emptyActivityContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  emptyActivityText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  emptyActivitySubtext: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
  },
});

export default DashboardScreen;