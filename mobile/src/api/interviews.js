import api from './index';

export const getInterviewTypes = async () => {
  try {
    const response = await api.get('/api/interview/types');
    return { success: true, types: response.data.types };
  } catch (error) {
    console.error('Error fetching interview types:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to fetch interview types.' 
    };
  }
};

export const startInterview = async (type, difficulty) => {
  try {
    const response = await api.post('/api/interview/start', { type, difficulty });
    return { 
      success: true, 
      interviewId: response.data.interviewId,
      questions: response.data.questions
    };
  } catch (error) {
    console.error('Error starting interview:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to start interview.' 
    };
  }
};

export const getInterview = async (interviewId) => {
  try {
    const response = await api.get(`/api/interview/${interviewId}`);
    return { success: true, interview: response.data.interview };
  } catch (error) {
    console.error('Error fetching interview:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to fetch interview.' 
    };
  }
};

export const submitAnswer = async (interviewId, questionId, answer) => {
  try {
    const response = await api.post('/api/interview/submit', {
      interviewId,
      questionId,
      answer
    });
    
    return { 
      success: true, 
      feedback: response.data.feedback,
      score: response.data.score
    };
  } catch (error) {
    console.error('Error submitting answer:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to submit answer.' 
    };
  }
};

export const getInterviewFeedback = async (interviewId) => {
  try {
    const response = await api.post('/api/interview/feedback', { interviewId });
    return { success: true, feedback: response.data.feedback };
  } catch (error) {
    console.error('Error getting interview feedback:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to get interview feedback.' 
    };
  }
};

export const getRecentInterviews = async () => {
  try {
    const response = await api.get('/api/interview/recent');
    return { success: true, interviews: response.data.interviews };
  } catch (error) {
    console.error('Error fetching recent interviews:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to fetch recent interviews.' 
    };
  }
};