const { handleMessage } = require('./src/services/chatbotService');

async function testSearch() {
    console.log('--- Iniciando prueba de búsqueda refactorizada ---');
    try {
        const response = await handleMessage('buscar artículos sobre inteligencia artificial');
        console.log('Respuesta del bot:');
        console.log(response);

        if (response.includes('Artículos en formato APA 7') && (response.includes('CrossRef') || response.includes('OpenAlex') || response.includes('Google Books'))) {
            console.log('✅ PRUEBA EXITOSA: Se recibieron resultados de las estrategias.');
        } else {
            console.error('❌ PRUEBA FALLIDA: No se recibieron resultados esperados.');
        }
    } catch (error) {
        console.error('❌ ERROR CRÍTICO:', error);
    }
}

testSearch();
