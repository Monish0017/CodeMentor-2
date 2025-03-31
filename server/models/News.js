const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Please add content']
  },
  imageUrl: {
    type: String,
    default: null
  },
  source: {
    type: String,
    required: [true, 'Please add source']
  },
  sourceUrl: {
    type: String,
    required: [true, 'Please add source URL']
  },
  category: {
    type: String,
    required: [true, 'Please specify category'],
    enum: ['Tech News', 'Job Posting', 'Coding Challenge', 'Promotion']
  },
  expiresAt: {
    type: Date,
    default: null // For temporary promotions/job postings
  },
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('News', newsSchema);
