const User = require('../models/User');

const subscribe = async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ success: false, message: 'Invalid subscription data.' });
    }

    const currentUserId = req.user._id;
    const user = await User.findById(currentUserId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    // Check for duplicate endpoint
    if (!user.pushSubscriptions.some(sub => sub.endpoint === subscription.endpoint)) {
      user.pushSubscriptions.push(subscription);
      await user.save();
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Subscribe error:', err);
    res.status(500).json({ success: false, message: 'Failed to subscribe for notifications.' });
  }
};

const unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ success: false, message: 'Endpoint is required.' });
    }

    const currentUserId = req.user._id;
    const user = await User.findById(currentUserId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    // Remove the subscription matching this endpoint
    user.pushSubscriptions = user.pushSubscriptions.filter(sub => sub.endpoint !== endpoint);
    await user.save();

    res.json({ success: true });
  } catch (err) {
    console.error('Unsubscribe error:', err);
    res.status(500).json({ success: false, message: 'Failed to unsubscribe from notifications.' });
  }
};

module.exports = { subscribe, unsubscribe };
