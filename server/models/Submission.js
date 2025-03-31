const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema({
  passed: {
    type: Boolean,
    required: true
  },
  input: String,
  expected: String,
  actual: String,
  error: String,
  status: String
}, { _id: false });

const submissionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  problem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true
  },
  code: {
    type: String,
    required: [true, 'Please add code']
  },
  language: {
    type: String,
    required: [true, 'Please specify language'],
    enum: ['javascript', 'python', 'java', 'cpp', 'c']
  },
  status: {
    type: String,
    enum: ['Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Compilation Error', 'Runtime Error', 'Pending', 'Processing'],
    default: 'Pending'
  },
  executionTime: {
    type: Number,
    default: 0
  },
  memory: {
    type: Number,
    default: 0
  },
  feedback: {
    type: String,
    default: ''
  },
  error: String,
  testResults: [testResultSchema],
  aiEvaluation: {
    score: Number,
    feedback: String,
    improvements: [String],
    timeComplexity: String,
    spaceComplexity: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Submission', submissionSchema);
