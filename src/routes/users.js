const express = require('express');
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/me', auth, userController.getMe);
router.put('/me', auth, userController.updateMe);
router.get('/:username', userController.getProfile);
router.post('/:username/follow', auth, userController.toggleFollow);

module.exports = router;
