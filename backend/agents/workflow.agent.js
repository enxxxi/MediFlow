const { v4: uuidv4 } = require("uuid");

const WORKFLOW_STATES = {
  START: "START",
  INPUT_RECEIVED: "INPUT_RECEIVED",
  TRIAGE_DONE: "TRIAGE_DONE",
  CHECKING_COMPLETENESS: "CHECKING_COMPLETENESS",
  ASKING_FOLLOWUP: "ASKING_FOLLOWUP",
  READY_FOR_SCHEDULING: "READY_FOR_SCHEDULING",
  COMPLETED: "COMPLETED",
  PAUSED: "PAUSED",
};

const QUESTION_MAP = {
  duration: "How long have you had these symptoms?",
  severity: "How severe is it on a scale from 1 to 10?",
  breathing_difficulty: "Are you having any difficulty breathing?",
  age_group: "Are you an adult, child, or elderly patient?",
};

function getRequiredFields(patientCase) {
  const symptoms = patientCase.symptoms || [];

  if (symptoms.includes("chest pain")) {
    return ["symptoms", "duration", "severity", "breathing_difficulty"];
  }

  if (symptoms.includes("fever")) {
    return ["symptoms", "duration", "severity"];
  }

  return ["symptoms", "duration", "severity"];
}

function findMissingFields(patientCase) {
  const requiredFields = getRequiredFields(patientCase);

  return requiredFields.filter((field) => {
    const value = patientCase[field];

    if (value === null || value === undefined) return true;
    if (typeof value === "string" && value.trim() === "") return true;
    if (Array.isArray(value) && value.length === 0) return true;

    return false;
  });
}

function generateFollowupQuestion(missingFields, patientCase) {
  if (!missingFields || missingFields.length === 0) return null;

  const nextField = missingFields[0];
  const firstSymptom = patientCase?.symptoms?.[0] || "these symptoms";

  const customQuestions = {
    duration: `How long have you had ${firstSymptom}?`,
    severity: `How severe is your ${firstSymptom} on a scale from 1 to 10?`,
    breathing_difficulty: "Are you having any difficulty breathing?",
    age_group: "Are you an adult, child, or elderly patient?",
  };

  return {
    field: nextField,
    question: customQuestions[nextField] || `Please provide ${nextField}.`,
  };
}

function createSession(patientCase) {
  const missingFields = findMissingFields(patientCase);
  const followup = generateFollowupQuestion(missingFields, patientCase);

  return {
    session_id: uuidv4(),
    current_step:
      missingFields.length > 0
        ? WORKFLOW_STATES.ASKING_FOLLOWUP
        : WORKFLOW_STATES.READY_FOR_SCHEDULING,
    completed_steps: [
      WORKFLOW_STATES.INPUT_RECEIVED,
      WORKFLOW_STATES.TRIAGE_DONE,
    ],
    patient_case: patientCase,
    pending_fields: missingFields,
    question_history: followup ? [followup.question] : [],
    last_question: followup ? followup.question : null,
    last_question_field: followup ? followup.field : null,
    case_summary:
      missingFields.length === 0 ? generateCaseSummary(patientCase) : null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function updateCaseFromAnswer(session, answer) {
  const field = session.last_question_field;

  if (!field) return session;

  const updatedPatientCase = {
    ...session.patient_case,
    [field]: answer,
  };

  const missingFields = findMissingFields(updatedPatientCase);
  const followup = generateFollowupQuestion(missingFields, updatedPatientCase);

  return {
    ...session,
    patient_case: updatedPatientCase,
    pending_fields: missingFields,
    current_step:
      missingFields.length > 0
        ? WORKFLOW_STATES.ASKING_FOLLOWUP
        : WORKFLOW_STATES.READY_FOR_SCHEDULING,
    last_question: followup ? followup.question : null,
    last_question_field: followup ? followup.field : null,
    question_history: followup
      ? [...session.question_history, followup.question]
      : session.question_history,
    case_summary:
      missingFields.length === 0
        ? generateCaseSummary(updatedPatientCase)
        : null,
    updated_at: new Date().toISOString(),
  };
}

function generateCaseSummary(patientCase) {
  const symptomsText = patientCase?.symptoms?.join(", ") || "unknown symptoms";
  const durationText = patientCase?.duration || "unknown duration";
  const severityText = patientCase?.severity || "unknown severity";
  const breathingText = patientCase?.breathing_difficulty
    ? ` and breathing difficulty: ${patientCase.breathing_difficulty}`
    : "";

  return `Patient reports ${symptomsText} since ${durationText} with severity ${severityText}${breathingText}.`;
}

function resumeWorkflow(session) {
  if (!session) return null;

  if (session.pending_fields && session.pending_fields.length > 0) {
    return {
      message: "Session resumed. More information is still needed.",
      current_step: session.current_step,
      next_question: session.last_question,
      pending_fields: session.pending_fields,
    };
  }

  return {
    message: "Session resumed. Case is ready for scheduling.",
    current_step: session.current_step,
    pending_fields: session.pending_fields,
  };
}

module.exports = {
  WORKFLOW_STATES,
  createSession,
  findMissingFields,
  generateFollowupQuestion,
  updateCaseFromAnswer,
  resumeWorkflow,
};