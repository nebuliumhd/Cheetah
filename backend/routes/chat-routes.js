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
    //searchForUsers,
    searchForFriends,
    editMessage,
    deleteMessage,
    // Group chat functions
    createGroupChat,
    getGroupParticipants,
    sendMessageToGroup,
    sendImageToGroup,
    sendVideoToUsername,
    sendVideoToGroup,
    addParticipantsToGroup,
    removeParticipantFromGroup,
    leaveGroup,
    updateGroupName
} from '../controllers/chat-controller.js';
import { authMiddleware } from '../middleware/auth-middleware.js';
import { uploadImage, uploadVideo } from '../middleware/upload-middleware.js';

const router = express.Router();

// Make sure user is authenticated before accessing chat routes
router.use(authMiddleware);
// Get all conversations for logged-in user
router.get('/', getConversations);
// Search for a user by username
//router.get('/search-users', searchForUsers);
// Get all messages in a conversation by conversation ID
router.get('/messages/:conversationId', getMessagesByConversationId);
// Sets a message as read
router.put('/mark-message-read/:messageId', markMessageAsRead);
// Delete an entire conversation
router.delete("/conversation/:id", deleteConversation);
// Edit a message (text only)
router.put('/message/:messageId', editMessage);
// Delete a message
router.delete('/message/:messageId', deleteMessage);
// Create a new group chat
router.post('/group/create', createGroupChat);
// Get all participants in a group with their profile pictures
router.get('/group/:conversationId/participants', getGroupParticipants);
// Send text message to group
router.post('/group/send', sendMessageToGroup);
// Send image message to group
router.post('/group/send-image', uploadImage, sendImageToGroup);
// Send video message to group
router.post('/group/send-video', uploadVideo, sendVideoToGroup);
// Add participants to group
router.post('/group/:conversationId/add-participants', addParticipantsToGroup);
// Remove participant from group
router.delete('/group/:conversationId/remove/:username', removeParticipantFromGroup);
// Leave group
router.post('/group/:conversationId/leave', leaveGroup);
// Update group name
router.patch('/group/:conversationId/name', updateGroupName);
// Start a 1:1 conversation
router.post('/start-by-username', startConversationByUsername);
// Get all messages by other user's username
router.get('/messages-by-username/:username', getMessagesWithUsername);
// Send text message to user
router.post('/send-by-username', sendMessageToUsername);
// Send video message to user
router.post('/send-video-by-username', uploadVideo, sendVideoToUsername);
// Send image message to user
router.post('/send-image-by-username', uploadImage, sendImageToUsername);
//Search for friends
router.get('/search-for-friends', searchForFriends);

export default router;