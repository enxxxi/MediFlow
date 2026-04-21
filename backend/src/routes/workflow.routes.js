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

// start session
router.post("/start", async (req, res) => {
  try {
    const patientCase = req.body;

    if (!patientCase || typeof patientCase !== "object") {
      return res.status(400).json({
        success: false,
        message: "Valid patient case data is required",
      });
    }

    const session = createSession(patientCase);
    await saveSession(session);

    return res.status(201).json({
      success: true,
      message: "Workflow session started",
      data: session,
    });
  } catch (error) {
    console.error("❌ BACKEND ERROR IN /START ROUTE:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

//answer session
router.post("/answer/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { answer } = req.body;

    const session = await getSessionById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    // 2. State Validations
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

    // 3. Input Validation
    if (!answer || typeof answer !== "string" || !answer.trim()) {
      return res.status(400).json({
        success: false,
        message: "A valid answer is required",
      });
    }

    // 4. Process Answer via Workflow Agent
    let updatedSession = await updateCaseFromAnswer(session, answer.trim());

    // 5. Check for Agent Validation Errors
    if (updatedSession.validation_error) {
      return res.status(400).json({
        success: false,
        message: updatedSession.validation_error,
        data: updatedSession,
      });
    }

    const savedSession = await updateSession(sessionId, updatedSession);

    return res.status(200).json({
      success: true,
      message: "Answer saved successfully",
      data: savedSession,
    });

  } catch (error) {
    // Log the actual error to your VS Code terminal for debugging
    console.error("❌ BACKEND ERROR IN /ANSWER ROUTE:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error: " + error.message,
    });
  }
});

// PAUSE WORKFLOW SESSION
router.post("/pause/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await getSessionById(sessionId);

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
    const savedSession = await updateSession(sessionId, pausedSession);

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
router.get("/resume/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await getSessionById(sessionId);

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
    const savedSession = await updateSession(sessionId, resumedSession);

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

//get all
router.get("/all/list", async (req, res) => {
  try {
    const sessions = await getAllSessions();

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

//get one
router.get("/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await getSessionById(sessionId);

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

//finalize
router.post("/finalize/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await getSessionById(sessionId);

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

    const savedSession = await updateSession(sessionId, completedSession);

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