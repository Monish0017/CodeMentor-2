import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Button, Paper, Typography, Box, CircularProgress, 
  Container, Grid, Card, CardContent, TextField, FormControl,
  InputLabel, Select, MenuItem, Divider, Alert, List, ListItem,
  ListItemText
} from '@mui/material';
import Mic from '@mui/icons-material/Mic';
import MicOff from '@mui/icons-material/MicOff';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Stop from '@mui/icons-material/Stop';
import Assessment from '@mui/icons-material/Assessment';
import QuestionAnswer from '@mui/icons-material/QuestionAnswer';
import Check from '@mui/icons-material/Check';
import ThumbUp from '@mui/icons-material/ThumbUp';
import Lightbulb from '@mui/icons-material/Lightbulb';
import TipsAndUpdates from '@mui/icons-material/TipsAndUpdates';
import StarIcon from '@mui/icons-material/Star';
import ErrorIcon from '@mui/icons-material/Error';
import TimerIcon from '@mui/icons-material/Timer';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import axios from 'axios';
import './InterviewPage.css'; // Import the CSS file

const SERVERURL = 'https://codementor-b244.onrender.com';

// Timer component to display elapsed time
const Timer = ({ isRunning }) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(prevTime => prevTime + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const formatTime = (timeInSeconds) => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = timeInSeconds % 60;
    
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0')
    ].join(':');
  };

  return (
    <div className="timer-display">
      <TimerIcon fontSize="small" className="timer-icon" />
      <span>{formatTime(elapsedTime)}</span>
    </div>
  );
};

// Helper function to parse feedback text
const parseFeedback = (feedbackText) => {
  if (!feedbackText) return { score: 0, sections: [] };
  
  // Extract score
  const scoreMatch = feedbackText.match(/Score:\s*(\d+)\/10/);
  const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
  
  // Split the feedback into sections
  let sections = [];
  
  // Check for strengths section
  if (feedbackText.includes("Strengths:")) {
    const strengthsMatch = feedbackText.match(/\*\*Strengths:\*\*(.*?)(?=\*\*Areas for Improvement:|$)/s);
    if (strengthsMatch && strengthsMatch[1]) {
      const strengthsList = strengthsMatch[1].split('*').filter(item => 
        item.trim() !== '' && !item.includes('Strengths:') && !item.includes('Areas for Improvement:')
      ).map(item => item.trim());
      
      sections.push({
        type: 'strengths',
        title: 'Strengths',
        items: strengthsList.filter(Boolean)
      });
    }
  }
  
  // Check for improvement areas
  if (feedbackText.includes("Areas for Improvement:")) {
    const improvementMatch = feedbackText.match(/\*\*Areas for Improvement:\*\*(.*?)(?=\*\*Overall:|$)/s);
    if (improvementMatch && improvementMatch[1]) {
      const improvementList = improvementMatch[1].split('*').filter(item => 
        item.trim() !== '' && !item.includes('Areas for Improvement:') && !item.includes('Overall:')
      ).map(item => item.trim());
      
      sections.push({
        type: 'improvements',
        title: 'Areas for Improvement',
        items: improvementList.filter(Boolean)
      });
    }
  }
  
  // Check for overall assessment
  if (feedbackText.includes("Overall:")) {
    const overallMatch = feedbackText.match(/\*\*Overall:\*\*(.*)/s);
    if (overallMatch && overallMatch[1]) {
      sections.push({
        type: 'overall',
        title: 'Overall',
        content: overallMatch[1].trim()
      });
    }
  }
  
  // If we couldn't extract structured sections, use the whole text
  if (sections.length === 0) {
    // Try to break it into paragraphs at least
    const paragraphs = feedbackText.split('\n\n').filter(Boolean);
    
    if (paragraphs.length > 1) {
      sections.push({
        type: 'general',
        title: 'Feedback',
        paragraphs: paragraphs
      });
    } else {
      sections.push({
        type: 'general',
        title: 'Feedback',
        content: feedbackText
      });
    }
  }
  
  return { score, sections };
};

