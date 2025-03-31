import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Get authentication headers
const getConfig = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

// Fetch all problems with optional filters
export const fetchProblems = async (filters = {}) => {
  try {
    // Build query string from filters
    const queryParams = new URLSearchParams();
    if (filters.difficulty && filters.difficulty !== 'All') {
      queryParams.append('difficulty', filters.difficulty);
    }
    if (filters.search) {
      queryParams.append('search', filters.search);
    }
    if (filters.tags) {
      queryParams.append('tags', filters.tags);
    }
    
    const queryString = queryParams.toString();
    const url = `${API_URL}/problems${queryString ? `?${queryString}` : ''}`;
    
    const response = await axios.get(url, getConfig());
    return response.data;
  } catch (error) {
    console.error('Error fetching problems:', error);
    throw error;
  }
};

// Fetch a specific problem by ID
export const fetchProblemById = async (problemId) => {
  try {
    const response = await axios.get(`${API_URL}/problems/${problemId}`, getConfig());
    return response.data.problem;
  } catch (error) {
    console.error(`Error fetching problem ${problemId}:`, error);
    throw error;
  }
};

// Run code without submitting
export const runCode = async (problemId, code, language, input = null) => {
  try {
    const response = await axios.post(
      `${API_URL}/problems/${problemId}/run`,
      { code, language, input },
      getConfig()
    );
    return response.data.result;
  } catch (error) {
    console.error('Error running code:', error);
    throw error;
  }
};

// Submit a solution for evaluation
export const submitSolution = async (problemId, code, language) => {
  try {
    const response = await axios.post(
      `${API_URL}/problems/${problemId}/submit`,
      { code, language },
      getConfig()
    );
    return response.data;
  } catch (error) {
    console.error('Error submitting solution:', error);
    throw error;
  }
};

// Get user's submissions for a problem
export const fetchProblemSubmissions = async (problemId) => {
  try {
    const response = await axios.get(
      `${API_URL}/problems/${problemId}/submissions`,
      getConfig()
    );
    return response.data.submissions;
  } catch (error) {
    console.error('Error fetching submissions:', error);
    throw error;
  }
};
