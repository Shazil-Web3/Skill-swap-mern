const ScheduleMessage = require('../models/ScheduleMessage');
const User = require('../models/user');

// Send a schedule request
exports.sendScheduleRequest = async (req, res) => {
  try {
    const { receiverId, customMessage, selectedTime } = req.body;
    const senderId = req.user._id; // Assuming user is authenticated

    // Check if user has paid and is approved (implement your logic here)
    const sender = await User.findById(senderId);
    if (!sender.isApproved || !sender.hasPaid) {
      return res.status(403).json({ message: 'User must be approved and have paid to send requests' });
    }

    const scheduleMessage = new ScheduleMessage({
      senderId,
      receiverId,
      customMessage,
      selectedTime
    });

    await scheduleMessage.save();
    res.status(201).json(scheduleMessage);
  } catch (error) {
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

    res.json({
      userName: user.name,
      template: {
        greeting: `Hi, ${user.name} is excited to connect with you.`,
        customMessage: '',
        context: 'Please schedule a meeting with me to continue learning.',
        timeSelection: '',
        closing: 'Looking forward to your confirmation.'
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get messages for a user
exports.getMessagesForUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const messages = await ScheduleMessage.find({ receiverId: userId })
      .populate('senderId', 'name')
      .sort({ createdAt: -1 });
    
    res.json(messages);
  } catch (error) {
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
    res.status(500).json({ message: error.message });
  }
}; 