const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  difficulty: {
    type: String,
    required: [true, 'Please specify difficulty level'],
    enum: ['Easy', 'Medium', 'Hard']
  },
  category: {
    type: String,
    required: [true, 'Please specify a category'],
    enum: [
      'Arrays', 
      'Strings', 
      'Linked Lists', 
      'Trees', 
      'Graphs', 
      'Dynamic Programming', 
      'Sorting', 
      'Searching', 
      'Hash Tables', 
      'Recursion',
      'Math',
      'Other'
    ]
  },
  examples: [{
    input: {
      type: String,
      required: [true, 'Please provide an example input']
    },
    output: {
      type: String,
      required: [true, 'Please provide an example output']
    },
    explanation: {
      type: String
    }
  }],
  constraints: {
    type: String
  },
  testCases: [{
    input: {
      type: String,
      required: [true, 'Please provide test case input']
    },
    output: {
      type: String,
      required: [true, 'Please provide expected output']
    },
    isHidden: {
      type: Boolean,
      default: false
    }
  }],
  solution: {
    type: String
  },
  hints: [String],
  tags: [String],
  companies: [String],
  submissionsCount: {
    type: Number,
    default: 0
  },
  successRate: {
    type: Number,
    default: 0
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add a text index for search functionality
problemSchema.index({ 
  title: 'text', 
  description: 'text',
  tags: 'text' 
});

module.exports = mongoose.model('Problem', problemSchema);
