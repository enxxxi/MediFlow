import axios from "axios";

let zAITriageAuthDisabled = false;

function cleanJsonText(text = "") {
  return String(text || "").replace(/```json|```/g, "").trim();
}

function normalizeTriageLevel(value) {
  const level = String(value || "").toUpperCase().trim();
  if (["EMERGENCY", "URGENT", "NON-URGENT"].includes(level)) return level;
  return "NON-URGENT";
}

function hasValidSeverity(patientCase = {}) {
  return (
    patientCase.severity !== undefined &&
    patientCase.severity !== null &&
    patientCase.severity !== "" &&
    patientCase.severity !== "unknown" &&
    !Number.isNaN(Number(patientCase.severity))
  );
}

function clampNumber(value, fallback, min, max) {
  const number = Number(value);
  if (Number.isNaN(number)) return fallback;
  return Math.min(Math.max(number, min), max);
}

function getSymptoms(patientCase = {}) {
  return Array.isArray(patientCase.symptoms)
    ? patientCase.symptoms.map((s) => String(s).toLowerCase())
    : [];
}

function buildBackupReasoning(patientCase = {}, triageLevel = "NON-URGENT") {
  const symptoms = getSymptoms(patientCase);
  const symptomText = symptoms.length > 0 ? symptoms.join(", ") : "the reported symptoms";

  const severityText = hasValidSeverity(patientCase)
    ? ` with severity ${patientCase.severity}`
    : "";

  if (triageLevel === "EMERGENCY") {
    return `${symptomText}${severityText} may indicate a potentially serious condition that requires immediate medical attention.`;
  }

  if (triageLevel === "URGENT") {
    return `${symptomText}${severityText} suggests the patient should receive prompt medical assessment, although no immediate life-threatening sign is clearly confirmed.`;
  }

  return `${symptomText}${severityText} does not show clear emergency red flags based on the available information, so routine care is appropriate unless symptoms worsen.`;
}

function enforceClinicalSafety(result, patientCase = {}) {
  const symptoms = getSymptoms(patientCase);
  const severity = hasValidSeverity(patientCase) ? Number(patientCase.severity) : null;

  if (symptoms.includes("chest pain") && symptoms.includes("dizziness")) {
    return {
      ...result,
      triage_level: "EMERGENCY",
      risk_score: Math.max(Number(result.risk_score || 0), 95),
      confidence: Math.max(Number(result.confidence || 0), 0.97),
      reasoning:
        "Chest pain with dizziness is treated as an emergency because it may indicate a serious cardiovascular issue.",
    };
  }

  if (symptoms.includes("shortness of breath")) {
    return {
      ...result,
      triage_level: "EMERGENCY",
      risk_score: Math.max(Number(result.risk_score || 0), 92),
      confidence: Math.max(Number(result.confidence || 0), 0.96),
      reasoning:
        "Shortness of breath is treated as an emergency because it may indicate respiratory distress.",
    };
  }

  if (symptoms.includes("vomiting") && symptoms.includes("dizziness") && severity !== null && severity >= 7) {
    return {
      ...result,
      triage_level: "URGENT",
      risk_score: Math.max(Number(result.risk_score || 0), 65),
      confidence: Math.max(Number(result.confidence || 0), 0.82),
      reasoning:
        `Vomiting and dizziness with severity ${severity} may indicate dehydration or a more serious condition, so prompt medical assessment is recommended.`,
    };
  }

  if (severity !== null && severity >= 9) {
    return {
      ...result,
      triage_level: "URGENT",
      risk_score: Math.max(Number(result.risk_score || 0), 80),
      confidence: Math.max(Number(result.confidence || 0), 0.9),
      reasoning:
        `Severity ${severity} is very high, so the case should be treated as urgent even if no specific emergency red flag is confirmed.`,
    };
  }

  return result;
}

function ruleBasedEmergencyCheck(patientCase = {}) {
  const symptoms = getSymptoms(patientCase);
  const rawInput = String(patientCase.raw_input || "").toLowerCase();
  const severity = hasValidSeverity(patientCase) ? Number(patientCase.severity) : 0;

  if (symptoms.includes("chest pain") && symptoms.includes("dizziness")) {
    return {
      triage_level: "EMERGENCY",
      risk_score: 95,
      confidence: 0.97,
      reasoning:
        "Emergency triggered by chest pain with dizziness, which may indicate a serious cardiovascular issue.",
      source: "rule",
    };
  }

  if (symptoms.includes("shortness of breath")) {
    return {
      triage_level: "EMERGENCY",
      risk_score: 92,
      confidence: 0.96,
      reasoning:
        "Emergency triggered by shortness of breath, which may indicate respiratory distress.",
      source: "rule",
    };
  }

  if (symptoms.includes("seizure") || rawInput.includes("unconscious")) {
    return {
      triage_level: "EMERGENCY",
      risk_score: 98,
      confidence: 0.98,
      reasoning: "Emergency triggered by seizure or unconscious state.",
      source: "rule",
    };
  }

  if (severity >= 9 && symptoms.length > 0) {
    return {
      triage_level: "URGENT",
      risk_score: 80,
      confidence: 0.9,
      reasoning: `Urgent classification triggered by very high reported severity ${severity}.`,
      source: "rule",
    };
  }

  return null;
}

