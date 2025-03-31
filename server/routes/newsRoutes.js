const express = require('express');
const { 
  getNews,
  getJobs,
  getPromotions,
  createNews,
  fetchExternalNews 
} = require('../controllers/newsController');
const { isAuthenticated, isAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

// Routes
router.get('/', getNews);
router.get('/jobs', getJobs);
router.get('/promotions', getPromotions);
router.post('/', isAuthenticated, isAdmin, createNews);
router.post('/fetch', isAuthenticated, isAdmin, fetchExternalNews);

module.exports = router;
