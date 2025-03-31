const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Question schema - used as a subdocument
const QuestionSchema = new Schema({
  question: {
    type: String,
    required: true
  },
  correctAnswer: {
    type: String,
    required: true
  },
  studentAnswer: {
    type: String
  },
  questionScore: {
    type: Number,
    min: 0,
    max: 10
  },
  feedback: {
    type: String
  }
});

// Interview schema
const InterviewSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    // Update the enum to match frontend values
    enum: ['Technical', 'Behavioral', 'System Design'] 
  },
  difficulty: {
    type: String,
    required: true,
    // Update the enum to match frontend values
    enum: ['Beginner', 'Intermediate', 'Advanced']
  },
  status: {
    type: String,
    required: true,
    enum: ['In Progress', 'Completed'],
    default: 'In Progress'
  },
  questions: [QuestionSchema],
  score: {
    type: Number,
    min: 0,
    max: 10
  },
  feedback: {
    strengths: [String],
    weaknesses: [String],
    overallRating: Number,
    summary: String
  },
  geminiResponse: {
    questionGeneration: String,
    finalFeedback: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }
});

const Interview = mongoose.model('Interview', InterviewSchema);

module.exports = Interview;