function fallbackTriage(patientCase = {}) {
  const symptoms = getSymptoms(patientCase);
  const severity = hasValidSeverity(patientCase) ? Number(patientCase.severity) : 0;

  let risk_score = 10;
  const reasons = [];

  for (const symptom of symptoms) {
    if (["chest pain", "shortness of breath"].includes(symptom)) {
      risk_score += 35;
      reasons.push(`${symptom} is high risk`);
    } else if (["dizziness", "vomiting", "fracture", "injury"].includes(symptom)) {
      risk_score += 20;
      reasons.push(`${symptom} is moderate risk`);
    } else {
      risk_score += 8;
      reasons.push(`${symptom} is lower risk`);
    }
  }

  if (severity >= 8) {
    risk_score += 20;
    reasons.push(`severity ${severity} is high`);
  } else if (severity >= 5) {
    risk_score += 10;
    reasons.push(`severity ${severity} is moderate`);
  }

  let triage_level = "NON-URGENT";
  if (risk_score >= 75) triage_level = "EMERGENCY";
  else if (risk_score >= 40) triage_level = "URGENT";

  return {
    triage_level,
    risk_score: Math.min(risk_score, 100),
    confidence: 0.72,
    reasoning:
      reasons.length > 0
        ? `Fallback triage based on ${reasons.join(", ")}.`
        : "Fallback triage based on limited available information.",
    source: "fallback",
  };
}

async function runGLMTriage(patientCase = {}) {
  const ZAI_ENDPOINT =
    process.env.ZAI_ENDPOINT?.trim() || "https://api.z-ai.com/v1/chat/completions";
  const ZAI_API_KEY = process.env.ZAI_API_KEY?.trim();

  if (!ZAI_API_KEY || zAITriageAuthDisabled) {
    return null;
  }

  const severityInstruction = hasValidSeverity(patientCase)
    ? `The patient explicitly reported severity ${patientCase.severity}. Use it in reasoning.`
    : "Severity is missing. Do not assume a severity value and do not mention severity in reasoning.";

  const requestBody = {
    model: "ilmu-glm-5.1",
    messages: [
      {
        role: "system",
        content: `You are the MediFlow Triage & Medical Reasoning Agent.

Return ONLY valid JSON. Do not include markdown or extra text.

JSON schema:
{
  "triage_level": "EMERGENCY" | "URGENT" | "NON-URGENT",
  "risk_score": number,
  "confidence": number,
  "reasoning": "one clear medical sentence based only on provided information"
}

Rules:
- Do not invent missing information.
- If severity is missing, do not assume a value.
- risk_score must be between 1 and 100.
- confidence must be between 0.1 and 1.
- reasoning must not be empty.
- EMERGENCY means immediate danger or red-flag symptoms.
- URGENT means needs prompt care but not immediate danger.
- NON-URGENT means routine care is suitable if symptoms remain mild.
- Vomiting with dizziness should usually be at least URGENT when severity is 7 or higher.
- Very high severity, 9 or 10, should be at least URGENT.
- Chest pain with dizziness should be EMERGENCY.
- Shortness of breath should be EMERGENCY.

${severityInstruction}`,
      },
      {
        role: "user",
        content: `Classify this patient case:\n${JSON.stringify(patientCase, null, 2)}`,
      },
    ],
    temperature: 0.2,
    max_tokens: 250,
  };

  try {
    const response = await axios.post(ZAI_ENDPOINT, requestBody, {
      timeout: 10000,
      headers: {
        Authorization: `Bearer ${ZAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const aiContent =
      response?.data?.choices?.[0]?.message?.content ||
      response?.data?.choices?.[0]?.text ||
      "{}";

    console.log("Raw GLM response:", aiContent);

    let parsed = {};
    try {
      const cleaned = cleanJsonText(aiContent);
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error("No JSON object found in GLM response");
      }

      parsed = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("❌ GLM JSON parse failed:", parseError.message);
      console.error("❌ Raw GLM content was:", aiContent);
      return null;
    }

    const triageLevel = normalizeTriageLevel(parsed.triage_level);
    const riskScore = clampNumber(parsed.risk_score, 30, 1, 100);
    const confidence = clampNumber(parsed.confidence, 0.75, 0.1, 1);

    const cleanReasoning = String(parsed.reasoning || "").trim();

    const glmResult = {
      triage_level: triageLevel,
      risk_score: riskScore,
      confidence,
      reasoning: cleanReasoning || buildBackupReasoning(patientCase, triageLevel),
      source: "glm",
    };

    return enforceClinicalSafety(glmResult, patientCase);
  } catch (error) {
    const status = error?.response?.status;
    const body = error?.response?.data;

    if (status === 401) {
      console.error("❌ Z.AI triage unauthorized. Check ZAI_API_KEY.");
      zAITriageAuthDisabled = true;
    } else {
      console.error("❌ Z.AI triage error:", error.message);
    }

    if (body) {
      console.error("❌ GLM triage response body:", JSON.stringify(body));
    }

    return null;
  }
}

export async function runTriageAgent(patientCase = {}) {
  const ruleResult = ruleBasedEmergencyCheck(patientCase);
  if (ruleResult) return ruleResult;

  const glmResult = await runGLMTriage(patientCase);
  if (glmResult) return glmResult;

  return fallbackTriage(patientCase);
}