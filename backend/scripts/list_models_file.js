const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
require('dotenv').config();

async function list() {
    const key = process.env.GEMINI_API_KEY.trim();

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await response.json();

        if (data.models) {
            const names = data.models.map(m => m.name).join('\n');
            fs.writeFileSync('models_list.txt', names, 'utf8');
            console.log("Guardado en models_list.txt");
        } else {
            console.log("Error o sin modelos");
        }
    } catch (e) {
        console.log("Error:", e.message);
    }
}

list();
