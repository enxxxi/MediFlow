import express from "express";
const router = express.Router();

import { scheduleAppointment } from "../services/scheduling.service.js";

import {
  WORKFLOW_STATES,
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

// START A NEW WORKFLOW SESSION
router.post("/start", (req, res) => {
  try {
    const patientCase = req.body;

    if (!patientCase || typeof patientCase !== "object") {
      return res.status(400).json({
        success: false,
        message: "Valid patient case data is required",
      });
    }

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

// SUBMIT ANSWER FOR FOLLOW-UP QUESTION
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

    if (session.current_step === WORKFLOW_STATES.PAUSED) {
      return res.status(400).json({
        success: false,
        message: "Workflow is paused. Please resume the session first.",
      });
    }

    if (session.current_step === WORKFLOW_STATES.COMPLETED) {
      return res.status(400).json({
        success: false,
        message: "This session is already completed",
      });
    }

    if (session.current_step === WORKFLOW_STATES.EMERGENCY_REDIRECTED) {
      return res.status(400).json({
        success: false,
        message: "Emergency cases cannot continue through normal flow",
      });
    }

    if (session.current_step === WORKFLOW_STATES.READY_FOR_SCHEDULING) {
      return res.status(400).json({
        success: false,
        message: "This session is already ready for scheduling",
      });
    }

    if (!answer || typeof answer !== "string" || !answer.trim()) {
      return res.status(400).json({
        success: false,
        message: "A valid answer is required",
      });
    }

    const updatedSession = updateCaseFromAnswer(session, answer.trim());

    if (updatedSession.validation_error) {
      return res.status(400).json({
        success: false,
        message: updatedSession.validation_error,
        data: updatedSession,
      });
    }

    const savedSession = updateSession(sessionId, updatedSession);

    return res.status(200).json({
      success: true,
      message: "Answer saved successfully",
      data: savedSession,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// PAUSE WORKFLOW SESSION
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

    if (session.current_step === WORKFLOW_STATES.COMPLETED) {
      return res.status(400).json({
        success: false,
        message: "Completed session cannot be paused",
      });
    }

    if (session.current_step === WORKFLOW_STATES.EMERGENCY_REDIRECTED) {
      return res.status(400).json({
        success: false,
        message: "Emergency redirected session cannot be paused",
      });
    }

    if (session.current_step === WORKFLOW_STATES.PAUSED) {
      return res.status(400).json({
        success: false,
        message: "Session is already paused",
      });
    }

    const pausedSession = pauseWorkflow(session);
    const savedSession = updateSession(sessionId, pausedSession);

    return res.status(200).json({
      success: true,
      message: "Workflow paused successfully",
      data: savedSession,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// RESUME WORKFLOW SESSION
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

    if (session.current_step === WORKFLOW_STATES.COMPLETED) {
      return res.status(400).json({
        success: false,
        message: "Completed session cannot be resumed",
      });
    }

    const resumedSession = resumeWorkflow(session);
    const savedSession = updateSession(sessionId, resumedSession);

    return res.status(200).json({
      success: true,
      message: "Workflow resumed successfully",
      data: savedSession,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// VIEW ALL SESSIONS
router.get("/all/list", (req, res) => {
  try {
    const sessions = getAllSessions();

    return res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// VIEW SINGLE SESSION
router.get("/:sessionId", (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = getSessionById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: session,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// FINALIZE WORKFLOW AND SCHEDULE APPOINTMENT
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

    if (session.current_step === WORKFLOW_STATES.EMERGENCY_REDIRECTED) {
      return res.status(400).json({
        success: false,
        message: "Emergency cases cannot proceed to appointment scheduling",
      });
    }

    if (session.current_step === WORKFLOW_STATES.COMPLETED) {
      return res.status(400).json({
        success: false,
        message: "This session has already been completed",
      });
    }

    if (session.current_step !== WORKFLOW_STATES.READY_FOR_SCHEDULING) {
      return res.status(400).json({
        success: false,
        message: "Session not ready for scheduling",
      });
    }

    const result = scheduleAppointment(session.patient_case);

    const completedSession = {
      ...session,
      current_step: WORKFLOW_STATES.COMPLETED,
      completed_steps: [
        ...new Set([...session.completed_steps, WORKFLOW_STATES.COMPLETED]),
      ],
      pending_fields: [],
      last_question: null,
      last_question_field: null,
      resume_message: null,
      next_question: null,
      validation_error: null,
      appointment_result: result,
      updated_at: new Date().toISOString(),
    };

    const savedSession = updateSession(sessionId, completedSession);

    return res.status(200).json({
      success: true,
      message: "Appointment scheduled successfully",
      data: savedSession,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;