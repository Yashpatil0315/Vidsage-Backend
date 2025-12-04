const express = require('express');
const router = express.Router();
const { processAudio } = require('../Controlers/audioProcessingController');

router.get('/', (req, res,) => {
    res.send("Audio route working");
});

router.post('/', processAudio);

module.exports = router;