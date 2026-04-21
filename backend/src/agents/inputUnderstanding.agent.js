import axios from "axios";

/**
 * Role: Convert messy user input → structured medical data
 */
export async function processMedicalInput(rawText) {
    // 1. CONFIGURATION
    const ZAI_ENDPOINT = process.env.ZAI_ENDPOINT || "https://api.z-ai.com/v1/chat/completions";
    const ZAI_API_KEY = process.env.ZAI_API_KEY;

    // 2. FALLBACK LOGIC (For development/testing if API key is missing)
    if (!ZAI_API_KEY) {
        console.warn("⚠️ ZAI_API_KEY not found in .env. Using fallback data.");
        return {
            symptoms: ["headache"],
            duration: "2 days",
            severity: "moderate",
            intent: "consultation",
            confidenceScore: 50,
            patient_type: "adult",
            raw_input: rawText,
            warning: "ZAI_API_KEY not set; returned fallback response.",
        };
    }

    // 3. THE BRAIN (GLM PROMPT)
    const requestBody = {
        model: "z-glm-4",
        messages: [
            {
                role: "system",
                content: `You are the MediFlow Input Understanding Agent. 
                Your goal is to parse unstructured medical complaints into a precise JSON format.
                
                STRICT RULES:
                1. Normalize symptoms (e.g., "my tummy hurts" -> "abdominal pain").
                2. Extrapolate severity (low/moderate/high/critical) based on clinical red flags.
                3. Determine intent: 'emergency' for life-threatening, 'consultation' for normal.
                4. Set confidenceScore (0-100) based on how much detail is provided.
                5. Identify patient_type (adult/child/unknown).
                6. Output ONLY raw JSON. No conversational text or markdown blocks.
                
                Extract only the medical keywords for symptoms. Do NOT include conversational filler.
                Bad: ['Umm, hi. So my head has been pounding...']
                Good: ['headache', 'fever']`
            },
            {
                role: "user",
                content: `Convert this input to JSON: "${rawText}"`
            },
        ],
        temperature: 0.1, // Set low for consistent structured output
    };

    // 4. API EXECUTION
    try {
        const response = await axios.post(ZAI_ENDPOINT, requestBody, {
            headers: {
                Authorization: `Bearer ${ZAI_API_KEY}`,
                "Content-Type": "application/json",
            },
        });

        // Extract and clean the AI response
        const aiResponse = response?.data?.choices?.[0]?.message?.content || "{}";
        const cleanJson = aiResponse.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleanJson);

        // 5. RETURN STRUCTURED MEDICAL CASE
        return {
            symptoms: parsed.symptoms || [],
            duration: parsed.duration || "not specified",
            severity: parsed.severity || "moderate",
            intent: parsed.intent || "consultation",
            confidenceScore: parsed.confidenceScore || 0,
            patient_type: parsed.patient_type || "adult",
            raw_input: rawText,
        };

    } catch (error) {
        console.error("❌ Z.AI Agent Error:", error.message);
        return {
            error: "Z.AI Analysis Failed",
            details: error.message,
            raw_input: rawText,
        };
    }
}