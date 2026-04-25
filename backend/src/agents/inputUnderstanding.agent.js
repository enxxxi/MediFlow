import axios from "axios";
import { normalizeDurationText } from "../../utils/helpers.js";

let zAIAuthDisabled = false;

const KNOWN_SYMPTOMS = [
    "fever",
    "cough",
    "headache",
    "sore throat",
    "chest pain",
    "shortness of breath",
    "nausea",
    "vomiting",
    "dizziness",
    "fatigue",
    "runny nose",
    "body ache",
    "diarrhea",
    "leg fracture",
    "leg injury",
    "leg pain",
    "swollen leg",
    "ankle sprain",
    "ankle injury",
    "sprain",
    "fracture",
    "injury",
];

function detectInjurySymptoms(rawText = "") {
    const text = String(rawText || "").toLowerCase();
    const matches = [];

    if (/\b(broke|broken|fracture|fractured)\b/.test(text) && /\bleg\b/.test(text)) {
        matches.push("leg fracture");
    }

    if (/\b(broke|broken|fracture|fractured)\b/.test(text) && /\b(arm|wrist|ankle|foot|rib)\b/.test(text)) {
        matches.push("fracture");
    }

    if (/\b(twisted|sprain|sprained|rolled)\b/.test(text) && /\bankle\b/.test(text)) {
        matches.push("ankle sprain");
    }

    if (/\b(sprain|twisted|strain)\b/.test(text)) {
        matches.push("sprain");
    }

    if (/\b(swollen|swelling|bruise|bruised|cut|bleeding)\b/.test(text)) {
        matches.push("injury");
    }

    if (matches.includes("ankle sprain")) {
        return matches.filter((item) => item !== "sprain");
    }

    return matches;
}

function normalizeSymptomsList(symptoms, rawText = "") {
    const rawTokens = Array.isArray(symptoms)
        ? symptoms
        : typeof symptoms === "string"
            ? [symptoms]
            : [];

    const fromTokens = rawTokens
        .map((item) => String(item || "").toLowerCase().trim())
        .flatMap((token) => token.split(/[,.;]|\band\b|\bwith\b/))
        .map((token) => token.replace(/[^a-z\s-]/g, "").trim())
        .filter(Boolean);

    const combinedText = `${fromTokens.join(" ")} ${String(rawText || "").toLowerCase()}`;
    const matched = KNOWN_SYMPTOMS.filter((symptom) => combinedText.includes(symptom));
    const injuryMatches = detectInjurySymptoms(rawText);

    const cleaned = [...matched, ...injuryMatches].length > 0
        ? [...new Set([...matched, ...injuryMatches])]
        : fromTokens.filter((token) => token.length > 2);
    return [...new Set(cleaned)].slice(0, 5);
}

function fallbackMedicalParse(rawText) {
    const text = String(rawText || "").toLowerCase();
    const symptoms = normalizeSymptomsList([], text);

    const durationMatch = text.match(/(\d+\s*(day|days|week|weeks|month|months|hour|hours))/);
    const severityMatch = text.match(/(?:pain|severity|level)?\s*(\d{1,2})\s*(?:\/\s*10)?/);

    const emergencySignals = ["chest pain", "shortness of breath", "can not breathe", "unconscious", "seizure"];
    const urgentSignals = ["high fever", "vomiting", "severe pain", "dizziness", "dehydration", "broken leg", "fracture", "leg injury"];

    const hasEmergencySignal = emergencySignals.some((signal) => text.includes(signal));
    const hasUrgentSignal = urgentSignals.some((signal) => text.includes(signal));

    let triageLevel = "NON-URGENT";
    if (hasEmergencySignal) {
        triageLevel = "EMERGENCY";
    } else if (hasUrgentSignal) {
        triageLevel = "URGENT";
    }

    return {
        symptoms: symptoms.length ? symptoms : ["injury"],
        duration: normalizeDurationText(durationMatch ? durationMatch[1] : text),
        severity: severityMatch ? Math.min(Number(severityMatch[1]), 10) : null,
        triage_level: triageLevel === "NON-URGENT" && /\b(broke|broken|fracture|fractured)\b/.test(text) ? "URGENT" : triageLevel,
        intent: "consultation",
        confidenceScore: 40,
        patient_type: "adult",
        raw_input: rawText,
    };
}

