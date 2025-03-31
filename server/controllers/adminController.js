const Admin = require('../models/Admin');
const User = require('../models/User');
const Problem = require('../models/Problem');
const JobNotification = require('../models/JobNotification');

/**
 * @desc   Register a new admin
 * @route  POST /api/admin/register
 * @access Public
 */
exports.register = async (req, res) => {
  try {
    const { name, email, phoneNo, password } = req.body;

    // Check if admin already exists
    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'Admin with this email already exists' 
      });
    }

    // Create new admin
    const admin = await Admin.create({
      name,
      email,
      phoneNo,
      password,
      role: 'admin'
    });

    // Generate JWT token
    const token = admin.getSignedJwtToken();

    res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      token
    });
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register admin',
      error: error.message
    });
  }
};

/**
 * @desc   Login admin
 * @route  POST /api/admin/login
 * @access Public
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for admin
    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    admin.lastLogin = Date.now();
    await admin.save();

    // Generate JWT token
    const token = admin.getSignedJwtToken();

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to login',
      error: error.message
    });
  }
};

/**
 * @desc   Get all users
 * @route  GET /api/admin/users
 * @access Private/Admin
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

/**
 * @desc   Delete a user
 * @route  DELETE /api/admin/users/:id
 * @access Private/Admin
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

/**
 * @desc   Insert a new problem
 * @route  POST /api/admin/problems
 * @access Private/Admin
 */
exports.insertProblem = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      difficulty, 
      category,
      examples,
      constraints,
      testCases,
      solution,
      hints,
      tags,
      companies,
      isPublic
    } = req.body;

    // Validate required fields
    if (!title || !description || !difficulty || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Validate examples
    if (!examples || !Array.isArray(examples) || examples.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one example with input and output'
      });
    }

    // Validate test cases
    if (!testCases || !Array.isArray(testCases) || testCases.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one test case with input and output'
      });
    }

    const problem = await Problem.create({
      title,
      description,
      difficulty,
      category,
      examples,
      constraints,
      testCases,
      solution,
      hints,
      tags,
      companies,
      isPublic,
      createdAt: Date.now()
    });

    res.status(201).json({
      success: true,
      message: 'Problem created successfully',
      data: problem
    });
  } catch (error) {
    console.error('Insert problem error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create problem',
      error: error.message
    });
  }
};

/**
 * @desc   Insert a new job notification
 * @route  POST /api/admin/jobs
 * @access Private/Admin
 */
exports.insertJobNotification = async (req, res) => {
  try {
    // Extract all required fields from request body
    const { title, company, description, requirements, location, salary, applicationLink } = req.body;
    
    // Validate required fields
    if (!title || !company) {
      return res.status(400).json({ message: 'Title and company are required fields' });
    }
    
    // Create the job notification with required fields
    const jobNotification = new JobNotification({
      title,
      company,
      description,
      requirements,
      location,
      salary,
      applicationLink,
      createdBy: req.user._id, // Assuming req.user contains the authenticated admin user
      createdAt: new Date()
    });

    const result = await jobNotification.save();
    
    res.status(201).json({
      success: true,
      message: 'Job notification created successfully',
      data: result
    });
  } catch (error) {
    console.warn('Insert job notification error:', error);
    res.status(500).json({ message: 'Failed to create job notification', error: error.message });
  }
};

/**
 * @desc   Get all problems
 * @route  GET /api/admin/problems
 * @access Private/Admin
 */
exports.getAllProblems = async (req, res) => {
  try {
    const problems = await Problem.find();

    res.status(200).json({
      success: true,
      count: problems.length,
      data: problems
    });
  } catch (error) {
    console.error('Get all problems error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch problems',
      error: error.message
    });
  }
};

/**
 * @desc   Delete a problem
 * @route  DELETE /api/admin/problems/:id
 * @access Private/Admin
 */
exports.deleteProblem = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }

    await Problem.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Problem deleted successfully'
    });
  } catch (error) {
    console.error('Delete problem error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete problem',
      error: error.message
    });
  }
};

/**
 * @desc   Get all job notifications
 * @route  GET /api/admin/jobs
 * @access Private/Admin
 */
exports.getAllJobNotifications = async (req, res) => {
  try {
    const jobNotifications = await JobNotification.find()
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: jobNotifications.length,
      data: jobNotifications
    });
  } catch (error) {
    console.error('Get all job notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job notifications',
      error: error.message
    });
  }
};

/**
 * @desc   Delete a job notification
 * @route  DELETE /api/admin/jobs/:id
 * @access Private/Admin
 */
exports.deleteJobNotification = async (req, res) => {
  try {
    const jobNotification = await JobNotification.findById(req.params.id);

    if (!jobNotification) {
      return res.status(404).json({
        success: false,
        message: 'Job notification not found'
      });
    }

    await JobNotification.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Job notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete job notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete job notification',
      error: error.message
    });
  }
};
