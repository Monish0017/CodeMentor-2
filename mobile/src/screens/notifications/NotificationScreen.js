import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Linking, ActivityIndicator, RefreshControl } from 'react-native';
import ProfileAvatar from '../../components/common/ProfileAvatar';
import * as notificationAPI from '../../api/notifications';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Server URL configuration - similar to webapp
const SERVERURL = 'http://localhost:5000'; // Change this to your actual backend URL for production

// Direct API calls to backend
const notificationDirectApi = {
  getJobNotifications: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${SERVERURL}/api/notifications/job`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        return { success: true, notifications: response.data.data };
      } else {
        return { success: false, error: response.data.message || 'Failed to fetch notifications' };
      }
    } catch (error) {
      console.error('Error fetching job notifications:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to load notifications' 
      };
    }
  },
  
  markNotificationAsRead: async (notificationId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.put(`${SERVERURL}/api/notifications/job/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        return { success: true };
      } else {
        return { success: false, error: response.data.message || 'Failed to mark notification as read' };
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to update notification' 
      };
    }
  }
};

const NotificationScreen = () => {
  const [jobNotifications, setJobNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Direct API call to backend
      const response = await notificationDirectApi.getJobNotifications();
      
      if (response.success) {
        setJobNotifications(response.notifications || []);
      } else {
        setError(response.error);
        // Use sample data as fallback
        setJobNotifications([
          {
            id: '1',
            company: 'Google',
            position: 'Frontend Developer',
            location: 'Mountain View, CA',
            posted: '2 hours ago',
            salary: '$120K - $150K',
            read: false,
            url: 'https://careers.google.com',
          },
          {
            id: '2',
            company: 'Microsoft',
            position: 'Full Stack Engineer',
            location: 'Redmond, WA',
            posted: '1 day ago',
            salary: '$110K - $140K',
            read: false,
            url: 'https://careers.microsoft.com',
          },
          {
            id: '3',
            company: 'Amazon',
            position: 'Software Development Engineer',
            location: 'Seattle, WA',
            posted: '2 days ago',
            salary: '$115K - $155K',
            read: true,
            url: 'https://amazon.jobs',
          },
        ]);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load job notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
  };

  const markAsRead = async (id) => {
    try {
      // Direct API call to backend
      const response = await notificationDirectApi.markNotificationAsRead(id);
      
      if (response.success) {
        setJobNotifications(prev => 
          prev.map(job => job.id === id ? {...job, read: true} : job)
        );
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const openJobListing = (job) => {
    if (!job.read) {
      markAsRead(job.id);
    }
    
    if (job.url) {
      Linking.openURL(job.url).catch(err => 
        console.error('Failed to open URL:', err)
      );
    }
  };

  const renderJobItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.jobItem,
        !item.read && styles.unreadJob
      ]}
      onPress={() => openJobListing(item)}
    >
      <View style={styles.companyLogoContainer}>
        <ProfileAvatar name={item.company} size={46} />
      </View>
      
      <View style={styles.jobContent}>
        <Text style={styles.companyName}>{item.company}</Text>
        <Text style={styles.positionTitle}>{item.position}</Text>
        <View style={styles.jobMetaContainer}>
          <Text style={styles.jobLocation}>📍 {item.location}</Text>
          {item.salary && <Text style={styles.jobSalary}>💰 {item.salary}</Text>}
        </View>
        <Text style={styles.postedTime}>Posted: {item.posted}</Text>
      </View>
      
      {!item.read && <View style={styles.unreadIndicator} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Job Notifications</Text>
        <Text style={styles.headerSubtitle}>
          Latest opportunities tailored for you
        </Text>
      </View>
      
      <View style={styles.contentContainer}>
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6200EE" />
            <Text style={styles.loadingText}>Loading job notifications...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchNotifications}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : jobNotifications.length > 0 ? (
          <FlatList
            data={jobNotifications}
            renderItem={renderJobItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.jobsList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No job notifications yet</Text>
            <Text style={styles.emptySubtext}>
              We'll notify you when relevant job opportunities become available
            </Text>
          </View>
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
    zIndex: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  contentContainer: {
    flex: 1,
    marginTop: -15,
    zIndex: 1,
  },
  jobsList: {
    padding: 16,
    paddingTop: 20,
  },
  jobItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  unreadJob: {
    borderLeftWidth: 4,
    borderLeftColor: '#6200EE',
  },
  companyLogoContainer: {
    marginRight: 16,
  },
  jobContent: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  positionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6200EE',
    marginBottom: 8,
  },
  jobMetaContainer: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  jobLocation: {
    fontSize: 14,
    color: '#666666',
    marginRight: 12,
  },
  jobSalary: {
    fontSize: 14,
    color: '#666666',
  },
  postedTime: {
    fontSize: 12,
    color: '#999999',
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6200EE',
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999999',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#6200EE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default NotificationScreen;