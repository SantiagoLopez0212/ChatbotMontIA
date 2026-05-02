const pdfParse = require('pdf-parse');

/**
 * Extrae texto de un buffer de PDF
 * @param {Buffer} dataBuffer
 * @returns {Promise<string>}
 */
async function extractTextFromPDF(dataBuffer) {
    try {
        const options = {};
        const pdfFunc = typeof pdfParse === 'function' ? pdfParse : (pdfParse.default || pdfParse.parse || pdfParse);
        const data = await pdfFunc(dataBuffer, options);
        return data.text.trim();
    } catch (err) {
        console.error('Error parseando PDF:', err.message);
        throw new Error(`Fallo en pdf-parse: ${err.message}`);
    }
}

module.exports = { extractTextFromPDF };
