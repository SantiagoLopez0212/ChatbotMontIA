/**
 * Rutas de autenticación
 * SRP: Este archivo solo maneja el montaje de rutas de auth.
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authController.me);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
