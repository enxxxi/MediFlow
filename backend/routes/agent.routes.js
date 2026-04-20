const express = require('express');
const router = express.Router();
const { processMedicalInput } = require('../agents/inputUnderstanding.agent.js');

router.post('/understand-input', async (req, res) => {
    const { text } = req.body;
    const result = await processMedicalInput(text);
    res.json(result);
});

module.exports = router;