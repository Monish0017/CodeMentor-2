import api from './index';

export const getProblems = async (filters = {}) => {
  try {
    // Convert filters to query string
    const queryParams = new URLSearchParams();
    if (filters.difficulty) queryParams.append('difficulty', filters.difficulty);
    if (filters.tags && filters.tags.length) queryParams.append('tags', filters.tags.join(','));
    if (filters.search) queryParams.append('search', filters.search);
    
    const response = await api.get(`/api/problems?${queryParams}`);
    return { success: true, problems: response.data.problems };
  } catch (error) {
    console.error('Error fetching problems:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to fetch problems.' 
    };
  }
};

export const getProblem = async (problemId) => {
  try {
    const response = await api.get(`/api/problems/${problemId}`);
    return { success: true, problem: response.data.problem };
  } catch (error) {
    console.error('Error fetching problem:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to fetch problem details.' 
    };
  }
};

export const submitSolution = async (problemId, solution, language) => {
  try {
    const response = await api.post('/api/problems/submit', {
      problemId,
      solution,
      language
    });
    
    return { 
      success: true, 
      result: response.data.result,
      executionTime: response.data.executionTime,
      memory: response.data.memory,
      status: response.data.status
    };
  } catch (error) {
    console.error('Error submitting solution:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to submit solution.' 
    };
  }
};

export const runTestCases = async (problemId, solution, language) => {
  try {
    const response = await api.post('/api/problems/test', {
      problemId,
      solution,
      language
    });
    
    return { 
      success: true, 
      results: response.data.results
    };
  } catch (error) {
    console.error('Error running test cases:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to run test cases.' 
    };
  }
};

export const getRecentChallenges = async () => {
  try {
    const response = await api.get('/api/problems/recent');
    return { success: true, recentChallenges: response.data.recentChallenges };
  } catch (error) {
    console.error('Error fetching recent challenges:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to fetch recent challenges.' 
    };
  }
};