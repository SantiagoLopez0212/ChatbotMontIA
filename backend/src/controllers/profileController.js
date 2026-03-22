/**
 * profileController.js
 * SRP: Responsable exclusivamente de la gestión del perfil del usuario.
 * Incluye: updateProfile (campos de texto) y uploadAvatar (imagen).
 */
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { getPool } = require('../config/db');

// ── MULTER CONFIG ──────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '../../uploads/avatars');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `user_${req.user.id}_${Date.now()}${ext}`);
  }
});

const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Solo se permiten imágenes JPG, PNG, WEBP o GIF.'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// ── CONTROLADORES ──────────────────────────────────────────────

/**
 * GET /api/profile
 * Retorna todos los datos del perfil del usuario autenticado.
 */
async function getProfile(req, res) {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT id, name, email, apodo, avatar_url, area_estudio, nivel_academico, intereses, onboarding_done FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado.' });
    res.json({ user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener perfil.', details: err.message });
  }
}

/**
 * PUT /api/profile
 * Actualiza campos de texto del perfil (apodo, área, nivel, intereses, onboarding_done).
 */
async function updateProfile(req, res) {
  const { apodo, area_estudio, nivel_academico, intereses, onboarding_done } = req.body;
  try {
    const pool = getPool();
    await pool.query(
      `UPDATE users SET
        apodo = COALESCE(?, apodo),
        area_estudio = COALESCE(?, area_estudio),
        nivel_academico = COALESCE(?, nivel_academico),
        intereses = COALESCE(?, intereses),
        onboarding_done = COALESCE(?, onboarding_done)
       WHERE id = ?`,
      [apodo || null, area_estudio || null, nivel_academico || null,
       intereses || null, onboarding_done !== undefined ? onboarding_done : null,
       req.user.id]
    );
    const [rows] = await pool.query(
      'SELECT id, name, email, apodo, avatar_url, area_estudio, nivel_academico, intereses, onboarding_done FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json({ message: 'Perfil actualizado.', user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar perfil.', details: err.message });
  }
}

/**
 * POST /api/profile/avatar
 * Sube una foto de perfil. Usa multer como middleware.
 */
async function uploadAvatar(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo.' });
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const pool = getPool();
    await pool.query('UPDATE users SET avatar_url = ? WHERE id = ?', [avatarUrl, req.user.id]);
    res.json({ message: 'Avatar subido.', avatar_url: avatarUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al subir avatar.', details: err.message });
  }
}

module.exports = { getProfile, updateProfile, uploadAvatar, upload };
