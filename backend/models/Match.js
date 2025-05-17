const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  skillId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: [true, 'Skill ID is required']
  },
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Requester ID is required']
  },
  requesterName: {
    type: String,
    required: true
  },
  requesterEmail: {
    type: String,
    required: true
  },
  skillOwnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Skill owner ID is required']
  },
  // In the status enum, add:
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected', 'PaymentCompleted'],
    default: 'Pending'
  },
  // In the match schema, add:
  paymentStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, { timestamps: true });

// Compound index to prevent duplicate pending requests
matchSchema.index(
  { skillId: 1, requesterId: 1, status: 1 },
  { 
    unique: true,
    partialFilterExpression: { status: 'Pending' }
  }
);

// Add a method to check if a match can be updated
matchSchema.methods.canUpdate = function() {
  return this.status === 'Pending';
};

// Add a method to check if a user can interact with the match
matchSchema.methods.canInteract = function(userId) {
  return this.skillOwnerId.toString() === userId.toString();
};

// Pre-save middleware to ensure requester and owner are different
matchSchema.pre('save', async function(next) {
  if (this.requesterId.toString() === this.skillOwnerId.toString()) {
    next(new Error('Requester cannot be the same as skill owner'));
  }
  next();
});

const Match = mongoose.model('Match', matchSchema);

module.exports = Match;