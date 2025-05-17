const Payment = require('../models/Payment');
const Match = require('../models/Match');
const User = require('../models/user');

exports.createPayment = async (req, res) => {
  try {
    console.log('Payment request received:', req.body);
    const { matchId, ...paymentData } = req.body;
    
    // Validate required fields
    if (!matchId || !paymentData.transactionId) {
      console.log('Payment validation failed: Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify match exists
    const match = await Match.findById(matchId);
    if (!match) {
      console.log('Match not found:', matchId);
      return res.status(404).json({ error: 'Match not found' });
    }

    // Verify user is part of this match
    if (match.requesterId.toString() !== req.user._id.toString() && 
        match.skillOwnerId.toString() !== req.user._id.toString()) {
      console.log('User not authorized for this match:', req.user._id);
      return res.status(403).json({ error: 'Not authorized for this match' });
    }

    const payment = new Payment({
      matchId,
      userId: req.user._id,
      ...paymentData
    });

    console.log('Saving payment to database...');
    await payment.save();
    console.log('Payment saved successfully:', payment);
    res.status(201).json(payment);
    
  } catch (err) {
    console.error('Error processing payment:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getPaymentsForMatch = async (req, res) => {
  try {
    const payments = await Payment.find({ matchId: req.params.matchId })
      .populate('userId', 'name email');
      
    res.json(payments);
  } catch (err) {
    console.error('Error fetching payments:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updatePaymentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const payment = await Payment.findById(req.params.paymentId);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    payment.status = status;
    await payment.save();

    // Update match status if both parties have paid
    await updateMatchStatusIfComplete(payment.matchId);

    res.json(payment);
  } catch (err) {
    console.error('Error updating payment:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.approvePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(
      req.params.paymentId,
      { status: 'Approved' },
      { new: true }
    );
    
    // Update match status if both payments are approved
    await updateMatchStatusIfComplete(payment.matchId);
    
    res.json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.rejectPayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(
      req.params.paymentId,
      { status: 'Rejected' },
      { new: true }
    );
    res.json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.listPendingPayments = async (req, res) => {
  try {
    const pendingPayments = await Payment.find({ status: 'Pending' })
      .populate('userId', 'name email')
      .populate('matchId', 'requesterId skillOwnerId');
    res.json(pendingPayments);
  } catch (err) {
    console.error('Error fetching pending payments:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getTotalEarnings = async (req, res) => {
  try {
    console.log('Calculating total earnings...');
    console.log('User role:', req.user.role);

    // First check if user is admin
    if (req.user.role !== 'admin') {
      console.log('User is not admin:', req.user.role);
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Find all approved payments
    const approvedPayments = await Payment.find({ status: 'Approved' })
      .populate('userId', 'name email')
      .populate('matchId');

    console.log('Found approved payments:', approvedPayments.length);
    
    // Calculate total earnings using actual payment amounts
    const totalEarnings = approvedPayments.reduce((sum, payment) => {
      return sum + (payment.amount || 0); // Use actual payment amount
    }, 0);

    console.log('Total earnings calculated:', totalEarnings);

    // Prepare payment details with actual amounts
    const paymentDetails = approvedPayments.map(payment => ({
      amount: payment.amount || 0,
      date: payment.updatedAt || payment.createdAt,
      user: payment.userId?.name || 'Unknown',
      matchId: payment.matchId?._id || 'Unknown',
      transactionId: payment.transactionId || 'Unknown'
    }));

    console.log('Payment details prepared:', paymentDetails.length);

    // Send response
    res.json({ 
      totalEarnings,
      paymentDetails
    });
  } catch (err) {
    console.error('Error calculating earnings:', err);
    res.status(500).json({ 
      error: 'Server error', 
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

async function updateMatchStatusIfComplete(matchId) {
  const payments = await Payment.find({ matchId });
  
  if (payments.length === 2 && payments.every(p => p.status === 'Approved')) {
    await Match.findByIdAndUpdate(matchId, { status: 'PaymentCompleted' });
  }
}