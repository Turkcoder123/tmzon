const Story = require('../models/Story');
const User = require('../models/User');
const logger = require('../logger');

// GET /api/stories – list active stories from followed users + own
exports.getStories = async (req, res) => {
  try {
    const me = await User.findById(req.user.id);
    if (!me) return res.status(404).json({ message: 'User not found' });

    const authors = [me._id, ...me.following];

    const stories = await Story.find({
      author: { $in: authors },
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .populate('author', 'username avatar');

    // Group by author
    const grouped = {};
    for (const story of stories) {
      const authorId = story.author._id.toString();
      if (!grouped[authorId]) {
        grouped[authorId] = {
          user: story.author,
          stories: [],
          hasNew: false,
        };
      }
      grouped[authorId].stories.push(story);
      if (!story.viewers.some((v) => v.toString() === req.user.id)) {
        grouped[authorId].hasNew = true;
      }
    }

    // Own stories first, then others
    const result = [];
    if (grouped[req.user.id]) {
      result.push(grouped[req.user.id]);
      delete grouped[req.user.id];
    }
    result.push(...Object.values(grouped));

    logger.debug('getStories', { user: req.user.username, groups: result.length });
    res.json(result);
  } catch (err) {
    logger.error('getStories error', { message: err.message, user: req.user.username });
    res.status(500).json({ message: err.message });
  }
};

// GET /api/stories/user/:username – get stories by specific user
exports.getUserStories = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const stories = await Story.find({
      author: user._id,
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .populate('author', 'username avatar');

    logger.debug('getUserStories', { username: req.params.username, count: stories.length });
    res.json(stories);
  } catch (err) {
    logger.error('getUserStories error', { message: err.message, username: req.params.username });
    res.status(500).json({ message: err.message });
  }
};

// POST /api/stories – create a story
exports.createStory = async (req, res) => {
  try {
    const { content, backgroundColor, textColor } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'content is required' });
    }

    const story = await Story.create({
      author: req.user.id,
      content: content.trim(),
      backgroundColor: backgroundColor || '#1DA1F2',
      textColor: textColor || '#FFFFFF',
    });

    await story.populate('author', 'username avatar');

    logger.info('Story created', { storyId: story._id, author: req.user.username });
    res.status(201).json(story);
  } catch (err) {
    logger.error('createStory error', { message: err.message, user: req.user.username });
    res.status(500).json({ message: err.message });
  }
};

// POST /api/stories/:id/view – mark story as viewed
exports.viewStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });

    const alreadyViewed = story.viewers.some((v) => v.toString() === req.user.id);
    if (!alreadyViewed) {
      story.viewers.push(req.user.id);
      await story.save();
    }

    logger.debug('Story viewed', { storyId: req.params.id, user: req.user.username });
    res.json({ viewed: true, viewersCount: story.viewers.length });
  } catch (err) {
    logger.error('viewStory error', { message: err.message, storyId: req.params.id });
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/stories/:id – delete own story
exports.deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });

    if (story.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await story.deleteOne();
    logger.info('Story deleted', { storyId: req.params.id, author: req.user.username });
    res.json({ message: 'Story deleted' });
  } catch (err) {
    logger.error('deleteStory error', { message: err.message, storyId: req.params.id });
    res.status(500).json({ message: err.message });
  }
};
