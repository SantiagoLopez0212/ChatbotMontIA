const OpenAIProvider = require('./providers/openaiProvider');
const GeminiProvider = require('./providers/geminiProvider');
const MockProvider = require('./providers/mockProvider');
const { OPENAI_API_KEY, GEMINI_API_KEY } = require('../config/appConfig');

class AIAdapter {
    constructor() {
        if (OPENAI_API_KEY) {
            console.log("Modo IA: Activado (OpenAI)");
            this.provider = new OpenAIProvider();
        } else if (GEMINI_API_KEY) {
            console.log("Modo IA: Activado (Gemini Free Tier)");
            this.provider = new GeminiProvider();
        } else {
            console.log("Modo IA: Desactivado (Usando Mock)");
            this.provider = new MockProvider();
        }
    }

    async getChatResponse(systemPrompt, userMessage) {
        const messages = [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage }
        ];
        return await this.provider.generateResponse(messages);
    }
}

module.exports = new AIAdapter();
