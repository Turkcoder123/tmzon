const Post = require('../models/Post');
const Comment = require('../models/Comment');
const redis = require('../config/redis');

// POST /api/posts
exports.createPost = async (req, res, next) => {
  try {
    const { content } = req.body;
    const images = req.files ? req.files.map((f) => `/uploads/${f.filename}`) : [];

    if (!content && images.length === 0) {
      return res.status(400).json({ error: 'İçerik veya resim gerekli' });
    }

    const post = await Post.create({ author: req.userId, content, images });
    await post.populate('author', 'username displayName avatar');

    await redis.del('feed:global');

    res.status(201).json({ post });
  } catch (err) {
    next(err);
  }
};

// GET /api/posts/feed
exports.getFeed = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const cacheKey = `feed:global:${page}:${limit}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const posts = await Post.find({ isActive: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username displayName avatar');

    const total = await Post.countDocuments({ isActive: true });
    const result = { posts, page, limit, total, pages: Math.ceil(total / limit) };

    await redis.setex(cacheKey, 60, JSON.stringify(result));
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// GET /api/posts/:id
exports.getPost = async (req, res, next) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, isActive: true }).populate(
      'author',
      'username displayName avatar'
    );

    if (!post) {
      return res.status(404).json({ error: 'Gönderi bulunamadı' });
    }

    res.json({ post });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/posts/:id
exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Gönderi bulunamadı' });
    }

    if (post.author.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Yetkisiz' });
    }

    post.isActive = false;
    await post.save();

    await redis.del('feed:global');
    res.json({ message: 'Gönderi silindi' });
  } catch (err) {
    next(err);
  }
};

// POST /api/posts/:id/like
exports.likePost = async (req, res, next) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, isActive: true });
    if (!post) {
      return res.status(404).json({ error: 'Gönderi bulunamadı' });
    }

    const alreadyLiked = post.likes.includes(req.userId);

    if (alreadyLiked) {
      post.likes.pull(req.userId);
      post.likesCount = Math.max(0, post.likesCount - 1);
    } else {
      post.likes.push(req.userId);
      post.likesCount += 1;
    }

    await post.save();
    res.json({ liked: !alreadyLiked, likesCount: post.likesCount });
  } catch (err) {
    next(err);
  }
};

// POST /api/posts/:id/comments
exports.addComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Yorum içeriği gerekli' });
    }

    const post = await Post.findOne({ _id: req.params.id, isActive: true });
    if (!post) {
      return res.status(404).json({ error: 'Gönderi bulunamadı' });
    }

    const comment = await Comment.create({
      post: post._id,
      author: req.userId,
      content,
    });

    post.commentsCount += 1;
    await post.save();

    await comment.populate('author', 'username displayName avatar');
    res.status(201).json({ comment });
  } catch (err) {
    next(err);
  }
};

// GET /api/posts/:id/comments
exports.getComments = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const comments = await Comment.find({ post: req.params.id, isActive: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username displayName avatar');

    res.json({ comments });
  } catch (err) {
    next(err);
  }
};
