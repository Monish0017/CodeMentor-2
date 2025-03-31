const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');

/**
 * Middleware to check if user is authenticated
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const isAuthenticated = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } 
    // Check if token exists in query params (for OAuth redirects)
    else if (req.query && req.query.token) {
      token = req.query.token;
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    // Verify token with specific error handling
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Log successful token verification
      console.log(`Token verified for user ID: ${decoded.id}`);
    } catch (tokenError) {
      console.error('Token verification error:', tokenError.name, tokenError.message);
      
      if (tokenError.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token signature', error: tokenError.name });
      } else if (tokenError.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token has expired', error: tokenError.name });
      } else {
        return res.status(401).json({ message: 'Token validation failed', error: tokenError.name });
      }
    }

    // Get user from token
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

/**
 * Middleware to check if admin is authenticated
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const isAdminAuthenticated = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } 
    // Check if token exists in query params (for OAuth redirects)
    else if (req.query && req.query.token) {
      token = req.query.token;
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log(`Admin token verified for ID: ${decoded.id}`);
    } catch (tokenError) {
      console.error('Token verification error:', tokenError.name, tokenError.message);
      
      if (tokenError.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token signature', error: tokenError.name });
      } else if (tokenError.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token has expired', error: tokenError.name });
      } else {
        return res.status(401).json({ message: 'Token validation failed', error: tokenError.name });
      }
    }

    // Get admin from token
    const admin = await Admin.findById(decoded.id).select('-password');

    if (!admin) {
      return res.status(401).json({ message: 'Not authorized, admin not found' });
    }

    // Check if the user is actually an admin
    if (admin.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized, requires admin role' });
    }

    req.user = admin;
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

/**
 * Middleware to check if user is admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as admin' });
  }
};

/**
 * Middleware to check if user is accessing their own data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const isOwner = (req, res, next) => {
  const userId = req.params.userId || req.body.userId;
  
  // Fixed comparison to handle string/ObjectId comparison properly
  if (req.user.id.toString() === userId.toString() || req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied. You can only access your own data' });
  }
};

module.exports = {
  isAuthenticated,
  isAdminAuthenticated,
  isAdmin,
  isOwner
};
