const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  level: {
    type: String,
    required: true,
    enum: ['beginner', 'intermediate', 'advanced']
  },
  description: {
    type: String,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Create compound text index
skillSchema.index({ 
  name: 'text',
  description: 'text'
}, {
  weights: {
    name: 3,
    description: 1
  }
});

module.exports = mongoose.model('Skill', skillSchema);