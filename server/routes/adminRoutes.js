const express = require('express');
const router = express.Router();
const { isAdminAuthenticated } = require('../middlewares/authMiddleware');
const {
  register,
  login,
  getAllUsers,
  deleteUser,
  insertProblem,
  insertJobNotification,
  getAllProblems,
  deleteProblem,
  getAllJobNotifications,
  deleteJobNotification
} = require('../controllers/adminController');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected admin routes
router.use(isAdminAuthenticated);

// User management routes
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);

// Problem management routes
router.post('/problems', insertProblem);
router.get('/problems', getAllProblems);
router.delete('/problems/:id', deleteProblem);

// Job notification routes
router.post('/job', insertJobNotification);
router.get('/jobs', getAllJobNotifications);
router.delete('/jobs/:id', deleteJobNotification);

module.exports = router;
