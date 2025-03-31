const JobNotification = require('../models/JobNotification');
const User = require('../models/User'); // Assuming you have a User model

// Create a new job notification (admin only)
exports.createJobNotification = async (req, res) => {
  try {
    const { title, description, company, location, applicationLink, salary, expiresAt } = req.body;
    
    if (!title || !description || !company) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, and company'
      });
    }

    const notification = new JobNotification({
      title,
      description,
      company,
      location: location || 'Remote',
      applicationLink,
      salary,
      createdBy: req.user.id,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    });

    await notification.save();

    res.status(201).json({
      success: true,
      message: 'Job notification created successfully',
      data: notification
    });
  } catch (error) {
    console.error('Error creating job notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create job notification',
      error: error.message
    });
  }
};

// Get all job notifications
exports.getAllJobNotifications = async (req, res) => {
  try {
    const notifications = await JobNotification.find({ isActive: true })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    console.error('Error fetching job notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job notifications',
      error: error.message
    });
  }
};

// Get notifications for current student with read status
exports.getStudentNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await JobNotification.find({ isActive: true })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email');

    // Add read status for each notification
    const notificationsWithReadStatus = notifications.map(notification => {
      const notificationObj = notification.toObject();
      const readStatus = notification.readBy.find(item => item.user.toString() === userId);
      notificationObj.isRead = !!readStatus;
      notificationObj.readAt = readStatus ? readStatus.readAt : null;
      return notificationObj;
    });

    res.status(200).json({
      success: true,
      count: notificationsWithReadStatus.length,
      data: notificationsWithReadStatus
    });
  } catch (error) {
    console.error('Error fetching student notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student notifications',
      error: error.message
    });
  }
};

// Get a single job notification by ID
exports.getJobNotificationById = async (req, res) => {
  try {
    const notification = await JobNotification.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Job notification not found'
      });
    }

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error fetching job notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job notification',
      error: error.message
    });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;

    const notification = await JobNotification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Job notification not found'
      });
    }

    // Check if user has already read this notification
    const alreadyRead = notification.readBy.some(item => item.user.toString() === userId);

    if (!alreadyRead) {
      notification.readBy.push({ user: userId, readAt: new Date() });
      await notification.save();
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
};

// Update a job notification (admin only)
exports.updateJobNotification = async (req, res) => {
  try {
    const { title, description, company, location, applicationLink, salary, isActive, expiresAt } = req.body;
    
    const notification = await JobNotification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Job notification not found'
      });
    }

    // Update fields
    if (title) notification.title = title;
    if (description) notification.description = description;
    if (company) notification.company = company;
    if (location) notification.location = location;
    if (applicationLink !== undefined) notification.applicationLink = applicationLink;
    if (salary !== undefined) notification.salary = salary;
    if (isActive !== undefined) notification.isActive = isActive;
    if (expiresAt) notification.expiresAt = new Date(expiresAt);

    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Job notification updated successfully',
      data: notification
    });
  } catch (error) {
    console.error('Error updating job notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update job notification',
      error: error.message
    });
  }
};

// Delete a job notification (admin only)
exports.deleteJobNotification = async (req, res) => {
  try {
    const notification = await JobNotification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Job notification not found'
      });
    }

    await JobNotification.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Job notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting job notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete job notification',
      error: error.message
    });
  }
};
