const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');

router.get('/stats', authMiddleware(['admin']), getDashboardStats);

module.exports = router;