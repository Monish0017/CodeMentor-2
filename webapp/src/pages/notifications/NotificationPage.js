import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { format } from 'date-fns';
import './NotificationPage.css';

const SERVERURL = 'https://codementor-b244.onrender.com'

const NotificationPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${SERVERURL}/api/notifications/job`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setNotifications(response.data.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications. Please try again later.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Refresh notifications every 5 minutes
    const interval = setInterval(() => {
      fetchNotifications();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id) => {
    try {
      await axios.put(`/api/notifications/job/${id}/read`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Update local state to mark notification as read
      setNotifications(prevNotifications => 
        prevNotifications.map(notif => 
          notif._id === id ? { ...notif, isRead: true } : notif
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleViewDetails = (id) => {
    // Mark as read when viewing details
    if (!notifications.find(n => n._id === id).isRead) {
      markAsRead(id);
    }
    // Implement navigation to details page or show modal
    // For now, we'll just open the application link if available
    const notification = notifications.find(n => n._id === id);
    if (notification.applicationLink) {
      window.open(notification.applicationLink, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="notification-loading">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p>Loading notifications...</p>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <div className="notification-container">
      <div className="notification-header">
        <h2>Job Notifications</h2>
      </div>
      
      {notifications.length === 0 ? (
        <div className="no-notifications">
          <h4>No job notifications available</h4>
          <p>Check back later for new job opportunities.</p>
        </div>
      ) : (
        <div className="notification-list">
          {notifications.map((notification) => (
            <Card 
              key={notification._id} 
              className={`notification-card ${!notification.isRead ? 'unread' : 'read'}`}
            >
              <Card.Body>
                <div className="notification-header-inner">
                  <Card.Title>{notification.title}</Card.Title>
                  {!notification.isRead && (
                    <Badge bg="primary" pill>New</Badge>
                  )}
                </div>
                <Card.Subtitle className="mb-2 text-muted">
                  {notification.company} • {notification.location}
                </Card.Subtitle>
                <Card.Text className="notification-description">
                  {notification.description}
                </Card.Text>
                {notification.salary && (
                  <Card.Text className="notification-salary">
                    Salary: {notification.salary}
                  </Card.Text>
                )}
                <div className="notification-footer">
                  <small className="text-muted">
                    Posted: {format(new Date(notification.createdAt), 'MMM dd, yyyy')}
                  </small>
                  {notification.expiresAt && (
                    <small className="text-danger">
                      Expires: {format(new Date(notification.expiresAt), 'MMM dd, yyyy')}
                    </small>
                  )}
                </div>
                <div className="notification-actions">
                  <Button 
                    variant="primary" 
                    onClick={() => handleViewDetails(notification._id)}
                  >
                    View Details
                  </Button>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}
      <Button 
        variant="primary" 
        className="refresh-button"
        onClick={fetchNotifications}
      >
        Refresh Notifications
      </Button>
    </div>
  );
};

export default NotificationPage;
