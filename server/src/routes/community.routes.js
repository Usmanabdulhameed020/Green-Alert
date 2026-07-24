const express = require('express');
const { create, getAll, getById, update, join, leave, deleteCommunity } = require('../controllers/community.controller');
const { protect } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Communities
 *   description: Community management endpoints
 */

const router = express.Router();

router.use(protect);

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.patch('/:id', update);
router.post('/:id/join', join);
router.post('/:id/leave', leave);
router.delete('/:id', deleteCommunity);

module.exports = router;
