const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/authMiddleware');
const {
  getProblems,
  getProblemById,
  submitSolution,
  runCode,
  getProblemSubmissions,
  getRecentChallenges,
  getUserProblemStats
} = require('../controllers/problemController');

// Public routes
router.get('/', isAuthenticated, getProblems);
// Important: Place specific routes before dynamic parameter routes
router.get('/recent', isAuthenticated, getRecentChallenges);
router.get('/stats', isAuthenticated, getUserProblemStats);
router.get('/:id', isAuthenticated, getProblemById);

// Protected routes (require authentication)
router.post('/:id/submit', isAuthenticated, submitSolution);
router.post('/:id/run', isAuthenticated, runCode);
router.get('/:id/submissions', isAuthenticated, getProblemSubmissions);

module.exports = router;
