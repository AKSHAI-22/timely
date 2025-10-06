const express = require('express');
const router = express.Router();
const expertController = require('../controllers/expertController');
const { authenticate } = require('../middleware/auth');

// Public routes
router.get('/profiles', expertController.getExpertProfiles);
router.get('/profile/:address', expertController.getExpertProfile);

// Protected routes
router.post('/profile', authenticate, expertController.createExpertProfile);
router.put('/profile', authenticate, expertController.updateExpertProfile);
router.delete('/profile', authenticate, expertController.deleteExpertProfile);

module.exports = router;
