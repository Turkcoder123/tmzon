const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getProfile,
  updateProfile,
  followUser,
  getUserPosts,
} = require('../controllers/profileController');

router.get('/:username', auth, getProfile);
router.put('/', auth, upload.single('avatar'), updateProfile);
router.post('/:userId/follow', auth, followUser);
router.get('/:username/posts', auth, getUserPosts);

module.exports = router;
