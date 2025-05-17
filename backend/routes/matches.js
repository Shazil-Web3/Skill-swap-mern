const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Match = require('../models/Match');
const Skill = require('../models/Skill');
const User = require('../models/user');
const Payment = require('../models/Payment');

// Get all matches for admin (this should be first to avoid conflicts)
router.get('/', auth(['admin']), async (req, res) => {
  try {
    console.log('Fetching all matches for admin...');
    console.log('User role:', req.user.role);
    
    const matches = await Match.find()
      .populate({
        path: 'skillId',
        select: 'title description'
      })
      .populate({
        path: 'requesterId',
        select: 'name email'
      })
      .populate({
        path: 'skillOwnerId',
        select: 'name email'
      })
      .sort({ createdAt: -1 });

    console.log('Found matches:', matches.length);

    // Get payment information for each match
    const matchesWithPayments = await Promise.all(matches.map(async (match) => {
      const payments = await Payment.find({ matchId: match._id })
        .populate('userId', 'name email');
      return {
        ...match.toObject(),
        payments
      };
    }));

    console.log('Matches with payments:', matchesWithPayments.length);
    res.json(matchesWithPayments);
  } catch (err) {
    console.error('Error fetching matches:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Request a match
router.post('/request', auth(), async (req, res) => {
  try {
    const { skillId } = req.body;
    
    // Get requester info from authenticated user
    const requester = await User.findById(req.user._id);
    if (!requester) {
      return res.status(404).json({ error: 'User not found' });
    }

    const skill = await Skill.findById(skillId).populate('userId');
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    // Check for existing match
    const existingMatch = await Match.findOne({
      skillId,
      requesterId: req.user._id,
      status: { $in: ['Pending', 'Accepted'] }
    });

    if (existingMatch) {
      return res.status(400).json({ error: 'Match request already exists' });
    }

    // Create match with requester details
    const match = new Match({
      skillId,
      requesterId: req.user._id,
      requesterName: requester.name,
      requesterEmail: requester.email,
      skillOwnerId: skill.userId._id,
      status: 'Pending'
    });

    await match.save();
    
    // Populate additional data for response
    const populatedMatch = await Match.populate(match, [
      { path: 'skillId' },
      { path: 'requesterId', select: 'name email' }
    ]);

    res.status(201).json(populatedMatch);
  } catch (err) {
    console.error('Error creating match request:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get received matches for a user
router.get('/received', auth(), async (req, res) => {
  try {
    console.log('Fetching matches for user:', req.user._id);
    
    // Find matches where user is either requester or skill owner
    const matches = await Match.find({
      $or: [
        { requesterId: req.user._id },
        { skillOwnerId: req.user._id }
      ]
    })
    .populate({
      path: 'skillId',
      select: 'title description'
    })
    .populate({
      path: 'requesterId',
      select: 'name email'
    })
    .populate({
      path: 'skillOwnerId',
      select: 'name email'
    })
    .sort({ createdAt: -1 });

    console.log('Found matches:', matches.length);

    // Get payment information for each match
    const matchesWithPayments = await Promise.all(matches.map(async (match) => {
      // Find all payments for this match
      const payments = await Payment.find({ matchId: match._id })
        .populate('userId', 'name email');
      
      console.log('Payments for match:', match._id, payments);

      // Get payment status for both users
      const requesterPayment = payments.find(p => 
        p.userId._id.toString() === match.requesterId._id.toString()
      );
      const skillOwnerPayment = payments.find(p => 
        p.userId._id.toString() === match.skillOwnerId._id.toString()
      );

      console.log('Payment status:', {
        matchId: match._id,
        requesterPayment: requesterPayment?.status || 'PENDING',
        skillOwnerPayment: skillOwnerPayment?.status || 'PENDING'
      });
      
      // Check if both users have paid
      const bothPaid = requesterPayment?.status === 'Approved' && skillOwnerPayment?.status === 'Approved';
      
      // Determine user's role in this match
      const isRequester = match.requesterId._id.toString() === req.user._id.toString();
      const isSkillOwner = match.skillOwnerId._id.toString() === req.user._id.toString();
      
      // Log match details for debugging
      console.log('Match details:', {
        matchId: match._id,
        requesterId: match.requesterId._id,
        skillOwnerId: match.skillOwnerId._id,
        currentUserId: req.user._id,
        isRequester,
        isSkillOwner,
        status: match.status,
        requesterPaymentStatus: requesterPayment?.status || 'PENDING',
        skillOwnerPaymentStatus: skillOwnerPayment?.status || 'PENDING',
        bothPaid
      });

      // Create the match object with all necessary information
      const matchObject = {
        ...match.toObject(),
        payments,
        bothPaid,
        requesterPaymentStatus: requesterPayment?.status || 'PENDING',
        skillOwnerPaymentStatus: skillOwnerPayment?.status || 'PENDING',
        userRole: isRequester ? 'requester' : 'skillOwner',
        canAccept: isSkillOwner && match.status === 'Pending',
        canPay: match.status === 'Accepted' && (
          (isRequester && (!requesterPayment || requesterPayment.status !== 'Approved')) ||
          (isSkillOwner && (!skillOwnerPayment || skillOwnerPayment.status !== 'Approved'))
        ),
        isCurrentUserRequester: isRequester,
        isCurrentUserSkillOwner: isSkillOwner,
        currentUserId: req.user._id
      };

      console.log('Processed match object:', matchObject);
      return matchObject;
    }));

    console.log('Matches with payments:', matchesWithPayments.length);
    res.json(matchesWithPayments);
  } catch (err) {
    console.error('Error fetching matches:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Accept a match request
router.post('/:matchId/accept', auth(), async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId);
    
    if (!match) {
      return res.status(404).json({ error: 'Match request not found' });
    }

    // Check if user is the skill owner
    if (match.skillOwnerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    match.status = 'Accepted';
    await match.save();

    res.json(match);
  } catch (err) {
    console.error('Error accepting match:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reject a match request
router.post('/:matchId/reject', auth(), async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId);
    
    if (!match) {
      return res.status(404).json({ error: 'Match request not found' });
    }

    // Check if user is the skill owner
    if (match.skillOwnerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    match.status = 'Rejected';
    await match.save();

    res.json(match);
  } catch (err) {
    console.error('Error rejecting match:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;