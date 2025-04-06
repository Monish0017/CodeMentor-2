import api from './index';

export const getLeaderboard = async (timeFrame = 'weekly') => {
  try {
    const response = await api.get(`/api/leaderboard?timeFrame=${timeFrame}`);
    return { success: true, leaderboard: response.data.leaderboard };
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to fetch leaderboard data.' 
    };
  }
};

export const getUserRank = async (timeFrame = 'weekly') => {
  try {
    const response = await api.get(`/api/leaderboard/rank?timeFrame=${timeFrame}`);
    return { 
      success: true, 
      rank: response.data.rank,
      score: response.data.score,
      problems: response.data.problems,
      id: response.data.id
    };
  } catch (error) {
    console.error('Error fetching user rank:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to fetch user ranking.' 
    };
  }
};

export const getUserStats = async () => {
  try {
    const response = await api.get('/api/leaderboard/stats');
    return { success: true, stats: response.data.stats };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to fetch user statistics.' 
    };
  }
};
