/**
 * profileRoutes.js
 * SRP: Montaje de rutas exclusivas del perfil de usuario.
 * Todas las rutas requieren autenticación JWT.
 */
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getProfile, updateProfile, uploadAvatar, upload } = require('../controllers/profileController');

router.get('/', authMiddleware, getProfile);
router.put('/', authMiddleware, updateProfile);
router.post('/avatar', authMiddleware, upload.single('avatar'), uploadAvatar);

module.exports = router;
