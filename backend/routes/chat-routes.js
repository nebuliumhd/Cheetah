import express from 'express';
import {
    getConversations,
    markMessageAsRead,
    startConversationByUsername,
    sendMessageToUsername,
    getMessagesWithUsername,
    getMessagesByConversationId,
    deleteConversation,
    sendImageToUsername,
    searchForUsers
} from '../controllers/chat-controller.js';
import { authMiddleware } from '../middleware/auth-middleware.js';
import { uploadImage } from '../middleware/upload-middleware.js';

const router = express.Router();

// Make sure user is authenticated before accessing chat routes
router.use(authMiddleware);
// Get all conversations for logged-in user
router.get('/', getConversations);
// Search for a user by username
router.get('/search-users', searchForUsers);
// Start a conversation
router.post('/start-by-username', startConversationByUsername);
// Get all messages by other user's username
router.get('/messages-by-username/:username', getMessagesWithUsername);
// Get all messages in a conversation by conversation ID
router.get('/messages/:conversationId', getMessagesByConversationId);
// Send text message
router.post('/send-by-username', sendMessageToUsername);
// Send image message
router.post('/send-image-by-username', uploadImage, sendImageToUsername);
// Sets a message as read
router.put('/mark-message-read/:messageId', markMessageAsRead);
// Delete an entire conversation
router.delete("/conversation/:id", deleteConversation);

export default router;