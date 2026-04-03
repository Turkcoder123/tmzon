const Post = require('../models/Post');
const User = require('../models/User');
const logger = require('../logger');

// GET /api/explore – discover feed (posts from users you don't follow, sorted by engagement)
exports.getExploreFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const skip = (page - 1) * limit;

    let excludeAuthors = [];
    if (req.user) {
      const me = await User.findById(req.user.id);
      if (me) {
        excludeAuthors = [me._id, ...me.following];
      }
    }

    const query = excludeAuthors.length > 0
      ? { author: { $nin: excludeAuthors } }
      : {};

    const posts = await Post.aggregate([
      { $match: query },
      {
        $addFields: {
          engagement: {
            $add: [
              { $size: '$likes' },
              { $multiply: [{ $size: '$comments' }, 2] },
            ],
          },
        },
      },
      { $sort: { engagement: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    // Populate author info
    await Post.populate(posts, { path: 'author', select: 'username avatar' });
    await Post.populate(posts, { path: 'comments.author', select: 'username avatar' });

    logger.debug('getExploreFeed', { user: req.user ? req.user.username : 'anonymous', count: posts.length });
    res.json(posts);
  } catch (err) {
    logger.error('getExploreFeed error', { message: err.message });
    res.status(500).json({ message: err.message });
  }
};

// GET /api/explore/trending – trending posts (most engaged in last 7 days)
exports.getTrending = async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const posts = await Post.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $addFields: {
          engagement: {
            $add: [
              { $size: '$likes' },
              { $multiply: [{ $size: '$comments' }, 2] },
            ],
          },
        },
      },
      { $sort: { engagement: -1 } },
      { $limit: 20 },
    ]);

    await Post.populate(posts, { path: 'author', select: 'username avatar' });
    await Post.populate(posts, { path: 'comments.author', select: 'username avatar' });

    logger.debug('getTrending', { count: posts.length });
    res.json(posts);
  } catch (err) {
    logger.error('getTrending error', { message: err.message });
    res.status(500).json({ message: err.message });
  }
};

// GET /api/explore/search – search posts and users
exports.search = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const query = q.trim();
    const regex = new RegExp(query, 'i');

    const [users, posts] = await Promise.all([
      User.find({
        $or: [
          { username: regex },
          { bio: regex },
        ],
      })
        .select('username avatar bio followers')
        .limit(10),
      Post.find({ content: regex })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('author', 'username avatar')
        .populate('comments.author', 'username avatar'),
    ]);

    logger.debug('search', { query, usersFound: users.length, postsFound: posts.length });
    res.json({ users, posts });
  } catch (err) {
    logger.error('search error', { message: err.message });
    res.status(500).json({ message: err.message });
  }
};
