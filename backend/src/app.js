/**
 * app.js - Configuración de Express
 *
 * SRP: Este archivo SOLO configura el middleware global y monta los routers.
 * Toda la lógica de rutas vive en src/routes/.
 * Alta Cohesión: un archivo, una responsabilidad.
 */
const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const { API_NAME, PORT } = require('./config/appConfig');
const securityHeaders = require('./middleware/securityHeaders');
const rateLimiter = require('./middleware/rateLimiter');

// Routers (SRP: cada router maneja su propio dominio)
const authRoutes = require('./routes/authRoutes');
const historyRoutes = require('./routes/historyRoutes');
const chatRoutes = require('./routes/chatRoutes');
const profileRoutes = require('./routes/profileRoutes');

const app = express();

// ===================================
// Middleware global
// ===================================
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));
app.use(securityHeaders);
app.use(rateLimiter(5 * 60 * 1000, 100));
// Servir avatares públicamente
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ===================================
// Rutas
// ===================================
app.use('/api/auth', authRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api', chatRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, name: API_NAME, port: PORT });
});

module.exports = app;
