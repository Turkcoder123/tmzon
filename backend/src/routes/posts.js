const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  createPost,
  getFeed,
  getPost,
  deletePost,
  likePost,
  addComment,
  getComments,
} = require('../controllers/postController');

router.post('/', auth, upload.array('images', 4), createPost);
router.get('/feed', auth, getFeed);
router.get('/:id', auth, getPost);
router.delete('/:id', auth, deletePost);
router.post('/:id/like', auth, likePost);
router.post('/:id/comments', auth, addComment);
router.get('/:id/comments', auth, getComments);

module.exports = router;
