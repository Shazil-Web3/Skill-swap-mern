const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Send a schedule request
router.post('/request', scheduleController.sendScheduleRequest);

// Get template with user data
router.get('/template/:userId', scheduleController.getTemplate);

// Get messages for a user
router.get('/messages/:userId', scheduleController.getMessagesForUser);

// Respond to a message (accept or reschedule)
router.post('/respond', scheduleController.respondToMessage);

module.exports = router; 