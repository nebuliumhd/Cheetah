const express = require('express');
const router = express.Router();

const{
    sendMessage,
    recieveMessage
} = require('../controllers/chat-controller');

module.exports = router;