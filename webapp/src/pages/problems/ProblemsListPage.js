import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ProblemsListPage.css';

const SERVERURL = 'https://codementor-b244.onrender.com'


const ProblemsListPage = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const fetchProblems = async () => {
    setLoading(true);
    try {
      // Build query parameters for server-side filtering
      const params = {};
      if (selectedDifficulty !== 'All') {
        params.difficulty = selectedDifficulty;
      }
      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await axios.get(`${SERVERURL}/api/problems`, { 
        params,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setProblems(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching problems:', err);
      setError('Failed to fetch problems. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search to prevent too many API calls
    const timer = setTimeout(() => {
      fetchProblems();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [selectedDifficulty, searchQuery]);

  const handleProblemClick = (problemId) => {
    navigate(`/problems/${problemId}`);
  };

  return (
    <div className="problems-container">
      <div className="problems-header">
        <h1>Coding Problems</h1>
        <p>Practice with these problems to improve your coding skills</p>
      </div>
      
      <div className="problems-filters">
        <div className="search-box">
          <input 
            type="text" 
            placeholder="Search problems..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="difficulty-filters">
          <button 
            className={`filter-button ${selectedDifficulty === 'All' ? 'active' : ''}`}
            onClick={() => setSelectedDifficulty('All')}
          >
            All
          </button>
          <button 
            className={`filter-button ${selectedDifficulty === 'Easy' ? 'active' : ''}`}
            onClick={() => setSelectedDifficulty('Easy')}
          >
            Easy
          </button>
          <button 
            className={`filter-button ${selectedDifficulty === 'Medium' ? 'active' : ''}`}
            onClick={() => setSelectedDifficulty('Medium')}
          >
            Medium
          </button>
          <button 
            className={`filter-button ${selectedDifficulty === 'Hard' ? 'active' : ''}`}
            onClick={() => setSelectedDifficulty('Hard')}
          >
            Hard
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="loading-problems">Loading problems...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="problems-list">
          <div className="problems-table-header">
            <div className="problem-title-header">Title</div>
            <div className="problem-difficulty-header">Difficulty</div>
            <div className="problem-acceptance-header">Acceptance</div>
            <div className="problem-status-header">Status</div>
          </div>
          
          {problems.length === 0 ? (
            <div className="no-problems">No problems found matching your criteria.</div>
          ) : (
            problems.map(problem => (
              <div 
                key={problem._id} 
                className="problem-item"
                onClick={() => handleProblemClick(problem._id)}
              >
                <div className="problem-title">
                  <h3>{problem.title}</h3>
                  <div className="problem-tags">
                    {problem.tags && problem.tags.map((tag, index) => (
                      <span key={index} className="problem-tag">{tag}</span>
                    ))}
                    {(problem.solved || problem.isSolved) && (
                      <span className="problem-tag solved-tag">✅ Solved</span>
                    )}
                  </div>
                </div>
                
                <div className={`problem-difficulty ${problem.difficulty.toLowerCase()}`}>
                  {problem.difficulty}
                </div>
                
                <div className="problem-acceptance">
                  {problem.acceptance}%
                </div>
                
                <div className="problem-status">
                  {(problem.solved || problem.isSolved) ? (
                    <span className="solved">Solved</span>
                  ) : (
                    <button className="solve-button">Solve</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ProblemsListPage;
