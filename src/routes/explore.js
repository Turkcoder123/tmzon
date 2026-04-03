const express = require('express');
const exploreController = require('../controllers/exploreController');
const auth = require('../middleware/auth');

const router = express.Router();

// Auth is optional for explore – pass user info if available
function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next();
  }
  return auth(req, res, next);
}

router.get('/', optionalAuth, exploreController.getExploreFeed);
router.get('/trending', exploreController.getTrending);
router.get('/search', exploreController.search);

module.exports = router;