export async function processMedicalInput(rawText) {
    // 1. CONFIGURATION
    const ZAI_ENDPOINT = process.env.ZAI_ENDPOINT?.trim() || "https://api.ilmu.ai/v1/chat/completions";
    const ZAI_API_KEY = process.env.ZAI_API_KEY?.trim();
    const ZAI_TIMEOUT_MS = Number(process.env.ZAI_TIMEOUT_MS || 30000);

    // 2. FALLBACK LOGIC
    if (!ZAI_API_KEY || zAIAuthDisabled) {
        console.warn("⚠️ ZAI_API_KEY not found in .env. Using fallback data.");
        return fallbackMedicalParse(rawText);
    }

    // 3. THE BRAIN (GLM PROMPT)
    const requestBody = {
        model: "ilmu-glm-5.1",
        messages: [
            {
                role: "system",
                content: `You are the MediFlow Medical Data Parser. 
                    Your sole purpose is to convert messy human speech into a clean, machine-readable JSON object.

                    ### EXTRACTION RULES:
                    1. SYMPTOMS: Extract ONLY medical keywords. 
                    - REMOVE conversational fillers (e.g., "Umm", "hi", "really pounding").
                    - NORMALIZE terms (e.g., "hot forehead" -> "fever").
                    - FORMAT: Always an array of strings.
                    2. TRIAGE LEVEL: Based on the symptoms, assign: "EMERGENCY", "URGENT", or "NON-URGENT".
                    3. SEVERITY: Extract a numerical value (1-10).
                    4. DURATION: Extract a concise string (e.g., "2 days").
                    5. INTENT: Must be 'emergency' or 'consultation'.
                    6. CONFIDENCE: Integer 0-100.

                    ### TARGET JSON STRUCTURE:
                    {
                    "symptoms": ["headache", "fever"],
                    "triage_level": "URGENT",
                    "severity": 8,
                    "duration": "2 days",
                    "intent": "consultation",
                    "confidenceScore": 90,
                    "patient_type": "adult"
                    }

                    OUTPUT ONLY RAW JSON. NO MARKDOWN. NO CONVERSATION.`
            },
            {
                role: "user",
                content: `Convert this input to JSON: "${rawText}"`
            },
        ],
        temperature: 0.1,
    };

    // 4. API EXECUTION & PARSING
    try {
        const response = await axios.post(ZAI_ENDPOINT, requestBody, {
            timeout: ZAI_TIMEOUT_MS,
            headers: {
              Authorization: `Bearer ${ZAI_API_KEY}`,
              "Content-Type": "application/json",
            },
        });

        // Extract text content from AI
        const aiContent =
          response?.data?.choices?.[0]?.message?.content ||
          response?.data?.choices?.[0]?.text ||
          "{}";

        // --- CLEANING LOGIC ---
        // Removes backticks and extra whitespace
        const cleanJsonString = aiContent.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleanJsonString);

        // 5. RETURN STRUCTURED DATA
        const normalizedSymptoms = normalizeSymptomsList(parsed.symptoms, rawText);
        const injuryMatches = detectInjurySymptoms(rawText);
        const mergedSymptoms = [...new Set([...normalizedSymptoms, ...injuryMatches])];

        return {
            symptoms: mergedSymptoms.length ? mergedSymptoms : ["injury"],
            duration: normalizeDurationText(parsed.duration) || "not specified",
            severity: parsed.severity || 1,
            triage_level: parsed.triage_level || (/\b(broke|broken|fracture|fractured)\b/.test(String(rawText || "").toLowerCase()) ? "URGENT" : "NON-URGENT"),
            intent: parsed.intent || "consultation",
            confidenceScore: parsed.confidenceScore || 0,
            patient_type: parsed.patient_type || "adult",
            raw_input: rawText,
        };

    } catch (error) {
        const status = error?.response?.status;
        const body = error?.response?.data;

        if (status === 401) {
            console.error("❌ Z.AI Agent Error: Unauthorized. Check ZAI_API_KEY in backend/.env.");
            zAIAuthDisabled = true;
        } else {
            console.error("❌ Z.AI Agent Error:", error.message);
        }

        if (body) {
            console.error("❌ Z.AI Agent response body:", JSON.stringify(body));
        }

        return {
            ...fallbackMedicalParse(rawText),
            error: "Z.AI Analysis Failed",
        };
    }
}
