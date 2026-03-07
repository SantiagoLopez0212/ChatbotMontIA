const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function list() {
    const key = process.env.GEMINI_API_KEY.trim();
    console.log("Key:", key.substring(0, 5) + "...");

    // Hack: The SDK doesn't expose listModels easily on the client instance in all versions?
    // Actually it does: genAI.getGenerativeModel is for getting a model.
    // To list models we might need to use the REST API via fetch if the SDK doesn't support it easily.

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await response.json();

        if (data.error) {
            console.log("API Error:", data.error.message);
        } else if (data.models) {
            console.log("Modelos disponibles:");
            data.models.forEach(m => console.log("- " + m.name));
        } else {
            console.log("Respuesta inesperada:", JSON.stringify(data));
        }
    } catch (e) {
        console.log("Fetch error:", e.message);
    }
}

list();
