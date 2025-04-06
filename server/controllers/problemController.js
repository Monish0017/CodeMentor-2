const Problem = require('../models/Problem');
const Submission = require('../models/Submission');
const User = require('../models/User');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI - reusing from interviewController
const initGeminiAI = () => {
  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    throw new Error('Gemini API key is not defined');
  }
  return new GoogleGenerativeAI(API_KEY);
};

// Get the appropriate Gemini model - reusing from interviewController
const getGeminiModel = (genAI) => {
  try {
    return genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  } catch (error) {
    console.error('Error initializing Gemini model:', error);
    throw new Error('Failed to initialize Gemini model: ' + error.message);
  }
};

// Helper function to extract JSON from Gemini responses - reusing from interviewController
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

// @desc    Get all problems
// @route   GET /api/problems
// @access  Public
exports.getProblems = async (req, res) => {
  try {
    // Extract query parameters for filtering
    const { difficulty, search, tags } = req.query;
    
    // Build the filter object
    const filter = {};
    
    if (difficulty && difficulty !== 'All') {
      filter.difficulty = difficulty;
    }
    
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }
    
    if (tags) {
      const tagArray = tags.split(',');
      filter.tags = { $in: tagArray };
    }
    
    // Find all problems that match the filter
    const problems = await Problem.find(filter).select('title difficulty tags acceptance isPublic');
    
    // If user is authenticated, add user-specific data like 'solved' status
    if (req.user) {
      // Get the user with their solved problems
      const user = await User.findById(req.user._id).select('solvedProblems');
      
      // Convert user's solved problems to string IDs for easy comparison
      const solvedProblemIds = user.solvedProblems.map(id => id.toString());
      
      // Add 'isSolved' field to each problem
      const problemsWithSolvedStatus = problems.map(problem => {
        return {
          ...problem.toObject(),
          isSolved: solvedProblemIds.includes(problem._id.toString())
        };
      });
      
      return res.json(problemsWithSolvedStatus);
    }
    
    res.json(problems);
  } catch (error) {
    console.error('Error fetching problems:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch problems',
      error: error.message
    });
  }
};

// @desc    Get problem by ID
// @route   GET /api/problems/:id
// @access  Public
exports.getProblemById = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }
    
    // Check if problem is public or user is admin
    if (!problem.isPublic && (!req.user || !req.user.isAdmin)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Check if the problem is already solved by the user
    let isSolved = false;
    if (req.user) {
      const user = await User.findById(req.user._id).select('solvedProblems');
      isSolved = user.solvedProblems.includes(problem._id);
    }
    
    // Return structured response with problem details and success flag
    res.json({
      success: true,
      problem: {
        title: problem.title,
        description: problem.description,
        difficulty: problem.difficulty,
        category: problem.category || "",
        examples: problem.examples || [],
        constraints: problem.constraints || "",
        testCases: problem.testCases || [],
        solution: problem.solution || "",
        hints: problem.hints || [],
        tags: problem.tags || [],
        companies: problem.companies || [],
        submissionsCount: problem.submissionsCount || 0,
        successRate: problem.successRate || 0,
        isPublic: problem.isPublic,
        starterCode: problem.starterCode || "// Write your code here",
        isSolved: isSolved
      }
    });
  } catch (error) {
    console.error('Error fetching problem:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch problem',
      error: error.message
    });
  }
};

