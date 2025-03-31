const User = require('../models/User');
const Submission = require('../models/Submission');
const Problem = require('../models/Problem'); // Add this import

// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture,
      bio: user.bio,
      level: user.level,
      problemsSolved: user.problemsSolved,
      points: user.points,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, bio, profilePicture } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (bio) user.bio = bio;
    if (profilePicture) user.profilePicture = profilePicture;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      profilePicture: updatedUser.profilePicture,
      bio: updatedUser.bio,
      level: updatedUser.level,
      problemsSolved: updatedUser.problemsSolved,
      points: updatedUser.points
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete user account
// @route   DELETE /api/user/delete
// @access  Private
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.remove();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user stats
// @route   GET /api/user/stats
// @access  Private
exports.getUserStats = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get user submissions
    const submissions = await Submission.find({ user: userId });
    
    // Calculate stats
    const totalSubmissions = submissions.length;
    const acceptedSubmissions = submissions.filter(sub => sub.status === 'Accepted').length;
    const solvedProblems = new Set(submissions.filter(sub => sub.status === 'Accepted').map(sub => sub.problem.toString())).size;
    
    // Get difficulty breakdown
    const problemIds = submissions.map(sub => sub.problem);
    const problems = await Problem.find({ _id: { $in: problemIds } });
    
    const difficultyBreakdown = {
      Easy: 0,
      Medium: 0,
      Hard: 0
    };
    
    problems.forEach(problem => {
      if (submissions.some(sub => 
        sub.problem.toString() === problem._id.toString() && 
        sub.status === 'Accepted'
      )) {
        difficultyBreakdown[problem.difficulty]++;
      }
    });
    
    res.json({
      totalSubmissions,
      acceptedSubmissions,
      solvedProblems,
      successRate: totalSubmissions > 0 ? (acceptedSubmissions / totalSubmissions * 100).toFixed(2) : 0,
      difficultyBreakdown
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
