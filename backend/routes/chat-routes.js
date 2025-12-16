/** ABSTRACT: chat-routes.js
 *
 *  DESCRIPTION:
 *  Defines all chat-related routes for the application.
 *  Handles both 1:1 messaging and group chat functionality.
 *  All routes are protected by `authMiddleware` to ensure only authenticated users can access chat features.
 *
 *  RESPONSIBILITIES:
 *  - 1:1 Chat:
 *      - Start a conversation by username
 *      - Send text, image, or video messages to another user
 *      - Retrieve messages by conversation ID or by username
 *      - Edit or delete messages
 *      - Mark messages as read
 *      - Delete entire conversations
 *  - Group Chat:
 *      - Create a new group chat
 *      - Send text, image, or video messages to a group
 *      - Add or remove participants
 *      - Leave a group
 *      - Update group name
 *      - Retrieve participants in a group
 *  - User Search:
 *      - Search for friends by username
 *
 *  FUNCTIONS/ROUTES:
 *  - GET '/' : Get all conversations for logged-in user
 *  - GET '/messages/:conversationId' : Get all messages by conversation ID
 *  - PUT '/mark-message-read/:messageId' : Mark message as read
 *  - DELETE '/conversation/:id' : Delete conversation
 *  - PUT '/message/:messageId' : Edit message
 *  - DELETE '/message/:messageId' : Delete message
 *  - POST '/group/create' : Create group chat
 *  - GET '/group/:conversationId/participants' : Get group participants
 *  - POST '/group/send' : Send text message to group
 *  - POST '/group/send-image' : Send image to group
 *  - POST '/group/send-video' : Send video to group
 *  - POST '/group/:conversationId/add-participants' : Add participants to group
 *  - DELETE '/group/:conversationId/remove/:username' : Remove participant from group
 *  - POST '/group/:conversationId/leave' : Leave group
 *  - PATCH '/group/:conversationId/name' : Update group name
 *  - POST '/start-by-username' : Start 1:1 conversation
 *  - GET '/messages-by-username/:username' : Get messages with a user
 *  - POST '/send-by-username' : Send text message to user
 *  - POST '/send-image-by-username' : Send image to user
 *  - POST '/send-video-by-username' : Send video to user
 *  - GET '/search-for-friends' : Search for friends
 *
 *  REVISION HISTORY ABSTRACT:
 *  PROGRAMMER: Johnathan Garland
 *
 *  END ABSTRACT
 **/

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