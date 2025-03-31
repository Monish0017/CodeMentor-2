const Interview = require('../models/Interview');
const User = require('../models/User');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const initGeminiAI = () => {
  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    throw new Error('Gemini API key is not defined');
  }
  return new GoogleGenerativeAI(API_KEY);
};

// Get the appropriate Gemini model
const getGeminiModel = (genAI) => {
  try {
    // Use the updated model name format - "gemini-1.5-pro" is the newer model
    // If this doesn't work, you might need to use "gemini-1.0-pro" based on your API access
    return genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  } catch (error) {
    console.error('Error initializing Gemini model:', error);
    throw new Error('Failed to initialize Gemini model: ' + error.message);
  }
};

// Helper function to extract JSON from Gemini responses that might contain markdown
const extractJsonFromResponse = (text) => {
  try {
    // First attempt direct parsing
    return JSON.parse(text);
  } catch (error) {
    // If direct parsing fails, try to extract JSON from markdown code blocks
    const jsonRegex = /```(?:json)?\s*([\s\S]*?)```/;
    const match = text.match(jsonRegex);
    
    if (match && match[1]) {
      // Found JSON within markdown code blocks
      const extractedJson = match[1].trim();
      return JSON.parse(extractedJson);
    }
    
    // If no code block is found but the response has square brackets
    // Try to extract array content
    if (text.includes('[') && text.includes(']')) {
      const arrayRegex = /\[([\s\S]*?)\]/;
      const arrayMatch = text.match(arrayRegex);
      
      if (arrayMatch && arrayMatch[1]) {
        return JSON.parse(`[${arrayMatch[1]}]`);
      }
    }
    
    // If still failing, throw the original error
    throw new Error(`Failed to parse AI response as JSON: ${error.message}`);
  }
};

// @desc    Start a new interview with Gemini
// @route   POST /api/interview/start
// @access  Private
exports.startInterview = async (req, res) => {
  try {
    const { type, difficulty } = req.body;
    
    if (!type || !difficulty) {
      return res.status(400).json({ 
        success: false, 
        message: 'Type and difficulty are required' 
      });
    }
    
    // Create a new interview record
    const interview = new Interview({
      user: req.user._id,
      type,
      difficulty,
      status: 'In Progress'
    });
    
    // Generate questions using Gemini
    try {
      const genAI = initGeminiAI();
      const model = getGeminiModel(genAI);
      
      const prompt = `
        Generate 5 interview questions for a ${difficulty} level ${type} interview.
        For each question, also provide the correct answer.
        Format your response as a JSON array of objects, each with 'question' and 'correctAnswer' properties.
        Return only valid JSON without any markdown formatting or other text.
      `;
      
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      try {
        // Parse the JSON response from Gemini using the helper function
        const questionsData = extractJsonFromResponse(responseText);
        
        // Store the questions in the interview document
        interview.questions = questionsData.map(item => ({
          question: item.question,
          correctAnswer: item.correctAnswer
        }));
        
        // Save the raw Gemini response for reference
        interview.geminiResponse = { questionGeneration: responseText };
        
        await interview.save();
        
        // Return only the questions to the client, not the answers
        const clientQuestions = interview.questions.map(q => ({
          id: q._id,
          question: q.question
        }));
        
        res.status(201).json({
          success: true,
          interviewId: interview._id,
          questions: clientQuestions
        });
      } catch (parseError) {
        console.error('Error parsing Gemini response:', parseError);
        console.error('Raw response:', responseText);
        res.status(500).json({
          success: false,
          message: 'Error generating interview questions',
          error: parseError.message
        });
      }
    } catch (aiError) {
      console.error('Error with Gemini AI:', aiError);
      res.status(500).json({
        success: false,
        message: 'Error with AI service',
        error: aiError.message
      });
    }
  } catch (error) {
    console.error('Error starting interview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start interview',
      error: error.message
    });
  }
};

