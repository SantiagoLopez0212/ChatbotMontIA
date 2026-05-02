require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  API_NAME: "MontIA Chatbot Académico",
  ALLOWED_ORIGINS: [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
  ],

  // Seguridad: fuente única de verdad para el JWT secret (principio DRY)
  JWT_SECRET: process.env.JWT_SECRET || (() => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET no definido en producción. Revisa tu archivo .env');
    }
    return 'dev_only_secret_change_me_in_env';
  })(),

  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,

  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || 'http://127.0.0.1:3000/api/auth/google/callback',
};
