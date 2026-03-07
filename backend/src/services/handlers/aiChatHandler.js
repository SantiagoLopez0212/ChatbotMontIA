const ChatHandler = require('./chatHandler');
const aiAdapter = require('../../adapters/aiAdapter');

class AIChatHandler extends ChatHandler {
    canHandle({ normalizedMessage }) {
        // Si no es un comando específico, asumimos que es una charla general para la IA
        // Esto debería ir al final de la cadena de responsabilidad
        return true;
    }

    async handle({ rawMessage, documentContext }) {
        let systemPrompt = "Eres un asistente virtual profesional especializado en gestión de información y atención al cliente. Responde siempre en español y de forma clara y amable.";

        if (documentContext) {
            systemPrompt += `\n\nCONTEXTO DEL DOCUMENTO CARGADO:\n${documentContext.substring(0, 15000)}\n\nINSTRUCCIONES CRÍTICAS:\n1. El usuario ha cargado un documento. Usa la información anterior para responder.\n2. Si el usuario pide citas, extrae FRAGMENTOS TEXTUALES EXACTOS del documento entre comillas.\n3. Si la respuesta no está en el documento, menciónalo y responde con tus conocimientos generales.`;
        }

        return await aiAdapter.getChatResponse(systemPrompt, rawMessage);
    }
}

module.exports = AIChatHandler;
