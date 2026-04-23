import axios from "axios";

let zAITriageAuthDisabled = false;

function cleanJsonText(text = "") {
  return String(text || "").replace(/```json|```/g, "").trim();
}

function ruleBasedEmergencyCheck(patientCase = {}) {
  const symptoms = Array.isArray(patientCase.symptoms)
    ? patientCase.symptoms.map((s) => String(s).toLowerCase())
    : [];

  const severity = Number(patientCase.severity || 0);
  const rawInput = String(patientCase.raw_input || "").toLowerCase();

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
      reasoning:
        "Emergency triggered by seizure or unconscious state.",
      source: "rule",
    };
  }

  if (severity >= 9 && symptoms.length > 0) {
    return {
      triage_level: "URGENT",
      risk_score: 80,
      confidence: 0.9,
      reasoning:
        "Urgent classification triggered by very high reported severity.",
      source: "rule",
    };
  }

  return null;
}

function fallbackTriage(patientCase = {}) {
  const symptoms = Array.isArray(patientCase.symptoms)
    ? patientCase.symptoms.map((s) => String(s).toLowerCase())
    : [];
  const severity = Number(patientCase.severity || 0);

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
    reasons.push("high severity");
  } else if (severity >= 5) {
    risk_score += 10;
    reasons.push("moderate severity");
  }

  let triage_level = "NON-URGENT";
  if (risk_score >= 75) {
    triage_level = "EMERGENCY";
  } else if (risk_score >= 40) {
    triage_level = "URGENT";
  }

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
  process.env.ZAI_ENDPOINT?.trim() || "https://api.ilmu.ai/chat/completions";
  const ZAI_API_KEY = process.env.ZAI_API_KEY?.trim();

  if (!ZAI_API_KEY || zAITriageAuthDisabled) {
    return null;
  }

  const requestBody = {
    model: "z-glm-4",
    messages: [
      {
        role: "system",
        content: `You are the MediFlow Triage & Medical Reasoning Agent.

Your job is to classify the patient's urgency level based on structured symptom information.

Return ONLY raw JSON with this exact structure:
{
  "triage_level": "EMERGENCY" | "URGENT" | "NON-URGENT",
  "risk_score": 0-100,
  "confidence": 0-1,
  "reasoning": "short medical reasoning"
}

Guidelines:
- EMERGENCY: potentially life-threatening symptoms or immediate danger
- URGENT: needs prompt care but not immediately life-threatening
- NON-URGENT: mild or routine condition

Be cautious and clinically sensible.
Do not include markdown.
Do not include extra text.`,
      },
      {
        role: "user",
        content: `Patient case:\n${JSON.stringify(patientCase, null, 2)}`,
      },
    ],
    temperature: 0.2,
  };

  try {
    console.log("ZAI_ENDPOINT:", ZAI_ENDPOINT);
    console.log("Request body:", JSON.stringify(requestBody, null, 2));
    const response = await axios.post(ZAI_ENDPOINT, requestBody, {
      timeout: 10000,
      headers: {
        Authorization: `Bearer ${ZAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const aiContent = response?.data?.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(cleanJsonText(aiContent));

    return {
      triage_level: parsed.triage_level || "NON-URGENT",
      risk_score: Number(parsed.risk_score || 0),
      confidence: Number(parsed.confidence || 0.7),
      reasoning: parsed.reasoning || "AI triage completed.",
      source: "glm",
    };
  } catch (error) {
    if (error?.response?.status === 401) {
      console.error("❌ GLM triage unauthorized. Check ZAI_API_KEY.");
      zAITriageAuthDisabled = true;
    } else {
      console.error("❌ GLM triage error:", error.message);
    }
    return null;
  }
}

export async function runTriageAgent(patientCase = {}) {
  const ruleResult = ruleBasedEmergencyCheck(patientCase);
  if (ruleResult) {
    console.log("Triage result:", ruleResult);
    return ruleResult;
  }

  const glmResult = await runGLMTriage(patientCase);
  if (glmResult) {
    console.log("Triage result:", glmResult);
    return glmResult;
  }

  const fallbackResult = fallbackTriage(patientCase);
  console.log("Triage result:", fallbackResult);
  return fallbackResult;
}