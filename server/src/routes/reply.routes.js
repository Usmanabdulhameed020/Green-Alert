const express = require('express');
const { getByPost, create, update, delete: deleteReply } = require('../controllers/reply.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/post/:postId', getByPost);
router.post('/post/:postId', create);
router.patch('/:id', update);
router.delete('/:id', deleteReply);

module.exports = router;
