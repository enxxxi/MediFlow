import axios from "axios";

export async function processMedicalInput(rawText) {
    const ZAI_ENDPOINT =
        process.env.ZAI_ENDPOINT || "https://api.z-ai.com/v1/chat/completions";
    const ZAI_API_KEY = process.env.ZAI_API_KEY;

    if (!ZAI_API_KEY) {
        return {
            symptoms: ["headache"],
            duration: "2 days",
            severity: "moderate",
            intent: "consultation",
            raw_input: rawText,
            warning: "ZAI_API_KEY not set; returned fallback response.",
        };
    }

    const requestBody = {
        model: "z-glm-4",
        messages: [
            {
                role: "system",
                content:
                    "You are the MediFlow Input Understanding Agent. Output ONLY a JSON object with keys: symptoms (array), duration (string), severity (low/moderate/high/critical), intent (emergency/consultation).",
            },
            {
                role: "user",
                content: rawText,
            },
        ],
        temperature: 0.1,
    };

    try {
        const response = await axios.post(ZAI_ENDPOINT, requestBody, {
            headers: {
                Authorization: `Bearer ${ZAI_API_KEY}`,
                "Content-Type": "application/json",
            },
        });

        const aiResponse = response?.data?.choices?.[0]?.message?.content || "{}";
        const cleanJson = aiResponse.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleanJson);

        return {
            symptoms: parsed.symptoms || [],
            duration: parsed.duration || "",
            severity: parsed.severity || "moderate",
            intent: parsed.intent || "consultation",
            raw_input: rawText,
        };
    } catch (error) {
        console.error("Z.AI Error:", error.message);
        return {
            error: "Z.AI Analysis Failed",
            details: error.message,
            raw_input: rawText,
        };
    }
}