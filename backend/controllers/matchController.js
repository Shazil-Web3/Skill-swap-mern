// ... existing imports ...

exports.createMatch = async (req, res) => {
  try {
    const { skillId } = req.body;
    
    // Get full requester details
    const requester = await User.findById(req.user._id).select('name email');
    if (!requester) {
      return res.status(404).json({ error: 'User not found' });
    }

    const skill = await Skill.findById(skillId).populate('userId');
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    const match = new Match({
      skillId,
      requesterId: req.user._id,
      requesterName: requester.name,
      requesterEmail: requester.email,
      skillOwnerId: skill.userId._id,
      status: 'Pending'
    });

    await match.save();
    
    // Return match with populated data
    const populatedMatch = await Match.findById(match._id)
      .populate('skillId', 'name level description')
      .populate('requesterId', 'name email');

    res.status(201).json(populatedMatch);
  } catch (err) {
    console.error('Error creating match:', err);
    res.status(500).json({ error: 'Server error' });
  }
};