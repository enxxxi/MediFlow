import { v4 as uuidv4 } from "uuid";
import { processMedicalInput } from "./inputUnderstanding.agent.js";
import { normalizeDurationText } from "../../utils/helpers.js";


// Normalize patient case to ensure symptoms is always an array
function normalizePatientCase(patientCase = {}) {
  const normalized = { ...patientCase };
  
  // Ensure symptoms is always an array
  if (!normalized.symptoms) {
    normalized.symptoms = [];
  } else if (typeof normalized.symptoms === 'string') {
    normalized.symptoms = [normalized.symptoms];
  } else if (!Array.isArray(normalized.symptoms)) {
    normalized.symptoms = [];
  }

  if (normalized.duration !== undefined && normalized.duration !== null) {
    normalized.duration = normalizeDurationText(normalized.duration) || normalized.duration;
  }
  
  return normalized;
}

export const WORKFLOW_STATES = {
  START: "START",
  INPUT_RECEIVED: "INPUT_RECEIVED",
  TRIAGE_DONE: "TRIAGE_DONE",
  CHECKING_COMPLETENESS: "CHECKING_COMPLETENESS",
  ASKING_FOLLOWUP: "ASKING_FOLLOWUP",
  READY_FOR_SCHEDULING: "READY_FOR_SCHEDULING",
  EMERGENCY_REDIRECTED: "EMERGENCY_REDIRECTED",
  COMPLETED: "COMPLETED",
  PAUSED: "PAUSED",
};

export const QUESTION_MAP = {
  duration: "How long have you had these symptoms?",
  severity: "How severe is it on a scale from 1 to 10?",
  breathing_difficulty: "Are you having any difficulty breathing?",
  age_group: "Are you an adult, child, or elderly patient?",
};

