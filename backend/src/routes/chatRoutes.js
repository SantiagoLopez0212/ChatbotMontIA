/**
 * Rutas del chatbot y procesamiento de documentos
 * SRP: Este archivo solo maneja el montaje de rutas del chat.
 */
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
    const { message, filters = {} } = req.body;
    const userId = req.user ? req.user.id : null;
    const response = await chatbotService.handleMessage(message, filters, userId);
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
    if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo.' });
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Solo se permiten archivos PDF.' });
    }
    const text = await pdfService.extractTextFromPDF(req.file.buffer);
    chatbotService.setDocumentContext(req.user?.id || 'guest', text);
    res.json({
      ok: true,
      message: 'Documento procesado correctamente.',
      preview: text.substring(0, 500) + '...'
    });
  } catch (err) {
    console.error('Error en upload:', err);
    res.status(500).json({ error: 'Error procesando el PDF.' });
  }
});

// Descarga y análisis de PDF desde URL externa
router.post('/analyze-source', optionalAuth, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'Falta la URL del documento.' });

    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/pdf'
      }
    });

    const contentType = response.headers['content-type'] || '';
    if (!contentType.includes('application/pdf') && !url.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({ error: 'El enlace no apunta a un archivo PDF válido.' });
    }

    const text = await pdfService.extractTextFromPDF(Buffer.from(response.data));
    chatbotService.setDocumentContext(req.user?.id || 'guest', text);

    res.json({
      ok: true,
      message: 'Fuente analizada correctamente.',
      preview: text.substring(0, 500) + '...'
    });
  } catch (err) {
    console.error('Error analizando fuente:', err);
    res.status(500).json({ error: 'No se pudo descargar o procesar la fuente.' });
  }
});

module.exports = router;
