/**
 * Rutas del historial de conversaciones (protegidas por JWT)
 * SRP: Este archivo solo maneja el montaje de rutas de historial.
 */
const express = require('express');
const router = express.Router();
const chatHistoryController = require('../controllers/chatHistoryController');
const validateToken = require('../middleware/authMiddleware');

router.get('/conversations', validateToken, chatHistoryController.getConversations);
router.post('/conversations', validateToken, chatHistoryController.createConversation);
router.delete('/conversations/:id', validateToken, chatHistoryController.deleteConversation);
router.put('/conversations/:id', validateToken, chatHistoryController.updateTitle);
router.get('/conversations/:id/messages', validateToken, chatHistoryController.getMessages);
router.post('/conversations/:id/messages', validateToken, chatHistoryController.addMessage);

module.exports = router;
