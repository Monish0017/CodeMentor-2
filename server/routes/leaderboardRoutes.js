const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/authMiddleware');
const {
  getLeaderboard,
  getUserRank,
  getUserStats
} = require('../controllers/leaderboardController');

// Public routes
router.get('/', getLeaderboard);

// Protected routes
router.get('/rank', isAuthenticated, getUserRank);
router.get('/stats', isAuthenticated, getUserStats);

module.exports = router;
