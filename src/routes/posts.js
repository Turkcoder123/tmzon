const express = require('express');
const postController = require('../controllers/postController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', postController.getAllPosts);
router.get('/feed', auth, postController.getFeed);
router.get('/user/:username', postController.getUserPosts);
router.get('/:id', postController.getPost);
router.post('/', auth, postController.createPost);
router.delete('/:id', auth, postController.deletePost);
router.post('/:id/like', auth, postController.toggleLike);
router.post('/:id/comments', auth, postController.addComment);
router.delete('/:id/comments/:commentId', auth, postController.deleteComment);

module.exports = router;
