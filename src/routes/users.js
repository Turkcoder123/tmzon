const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/users/:username  – get public profile
router.get('/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .populate('followers', 'username')
      .populate('following', 'username');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/users/:username/follow  – follow / unfollow (auth required)
router.post('/:username/follow', auth, async (req, res) => {
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
    res.json({ following: !alreadyFollowing, followersCount: target.followers.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
