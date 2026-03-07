class MockProvider {
    async generateResponse(messages) {
        // Simula un pequeño retraso para parecer real
        await new Promise(resolve => setTimeout(resolve, 500));

        const lastMessage = messages[messages.length - 1].content.toLowerCase();

        if (lastMessage.includes('hola') || lastMessage.includes('buenos dias')) {
            return "¡Hola! Soy MontIA en modo demostración. Puedo buscar artículos científicos por ti. Intenta decir: 'buscar artículos sobre clima'.";
        }

        if (lastMessage.includes('ayuda') || lastMessage.includes('que haces')) {
            return "Puedo buscar en bases de datos académicas como CrossRef y OpenAlex. Solo dime qué tema te interesa.";
        }

        return "Estoy en modo gratuito/demo y no tengo cerebro de IA conectado. Solo puedo responder saludos y realizar búsquedas de artículos. Para activar mi inteligencia completa, necesitas configurar una API Key.";
    }
}

module.exports = MockProvider;
