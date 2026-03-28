const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  createStory,
  getStories,
  viewStory,
  deleteStory,
} = require('../controllers/storyController');

router.post('/', auth, upload.single('image'), createStory);
router.get('/', auth, getStories);
router.post('/:id/view', auth, viewStory);
router.delete('/:id', auth, deleteStory);

module.exports = router;