// Component to render parsed feedback
const FormattedFeedback = ({ feedbackText }) => {
  const { score, sections } = parseFeedback(feedbackText);
  
  return (
    <div className="feedback-content">
      {sections.map((section, index) => (
        <div key={index}>
          {section.type === 'strengths' && (
            <div className="feedback-section">
              <h4 className="feedback-section-title">
                <ThumbUp fontSize="small" style={{ marginRight: '8px', color: '#4caf50' }} />
                {section.title}
              </h4>
              <ul>
                {section.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          
          {section.type === 'improvements' && (
            <div className="feedback-suggestions">
              <h4>
                <TipsAndUpdates fontSize="small" style={{ marginRight: '8px' }} />
                {section.title}
              </h4>
              <ul>
                {section.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          
          {section.type === 'overall' && (
            <div className="feedback-overall">
              <h4 className="feedback-overall-title">
                <StarIcon fontSize="small" style={{ marginRight: '8px' }} />
                {section.title}
              </h4>
              <p>{section.content}</p>
            </div>
          )}
          
          {section.type === 'general' && (
            <div className="feedback-general">
              <h4 className="feedback-section-title">{section.title}</h4>
              {section.paragraphs ? 
                section.paragraphs.map((para, idx) => <p key={idx}>{para}</p>) :
                <p>{section.content}</p>
              }
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const InterviewPage = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams(); // Get sessionId from URL parameters
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token) {
      navigate('/auth/login');
      return;
    }
    
    try {
      setUser(JSON.parse(userData));
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/auth/login');
    }
    
    setIsLoading(false);
  }, [navigate]);

  useEffect(() => {
    // Clean up timer on component unmount
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const [type, setType] = useState('Technical');
  const [difficulty, setDifficulty] = useState('Intermediate');
  
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [interview, setInterview] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [answerFeedback, setAnswerFeedback] = useState(null);
  const [finalFeedback, setFinalFeedback] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (sessionId) {
      fetchInterview(sessionId);
    }
  }, [sessionId]);
  
  const fetchInterview = async (id) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.get(`${SERVERURL}/api/interview/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data.success) {
        setInterview(response.data.interview);
        setIsSessionActive(true);
        
        if (response.data.interview.questions) {
          setQuestions(response.data.interview.questions.map(q => ({
            id: q._id,
            question: q.question,
            studentAnswer: q.studentAnswer,
            feedback: q.feedback,
            score: q.questionScore
          })));
        }
        
        if (response.data.interview.status === 'Completed') {
          setFinalFeedback(response.data.interview.feedback);
        }
      }
    } catch (err) {
      console.error('Error fetching interview:', err);
      setError('Failed to load interview. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const startInterview = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.post(`${SERVERURL}/api/interview/start`, 
        { type, difficulty }, 
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      
      if (response.data.success) {
        const formattedQuestions = response.data.questions.map(q => ({
          id: q._id || q.id,
          question: q.question,
          studentAnswer: q.studentAnswer || '',
          feedback: q.feedback || '',
          score: q.questionScore || 0
        }));
        
        setQuestions(formattedQuestions);
        setInterview({ 
          _id: response.data.interviewId, 
          type, 
          difficulty,
          status: 'In Progress' 
        });
        setIsSessionActive(true);
        setCurrentQuestionIndex(0);
        setCurrentAnswer('');
        setAnswerFeedback(null);
        setFinalFeedback(null);
        
        // Start the timer
        setElapsedTime(0);
        setTimerRunning(true);
        timerIntervalRef.current = setInterval(() => {
          setElapsedTime(prevTime => prevTime + 1);
        }, 1000);
      }
    } catch (err) {
      console.error('Error starting interview:', err);
      setError('Failed to start interview. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const submitAnswer = async () => {
    try {
      if (!currentAnswer.trim()) {
        setError('Please provide an answer before submitting');
        return;
      }
      
      setLoading(true);
      setError('');
      
      const currentQuestion = questions[currentQuestionIndex];
      
      const response = await axios.post(`${SERVERURL}/api/interview/submit`, {
        interviewId: interview._id,
        questionId: currentQuestion.id,
        answer: currentAnswer
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data.success) {
        const updatedQuestions = [...questions];
        updatedQuestions[currentQuestionIndex] = {
          ...updatedQuestions[currentQuestionIndex],
          studentAnswer: currentAnswer,
          feedback: response.data.feedback,
          score: response.data.score
        };
        
        setQuestions(updatedQuestions);
        setAnswerFeedback({
          score: response.data.score,
          feedback: response.data.feedback
        });
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
      setError('Failed to submit answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentAnswer('');
      setAnswerFeedback(null);
    }
  };
  
  const completeInterview = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Stop timer
      setTimerRunning(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      
      const response = await axios.post(`${SERVERURL}/api/interview/feedback`, {
        interviewId: interview._id,
        timeSpent: elapsedTime // Send elapsed time to server
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data.success) {
        setFinalFeedback({
          ...response.data.feedback,
          timeSpent: elapsedTime // Store time spent in feedback
        });
      }
    } catch (err) {
      console.error('Error completing interview:', err);
      setError('Failed to complete interview. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const allQuestionsAnswered = () => {
    return questions.every(q => q.studentAnswer);
  };
  
  const formatTime = (timeInSeconds) => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = timeInSeconds % 60;
    
    let formattedTime = '';
    
    if (hours > 0) {
      formattedTime += `${hours} hour${hours > 1 ? 's' : ''} `;
    }
    
    if (minutes > 0 || hours > 0) {
      formattedTime += `${minutes} minute${minutes > 1 ? 's' : ''} `;
    }
    
    formattedTime += `${seconds} second${seconds > 1 ? 's' : ''}`;
    
    return formattedTime;
  };

  const renderInterviewSetup = () => (
    <Paper elevation={3} className="interview-paper setup-form">
      <Typography variant="h5" gutterBottom>Start a New Interview</Typography>
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Interview Type</InputLabel>
            <Select
              value={type}
              label="Interview Type"
              onChange={(e) => setType(e.target.value)}
            >
              <MenuItem value="Technical">Technical</MenuItem>
              <MenuItem value="Behavioral">Behavioral</MenuItem>
              <MenuItem value="System Design">System Design</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Difficulty</InputLabel>
            <Select
              value={difficulty}
              label="Difficulty"
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <MenuItem value="Beginner">Beginner</MenuItem>
              <MenuItem value="Intermediate">Intermediate</MenuItem>
              <MenuItem value="Advanced">Advanced</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      
      <Box textAlign="center" mt={4}>
        <Button 
          variant="contained" 
          className="start-button"
          startIcon={<PlayArrow />}
          onClick={startInterview}
          disabled={loading}
        >
          Start Interview
        </Button>
      </Box>
    </Paper>
  );
  
  const renderCurrentQuestion = () => {
    if (!questions || questions.length === 0) {
      return (
        <Paper elevation={3} className="interview-paper">
          <Box display="flex" justifyContent="center" my={2} className="loading-container">
            <CircularProgress className="loading-spinner" />
          </Box>
          <Typography variant="body1" align="center">
            Loading questions...
          </Typography>
        </Paper>
      );
    }
    
    const currentQuestion = questions[currentQuestionIndex];
    const hasSubmittedAnswer = !!answerFeedback;
    
    return (
      <Paper elevation={3} className={`interview-paper question-paper ${hasSubmittedAnswer ? 'with-feedback' : ''}`}>
        <Box p={3}>
          <Typography variant="overline" className="question-number">
            Question {currentQuestionIndex + 1} of {questions.length}
          </Typography>
          
          <Typography variant="h6" gutterBottom className="question-text">
            {currentQuestion.question}
          </Typography>
          
          <Box mt={3}>
            <TextField
              fullWidth
              multiline
              rows={6}
              label="Your Answer"
              variant="outlined"
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              disabled={!!answerFeedback}
              className="answer-field"
            />
          </Box>
          
          <Box display="flex" justifyContent="flex-end" mt={3}>
            {!answerFeedback ? (
              <Button 
                variant="contained" 
                className="submit-button"
                startIcon={<QuestionAnswer />}
                onClick={submitAnswer}
                disabled={loading || !currentAnswer.trim()}
              >
                Submit Answer
              </Button>
            ) : (
              <Button 
                variant="contained" 
                className="next-button"
                startIcon={<Check />}
                onClick={nextQuestion}
                disabled={currentQuestionIndex >= questions.length - 1}
              >
                Next Question
              </Button>
            )}
          </Box>
          
          {answerFeedback && (
            <Box mt={3} className="feedback-container">
              {answerFeedback.score && (
                <h6>
                  <Assessment fontSize="small" style={{ verticalAlign: 'middle' }} />
                  Feedback Assessment
                  <span className="score">{answerFeedback.score}/10</span>
                </h6>
              )}
              
              <FormattedFeedback feedbackText={answerFeedback.feedback} />
            </Box>
          )}
        </Box>
      </Paper>
    );
  };
  
  const renderFinalFeedback = () => {
    if (!finalFeedback) return null;
    
    return (
      <Paper elevation={3} className="interview-paper final-feedback">
        <Typography variant="h5" gutterBottom align="center">
          Interview Completed
        </Typography>
        
        <Typography variant="h6" className="overall-rating" align="center" gutterBottom>
          Overall Rating: {finalFeedback.overallRating}/10
        </Typography>
        
        <div className="time-spent">
          <AccessTimeIcon className="time-icon" />
          <Typography variant="subtitle1">
            Time Spent: {formatTime(finalFeedback.timeSpent || elapsedTime)}
          </Typography>
        </div>
        
        <Divider sx={{ my: 2 }} />
        
        <div className="feedback-section">
          <Typography variant="h6" gutterBottom>
            Strengths:
          </Typography>
          <List className="feedback-list">
            {finalFeedback.strengths.map((strength, idx) => (
              <ListItem key={idx} className="feedback-item">
                <ListItemText primary={strength} />
              </ListItem>
            ))}
          </List>
        </div>
        
        <div className="feedback-section">
          <Typography variant="h6" gutterBottom>
            Areas for Improvement:
          </Typography>
          <List className="feedback-list">
            {finalFeedback.weaknesses.map((weakness, idx) => (
              <ListItem key={idx} className="feedback-item">
                <ListItemText primary={weakness} />
              </ListItem>
            ))}
          </List>
        </div>
        
        <div className="feedback-section">
          <Typography variant="h6" gutterBottom>
            Summary:
          </Typography>
          <Typography paragraph>
            {finalFeedback.summary.replace(/\*\*/g, '')} {/* Remove ** from the summary */}
          </Typography>
        </div>
        
        <Box textAlign="center">
          <Button 
            variant="contained" 
            className="new-interview-button"
            onClick={() => {
              setIsSessionActive(false);
              setInterview(null);
              setQuestions([]);
              setFinalFeedback(null);
              navigate('/interview');
            }}
          >
            Start a New Interview
          </Button>
        </Box>
      </Paper>
    );
  };
  
  const renderInterviewProgress = () => {
    if (finalFeedback) {
      return renderFinalFeedback();
    }
    
    return (
      <>
        <div className="interview-header">
          <Typography variant="h5" gutterBottom>
            {interview?.type || 'Technical'} Interview - {interview?.difficulty || 'Intermediate'} Level
          </Typography>
          <Timer isRunning={timerRunning} />
        </div>
        
        {renderCurrentQuestion()}
        
        <Box display="flex" justifyContent="center" mt={4}>
          {allQuestionsAnswered() && !finalFeedback && (
            <Button 
              variant="contained" 
              className="complete-button"
              startIcon={<Assessment />}
              onClick={completeInterview}
              disabled={loading}
            >
              Complete Interview & Get Feedback
            </Button>
          )}
        </Box>
      </>
    );
  };
  
  if (loading && !interview) {
    return (
      <Container maxWidth="md" className="interview-container">
        <Box display="flex" justifyContent="center" my={4} className="loading-container">
          <CircularProgress className="loading-spinner" />
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" className="interview-container">
      <div className="interview-header">
        <Typography variant="h4" component="h1" gutterBottom align="center">
          AI Mock Interview
        </Typography>
      </div>
      
      {error && (
        <div className="error-message">
          <ErrorIcon style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          {error}
        </div>
      )}
      
      {!isSessionActive ? renderInterviewSetup() : renderInterviewProgress()}
    </Container>
  );
};

export default InterviewPage;