// @desc    Submit solution for evaluation
// @route   POST /api/problems/:id/submit
// @access  Private
exports.submitSolution = async (req, res) => {
  try {
    const { code, language } = req.body;
    const problemId = req.params.id;
    
    if (!code || !language) {
      return res.status(400).json({
        success: false,
        message: 'Code and language are required'
      });
    }
    
    const problem = await Problem.findById(problemId);
    
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }
    
    // Check if the user has already solved this problem
    const user = await User.findById(req.user._id).select('solvedProblems');
    const alreadySolved = user.solvedProblems.some(id => id.toString() === problemId);
    
    if (alreadySolved) {
      return res.status(400).json({
        success: false,
        message: 'You have already solved this problem',
        alreadySolved: true
      });
    }
    
    // Create a submission record
    const submission = new Submission({
      user: req.user._id,
      problem: problemId,
      code,
      language,
      status: 'Processing'
    });
    
    // Increment the submission count for this problem
    await Problem.findByIdAndUpdate(problemId, { $inc: { submissionsCount: 1 } });
    
    // First attempt to execute the code with Judge0
    try {
      // Configure Judge0 request with RapidAPI
      const judge0Url = process.env.JUDGE0_API_URL ;
      const judge0ApiKey = process.env.JUDGE0_API_KEY;
      
      // Configure headers for RapidAPI
      const headers = {
        'X-RapidAPI-Key': judge0ApiKey,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
        'Content-Type': 'application/json'
      };
      
      // Get language ID mapping for Judge0
      const languageIdMap = {
        'javascript': 63,
        'python': 71,
        'cpp': 54,
        'java': 62,
        'c': 50,
        // Add more language mappings as needed
      };
      
      const languageId = languageIdMap[language.toLowerCase()];
      
      if (!languageId) {
        return res.status(400).json({
          success: false,
          message: 'Unsupported language'
        });
      }
      
      // For each test case, run the code
      const testResults = [];
      let allTestsPassed = true;
      let totalExecutionTime = 0;
      let maxMemoryUsage = 0;
      
      for (const testCase of problem.testCases) {
        // Run code separately for each test case to ensure unique outputs
        const response = await axios.post(`${judge0Url}/submissions`, {
          source_code: code,
          language_id: languageId,
          stdin: testCase.input,
          // Remove expected_output to avoid Judge0 making the comparison
          // We'll do the comparison ourselves
          cpu_time_limit: 2, // 2 seconds
          memory_limit: 128000 // 128MB
        }, { headers });
        
        const token = response.data.token;
        
        // Poll for Judge0 results
        let executionResult;
        let attempts = 0;
        
        while (attempts < 10) {
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms between polls
          
          const resultResponse = await axios.get(`${judge0Url}/submissions/${token}`, { headers });
          executionResult = resultResponse.data;
          
          if (executionResult.status.id !== 1 && executionResult.status.id !== 2) {
            // Not in Queue or Processing
            break;
          }
          
          attempts++;
        }
        
        // Track execution stats
        if (executionResult.time) {
          totalExecutionTime += parseFloat(executionResult.time);
        }
        
        if (executionResult.memory) {
          maxMemoryUsage = Math.max(maxMemoryUsage, parseInt(executionResult.memory));
        }
        
        // Check execution result - normalize output format before comparing
        let normalizedActual = executionResult.stdout ? executionResult.stdout.trim() : '';
        let normalizedExpected = testCase.output.trim();
        
        // Determine if comparison passed based on various formats
        let passed = false;
        let error = executionResult.stderr || '';
        
        // First check if execution was successful
        if (executionResult.status.id === 3) {
          try {
            // Try to parse both as JSON if they look like arrays or objects
            if ((normalizedActual.startsWith('[') && normalizedActual.endsWith(']')) || 
                (normalizedActual.startsWith('{') && normalizedActual.endsWith('}'))) {
              const actualJSON = JSON.parse(normalizedActual);
              
              // Parse expected output as JSON if possible
              let expectedJSON;
              try {
                expectedJSON = JSON.parse(normalizedExpected);
              } catch (e) {
                // If expected can't be parsed as JSON directly, try to clean it
                // Sometimes expected outputs are stored with extra quotes
                if (normalizedExpected.startsWith('"[') && normalizedExpected.endsWith(']"')) {
                  // Remove extra quotes and try again
                  const cleanedExpected = normalizedExpected.substring(1, normalizedExpected.length-1);
                  expectedJSON = JSON.parse(cleanedExpected);
                } else {
                  throw e;
                }
              }
              
              // For arrays, first try direct JSON string comparison
              passed = JSON.stringify(actualJSON) === JSON.stringify(expectedJSON);
              
              // If that fails but both are arrays, compare array contents regardless of formatting
              if (!passed && Array.isArray(actualJSON) && Array.isArray(expectedJSON)) {
                // If arrays have same length
                if (actualJSON.length === expectedJSON.length) {
                  // For simple two-element arrays (like in Two Sum problem), 
                  // check if the values match in any order
                  if (actualJSON.length === 2 && expectedJSON.length === 2) {
                    // If actual has the same elements as expected (order-independent)
                    passed = (actualJSON.includes(expectedJSON[0]) && 
                             actualJSON.includes(expectedJSON[1]));
                  } else {
                    // For larger arrays, compare sorted versions to ignore order
                    // Only for arrays of primitive values
                    const allPrimitives = [...actualJSON, ...expectedJSON].every(
                      item => typeof item !== 'object' || item === null
                    );
                    
                    if (allPrimitives) {
                      const sortedActual = [...actualJSON].sort();
                      const sortedExpected = [...expectedJSON].sort();
                      passed = JSON.stringify(sortedActual) === JSON.stringify(sortedExpected);
                    }
                  }
                }
              }
            } else {
              // Direct string comparison if not JSON
              passed = normalizedActual === normalizedExpected;
              
              // If that fails, try number comparison (for single number outputs)
              if (!passed && !isNaN(normalizedActual) && !isNaN(normalizedExpected)) {
                passed = Number(normalizedActual) === Number(normalizedExpected);
              }
            }
          } catch (e) {
            // If JSON parsing fails, fall back to direct string comparison
            passed = normalizedActual === normalizedExpected;
            if (!passed) {
              error = `Output format error: ${e.message}`;
            }
          }
        }
        
        if (!passed) allTestsPassed = false;
        
        testResults.push({
          passed,
          input: testCase.input,
          expected: normalizedExpected,
          actual: normalizedActual,
          error,
          status: executionResult.status.description
        });
      }
      
      // Update submission with test results and execution stats
      submission.testResults = testResults;
      submission.status = allTestsPassed ? 'Accepted' : 'Wrong Answer';
      submission.executionTime = totalExecutionTime;
      submission.memory = maxMemoryUsage;
      
      // Evaluate the solution using Gemini AI
      const genAI = initGeminiAI();
      const model = getGeminiModel(genAI);
      
      const prompt = `
        Evaluate this solution to the following coding problem:
        
        Problem: ${problem.title}
        Description: ${problem.description}
        
        User's solution (${language}): 
        ${code}
        
        Test Results:
        ${JSON.stringify(testResults, null, 2)}
        
        Please provide:
        1. A score from 1-10 based on correctness, efficiency, and code quality
        2. Detailed feedback about the solution
        3. Specific improvements that could be made
        4. Time and space complexity analysis
        
        Format your response as JSON:
        {
          "score": number,
          "feedback": "detailed feedback about the solution",
          "improvements": ["improvement1", "improvement2", ...],
          "timeComplexity": "e.g., O(n)",
          "spaceComplexity": "e.g., O(1)"
        }
      `;
      
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Parse the Gemini feedback
      const evaluation = extractJsonFromResponse(responseText);
      
      // Update submission with AI evaluation
      submission.aiEvaluation = evaluation;
      
      // Add overall feedback based on AI evaluation
      submission.feedback = evaluation.feedback;
      
      // If all tests passed, update user's stats and mark problem as solved
      if (allTestsPassed) {
        // Get problem difficulty to calculate score
        const problem = await Problem.findById(problemId).select('difficulty');
        
        // Calculate points based on difficulty
        let pointsEarned = 10; // Base points for solving any problem
        
        // Additional points based on difficulty
        if (problem.difficulty === 'Easy') {
          pointsEarned += 5;
        } else if (problem.difficulty === 'Medium') {
          pointsEarned += 15;
        } else if (problem.difficulty === 'Hard') {
          pointsEarned += 25;
        }
        
        // Add bonus points based on AI evaluation score (if available)
        if (evaluation && evaluation.score) {
          // Add up to 10 additional points based on code quality
          pointsEarned += Math.round(evaluation.score);
        }
        
        // Add this problem to user's solvedProblems array and update score
        await User.findByIdAndUpdate(req.user._id, {
          $addToSet: { solvedProblems: problemId },
          $inc: { score: pointsEarned },
          lastActivityDate: Date.now()
        });
        
        submission.pointsEarned = pointsEarned;
      }
      
      await submission.save();
      
      res.json({
        success: true,
        submission: {
          id: submission._id,
          status: submission.status,
          testResults,
          evaluation: evaluation,
          executionTime: submission.executionTime,
          memory: submission.memory,
          isSolved: allTestsPassed,
          pointsEarned: submission.pointsEarned || 0
        }
      });
      
    } catch (judgeError) {
      console.error('Error with Judge0 RapidAPI:', judgeError);
      
      // If Judge0 fails, fallback to just AI evaluation
      submission.status = 'Runtime Error';
      submission.error = `Judge0 execution error: ${judgeError.message}`;
      
      // Still try to get AI feedback on the code
      try {
        const genAI = initGeminiAI();
        const model = getGeminiModel(genAI);
        
        const prompt = `
          Evaluate this solution to the following coding problem:
          
          Problem: ${problem.title}
          Description: ${problem.description}
          
          User's solution (${language}): 
          ${code}
          
          Please provide:
          1. A score from 1-10 based on code quality and likely correctness
          2. Detailed feedback about the solution
          3. Specific improvements that could be made
          4. Time and space complexity analysis
          
          Format your response as JSON:
          {
            "score": number,
            "feedback": "detailed feedback about the solution",
            "improvements": ["improvement1", "improvement2", ...],
            "timeComplexity": "e.g., O(n)",
            "spaceComplexity": "e.g., O(1)"
          }
        `;
        
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        // Parse the Gemini feedback
        const evaluation = extractJsonFromResponse(responseText);
        
        // Update submission with AI evaluation
        submission.aiEvaluation = evaluation;
        submission.feedback = evaluation.feedback;
        await submission.save();
        
        res.json({
          success: true,
          message: 'Code execution failed, but AI evaluation provided',
          error: judgeError.message,
          evaluation
        });
      } catch (aiError) {
        console.error('Error with Gemini AI:', aiError);
        submission.error = `${submission.error}. AI Evaluation failed: ${aiError.message}`;
        await submission.save();
        
        res.status(500).json({
          success: false,
          message: 'Both code execution and AI evaluation failed',
          error: judgeError.message,
          aiError: aiError.message
        });
      }
    }
  } catch (error) {
    console.error('Error submitting solution:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit solution',
      error: error.message
    });
  }
};

