const express = require('express');
const { create, getByCommunity, vote, delete: deletePoll } = require('../controllers/poll.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/community/:communityId', getByCommunity);
router.post('/community/:communityId', create);
router.post('/:id/vote', vote);
router.delete('/:id', deletePoll);

module.exports = router;
