const User = require('../models/user');

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.addUserSkill = async (req, res) => {
  try {
    const { name, level } = req.body;
    console.log(`Adding skill for user ${req.user.id}:`, { name, level });
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $push: { 'profile.skills': { name, level } } },
      { new: true }
    );
    
    console.log('Skill added successfully:', user.profile.skills);
    res.json(user.profile.skills);
  } catch (err) {
    console.error('Error adding skill:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getUserSkills = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('profile.skills');
    console.log('Fetched skills for user:', user.profile.skills.length);
    res.json(user.profile.skills);
  } catch (err) {
    console.error('Error fetching skills:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.searchSkills = async (req, res) => {
  try {
    const { term } = req.query;
    console.log(`Searching skills for term: ${term}`);
    
    const users = await User.find({
      'profile.skills.name': { $regex: term, $options: 'i' }
    }).select('profile.skills name');
    
    const skills = users.flatMap(user => 
      user.profile.skills
        .filter(skill => skill.name.toLowerCase().includes(term.toLowerCase()))
        .map(skill => ({
          ...skill.toObject(),
          user: { id: user._id, name: user.name }
        }))
    );
    
    console.log(`Found ${skills.length} matching skills`);
    res.json(skills);
  } catch (err) {
    console.error('Error searching skills:', err);
    res.status(500).json({ error: 'Server error' });
  }
};