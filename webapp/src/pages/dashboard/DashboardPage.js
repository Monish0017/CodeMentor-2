import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './DashboardPage.css';

const SERVERURL = 'https://codementor-b244.onrender.com'

const DashboardPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recentChallenges, setRecentChallenges] = useState([]);
  const [recentInterviews, setRecentInterviews] = useState([]);
  const [isLoadingInterviews, setIsLoadingInterviews] = useState(false);
  const [interviewsError, setInterviewsError] = useState(null);
  const [isLoadingChallenges, setIsLoadingChallenges] = useState(false);
  const [challengesError, setChallengesError] = useState(null);
  const [userStats, setUserStats] = useState({
    problemsSolved: 0,
    interviewsCompleted: 0,
    rank: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState(null);

  useEffect(() => {
    // Load user data from localStorage instead of AuthContext
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token) {
      navigate('/auth/login');
      return;
    }
    
    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Fetch user stats
      fetchUserStats();
      
      // Fetch recent interviews and challenges
      fetchRecentInterviews();
      fetchRecentChallenges();
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/auth/login');
    }
    
    setIsLoading(false);
  }, [navigate]);

  const fetchUserStats = async () => {
    try {
      setIsLoadingStats(true);
      setStatsError(null);
      
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${SERVERURL}/api/leaderboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setUserStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
      setStatsError('Failed to load user stats. Please try again.');
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchRecentInterviews = async () => {
    try {
      setIsLoadingInterviews(true);
      setInterviewsError(null);
      
      const token = localStorage.getItem('token');
      
      // Real API call to fetch recent interviews
      const response = await axios.get(`${ SERVERURL }/api/interview/recent`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setRecentInterviews(response.data.interviews);
      }
    } catch (error) {
      console.error('Error fetching recent interviews:', error);
      setInterviewsError('Failed to load recent interviews. Please try again.');
    } finally {
      setIsLoadingInterviews(false);
    }
  };
  
  const fetchRecentChallenges = async () => {
    try {
      setIsLoadingChallenges(true);
      setChallengesError(null);
      
      const token = localStorage.getItem('token');
      
      // Real API call to fetch recent coding challenges
      const response = await axios.get(`${SERVERURL}/api/problems/recent`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setRecentChallenges(response.data.recentChallenges);
      }
    } catch (error) {
      console.error('Error fetching recent challenges:', error);
      setChallengesError('Failed to load recent challenges. Please try again.');
    } finally {
      setIsLoadingChallenges(false);
    }
  };
  
  // Helper function to format timestamps
  const formatTimestamp = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 60) {
      return diffMins <= 1 ? 'Just now' : `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    } else if (diffDays < 7) {
      return diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth/login');
  };
  
  const handleRefreshInterviews = () => {
    fetchRecentInterviews();
  };
  
  const handleRefreshChallenges = () => {
    fetchRecentChallenges();
  };
  
  const handleViewInterview = (interviewId) => {
    navigate(`/interview/${interviewId}`);
  };
  
  const handleViewProblem = (problemId) => {
    navigate(`/problems/${problemId}`);
  };

  const handleRefreshStats = () => {
    fetchUserStats();
  };

  if (isLoading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <p className="welcome-text">Welcome back, {user?.name || 'User'}!</p>
        </div>

        {/* Stats Cards */}
        <div className="stats-container">
          {isLoadingStats ? (
            <div className="loading-spinner-container">
              <div className="loading-spinner"></div>
            </div>
          ) : statsError ? (
            <div className="error-message">
              {statsError}
              <button onClick={handleRefreshStats} className="retry-button">Retry</button>
            </div>
          ) : (
            <>
              <div className="stats-card">
                <h2 className="stats-value">{userStats.problemsSolved}</h2>
                <p className="stats-label">Problems Solved</p>
              </div>
              <div className="stats-card">
                <h2 className="stats-value">{userStats.interviewsCompleted}</h2>
                <p className="stats-label">Interviews</p>
              </div>
              <div className="stats-card">
                <h2 className="stats-value">#{userStats.rank}</h2>
                <p className="stats-label">Ranking</p>
              </div>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="section">
          <h2 className="section-title">Quick Actions</h2>
          <div className="quick-actions">
            <div className="action-card" onClick={() => navigate('/problems')}>
              <div className="action-icon">📝</div>
              <h3 className="action-title">Solve Problem</h3>
            </div>
            <div className="action-card" onClick={() => navigate('/interview')}>
              <div className="action-icon">🤖</div>
              <h3 className="action-title">Start Interview</h3>
            </div>
            <div className="action-card" onClick={() => navigate('/leaderboard')}>
              <div className="action-icon">🏆</div>
              <h3 className="action-title">Leaderboard</h3>
            </div>
          </div>
        </div>

        {/* Recent Interviews Section */}
        <div className="section">
          <div className="interviews-header">
            <h2 className="section-title">Recent Interviews</h2>
          </div>
          
          {interviewsError && (
            <div className="error-message">
              {interviewsError}
              <button onClick={handleRefreshInterviews} className="retry-button">Retry</button>
            </div>
          )}
          
          {isLoadingInterviews && (
            <div className="loading-spinner-container">
              <div className="loading-spinner"></div>
            </div>
          )}
          
          {!isLoadingInterviews && recentInterviews.length === 0 ? (
            <div className="no-interviews">
              <p>You haven't taken any interviews yet.</p>
              <button onClick={() => navigate('/interview')} className="action-button">
                Start Your First Interview
              </button>
            </div>
          ) : (
            <div className="interviews-list">
              {recentInterviews.map(interview => (
                <div 
                  key={interview.id} 
                  className="interview-card"
                  onClick={() => handleViewInterview(interview.id)}
                >
                  <div className="interview-content">
                    <h3 className="interview-title">{interview.type} Interview</h3>
                    <div className="interview-details">
                      <span className={`difficulty-badge ${interview.difficulty.toLowerCase()}`}>
                        {interview.difficulty}
                      </span>
                      {interview.status === 'Completed' && (
                        <span className="score-badge">Score: {interview.score}/10</span>
                      )}
                    </div>
                    <p className="interview-time">{formatTimestamp(interview.date)}</p>
                  </div>
                  <div className="interview-status-icon">
                    {interview.status === 'Completed' ? '✓' : '⏱️'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Coding Challenges */}
        <div className="section">
          <div className="challenges-header">
            <h2 className="section-title">Recent Coding Challenges</h2>
          </div>
          
          {challengesError && (
            <div className="error-message">
              {challengesError}
              <button onClick={handleRefreshChallenges} className="retry-button">Retry</button>
            </div>
          )}
          
          {isLoadingChallenges && (
            <div className="loading-spinner-container">
              <div className="loading-spinner"></div>
            </div>
          )}
          
          {!isLoadingChallenges && recentChallenges.length === 0 ? (
            <div className="no-challenges">
              <p>You haven't solved any coding challenges yet.</p>
              <button onClick={() => navigate('/problems')} className="action-button">
                Solve Your First Challenge
              </button>
            </div>
          ) : (
            <div className="challenges-list">
              {recentChallenges.map(challenge => (
                <div 
                  key={challenge.id} 
                  className="challenge-card"
                  onClick={() => handleViewProblem(challenge.problemId)}
                >
                  <div className="challenge-icon">📝</div>
                  <div className="challenge-content">
                    <h3 className="challenge-title">{challenge.title}</h3>
                    <div className="challenge-details">
                      <span className={`difficulty-badge ${challenge.difficulty.toLowerCase()}`}>
                        {challenge.difficulty}
                      </span>
                      <span className={`status-badge ${challenge.status === 'Accepted' ? 'success' : 'failed'}`}>
                        {challenge.status}
                      </span>
                      <span className="language-badge">{challenge.language}</span>
                      {challenge.score && (
                        <span className="score-badge">Score: {challenge.score}/10</span>
                      )}
                    </div>
                    {challenge.executionTime > 0 && (
                      <p className="challenge-stats">
                        Time: {challenge.executionTime.toFixed(2)}s | Memory: {challenge.memory} KB
                      </p>
                    )}
                    <p className="challenge-time">{formatTimestamp(challenge.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