// @desc    Submit an answer during the interview
// @route   POST /api/interview/submit
// @access  Private
exports.submitAnswer = async (req, res) => {
  try {
    const { interviewId, questionId, answer } = req.body;
    
    if (!interviewId || !questionId || !answer) {
      return res.status(400).json({
        success: false,
        message: 'Interview ID, question ID, and answer are required'
      });
    }
    
    const interview = await Interview.findById(interviewId);
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }
    
    // Check if the interview belongs to the user
    if (interview.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    // Find the question
    const question = interview.questions.id(questionId);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }
    
    // Store the user's answer
    question.studentAnswer = answer;
    
    // Evaluate the answer using Gemini
    try {
      const genAI = initGeminiAI();
      const model = getGeminiModel(genAI);
      
      const prompt = `
        Evaluate this answer for a coding interview:
        
        Question: ${question.question}
        
        Correct answer: ${question.correctAnswer}
        
        Student's answer: ${answer}
        
        Please evaluate on a scale of 0-10 and provide feedback.
        Format your response as JSON with these fields:
        {
          "score": number,
          "feedback": "detailed feedback"
        }
      `;
      
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      try {
        // Parse the Gemini response using the helper function
        const evaluation = extractJsonFromResponse(responseText);
        
        // Update the question with the score and feedback
        question.questionScore = evaluation.score;
        question.feedback = evaluation.feedback;
        
        // Save the interview with the updated question
        await interview.save();
        
        res.json({
          success: true,
          score: evaluation.score,
          feedback: evaluation.feedback
        });
      } catch (parseError) {
        console.error('Error parsing Gemini evaluation:', parseError);
        console.error('Raw response:', responseText);
        res.status(500).json({
          success: false,
          message: 'Error evaluating answer',
          error: parseError.message
        });
      }
    } catch (aiError) {
      console.error('Error with Gemini AI:', aiError);
      res.status(500).json({
        success: false,
        message: 'Error with AI service',
        error: aiError.message
      });
    }
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit answer',
      error: error.message
    });
  }
};

// @desc    Save feedback and complete the interview
// @route   POST /api/interview/feedback
// @access  Private
exports.saveFeedback = async (req, res) => {
  try {
    const { interviewId } = req.body;
    
    if (!interviewId) {
      return res.status(400).json({
        success: false,
        message: 'Interview ID is required'
      });
    }
    
    const interview = await Interview.findById(interviewId);
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }
    
    // Check if the interview belongs to the user
    if (interview.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    // Check if all questions have answers
    const unansweredQuestions = interview.questions.filter(q => !q.studentAnswer);
    
    if (unansweredQuestions.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'All questions must be answered before completing the interview',
        unansweredCount: unansweredQuestions.length
      });
    }
    
    // Generate final feedback using Gemini
    try {
      const genAI = initGeminiAI();
      const model = getGeminiModel(genAI);
      
      const questionSummaries = interview.questions.map(q => ({
        question: q.question,
        correctAnswer: q.correctAnswer,
        studentAnswer: q.studentAnswer,
        score: q.questionScore,
        feedback: q.feedback
      }));
      
      const prompt = `
        Generate comprehensive feedback for this coding interview:
        
        Interview Type: ${interview.type}
        Difficulty: ${interview.difficulty}
        
        Questions and Answers:
        ${JSON.stringify(questionSummaries, null, 2)}
        
        Please provide:
        1. A list of strengths (what the candidate did well)
        2. A list of weaknesses (areas for improvement)
        3. An overall rating from 1-10
        4. A summary with advice for further study
        
        Format your response as JSON:
        {
          "strengths": ["strength1", "strength2", ...],
          "weaknesses": ["weakness1", "weakness2", ...],
          "overallRating": number,
          "summary": "detailed summary and advice"
        }
      `;
      
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      try {
        // Parse the Gemini feedback using the helper function
        const feedbackData = extractJsonFromResponse(responseText);
        
        // Calculate the total score
        const totalScore = interview.questions.reduce((sum, q) => sum + (q.questionScore || 0), 0);
        const averageScore = totalScore / interview.questions.length;
        
        // Update the interview with the feedback
        interview.feedback = {
          strengths: feedbackData.strengths || [],
          weaknesses: feedbackData.weaknesses || [],
          overallRating: feedbackData.overallRating || Math.round(averageScore),
          summary: feedbackData.summary || ''
        };
        
        interview.score = Math.round(averageScore);
        interview.status = 'Completed';
        interview.completedAt = Date.now();
        
        // Store the raw Gemini response
        interview.geminiResponse = {
          ...interview.geminiResponse,
          finalFeedback: responseText
        };
        
        await interview.save();
        
        // Calculate points based on difficulty and score
        let pointsEarned = interview.score; // Base points from the score
        
        // Bonus points based on difficulty
        if (interview.difficulty === 'Easy') {
          pointsEarned += 5;
        } else if (interview.difficulty === 'Medium') {
          pointsEarned += 10;
        } else if (interview.difficulty === 'Hard') {
          pointsEarned += 15;
        }
        
        // Update user's score and add interview to completedInterviews
        await User.findByIdAndUpdate(req.user._id, {
          $inc: { score: pointsEarned },
          $addToSet: { completedInterviews: interview._id },
          lastActivityDate: Date.now()
        });
        
        res.json({
          success: true,
          feedback: interview.feedback,
          score: interview.score,
          pointsEarned
        });
      } catch (parseError) {
        console.error('Error parsing Gemini feedback:', parseError);
        console.error('Raw response:', responseText);
        res.status(500).json({
          success: false,
          message: 'Error generating feedback',
          error: parseError.message
        });
      }
    } catch (aiError) {
      console.error('Error with Gemini AI:', aiError);
      res.status(500).json({
        success: false,
        message: 'Error with AI service',
        error: aiError.message
      });
    }
  } catch (error) {
    console.error('Error saving feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save feedback',
      error: error.message
    });
  }
};

