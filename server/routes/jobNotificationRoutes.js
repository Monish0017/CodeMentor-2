const express = require('express');
const router = express.Router();
const jobNotificationController = require('../controllers/jobNotificationController');
const { isAuthenticated } = require('../middlewares/authMiddleware');

// Public routes (if any)

// Protected routes
// Student routes
router.get('/', isAuthenticated, jobNotificationController.getStudentNotifications);
router.get('/:id', isAuthenticated, jobNotificationController.getJobNotificationById);
router.put('/:id/read', isAuthenticated, jobNotificationController.markAsRead);


module.exports = router;
