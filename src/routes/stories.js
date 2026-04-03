const express = require('express');
const storyController = require('../controllers/storyController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, storyController.getStories);
router.get('/user/:username', auth, storyController.getUserStories);
router.post('/', auth, storyController.createStory);
router.post('/:id/view', auth, storyController.viewStory);
router.delete('/:id', auth, storyController.deleteStory);

module.exports = router;
