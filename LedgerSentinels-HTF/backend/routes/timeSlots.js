const express = require('express');
const router = express.Router();
const timeSlotController = require('../controllers/timeSlotController');
const { authenticate } = require('../middleware/auth');

// Public routes
router.get('/available', timeSlotController.getAvailableTimeSlots);

// Protected routes
router.post('/create', authenticate, timeSlotController.createTimeSlot);
router.get('/expert', authenticate, timeSlotController.getExpertTimeSlots);
router.get('/user', authenticate, timeSlotController.getUserTimeSlots);
router.post('/buy/:tokenId', authenticate, timeSlotController.buyTimeSlot);

module.exports = router;
