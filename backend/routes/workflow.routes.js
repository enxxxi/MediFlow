const express = require("express");
const router = express.Router();

const {
  createSession,
  updateCaseFromAnswer,
  resumeWorkflow,
  pauseWorkflow,
} = require("../agents/workflow.agent");

const {
  getSessionById,
  saveSession,
  updateSession,
  getAllSessions,
} = require("../services/session.service");

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

module.exports = router;