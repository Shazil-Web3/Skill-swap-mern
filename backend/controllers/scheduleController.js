const ScheduleMessage = require('../models/ScheduleMessage');
const User = require('../models/user');

// Send a schedule request
exports.sendScheduleRequest = async (req, res) => {
  try {
    const { receiverId, customMessage, selectedTime } = req.body;
    const senderId = req.user._id;

    const scheduleMessage = new ScheduleMessage({
      senderId,
      receiverId,
      customMessage,
      selectedTime,
      status: 'pending'
    });

    await scheduleMessage.save();
    res.status(201).json(scheduleMessage);
  } catch (error) {
    console.error('Error sending schedule request:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get template with user data
exports.getTemplate = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return template with all 5 points expected by the frontend
    res.json({
      greeting: `Hi, I'm ${user.name} and I'm excited to connect with you.`,
      customMessage: 'I want to learn and improve my skills with your guidance.',
      context: 'I would like to schedule a session to learn and improve my skills.',
      timeSelection: 'Please let me know your available time slots.',
      closing: 'Looking forward to your response and scheduling a session together.'
    });
  } catch (error) {
    console.error('Error getting template:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get messages for a user
exports.getMessagesForUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const messages = await ScheduleMessage.find({ 
      $or: [{ senderId: userId }, { receiverId: userId }]
    })
      .populate('senderId', 'name')
      .populate('receiverId', 'name')
      .sort({ createdAt: -1 });
    
    res.json(messages);
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ message: error.message });
  }
};

// Respond to a message (accept or reschedule)
exports.respondToMessage = async (req, res) => {
  try {
    const { messageId, action, newTime } = req.body;
    const message = await ScheduleMessage.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (action === 'accept') {
      message.status = 'accepted';
    } else if (action === 'reschedule') {
      if (!newTime) {
        return res.status(400).json({ message: 'New time is required for rescheduling' });
      }
      message.status = 'rescheduled';
      message.selectedTime = newTime;
    }

    await message.save();
    res.json(message);
  } catch (error) {
    console.error('Error responding to message:', error);
    res.status(500).json({ message: error.message });
  }
}; 