function isEmptyValue(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

function normalizeText(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text ? text : null;
}

function normalizeSeverity(value) {
  const text = normalizeText(value);
  if (!text) return null;

  const lower = text.toLowerCase();

  // direct numeric input: "7"
  const numeric = Number(text);
  if (!Number.isNaN(numeric) && numeric >= 1 && numeric <= 10) {
    return numeric;
  }

  // allow only severity-like patterns, not unrelated phrases like "3 days"
  const allowedPatterns = [
    /^\d+\s*\/\s*10$/,                               // 7/10
    /^(about|around|approximately)\s+\d+$/,         // around 8
    /^(pain\s+is|severity\s+is)\s+\d+$/,            // pain is 9
  ];

  const matchesAllowedPattern = allowedPatterns.some((pattern) =>
    pattern.test(lower)
  );

  if (matchesAllowedPattern) {
    const match = lower.match(/\d+/);
    if (match) {
      const extracted = Number(match[0]);
      if (!Number.isNaN(extracted) && extracted >= 1 && extracted <= 10) {
        return extracted;
      }
    }
  }

  return null;
}

function normalizeBreathingDifficulty(value) {
  const text = normalizeText(value);
  if (!text) return null;

  const lower = text.toLowerCase();

  if (["yes", "y", "true"].includes(lower)) return "yes";
  if (["no", "n", "false"].includes(lower)) return "no";

  return null;
}

function normalizeAgeGroup(value) {
  const text = normalizeText(value);
  if (!text) return null;

  const lower = text.toLowerCase();

  if (["adult", "adults"].includes(lower)) return "adult";
  if (["child", "kid", "children"].includes(lower)) return "child";
  if (["elderly", "senior", "old"].includes(lower)) return "elderly";

  return null;
}

export function normalizeAnswerByField(field, answer) {
  switch (field) {
    case "duration":
      return normalizeDurationText(answer);
    case "severity":
      return normalizeSeverity(answer);
    case "breathing_difficulty":
      return normalizeBreathingDifficulty(answer);
    case "age_group":
      return normalizeAgeGroup(answer);
    default:
      return normalizeText(answer);
  }
}

function getValidationErrorMessage(field) {
  switch (field) {
    case "severity":
      return "Please enter a severity from 1 to 10.";
    case "breathing_difficulty":
      return "Please answer yes or no.";
    case "age_group":
      return "Please answer adult, child, or elderly.";
    case "duration":
      return "Please provide how long you have had the symptoms.";
    default:
      return `Invalid input for ${field}.`;
  }
}

export function getRequiredFields(patientCase = {}) {
  const symptoms = Array.isArray(patientCase.symptoms)
    ? patientCase.symptoms
    : [];
  const triageLevel = String(patientCase.triage_level || "").toUpperCase();

  const requiredFields = ["symptoms", "duration", "severity"];

  if (symptoms.includes("chest pain")) {
    requiredFields.push("breathing_difficulty");
  }

  if (triageLevel === "EMERGENCY") {
    if (!requiredFields.includes("breathing_difficulty")) {
      requiredFields.push("breathing_difficulty");
    }
    if (!requiredFields.includes("age_group")) {
      requiredFields.push("age_group");
    }
  }

  return [...new Set(requiredFields)];
}

export function findMissingFields(patientCase = {}) {
  const requiredFields = getRequiredFields(patientCase);

  return requiredFields.filter((field) => {
    const value = patientCase[field];
    return isEmptyValue(value);
  });
}

export function generateFollowupQuestion(missingFields = [], patientCase = {}) {
  if (!missingFields.length) return null;

  const nextField = missingFields[0];

  const customQuestions = {
    duration: "How long have you had these symptoms?",
    severity: "How severe are your symptoms on a scale from 1 to 10?",
    breathing_difficulty: "Are you having any difficulty breathing?",
    age_group: "Are you an adult, child, or elderly patient?",
  };

  return {
    field: nextField,
    question:
      customQuestions[nextField] ||
      QUESTION_MAP[nextField] ||
      `Please provide ${nextField}.`,
  };
}

export function generateCaseSummary(patientCase = {}) {
  const symptomsText = patientCase?.symptoms?.length
    ? patientCase.symptoms.join(", ")
    : "unknown symptoms";

  const durationText = patientCase?.duration || "unknown duration";
  const severityText = patientCase?.severity || "unknown severity";
  const breathingText = patientCase?.breathing_difficulty
    ? ` Breathing difficulty: ${patientCase.breathing_difficulty}.`
    : "";
  const ageGroupText = patientCase?.age_group
    ? ` Age group: ${patientCase.age_group}.`
    : "";
  const triageText = patientCase?.triage_level
    ? ` Triage level: ${patientCase.triage_level}.`
    : "";

  return `Patient reports ${symptomsText} for ${durationText} with severity ${severityText}.${breathingText}${ageGroupText}${triageText}`.trim();
}

export function shouldRedirectEmergency(patientCase = {}) {
  const triageLevel = String(patientCase.triage_level || "").toUpperCase();
  return triageLevel === "EMERGENCY";
}

export function createSession(patientCase = {}) {
  // Normalize patient case first
  const normalizedCase = normalizePatientCase(patientCase);
  
  const missingFields = findMissingFields(normalizedCase);
  const followup = generateFollowupQuestion(missingFields, normalizedCase);
  const isEmergency = shouldRedirectEmergency(normalizedCase);

  let currentStep = WORKFLOW_STATES.CHECKING_COMPLETENESS;

  if (isEmergency && missingFields.length === 0) {
    currentStep = WORKFLOW_STATES.EMERGENCY_REDIRECTED;
  } else if (missingFields.length > 0) {
    currentStep = WORKFLOW_STATES.ASKING_FOLLOWUP;
  } else {
    currentStep = WORKFLOW_STATES.READY_FOR_SCHEDULING;
  }

  return {
    session_id: uuidv4(),
    current_step: currentStep,
    completed_steps: [
      WORKFLOW_STATES.INPUT_RECEIVED,
      WORKFLOW_STATES.TRIAGE_DONE,
    ],
    patient_case: normalizedCase,
    pending_fields: missingFields,
    question_history: followup
      ? [
          {
            field: followup.field,
            question: followup.question,
            answer: null,
            asked_at: new Date().toISOString(),
            answered_at: null,
          },
        ]
      : [],
    last_question: followup ? followup.question : null,
    last_question_field: followup ? followup.field : null,
    case_summary:
      missingFields.length === 0 ? generateCaseSummary(normalizedCase) : null,
    validation_error: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export async function updateCaseFromAnswer(session, answer) {
  if (!session || !session.last_question_field) return session;

  const field = session.last_question_field;
  const normalizedAnswer = normalizeAnswerByField(field, answer);

  if (normalizedAnswer === null) {
    return {
      ...session,
      current_step: WORKFLOW_STATES.ASKING_FOLLOWUP,
      validation_error: getValidationErrorMessage(field),
      next_question: session.last_question,
      updated_at: new Date().toISOString(),
    };
  }

  // Initialize updatedPatientCase with current values as a fallback
  let updatedPatientCase = {
    ...session.patient_case,
    [field]: normalizedAnswer,
  };

  // Keep symptom extraction stable after initial intake.
  // Follow-up answers should not replace detected symptoms with a new parse.
  const shouldReevaluateTriage = ["severity", "breathing_difficulty"].includes(field);

  if (shouldReevaluateTriage) {
    try {
      const knownSymptoms = Array.isArray(session.patient_case?.symptoms)
        ? session.patient_case.symptoms.join(", ")
        : "unknown";
      const combinedContext = `Known symptoms: ${knownSymptoms}. Patient answered ${field}: ${answer}`;

      const aiRefinedCase = await processMedicalInput(combinedContext);

      if (aiRefinedCase && !aiRefinedCase.error) {
        updatedPatientCase = {
          ...updatedPatientCase,
          triage_level: aiRefinedCase.triage_level || updatedPatientCase.triage_level,
        };
      }
    } catch (error) {
      console.error("⚠️ AI Re-evaluation failed, keeping existing triage level:", error.message);
    }
  }

  const normalizedUpdatedCase = normalizePatientCase(updatedPatientCase);

  const existingSymptoms = Array.isArray(session.patient_case?.symptoms)
    ? [...session.patient_case.symptoms]
    : [];
  if (existingSymptoms.length > 0) {
    normalizedUpdatedCase.symptoms = existingSymptoms;
  }

  const updatedHistory = Array.isArray(session.question_history) ? [...session.question_history] : [];
  
  // Mark the current question as answered in history
  if (updatedHistory.length > 0) {
    const lastEntry = updatedHistory[updatedHistory.length - 1];
    if (lastEntry && lastEntry.field === field && lastEntry.answer === null) {
      lastEntry.answer = normalizedAnswer;
      lastEntry.answered_at = new Date().toISOString();
    }
  }

  const missingFields = findMissingFields(normalizedUpdatedCase);
  const isEmergency = shouldRedirectEmergency(normalizedUpdatedCase);
  const followup = generateFollowupQuestion(missingFields, normalizedUpdatedCase);

  let currentStep;
  if (isEmergency && missingFields.length === 0) {
    currentStep = WORKFLOW_STATES.EMERGENCY_REDIRECTED;
  } else if (missingFields.length > 0) {
    currentStep = WORKFLOW_STATES.ASKING_FOLLOWUP;
  } else {
    currentStep = WORKFLOW_STATES.READY_FOR_SCHEDULING;
  }

  // Push the next question to history if one was generated
  if (followup) {
    updatedHistory.push({
      field: followup.field,
      question: followup.question,
      answer: null,
      asked_at: new Date().toISOString(),
      answered_at: null,
    });
  }

  return {
    ...session,
    patient_case: normalizedUpdatedCase,
    pending_fields: missingFields,
    current_step: currentStep,
    last_question: followup ? followup.question : null,
    last_question_field: followup ? followup.field : null,
    question_history: updatedHistory,
    case_summary: currentStep === WORKFLOW_STATES.READY_FOR_SCHEDULING ? generateCaseSummary(normalizedUpdatedCase) : null,
    validation_error: null,
    next_question: followup ? followup.question : null,
    updated_at: new Date().toISOString(),
  };
}

export function resumeWorkflow(session) {
  if (!session) return null;

  if (session.current_step === WORKFLOW_STATES.COMPLETED) {
    return {
      ...session,
      updated_at: new Date().toISOString(),
      resume_message: "This session is already completed.",
      next_question: null,
    };
  }

  if (session.current_step === WORKFLOW_STATES.EMERGENCY_REDIRECTED) {
    return {
      ...session,
      updated_at: new Date().toISOString(),
      resume_message: "This case has been redirected for emergency handling.",
      next_question: null,
    };
  }

  if (session.pending_fields && session.pending_fields.length > 0) {
    return {
      ...session,
      current_step: WORKFLOW_STATES.ASKING_FOLLOWUP,
      updated_at: new Date().toISOString(),
      resume_message: "Session resumed. More information is still needed.",
      next_question: session.last_question,
    };
  }

  return {
    ...session,
    current_step: WORKFLOW_STATES.READY_FOR_SCHEDULING,
    updated_at: new Date().toISOString(),
    resume_message: "Session resumed. Case is ready for scheduling.",
    next_question: null,
  };
}

export function pauseWorkflow(session) {
  if (!session) return null;

  if (
    session.current_step === WORKFLOW_STATES.COMPLETED ||
    session.current_step === WORKFLOW_STATES.EMERGENCY_REDIRECTED
  ) {
    return {
      ...session,
      updated_at: new Date().toISOString(),
    };
  }

  return {
    ...session,
    current_step: WORKFLOW_STATES.PAUSED,
    updated_at: new Date().toISOString(),
  };
}