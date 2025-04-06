import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './LeaderboardPage.css';

const SERVERURL = 'https://codementor-b244.onrender.com';

const LeaderboardPage = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeFrame, setTimeFrame] = useState('weekly'); // 'weekly', 'monthly', 'allTime'
  const [userRank, setUserRank] = useState(null);
  
  useEffect(() => {
    fetchLeaderboard();
    fetchUserRank();
  }, [timeFrame]);
  
  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${SERVERURL}/api/leaderboard?timeFrame=${timeFrame}`);
      
      if (response.data.success) {
        setLeaderboardData(response.data.leaderboard);
      } else {
        setError('Failed to fetch leaderboard data');
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to fetch leaderboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchUserRank = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return;
      }
      
      const response = await axios.get(
        `${SERVERURL}/api/leaderboard/rank?timeFrame=${timeFrame}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setUserRank(response.data);
      }
    } catch (err) {
      console.error('Error fetching user rank:', err);
      // Not setting error here to still show the leaderboard even if user rank fails
    }
  };
  
  const getTimeFrameLabel = () => {
    switch (timeFrame) {
      case 'weekly': return 'This Week';
      case 'monthly': return 'This Month';
      case 'allTime': return 'All Time';
      default: return 'Leaderboard';
    }
  };
  
  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h1>Leaderboard</h1>
        
        <div className="time-filter">
          <button 
            className={`filter-btn ${timeFrame === 'weekly' ? 'active' : ''}`}
            onClick={() => setTimeFrame('weekly')}
          >
            Weekly
          </button>
          <button 
            className={`filter-btn ${timeFrame === 'monthly' ? 'active' : ''}`}
            onClick={() => setTimeFrame('monthly')}
          >
            Monthly
          </button>
          <button 
            className={`filter-btn ${timeFrame === 'allTime' ? 'active' : ''}`}
            onClick={() => setTimeFrame('allTime')}
          >
            All Time
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="loading-leaderboard">Loading leaderboard data...</div>
      ) : error ? (
        <div className="error-message">
          {error}
          <button onClick={fetchLeaderboard} className="retry-button">Retry</button>
        </div>
      ) : (
        <>
          {userRank && (
            <div className="user-rank-card">
              <div className="user-rank">Your Rank: #{userRank.rank}</div>
              <div className="user-score">Score: {userRank.score}</div>
              <div className="user-problems">Problems Solved: {userRank.problems}</div>
            </div>
          )}
          
          <div className="leaderboard-table">
            <div className="leaderboard-table-header">
              <div className="rank-column">Rank</div>
              <div className="name-column">Name</div>
              <div className="problems-column">Problems</div>
              <div className="score-column">Score</div>
            </div>
            
            <div className="leaderboard-table-body">
              {leaderboardData.length === 0 ? (
                <div className="no-data-message">
                  No data available for {getTimeFrameLabel().toLowerCase()} leaderboard.
                </div>
              ) : (
                leaderboardData.map((user) => (
                  <div 
                    key={user.id} 
                    className={`leaderboard-row ${userRank && user.id === userRank.id ? 'current-user' : ''}`}
                  >
                    <div className="rank-column">
                      {user.rank <= 3 ? (
                        <div className={`trophy rank-${user.rank}`}>
                          {user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : '🥉'}
                        </div>
                      ) : (
                        <span>{user.rank}</span>
                      )}
                    </div>
                    <div className="name-column">{user.name}</div>
                    <div className="problems-column">{user.problems}</div>
                    <div className="score-column">{user.score}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LeaderboardPage;
