const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GEMINI_API_KEY } = require('../../config/appConfig');

class GeminiProvider {
    constructor() {
        if (!GEMINI_API_KEY) {
            console.warn("Gemini API Key no configurada.");
        } else {
            // Aseguramos que la key no tenga espacios extra
            const key = GEMINI_API_KEY.trim();
            this.genAI = new GoogleGenerativeAI(key);

            // Usamos gemini-flash-latest que es la versión estable para esta clave
            this.modelName = "gemini-flash-latest";
        }
    }

    async generateResponse(messages) {
        if (!GEMINI_API_KEY) return "Error: API Key de Gemini no configurada.";

        const maxRetries = 3;
        let attempt = 0;

        while (attempt < maxRetries) {
            try {
                const model = this.genAI.getGenerativeModel({ model: this.modelName });

                const systemMessage = messages.find(m => m.role === 'system')?.content || "";
                const userMessages = messages.filter(m => m.role === 'user');
                const lastUserMessage = userMessages[userMessages.length - 1]?.content || "";

                const finalPrompt = `${systemMessage}\n\nUsuario: ${lastUserMessage}`;

                const result = await model.generateContent(finalPrompt);
                const response = await result.response;
                return response.text();
            } catch (error) {
                attempt++;
                const isOverloaded = error.message.includes("503") || error.message.includes("429") || error.message.includes("quota");

                if (isOverloaded && attempt < maxRetries) {
                    console.warn(`[Gemini] Error de cuota/congestión (503/429). Reintento ${attempt}/${maxRetries} en ${attempt * 2} segundos...`);
                    // Esperar 2s, 4s, etc. antes del próximo intento
                    await new Promise(resolve => setTimeout(resolve, attempt * 2000));
                    continue; // Reintentar
                }

                console.error("--- ERROR GEMINI DETALLADO ---");
                console.error("Mensaje:", error.message);

                let userFriendlyMsg = `Lo siento, hubo un error técnico con la IA (${this.modelName}).`;

                if (error.message.includes("403") || error.message.includes("permission")) {
                    userFriendlyMsg += " Error de permisos (403). Verifica que tu API Key esté activa y que tu región sea compatible.";
                } else if (isOverloaded) {
                    userFriendlyMsg += " Límite de cuota excedido temporalmente. Por favor, intenta de nuevo en unos momentos.";
                }

                console.error("------------------------------");
                return userFriendlyMsg;
            }
        }
    }
}

module.exports = GeminiProvider;
