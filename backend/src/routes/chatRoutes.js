const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');

const chatbotService = require('../services/chatbotService');
const mindMapHandler = require('../services/handlers/mindMapHandler');
const pdfService = require('../services/pdfService');
const validateInput = require('../middleware/validateInput');
const optionalAuth = require('../middleware/optionalAuthMiddleware');

const upload = multer({ storage: multer.memoryStorage() });

// Endpoint principal del chatbot
router.post('/chat', optionalAuth, validateInput, async (req, res) => {
  try {
    const { message, filters = {}, conversationId = null } = req.body;
    const userId = req.user ? req.user.id : null;
    const response = await chatbotService.handleMessage(message, filters, userId, conversationId);
    res.json({
      reply: response.text || response,
      type: response.type || 'text',
      data: response.data || null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: 'Error interno del servidor.' });
  }
});

// Limpia el documento cargado en la sesión actual
router.post('/clear-document', optionalAuth, (req, res) => {
  const userId = req.user?.id || 'guest';
  const { conversationId = null } = req.body;
  chatbotService.setDocumentContext(userId, conversationId, null);
  res.json({ ok: true });
});

// Endpoint del Mapa Conceptual
router.post('/mindmap', optionalAuth, async (req, res) => {
  try {
    const { query, results } = req.body;
    if (!query || !results || !Array.isArray(results)) {
      return res.status(400).json({ error: 'Se requieren query y results (array).' });
    }
    const graphData = await mindMapHandler.generateGraph(query, results);
    res.json(graphData);
  } catch (err) {
    console.error('Error generando mapa conceptual:', err);
    res.status(500).json({ error: 'Error generando el mapa conceptual.' });
  }
});



// Subida y extracción de texto desde PDF
router.post('/upload', optionalAuth, upload.single('file'), async (req, res) => {
  try {
    // Tomar chat ID desde req.body form-data si existe
    const conversationId = req.body.conversationId || null;

    if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo.' });
    if (req.file.mimetype !== 'application/pdf') {
       return res.status(400).json({ error: 'Solo se permiten archivos PDF.' });
    }
    const text = await pdfService.extractTextFromPDF(req.file.buffer);
    chatbotService.setDocumentContext(req.user?.id || 'guest', conversationId, text);
    res.json({
      ok: true,
      message: 'Documento procesado correctamente.',
      preview: text.substring(0, 500) + '...'
    });
  } catch (err) {
    console.error('Error en upload:', err);
    res.status(500).json({ error: `Error interno de procesamiento PDF: ${err.message}` });
  }
});

// Descarga y análisis de PDF desde URL externa
router.post('/analyze-source', optionalAuth, async (req, res) => {
  try {
    const { url, conversationId = null } = req.body;
    if (!url) return res.status(400).json({ error: 'Falta la URL del documento.' });

    let text = '';
    let sourceType = 'unknown';

    // Intentar descargar el contenido
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 15000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/pdf,text/html,application/xhtml+xml,*/*'
      }
    });

    const contentType = response.headers['content-type'] || '';
    const dataBuffer = Buffer.from(response.data);

    // Si es PDF, extraer texto del PDF
    if (contentType.includes('application/pdf') || url.toLowerCase().endsWith('.pdf')) {
      text = await pdfService.extractTextFromPDF(dataBuffer);
      sourceType = 'pdf';
    } 
    // Si es HTML, extraer texto de la página (abstract, metadata, etc.)
    else if (contentType.includes('text/html') || contentType.includes('application/xhtml')) {
      const htmlContent = dataBuffer.toString('utf-8');
      text = extractTextFromHTML(htmlContent);
      sourceType = 'webpage';
    }
    // Intentar como texto plano
    else {
      text = dataBuffer.toString('utf-8').substring(0, 10000);
      sourceType = 'text';
    }

    if (!text || text.length < 50) {
      return res.status(400).json({ 
        error: 'No se pudo extraer contenido suficiente del documento.',
        hint: 'El artículo puede requerir acceso institucional o suscripción.'
      });
    }

    // Usamos el texto consolidado y lo asilamos de una vez por chat
    chatbotService.setDocumentContext(req.user?.id || 'guest', conversationId, text);

    res.json({
      ok: true,
      message: 'Fuente analizada correctamente.',
      sourceType,
      preview: text.substring(0, 500) + '...'
    });
  } catch (err) {
    console.error('Error analizando fuente:', err.message);
    
    // Mensaje más descriptivo según el error
    let errorMsg = 'No se pudo descargar o procesar la fuente.';
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
      errorMsg = 'No se pudo conectar con el servidor del artículo.';
    } else if (err.response?.status === 403) {
      errorMsg = 'Acceso denegado. El artículo puede requerir suscripción.';
    } else if (err.response?.status === 404) {
      errorMsg = 'El artículo no fue encontrado en esa URL.';
    }
    
    res.status(500).json({ error: errorMsg });
  }
});

/**
 * Extrae texto relevante de HTML (abstract, contenido principal, metadata)
 */
function extractTextFromHTML(html) {
  // Remover scripts, styles, y tags HTML
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');

  // Buscar el abstract específicamente (común en páginas de artículos)
  const abstractMatch = html.match(/<abstract[^>]*>([\s\S]*?)<\/abstract>/i) ||
                        html.match(/class="abstract"[^>]*>([\s\S]*?)<\/div>/i) ||
                        html.match(/id="abstract"[^>]*>([\s\S]*?)<\/section>/i) ||
                        html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i) ||
                        html.match(/<meta[^>]*name="DC\.description"[^>]*content="([^"]+)"/i);

  let abstractText = '';
  if (abstractMatch) {
    abstractText = abstractMatch[1].replace(/<[^>]+>/g, ' ').trim();
  }

  // Extraer todo el texto visible
  text = text
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Si encontramos abstract, priorizarlo
  if (abstractText && abstractText.length > 100) {
    return `ABSTRACT:\n${abstractText}\n\nCONTENIDO ADICIONAL:\n${text.substring(0, 5000)}`;
  }

  return text.substring(0, 8000);
}

module.exports = router;
