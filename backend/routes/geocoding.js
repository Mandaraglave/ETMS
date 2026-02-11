const express = require('express');
const router = express.Router();

// Reverse geocoding proxy endpoint
router.get('/reverse-geocode', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`
    );
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    res.status(500).json({ error: 'Failed to get address' });
  }
});

module.exports = router;