// Add a new method to get user interview stats
exports.getUserInterviewStats = async (req, res) => {
  try {
    // Get completed interviews count
    const interviewCount = await Interview.countDocuments({
      user: req.user._id,
      status: 'Completed'
    });
    
    // Get average score
    const interviews = await Interview.find({
      user: req.user._id,
      status: 'Completed'
    }).select('score');
    
    let averageScore = 0;
    if (interviews.length > 0) {
      const totalScore = interviews.reduce((sum, interview) => sum + (interview.score || 0), 0);
      averageScore = Math.round(totalScore / interviews.length);
    }
    
    res.json({
      success: true,
      stats: {
        interviewsCompleted: interviewCount,
        averageScore
      }
    });
  } catch (error) {
    console.error('Error getting user interview stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get interview stats',
      error: error.message
    });
  }
};

// @desc    Get an interview by ID
// @route   GET /api/interview/:id
// @access  Private
exports.getInterview = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }
    
    // Check if the interview belongs to the user
    if (interview.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    res.json({
      success: true,
      interview
    });
  } catch (error) {
    console.error('Error getting interview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get interview',
      error: error.message
    });
  }
};

// @desc    Get recent interviews for a user
// @route   GET /api/interview/recent
// @access  Private
exports.getRecentInterviews = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5; // Default to 5 if not specified
    
    const interviews = await Interview.find({ user: req.user._id })
      .select('type difficulty score status completedAt createdAt feedback questions')
      .sort({ createdAt: -1 })
      .limit(limit);
    
    // Format the data for the client
    const formattedInterviews = interviews.map(interview => ({
      id: interview._id,
      type: interview.type,
      difficulty: interview.difficulty,
      score: interview.score || 0,
      status: interview.status,
      date: interview.completedAt || interview.createdAt,
      questionCount: interview.questions.length,
      summary: interview.feedback?.summary || null
    }));
    
    res.json({
      success: true,
      interviews: formattedInterviews
    });
  } catch (error) {
    console.error('Error getting recent interviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recent interviews',
      error: error.message
    });
  }
};
