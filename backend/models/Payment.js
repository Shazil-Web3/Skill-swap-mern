const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  whatsappNumber: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  transactionId: {
    type: String,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['Bkash', 'Nagad', 'Card'],
    required: true
  },
  userCategory: {
    type: String,
    enum: ['Student', 'Teacher'],
    required: true
  },
  country: {
    type: String,
    required: true
  },
  educationalField: {
    type: String,
    required: true
  },
  institution: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Payment', paymentSchema);