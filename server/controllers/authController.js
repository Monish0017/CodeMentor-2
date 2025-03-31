const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { uploadImage, uploadImageFromUrl } = require('../utils/cloudinary');

/**
 * Generate JWT token
 * @param {Object} user - User object
 * @returns {String} JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role || 'user' },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
const register = async (req, res) => {
  try {
    const { name, email, password, googleId, profilePicture, authType } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Please provide name and email' });
    }

    // For regular registration, password is required
    if (authType !== 'google' && !password) {
      return res.status(400).json({ message: 'Please provide a password' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // If user exists and is trying to log in with Google
      if (authType === 'google' && googleId) {
        // Update Google ID if needed
        if (existingUser.google_id !== googleId) {
          existingUser.google_id = googleId;
        }
        
        // Upload and update profile picture if provided
        if (profilePicture) {
          try {
            const uploadResult = await uploadImageFromUrl(profilePicture);
            existingUser.profile_picture = uploadResult.secure_url;
          } catch (uploadError) {
            console.error('Error uploading Google profile picture:', uploadError);
            // Continue with the existing picture if upload fails
          }
        }
        
        existingUser.last_login = new Date();
        await existingUser.save();
        
        const token = generateToken(existingUser);
        
        return res.status(200).json({
          success: true,
          token,
          user: {
            _id: existingUser._id,
            name: existingUser.name,
            email: existingUser.email,
            role: existingUser.role,
            profile_picture: existingUser.profile_picture
          }
        });
      }
      
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create a new user
    const userData = {
      name,
      email,
      date_joined: new Date(),
      last_login: new Date(),
      authType: authType || 'local'
    };

    // Handle profile picture upload
    if (req.file) {
      try {
        const uploadResult = await uploadImage(req.file.path);
        userData.profile_picture = uploadResult.secure_url;
      } catch (uploadError) {
        console.error('Error uploading profile picture:', uploadError);
        // Continue without profile picture if upload fails
      }
    }

    // Add Google-specific fields if present
    if (authType === 'google') {
      userData.google_id = googleId;
      
      // Upload Google profile picture to Cloudinary for backup
      if (profilePicture) {
        try {
          const uploadResult = await uploadImageFromUrl(profilePicture);
          userData.profile_picture = uploadResult.secure_url;
        } catch (uploadError) {
          console.error('Error uploading Google profile picture:', uploadError);
          // Continue with the original URL if upload fails
          userData.profile_picture = profilePicture;
        }
      }
    } else {
      // Hash password for regular users
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(password, salt);
    }

    const user = new User(userData);
    await user.save();

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile_picture: user.profile_picture
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
const login = async (req, res) => {
  try {
    const { email, password, googleId, profilePicture, authType } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Please provide email' });
    }

    const user = await User.findOne({ email }).select('+password +google_id');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Handle Google login
    if (authType === 'google') {
      if (!googleId) {
        return res.status(400).json({ message: 'Google ID is required for Google login' });
      }
      
      // If user doesn't have a Google ID or it doesn't match
      if (!user.google_id && user.authType !== 'google') {
        return res.status(401).json({ 
          message: 'This email is registered with password. Please use password to login.'
        });
      }
      
      // Update Google ID if needed
      if (user.google_id !== googleId) {
        user.google_id = googleId;
      }
      
      // Upload and update Google profile picture if provided
      if (profilePicture) {
        try {
          const uploadResult = await uploadImageFromUrl(profilePicture);
          user.profile_picture = uploadResult.secure_url;
        } catch (uploadError) {
          console.error('Error uploading Google profile picture on login:', uploadError);
          // Continue with the existing picture if upload fails
        }
      }
    } else {
      // Regular password login
      if (!password) {
        return res.status(400).json({ message: 'Please provide password' });
      }
      
      // If account is Google-only
      if (user.authType === 'google' && !user.password) {
        return res.status(401).json({ 
          message: 'This account uses Google Sign-In. Please login with Google.'
        });
      }
      
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    }

    // Update last login time
    user.last_login = new Date();
    await user.save();

    const token = generateToken(user);
    res.status(200).json({
      success: true,
      token,
      user: { 
        _id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        profile_picture: user.profile_picture
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get current user profile
 * @route GET /api/auth/me
 * @access Private
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile_picture: user.profile_picture,
        date_joined: user.date_joined,
        last_login: user.last_login
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Logout user
 * @route   GET /api/auth/logout
 * @access  Private
 */
const logout = (req, res) => {
  // For JWT authentication, the client is responsible for removing the token
  // The server simply acknowledges the logout request
  res.status(200).json({ message: 'Logged out successfully' });
};

// Export all functions as a single object
module.exports = {
  register,
  login,
  getMe,
  logout
};
