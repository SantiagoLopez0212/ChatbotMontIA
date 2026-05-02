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

// Middleware global
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));
app.use(securityHeaders);
app.use(rateLimiter(5 * 60 * 1000, 100));
// Servir avatares públicamente
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api', chatRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, name: API_NAME, port: PORT });
});

// Servir frontend estático
const frontendPath = path.join(__dirname, '../../frontend');
app.use(express.static(frontendPath));

// Catch-all: cualquier ruta que no sea /api/* devuelve index.html
app.get(/^\/(?!api).*/, (_req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

module.exports = app;
