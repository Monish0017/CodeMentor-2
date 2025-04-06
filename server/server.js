const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const connectDB = require('./config/db');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory');
}

// Load environment variables
dotenv.config();

// Validate environment variables
const validateEnv = require('./utils/validateEnv');
if (!validateEnv()) {
  console.error('Environment validation failed. Please check your .env file.');
  process.exit(1);
}

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Configure CORS middleware with more specific options
app.use(cors({
  origin: [
    'https://code-mentor-drab.vercel.app', // Your production frontend
    'http://localhost:3000',               // Local development frontend
    'http://127.0.0.1:3000'
  ],
  credentials: true,  // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(helmet());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Add request logging middleware - place this right after other middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// Expose CORS headers in the response
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Routes
const authRoutes = require('./routes/authRoutes');
const problemRoutes = require('./routes/problemRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const newsRoutes = require('./routes/newsRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const adminRoutes = require('./routes/adminRoutes'); 
const jobNotificationRoutes = require('./routes/jobNotificationRoutes'); // Add job notification routes

// API routes
app.use('/api/auth', authRoutes);
// Comment out this line since it creates a duplicate route
// app.use('/api/auth/google', googleAuthRoutes);
// Instead, if there's separate Google routes, mount them properly:
// app.use('/auth/google', googleAuthRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes); // Mount admin routes
app.use('/api/notifications/job', jobNotificationRoutes); // Mount job notification routes

// Add a catch-all route handler for debugging path issues
app.use((req, res, next) => {
  if (req.path.includes('/api/api/')) {
    console.log('Detected duplicate /api prefix in URL:', req.originalUrl);
    // Redirect to the correct path by removing one /api
    const correctedPath = req.originalUrl.replace('/api/api/', '/api/');
    return res.redirect(correctedPath);
  }
  next();
});

// Base route for API check
app.get('/', (req, res) => {
  res.json({
    message: 'CodeMentor API is running',
    endpoints: {
      auth: '/api/auth',
      user: '/api/user',
      problems: '/api/problems',
      code: '/api/code',
      interview: '/api/interview',
      stats: '/api/stats',
      forum: '/api/forum',
      collab: '/api/collab',
      news: '/api/news',
      notifications: '/api/notifications/job' // Add this line
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'An unexpected error occurred',
    error: err.message
  });
});

// Connect to MongoDB first, then start the server
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
    
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

module.exports = app;
