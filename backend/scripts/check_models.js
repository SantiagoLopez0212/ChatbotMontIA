const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function checkModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("API Key:", apiKey ? "Presente (" + apiKey.substring(0, 10) + "...)" : "No encontrada");

    const genAI = new GoogleGenerativeAI(apiKey);

    const modelsToTest = ["gemini-1.5-flash", "gemini-pro", "gemini-1.0-pro"];

    for (const modelName of modelsToTest) {
        try {
            console.log(`\nProbando modelo: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Test");
            console.log(`✅ ${modelName} FUNCIONA.`);
        } catch (error) {
            console.log(`❌ ${modelName} FALLÓ.`);
            console.log("Error completo:", JSON.stringify(error, null, 2));
            console.log("Mensaje:", error.message);
        }
    }
}

checkModels();
