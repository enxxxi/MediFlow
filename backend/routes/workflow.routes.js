import express from "express";
const router = express.Router();
import { scheduleAppointment } from "../services/scheduling.service.js";

import {
  createSession,
  updateCaseFromAnswer,
  resumeWorkflow,
  pauseWorkflow,
} from "../agents/workflow.agent.js";

import {
  getSessionById,
  saveSession,
  updateSession,
  getAllSessions,
} from "../services/session.service.js";

// Start a workflow session
router.post("/start", (req, res) => {
  try {
    const patientCase = req.body;

    const session = createSession(patientCase);
    saveSession(session);

    return res.status(201).json({
      success: true,
      message: "Workflow session started",
      data: session,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Submit an answer to follow-up question
router.post("/answer/:sessionId", (req, res) => {
  try {
    const { sessionId } = req.params;
    const { answer } = req.body;

    const session = getSessionById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    const updatedSession = updateCaseFromAnswer(session, answer);
    updateSession(sessionId, updatedSession);

    return res.status(200).json({
      success: true,
      message: "Answer saved",
      data: updatedSession,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Pause a workflow session
router.post("/pause/:sessionId", (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = getSessionById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    const pausedSession = pauseWorkflow(session);
    updateSession(sessionId, pausedSession);

    return res.status(200).json({
      success: true,
      message: "Workflow paused successfully",
      data: pausedSession,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Resume a workflow session
router.get("/resume/:sessionId", (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = getSessionById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    const resumedSession = resumeWorkflow(session);
    updateSession(sessionId, resumedSession);

    return res.status(200).json({
      success: true,
      message: "Workflow resumed",
      data: resumedSession,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// View all sessions
router.get("/all", (req, res) => {
  try {
    const sessions = getAllSessions();

    return res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.post("/finalize/:sessionId", (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = getSessionById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    // ONLY run if ready
    if (session.current_step !== "READY_FOR_SCHEDULING") {
      return res.status(400).json({
        success: false,
        message: "Session not ready for scheduling",
      });
    }

    const result = scheduleAppointment(session.patient_case);

    return res.json({
      success: true,
      message: "Appointment scheduled successfully",
      data: {
        session_id: sessionId,
        ...result
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;