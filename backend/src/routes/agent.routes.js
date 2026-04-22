import express from "express";
import { processMedicalInput } from "../agents/inputUnderstanding.agent.js";
import { scheduleAppointment } from "../services/scheduling.service.js";

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
  try {
    const patientCase = req.body;

    if (!patientCase || typeof patientCase !== "object" || Array.isArray(patientCase)) {
      return res.status(400).json({
        success: false,
        message: "Valid patient case data is required",
      });
    }

    const result = scheduleAppointment(patientCase);

    return res.status(200).json({
      success: true,
      message: "Appointment decision generated successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Scheduling failed",
      details: error.message,
    });
  }
});

export default router;
