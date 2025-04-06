import api from './index';

export const getJobNotifications = async () => {
  try {
    const response = await api.get('/api/notifications/job');
    return { success: true, notifications: response.data.data };
  } catch (error) {
    console.error('Error fetching job notifications:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to fetch job notifications.' 
    };
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await api.put(`/api/notifications/job/${notificationId}/read`);
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to mark notification as read.' 
    };
  }
};

export const getGeneralNotifications = async () => {
  try {
    const response = await api.get('/api/notifications/general');
    return { success: true, notifications: response.data.notifications };
  } catch (error) {
    console.error('Error fetching general notifications:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to fetch general notifications.' 
    };
  }
};
