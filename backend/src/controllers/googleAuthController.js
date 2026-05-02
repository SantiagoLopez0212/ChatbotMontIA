/**
 * googleAuthController.js - Controlador para autenticación con Google OAuth 2.0
 * 
 * Flujo:
 * 1. Usuario hace clic en "Continuar con Google"
 * 2. Frontend redirige a /api/auth/google
 * 3. Backend redirige a Google para autenticación
 * 4. Google redirige de vuelta a /api/auth/google/callback con un código
 * 5. Backend intercambia el código por tokens y obtiene info del usuario
 * 6. Backend crea/actualiza usuario en BD y genera JWT
 * 7. Redirige al frontend con el token
 */

const jwt = require('jsonwebtoken');
const { getPool } = require('../config/db');
const { JWT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = require('../config/appConfig');

// URLs de Google OAuth
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

/**
 * Genera la URL de autorización de Google y redirige al usuario
 */
function initiateGoogleAuth(req, res) {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent'
  });

  const authUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;
  res.redirect(authUrl);
}

/**
 * Callback de Google OAuth - intercambia código por tokens y crea/actualiza usuario
 */
async function handleGoogleCallback(req, res) {
  const { code, error } = req.query;

  // Si el usuario canceló o hubo error
  if (error || !code) {
    return res.redirect('/auth.html?error=google_auth_cancelled');
  }

  try {
    // 1. Intercambiar código por tokens
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Error obteniendo token de Google:', tokenData);
      return res.redirect('/auth.html?error=google_token_failed');
    }

    // 2. Obtener información del usuario de Google
    const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    const googleUser = await userInfoResponse.json();

    if (!userInfoResponse.ok || !googleUser.email) {
      console.error('Error obteniendo info de usuario:', googleUser);
      return res.redirect('/auth.html?error=google_userinfo_failed');
    }

    // 3. Buscar o crear usuario en la base de datos
    const pool = getPool();
    
    // Primero buscar por google_id
    let [users] = await pool.query('SELECT * FROM users WHERE google_id = ?', [googleUser.id]);
    
    let user;
    
    if (users.length > 0) {
      // Usuario existente con Google - actualizar info si es necesario
      user = users[0];
      await pool.query(
        'UPDATE users SET name = ?, avatar_url = COALESCE(avatar_url, ?) WHERE id = ?',
        [googleUser.name || user.name, googleUser.picture, user.id]
      );
    } else {
      // Buscar por email (puede ser usuario que se registró con email/password)
      [users] = await pool.query('SELECT * FROM users WHERE email = ?', [googleUser.email]);
      
      if (users.length > 0) {
        // Vincular cuenta existente con Google
        user = users[0];
        await pool.query(
          'UPDATE users SET google_id = ?, avatar_url = COALESCE(avatar_url, ?) WHERE id = ?',
          [googleUser.id, googleUser.picture, user.id]
        );
      } else {
        // Crear nuevo usuario
        const [result] = await pool.query(
          'INSERT INTO users (name, email, google_id, avatar_url) VALUES (?, ?, ?, ?)',
          [googleUser.name || 'Usuario', googleUser.email, googleUser.id, googleUser.picture]
        );
        user = { id: result.insertId, name: googleUser.name, email: googleUser.email };
      }
    }

    // 4. Generar JWT
    const token = jwt.sign(
      { id: user.id, email: user.email || googleUser.email },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    // 5. Redirigir al frontend con el token
    res.redirect(`/index.html?token=${token}`);

  } catch (err) {
    console.error('Error en Google OAuth callback:', err);
    res.redirect('/auth.html?error=google_auth_error');
  }
}

module.exports = { initiateGoogleAuth, handleGoogleCallback };
