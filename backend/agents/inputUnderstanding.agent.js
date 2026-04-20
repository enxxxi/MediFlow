// backend/agents/inputUnderstanding.agent.js
const axios = require('axios'); 

const processMedicalInput = async (rawText) => {
    const systemPrompt = "You are a Medical Input Parser. Convert input to JSON with keys: symptoms (list), duration, severity, and intent.";
    
    // Here you would call your LLM API (like Gemini or OpenAI)
    // For now, let's assume it returns the structured object
    return {
        symptoms: ["headache"],
        duration: "2 days",
        severity: "moderate",
        intent: "consultation"
    };
};

module.exports = { processMedicalInput };