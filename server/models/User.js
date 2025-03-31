const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    select: false,
    minlength: [6, 'Password must be at least 6 characters long']
    // Not required for Google auth users
  },
  google_id: {
    type: String,
    select: false
  },
  profile_picture: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  date_joined: {
    type: Date,
    default: Date.now
  },
  last_login: {
    type: Date,
    default: Date.now
  },
  authType: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  solvedProblems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem'
  }],
  // New fields added for scoring and stats
  score: {
    type: Number,
    default: 0
  },
  completedInterviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview'
  }],
  streak: {
    type: Number,
    default: 0
  },
  lastActivityDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
