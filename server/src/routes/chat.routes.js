const express = require('express');
const { handleChat } = require('../controllers/chat.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

// All chat routes require authentication
router.use(protect);

// POST /api/chat — send a message to the GreenAlert AI assistant
router.post('/', handleChat);

module.exports = router;
