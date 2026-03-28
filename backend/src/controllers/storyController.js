const Story = require('../models/Story');
const redis = require('../config/redis');

// POST /api/stories
exports.createStory = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Story için resim gerekli' });
    }

    const story = await Story.create({
      author: req.userId,
      image: `/uploads/${req.file.filename}`,
      caption: req.body.caption || '',
    });

    await story.populate('author', 'username displayName avatar');
    res.status(201).json({ story });
  } catch (err) {
    next(err);
  }
};

// GET /api/stories
exports.getStories = async (req, res, next) => {
  try {
    const cacheKey = 'stories:active';
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const stories = await Story.find({ isActive: true, expiresAt: { $gt: new Date() } })
      .sort({ createdAt: -1 })
      .populate('author', 'username displayName avatar');

    const grouped = {};
    stories.forEach((story) => {
      const authorId = story.author._id.toString();
      if (!grouped[authorId]) {
        grouped[authorId] = {
          user: story.author,
          stories: [],
        };
      }
      grouped[authorId].stories.push(story);
    });

    const result = { stories: Object.values(grouped) };
    await redis.setex(cacheKey, 30, JSON.stringify(result));
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// POST /api/stories/:id/view
exports.viewStory = async (req, res, next) => {
  try {
    const story = await Story.findOne({ _id: req.params.id, isActive: true });
    if (!story) {
      return res.status(404).json({ error: 'Story bulunamadı' });
    }

    if (!story.viewers.includes(req.userId)) {
      story.viewers.push(req.userId);
      await story.save();
    }

    res.json({ message: 'Görüntülendi' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/stories/:id
exports.deleteStory = async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ error: 'Story bulunamadı' });
    }

    if (story.author.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Yetkisiz' });
    }

    story.isActive = false;
    await story.save();
    res.json({ message: 'Story silindi' });
  } catch (err) {
    next(err);
  }
};
