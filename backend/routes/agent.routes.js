import express from "express";
import { processMedicalInput } from "../agents/inputUnderstanding.agent.js";

const router = express.Router();

router.post("/understand-input", async (req, res) => {
  try {
    const { text } = req.body;
    const result = await processMedicalInput(text);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: "Failed to process medical input",
      details: error.message
    });
  }
});

router.post("/schedule", (req, res) => {
  res.json({ message: "OK" });
});

export default router;