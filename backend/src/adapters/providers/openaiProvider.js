const OpenAI = require("openai");
const { OPENAI_API_KEY } = require('../../config/appConfig');

class OpenAIProvider {
    constructor() {
        if (!OPENAI_API_KEY) {
            console.warn("OpenAI API Key no configurada.");
        }
        this.openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    }

    async generateResponse(messages) {
        if (!OPENAI_API_KEY) return "Error: API Key de OpenAI no configurada.";

        try {
            const completion = await this.openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: messages,
                max_tokens: 1500,
                temperature: 0.7,
            });
            return completion.choices[0].message.content.trim();
        } catch (error) {
            console.error("Error OpenAI:", error.message);
            return "Lo siento, hubo un error al conectar con la IA.";
        }
    }
}

module.exports = OpenAIProvider;
