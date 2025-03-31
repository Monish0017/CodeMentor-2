const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getMe, 
  logout 
} = require('../controllers/authController');
const { isAuthenticated } = require('../middlewares/authMiddleware');
const { uploadProfilePicture } = require('../utils/multer');

// Add GET handler for register route to handle incorrect method
router.get('/register', (req, res) => {
  res.status(405).json({ 
    message: 'Method not allowed. Please use POST for registration.',
    required_fields: ['name', 'email', 'password']
  });
});

// Auth routes
router.post('/register', uploadProfilePicture, register);
router.post('/login', login);
router.get('/me', isAuthenticated, getMe);
router.get('/logout', logout);

// Add a root level redirect handler to fix potential URL inconsistencies
router.get('/', (req, res) => {
  res.json({ message: 'Auth API is working' });
});

module.exports = router;
