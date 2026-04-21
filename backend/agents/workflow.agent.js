import { v4 as uuidv4 } from "uuid";

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
  const firstSymptom = patientCase?.symptoms?.[0] || "these symptoms";

  const customQuestions = {
    duration: `How long have you had ${firstSymptom}?`,
    severity: `How severe is your ${firstSymptom} on a scale from 1 to 10?`,
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
  const missingFields = findMissingFields(patientCase);
  const followup = generateFollowupQuestion(missingFields, patientCase);
  const isEmergency = shouldRedirectEmergency(patientCase);

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
    patient_case: patientCase,
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
      missingFields.length === 0 ? generateCaseSummary(patientCase) : null,
    validation_error: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function updateCaseFromAnswer(session, answer) {
  if (!session || !session.last_question_field) return session;

  const field = session.last_question_field;
  const normalizedAnswer = normalizeAnswerByField(field, answer);

  if (normalizedAnswer === null) {
    return {
      ...session,
      current_step: WORKFLOW_STATES.ASKING_FOLLOWUP,
      validation_error: getValidationErrorMessage(field),
      resume_message: null,
      next_question: session.last_question,
      updated_at: new Date().toISOString(),
    };
  }

  const updatedPatientCase = {
    ...session.patient_case,
    [field]: normalizedAnswer,
  };

  const updatedHistory = Array.isArray(session.question_history)
    ? [...session.question_history]
    : [];

  if (updatedHistory.length > 0) {
    const lastEntry = updatedHistory[updatedHistory.length - 1];

    if (lastEntry && lastEntry.field === field && lastEntry.answer === null) {
      lastEntry.answer = normalizedAnswer;
      lastEntry.answered_at = new Date().toISOString();
    }
  }

  const missingFields = findMissingFields(updatedPatientCase);
  const followup = generateFollowupQuestion(missingFields, updatedPatientCase);
  const isEmergency = shouldRedirectEmergency(updatedPatientCase);

  let currentStep;
  if (isEmergency && missingFields.length === 0) {
    currentStep = WORKFLOW_STATES.EMERGENCY_REDIRECTED;
  } else if (missingFields.length > 0) {
    currentStep = WORKFLOW_STATES.ASKING_FOLLOWUP;
  } else {
    currentStep = WORKFLOW_STATES.READY_FOR_SCHEDULING;
  }

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
    patient_case: updatedPatientCase,
    pending_fields: missingFields,
    current_step: currentStep,
    last_question: followup ? followup.question : null,
    last_question_field: followup ? followup.field : null,
    question_history: updatedHistory,
    case_summary:
      missingFields.length === 0
        ? generateCaseSummary(updatedPatientCase)
        : null,
    validation_error: null,
    resume_message: null,
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