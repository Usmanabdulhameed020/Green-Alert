const express = require('express');
const { getByCommunity, create, update, toggleReact, delete: deletePost } = require('../controllers/post.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/community/:communityId', getByCommunity);
router.post('/community/:communityId', create);
router.patch('/:id', update);
router.post('/:id/react', toggleReact);
router.delete('/:id', deletePost);

module.exports = router;