// @desc    Run code without submission
// @route   POST /api/problems/:id/run
// @access  Private
exports.runCode = async (req, res) => {
  try {
    const { code, language } = req.body;
    const problemId = req.params.id;
    
    if (!code || !language) {
      return res.status(400).json({
        success: false,
        message: 'Code and language are required'
      });
    }
    
    // Check if problem exists
    const problem = await Problem.findById(problemId);
    
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }
    
    // Configure Judge0 request with RapidAPI
    const judge0Url = process.env.JUDGE0_API_URL;
    const judge0ApiKey = process.env.JUDGE0_API_KEY;
    
    // Configure headers for RapidAPI
    const headers = {
      'X-RapidAPI-Key': judge0ApiKey,
      'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
      'Content-Type': 'application/json'
    };
    
    // Get language ID mapping for Judge0
    const languageIdMap = {
      'javascript': 63,
      'python': 71,
      'cpp': 54,
      'java': 62,
      'c': 50,
      // Add more language mappings as needed
    };
    
    const languageId = languageIdMap[language.toLowerCase()];
    
    if (!languageId) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported language'
      });
    }
    
    // Use a test case from the problem or user provided input
    const testInput = (problem.testCases.length > 0 ? problem.testCases[0].input : '');
    
    try {
      const response = await axios.post(`${judge0Url}/submissions`, {
        source_code: code,
        language_id: languageId,
        stdin: testInput,
        cpu_time_limit: 2, // 2 seconds
        memory_limit: 128000 // 128MB
      }, { headers });
      
      const token = response.data.token;
      
      if (!token) {
        throw new Error('No submission token received from Judge0');
      }
      
      // Poll for Judge0 results
      let executionResult;
      let attempts = 0;
      
      while (attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms between polls
        
        const resultResponse = await axios.get(`${judge0Url}/submissions/${token}`, { headers });
        executionResult = resultResponse.data;
        
        if (executionResult.status.id !== 1 && executionResult.status.id !== 2) {
          // Not in Queue or Processing
          break;
        }
        
        attempts++;
      }
      
      res.json({
        success: true,
        result: {
          output: executionResult.stdout || '',
          error: executionResult.stderr || '',
          status: executionResult.status.description,
          time: executionResult.time,
          memory: executionResult.memory
        }
      });
    } catch (judgeError) {
      console.error('Error with Judge0 RapidAPI:', judgeError);
      res.status(503).json({
        success: false,
        message: 'Code execution service error',
        details: judgeError.message
      });
    }
  } catch (error) {
    console.error('Error running code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run code',
      error: error.message
    });
  }
};

