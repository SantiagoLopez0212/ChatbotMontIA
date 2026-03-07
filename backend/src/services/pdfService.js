const pdf = require('pdf-parse');

/**
 * Extrae texto de un buffer de PDF
 * @param {Buffer} dataBufferBuffer
 * @returns {Promise<string>}
 */
async function extractTextFromPDF(dataBuffer) {
    try {
        const options = {
            // Opciones si es necesario (ej. selector de páginas)
        };
        const data = await pdf(dataBuffer, options);
        return data.text.trim();
    } catch (err) {
        console.error('Error parseando PDF:', err.message);
        throw new Error('No se pudo leer el contenido del PDF.');
    }
}

module.exports = { extractTextFromPDF };
