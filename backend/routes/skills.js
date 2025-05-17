const express = require('express');
const router = express.Router();
const { 
  addSkill, 
  getUserSkills, 
  searchSkills 
} = require('../controllers/skillController');
const auth = require('../middleware/auth');

router.post('/', auth(), addSkill);
router.get('/my-skills', auth(), getUserSkills);
router.get('/search', searchSkills);

module.exports = router;