// @desc    Get user's submissions for a problem
// @route   GET /api/problems/:id/submissions
// @access  Private
exports.getProblemSubmissions = async (req, res) => {
  try {
    const problemId = req.params.id;
    
    const submissions = await Submission.find({
      user: req.user._id,
      problem: problemId
    }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      submissions
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch submissions',
      error: error.message
    });
  }
};

// @desc    Get user's recent coding challenge submissions
// @route   GET /api/problems/recent
// @access  Private
exports.getRecentChallenges = async (req, res) => {
  try {
    // Find recent submissions for this user
    const submissions = await Submission.find({
      user: req.user._id
    })
    .sort({ createdAt: -1 })
    .limit(5) // Limit to 5 most recent submissions
    .populate('problem', 'title difficulty'); // Populate with problem details
    
    // Format the submissions for the frontend
    const recentChallenges = submissions.map(submission => ({
      id: submission._id,
      problemId: submission.problem._id,
      title: submission.problem.title,
      difficulty: submission.problem.difficulty,
      status: submission.status,
      language: submission.language,
      executionTime: submission.executionTime,
      memory: submission.memory,
      score: submission.aiEvaluation?.score || null,
      feedback: submission.feedback || '',
      timestamp: submission.createdAt
    }));
    
    res.json({
      success: true,
      recentChallenges
    });
  } catch (error) {
    console.error('Error fetching recent challenges:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent coding challenges',
      error: error.message
    });
  }
};

// Add a new method to get user problem solving stats
exports.getUserProblemStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('solvedProblems');
    
    // Get count of solved problems by difficulty
    const problems = await Problem.find({
      _id: { $in: user.solvedProblems }
    }).select('difficulty');
    
    const stats = {
      total: user.solvedProblems.length,
      easy: 0,
      medium: 0,
      hard: 0
    };
    
    problems.forEach(problem => {
      const difficulty = problem.difficulty.toLowerCase();
      if (stats[difficulty] !== undefined) {
        stats[difficulty]++;
      }
    });
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting user problem stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get problem stats',
      error: error.message
    });
  }
};
