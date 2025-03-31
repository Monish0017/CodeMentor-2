import React, { useState, useEffect } from 'react';
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
import axios from 'axios';

const SERVERURL = 'http://localhost:5000'

const InterviewPage = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams(); // Get sessionId from URL parameters
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in via localStorage
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

  const [type, setType] = useState('Technical');
  const [difficulty, setDifficulty] = useState('Intermediate');
  
  // Interview session states
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [interview, setInterview] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [answerFeedback, setAnswerFeedback] = useState(null);
  const [finalFeedback, setFinalFeedback] = useState(null);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  
  // Load existing interview if sessionId is provided
  useEffect(() => {
    if (sessionId) {
      fetchInterview(sessionId);
    }
  }, [sessionId]);
  
  const fetchInterview = async (id) => {
    try {
      setLoading(true);
      setError('');
      
      // Connect to the GET /api/interview/:id endpoint
    const response = await axios.get(`${ SERVERURL }/api/interview/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data.success) {
        setInterview(response.data.interview);
        setIsSessionActive(true);
        
        // Set questions from the interview
        if (response.data.interview.questions) {
          setQuestions(response.data.interview.questions.map(q => ({
            id: q._id,
            question: q.question,
            studentAnswer: q.studentAnswer,
            feedback: q.feedback,
            score: q.questionScore
          })));
        }
        
        // If interview is completed, show final feedback
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
      
      // Connect to the POST /api/interview/start endpoint with proper body format
      const response = await axios.post(`${ SERVERURL }/api/interview/start`, 
        { type, difficulty }, // This matches the expected body format in controller
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      
      if (response.data.success) {
        // Transform questions to the required format if needed
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
      
      // Connect to the POST /api/interview/submit endpoint with proper body format
      const response = await axios.post(`${ SERVERURL }/api/interview/submit`, {
        interviewId: interview._id,
        questionId: currentQuestion.id,
        answer: currentAnswer
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data.success) {
        // Update the current question with feedback
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
      
      // Connect to the POST /api/interview/feedback endpoint with proper body format
      const response = await axios.post(`${ SERVERURL }/api/interview/feedback`, {
        interviewId: interview._id
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data.success) {
        setFinalFeedback(response.data.feedback);
      }
    } catch (err) {
      console.error('Error completing interview:', err);
      setError('Failed to complete interview. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // This would integrate with speech-to-text in a real implementation
    if (!isRecording) {
      // Start recording logic would go here
      console.log('Recording started');
    } else {
      // Stop recording and process the result
      console.log('Recording stopped');
      // In a real implementation, this would update the currentAnswer state with the transcribed text
    }
  };
  
  // Helper to check if all questions have been answered
  const allQuestionsAnswered = () => {
    return questions.every(q => q.studentAnswer);
  };
  
  // Render the interview setup form
  const renderInterviewSetup = () => (
    <Paper elevation={3} sx={{ p: 4, my: 4 }}>
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
          color="primary" 
          size="large"
          startIcon={<PlayArrow />}
          onClick={startInterview}
          disabled={loading}
        >
          Start Interview
        </Button>
      </Box>
    </Paper>
  );
  
  // Render the current question
  const renderCurrentQuestion = () => {
    if (!questions || questions.length === 0) {
      return (
        <Paper elevation={3} sx={{ p: 3, my: 3 }}>
          <Box display="flex" justifyContent="center" my={2}>
            <CircularProgress />
          </Box>
          <Typography variant="body1" align="center">
            Loading questions...
          </Typography>
        </Paper>
      );
    }
    
    const currentQuestion = questions[currentQuestionIndex];
    
    return (
      <Paper elevation={3} sx={{ p: 3, my: 3 }}>
        <Typography variant="overline">
          Question {currentQuestionIndex + 1} of {questions.length}
        </Typography>
        
        <Typography variant="h6" gutterBottom sx={{ mt: 1 }}>
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
          />
        </Box>
        
        <Box display="flex" justifyContent="space-between" mt={3}>
          <Button 
            variant="outlined" 
            color={isRecording ? "error" : "primary"}
            startIcon={isRecording ? <MicOff /> : <Mic />}
            onClick={toggleRecording}
            disabled={!!answerFeedback}
          >
            {isRecording ? "Stop Recording" : "Record Answer"}
          </Button>
          
          {!answerFeedback ? (
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<QuestionAnswer />}
              onClick={submitAnswer}
              disabled={loading || !currentAnswer.trim()}
            >
              Submit Answer
            </Button>
          ) : (
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<Check />}
              onClick={nextQuestion}
              disabled={currentQuestionIndex >= questions.length - 1}
            >
              Next Question
            </Button>
          )}
        </Box>
        
        {answerFeedback && (
          <Box mt={3} p={2} bgcolor="rgba(0,0,0,0.03)" borderRadius={1}>
            <Typography variant="h6" gutterBottom>
              Feedback (Score: {answerFeedback.score}/10)
            </Typography>
            <Typography variant="body1">
              {answerFeedback.feedback}
            </Typography>
          </Box>
        )}
      </Paper>
    );
  };
  
  // Render the final feedback
  const renderFinalFeedback = () => {
    if (!finalFeedback) return null;
    
    return (
      <Paper elevation={3} sx={{ p: 3, my: 3 }}>
        <Typography variant="h5" gutterBottom align="center">
          Interview Completed
        </Typography>
        
        <Typography variant="h6" color="primary" align="center" gutterBottom>
          Overall Rating: {finalFeedback.overallRating}/10
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="h6" gutterBottom>
          Strengths:
        </Typography>
        <List>
          {finalFeedback.strengths.map((strength, idx) => (
            <ListItem key={idx}>
              <ListItemText primary={strength} />
            </ListItem>
          ))}
        </List>
        
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Areas for Improvement:
        </Typography>
        <List>
          {finalFeedback.weaknesses.map((weakness, idx) => (
            <ListItem key={idx}>
              <ListItemText primary={weakness} />
            </ListItem>
          ))}
        </List>
        
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Summary:
        </Typography>
        <Typography paragraph>
          {finalFeedback.summary}
        </Typography>
        
        <Box textAlign="center" mt={3}>
          <Button 
            variant="contained" 
            color="primary"
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
  
  // Render interview progress
  const renderInterviewProgress = () => {
    if (finalFeedback) {
      return renderFinalFeedback();
    }
    
    return (
      <>
        <Box mb={2}>
          <Typography variant="h5" gutterBottom>
            {interview?.type || 'Technical'} Interview - {interview?.difficulty || 'Intermediate'} Level
          </Typography>
          <Divider />
        </Box>
        
        {renderCurrentQuestion()}
        
        <Box display="flex" justifyContent="center" mt={4}>
          {allQuestionsAnswered() && !finalFeedback && (
            <Button 
              variant="contained" 
              color="primary"
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
      <Container maxWidth="md">
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ my: 3 }}>
        AI Mock Interview
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}
      
      {!isSessionActive ? renderInterviewSetup() : renderInterviewProgress()}
    </Container>
  );
};

export default InterviewPage;
