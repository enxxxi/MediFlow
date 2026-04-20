//import axios from "axios";

export async function processMedicalInput(rawText) {
  const systemPrompt =
    "You are a Medical Input Parser. Convert input to JSON with keys: symptoms (list), duration, severity, and intent.";

  // Placeholder logic (replace with Gemini/OpenAI later)
  // Example structured output
  return {
    symptoms: ["headache"],
    duration: "2 days",
    severity: "moderate",
    intent: "consultation",
    raw_input: rawText
  };
}