const Post = require('../models/Post');
const User = require('../models/User');
const logger = require('../logger');

// GET /api/posts – list all posts (newest first)
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('author', 'username avatar')
      .populate('comments.author', 'username avatar');
    logger.debug('getAllPosts', { count: posts.length });
    res.json(posts);
  } catch (err) {
    logger.error('getAllPosts error', { message: err.message });
    res.status(500).json({ message: err.message });
  }
};

// GET /api/posts/feed – posts from followed users (auth required)
exports.getFeed = async (req, res) => {
  try {
    const me = await User.findById(req.user.id);
    if (!me) return res.status(404).json({ message: 'User not found' });

    const authors = [me._id, ...me.following];
    const posts = await Post.find({ author: { $in: authors } })
      .sort({ createdAt: -1 })
      .populate('author', 'username avatar')
      .populate('comments.author', 'username avatar');
    logger.debug('getFeed', { user: req.user.username, count: posts.length });
    res.json(posts);
  } catch (err) {
    logger.error('getFeed error', { message: err.message, user: req.user.username });
    res.status(500).json({ message: err.message });
  }
};

// GET /api/posts/user/:username – posts by a specific user
exports.getUserPosts = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const posts = await Post.find({ author: user._id })
      .sort({ createdAt: -1 })
      .populate('author', 'username avatar')
      .populate('comments.author', 'username avatar');
    logger.debug('getUserPosts', { username: req.params.username, count: posts.length });
    res.json(posts);
  } catch (err) {
    logger.error('getUserPosts error', { message: err.message, username: req.params.username });
    res.status(500).json({ message: err.message });
  }
};

// GET /api/posts/:id – get single post
exports.getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username avatar')
      .populate('comments.author', 'username avatar');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    logger.debug('getPost', { postId: req.params.id });
    res.json(post);
  } catch (err) {
    logger.error('getPost error', { message: err.message, postId: req.params.id });
    res.status(500).json({ message: err.message });
  }
};

// POST /api/posts – create post (auth required)
exports.createPost = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'content is required' });
    const post = await Post.create({ author: req.user.id, content });
    await post.populate('author', 'username avatar');
    logger.info('Post created', { postId: post._id, author: req.user.username });
    res.status(201).json(post);
  } catch (err) {
    logger.error('createPost error', { message: err.message, user: req.user.username });
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/posts/:id – delete post (owner only)
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.user.id) {
      logger.warn('deletePost unauthorized', { postId: req.params.id, user: req.user.username });
      return res.status(403).json({ message: 'Not authorized' });
    }
    await post.deleteOne();
    logger.info('Post deleted', { postId: req.params.id, author: req.user.username });
    res.json({ message: 'Post deleted' });
  } catch (err) {
    logger.error('deletePost error', { message: err.message, postId: req.params.id });
    res.status(500).json({ message: err.message });
  }
};

// POST /api/posts/:id/like – toggle like (auth required)
exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const userId = req.user.id;
    const alreadyLiked = post.likes.some((id) => id.toString() === userId);
    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      post.likes.push(userId);
    }
    await post.save();
    const action = alreadyLiked ? 'unliked' : 'liked';
    logger.info(`Post ${action}`, { postId: req.params.id, user: req.user.username, likes: post.likes.length });
    res.json({ likes: post.likes.length, liked: !alreadyLiked });
  } catch (err) {
    logger.error('toggleLike error', { message: err.message, postId: req.params.id });
    res.status(500).json({ message: err.message });
  }
};

// POST /api/posts/:id/comments – add comment (auth required)
exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'content is required' });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    post.comments.push({ author: req.user.id, content });
    await post.save();
    await post.populate('comments.author', 'username avatar');
    const comment = post.comments[post.comments.length - 1];
    logger.info('Comment added', { postId: req.params.id, commentId: comment._id, user: req.user.username });
    res.status(201).json(comment);
  } catch (err) {
    logger.error('addComment error', { message: err.message, postId: req.params.id });
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/posts/:id/comments/:commentId – delete comment (owner only)
exports.deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.author.toString() !== req.user.id) {
      logger.warn('deleteComment unauthorized', { postId: req.params.id, commentId: req.params.commentId, user: req.user.username });
      return res.status(403).json({ message: 'Not authorized' });
    }
    comment.deleteOne();
    await post.save();
    logger.info('Comment deleted', { postId: req.params.id, commentId: req.params.commentId, user: req.user.username });
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    logger.error('deleteComment error', { message: err.message, postId: req.params.id });
    res.status(500).json({ message: err.message });
  }
};
