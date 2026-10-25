const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/crops', async (req, res) => {
  try {
    const crops = await db.query('SELECT * FROM crops ORDER BY name ASC');
    return res.json({ success: true, crops });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error retrieving crops.' });
  }
});

router.get('/fertilizers', async (req, res) => {
  try {
    const fertilizers = await db.query('SELECT * FROM fertilizers ORDER BY type ASC, name ASC');
    return res.json({ success: true, fertilizers });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error retrieving fertilizers.' });
  }
});

module.exports = router;
