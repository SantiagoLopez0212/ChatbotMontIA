const GeminiProvider = require('./src/adapters/providers/geminiProvider');
require('dotenv').config();

async function verify() {
    console.log("Verificando GeminiProvider con gemini-2.0-flash...");
    const provider = new GeminiProvider();

    // Simular mensajes
    const messages = [
        { role: 'system', content: 'Eres un asistente de prueba.' },
        { role: 'user', content: 'Di "Hola Mundo" si funcionas.' }
    ];

    try {
        const response = await provider.generateResponse(messages);
        console.log("✅ Respuesta recibida:", response);
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

verify();
