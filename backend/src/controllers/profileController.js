const User = require('../models/User');
const Post = require('../models/Post');

// GET /api/profile/:username
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username, isActive: true });
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    const postCount = await Post.countDocuments({ author: user._id, isActive: true });

    res.json({
      user: user.toPublicJSON(),
      stats: {
        posts: postCount,
        followers: user.followers.length,
        following: user.following.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { displayName, bio, username } = req.body;
    const updates = {};

    if (displayName !== undefined) updates.displayName = displayName;
    if (bio !== undefined) updates.bio = bio;
    if (username !== undefined) {
      const existing = await User.findOne({ username, _id: { $ne: req.userId } });
      if (existing) {
        return res.status(409).json({ error: 'Bu kullanıcı adı zaten kullanılıyor' });
      }
      updates.username = username;
    }

    if (req.file) {
      updates.avatar = `/uploads/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(req.userId, updates, {
      new: true,
      runValidators: true,
    });

    res.json({ user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
};

// POST /api/profile/:userId/follow
exports.followUser = async (req, res, next) => {
  try {
    const targetId = req.params.userId;
    if (targetId === req.userId.toString()) {
      return res.status(400).json({ error: 'Kendinizi takip edemezsiniz' });
    }

    const target = await User.findById(targetId);
    if (!target || !target.isActive) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    const isFollowing = req.user.following.includes(targetId);

    if (isFollowing) {
      req.user.following.pull(targetId);
      target.followers.pull(req.userId);
    } else {
      req.user.following.push(targetId);
      target.followers.push(req.userId);
    }

    await Promise.all([req.user.save(), target.save()]);

    res.json({
      following: !isFollowing,
      followersCount: target.followers.length,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/profile/:username/posts
exports.getUserPosts = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const posts = await Post.find({ author: user._id, isActive: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username displayName avatar');

    res.json({ posts });
  } catch (err) {
    next(err);
  }
};
