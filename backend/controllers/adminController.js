const User = require('../models/user');
const Payment = require('../models/Payment');
const Match = require('../models/Match');

exports.getDashboardStats = async (req, res) => {
  console.log('Getting dashboard stats...');
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const stats = {
      totalUsers: await User.countDocuments(),
      activeUsers: await User.countDocuments({ 
        lastLogin: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
      }),
      newUsersToday: await User.countDocuments({ 
        createdAt: { $gte: today } 
      }),
      userStatus: {
        active: await User.countDocuments({ status: 'active' }),
        inactive: await User.countDocuments({ status: 'inactive' }),
        suspended: await User.countDocuments({ status: 'suspended' })
      },
      recentUsers: await User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email role createdAt'),
      payments: {
        total: await Payment.countDocuments(),
        recent: await Payment.find()
          .sort({ createdAt: -1 })
          .limit(10)
          .populate('userId', 'name email')
          .populate('matchId')
          .select('amount transactionId paymentMethod status createdAt')
      }
    };

    console.log('Stats generated successfully:', stats);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    res.status(500).json({ success: false, message: 'Error fetching stats', error: error.message });
  }
};

exports.approvePayment = async (req, res) => {
  try {
    const { matchId } = req.params;
    const match = await Match.findByIdAndUpdate(
      matchId,
      { paymentStatus: 'approved' },
      { new: true }
    );
    res.json(match);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};