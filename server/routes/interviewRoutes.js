const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/authMiddleware');
const interviewController = require('../controllers/interviewController');

// Protected routes - require authentication
router.post('/start', isAuthenticated, interviewController.startInterview);
router.post('/submit', isAuthenticated, interviewController.submitAnswer);
router.post('/feedback', isAuthenticated, interviewController.saveFeedback);
router.get('/recent', isAuthenticated, interviewController.getRecentInterviews);
router.get('/stats', isAuthenticated, interviewController.getUserInterviewStats);
router.get('/:id', isAuthenticated, interviewController.getInterview);

module.exports = router;
