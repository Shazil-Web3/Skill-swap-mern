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

// Get received match requests
router.get('/received', auth(), async (req, res) => {
  try {
    const matches = await Match.find({ skillOwnerId: req.user._id })
      .populate('skillId')
      .populate('requesterId', 'name email')
      .sort({ createdAt: -1 });

    res.json(matches);
  } catch (err) {
    console.error('Error fetching matches:', err);
    res.status(500).json({ error: 'Server error' });
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