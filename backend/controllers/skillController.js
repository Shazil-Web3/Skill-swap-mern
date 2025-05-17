const Skill = require('../models/Skill');
const User = require('../models/user');

exports.addSkill = async (req, res) => {
  try {
    const { name, level, description } = req.body;
    console.log('\n=== SKILL ADDITION ATTEMPT ===');
    console.log('Request user:', req.user);
    console.log('User ID from request:', req.user?.id);
    console.log('Skill Data:', { name, level, description });

    if (!req.user?.id) {
      console.error('No user ID found in request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const skill = new Skill({
      name: name.toLowerCase().trim(),
      level,
      description: description || '',
      userId: req.user.id
    });

    const savedSkill = await skill.save();
    console.log('=== SKILL SAVED TO DB ===');
    console.log('Skill ID:', savedSkill._id);
    console.log('Full Document:', savedSkill);

    res.status(201).json(savedSkill);
  } catch (err) {
    console.error('\n=== SKILL SAVE ERROR ===');
    console.error('Error:', err);
    res.status(500).json({ error: 'Failed to save skill' });
  }
};

exports.getUserSkills = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const skills = await Skill.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    
    res.json(skills);
  } catch (err) {
    console.error('Error fetching skills:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.searchSkills = async (req, res) => {
  try {
    const { term } = req.query;
    console.log('Searching skills for:', term);
    
    if (!term?.trim()) {
      return res.status(400).json({ error: 'Search term is required' });
    }

    const skills = await Skill.find({
      $or: [
        { name: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } }
      ]
    })
    .populate('userId', 'name email')
    .sort({ createdAt: -1 });

    console.log(`Found ${skills.length} matching skills`);
    res.json(skills);
  } catch (err) {
    console.error('Error searching skills:', err);
    res.status(500).json({ error: 'Server error' });
  }
};