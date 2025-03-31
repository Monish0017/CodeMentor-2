const User = require('../models/User');

// @desc    Get leaderboard data
// @route   GET /api/leaderboard
// @access  Public
exports.getLeaderboard = async (req, res) => {
  try {
    const timeFrame = req.query.timeFrame || 'allTime';
    const limit = parseInt(req.query.limit) || 10;
    
    // Build query based on time frame
    const query = {};
    
    if (timeFrame === 'weekly') {
      // Get date from 7 days ago
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      query.lastActivityDate = { $gte: weekAgo };
    } else if (timeFrame === 'monthly') {
      // Get date from 30 days ago
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      query.lastActivityDate = { $gte: monthAgo };
    }
    
    // Find users with highest scores
    const users = await User.find(query)
      .sort({ score: -1 })
      .limit(limit)
      .select('name profile_picture score solvedProblems completedInterviews');
    
    // Format data for response
    const leaderboardData = users.map((user, index) => ({
      id: user._id,
      rank: index + 1,
      name: user.name,
      profilePicture: user.profile_picture,
      score: user.score,
      problems: user.solvedProblems.length,
      interviews: user.completedInterviews.length
    }));
    
    res.json({
      success: true,
      timeFrame,
      leaderboard: leaderboardData
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard data',
      error: error.message
    });
  }
};

// @desc    Get current user's rank
// @route   GET /api/leaderboard/rank
// @access  Private
exports.getUserRank = async (req, res) => {
  try {
    const timeFrame = req.query.timeFrame || 'allTime';
    
    // Build query based on time frame
    const query = {};
    
    if (timeFrame === 'weekly') {
      // Get date from 7 days ago
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      query.lastActivityDate = { $gte: weekAgo };
    } else if (timeFrame === 'monthly') {
      // Get date from 30 days ago
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      query.lastActivityDate = { $gte: monthAgo };
    }
    
    // Get current user's score
    const currentUser = await User.findById(req.user._id)
      .select('score solvedProblems completedInterviews');
    
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Count users with higher score
    const higherScoreCount = await User.countDocuments({
      ...query,
      score: { $gt: currentUser.score }
    });
    
    // User's rank is higherScoreCount + 1
    const rank = higherScoreCount + 1;
    
    res.json({
      success: true,
      rank,
      score: currentUser.score,
      problems: currentUser.solvedProblems.length,
      interviews: currentUser.completedInterviews.length
    });
  } catch (error) {
    console.error('Error getting user rank:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user rank',
      error: error.message
    });
  }
};

// @desc    Get user stats for dashboard
// @route   GET /api/leaderboard/stats
// @access  Private
exports.getUserStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('score streak solvedProblems completedInterviews lastActivityDate');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get user's rank
    const higherScoreCount = await User.countDocuments({
      score: { $gt: user.score }
    });
    
    // Calculate streak (simplified logic)
    let streak = user.streak;
    const lastActivityDate = new Date(user.lastActivityDate);
    const today = new Date();
    
    // Check if last activity was yesterday or today to maintain streak
    const dayDifference = Math.floor((today - lastActivityDate) / (1000 * 60 * 60 * 24));
    if (dayDifference > 1) {
      // Reset streak if more than a day passed since last activity
      streak = 0;
      await User.findByIdAndUpdate(req.user._id, { streak: 0 });
    }
    
    res.json({
      success: true,
      stats: {
        score: user.score,
        rank: higherScoreCount + 1,
        problemsSolved: user.solvedProblems.length,
        interviewsCompleted: user.completedInterviews.length,
        streak
      }
    });
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user stats',
      error: error.message
    });
  }
};
