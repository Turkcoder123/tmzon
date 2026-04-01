const User = require('../models/User');
const logger = require('../logger');

// GET /api/users/me – own profile (auth required)
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('followers', 'username avatar')
      .populate('following', 'username avatar');
    if (!user) return res.status(404).json({ message: 'User not found' });
    logger.debug('getMe', { user: req.user.username });
    res.json(user);
  } catch (err) {
    logger.error('getMe error', { message: err.message, user: req.user.username });
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/users/me – update own profile (auth required)
exports.updateMe = async (req, res) => {
  try {
    const bio = req.body.bio !== undefined ? String(req.body.bio) : undefined;
    const avatar = req.body.avatar !== undefined ? String(req.body.avatar) : undefined;
    const username = req.body.username !== undefined ? String(req.body.username).trim() : undefined;
    const updates = {};
    if (bio !== undefined) updates.bio = bio;
    if (avatar !== undefined) updates.avatar = avatar;
    if (username !== undefined) {
      const taken = await User.findOne({ username, _id: { $ne: req.user.id } });
      if (taken) return res.status(409).json({ message: 'Username already taken' });
      updates.username = username;
    }
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true })
      .populate('followers', 'username avatar')
      .populate('following', 'username avatar');
    if (!user) return res.status(404).json({ message: 'User not found' });
    logger.info('Profile updated', { user: req.user.username, fields: Object.keys(updates) });
    res.json(user);
  } catch (err) {
    logger.error('updateMe error', { message: err.message, user: req.user.username });
    res.status(500).json({ message: err.message });
  }
};

// GET /api/users/:username – get public profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .populate('followers', 'username avatar')
      .populate('following', 'username avatar');
    if (!user) return res.status(404).json({ message: 'User not found' });
    logger.debug('getProfile', { username: req.params.username });
    res.json(user);
  } catch (err) {
    logger.error('getProfile error', { message: err.message, username: req.params.username });
    res.status(500).json({ message: err.message });
  }
};

// POST /api/users/:username/follow – follow / unfollow (auth required)
exports.toggleFollow = async (req, res) => {
  try {
    if (req.params.username === req.user.username) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }
    const target = await User.findOne({ username: req.params.username });
    if (!target) return res.status(404).json({ message: 'User not found' });

    const me = await User.findById(req.user.id);
    const alreadyFollowing = me.following.some((id) => id.toString() === target._id.toString());

    if (alreadyFollowing) {
      me.following = me.following.filter((id) => id.toString() !== target._id.toString());
      target.followers = target.followers.filter((id) => id.toString() !== me._id.toString());
    } else {
      me.following.push(target._id);
      target.followers.push(me._id);
    }
    await me.save();
    await target.save();
    const action = alreadyFollowing ? 'unfollowed' : 'followed';
    logger.info(`User ${action}`, { actor: req.user.username, target: req.params.username, followersCount: target.followers.length });
    res.json({ following: !alreadyFollowing, followersCount: target.followers.length });
  } catch (err) {
    logger.error('toggleFollow error', { message: err.message, actor: req.user.username, target: req.params.username });
    res.status(500).json({ message: err.message });
  }
};
