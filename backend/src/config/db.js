/**
 * db.js - Configuración y conexión a la base de datos (MySQL)
 *
 * SRP: Este módulo es el único responsable de toda la gestión de la BD.
 * Incluye la creación del pool de conexiones (Singleton) y la inicialización
 * de las tablas necesarias.
 *
 * Patrón Singleton: el pool se crea una sola vez y se reutiliza.
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

let pool;

/**
 * Retorna el pool de conexiones MySQL (crea uno si no existe aún).
 * @returns {mysql.Pool}
 */
function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'proyecto_chatbot',
      port: parseInt(process.env.DB_PORT, 10) || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }
  return pool;
}

/**
 * Crea las tablas necesarias si no existen.
 * SRP: La lógica de inicialización de BD pertenece aquí, no en server.js.
 */
async function initDB() {
  try {
    const db = getPool();

    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) DEFAULT 'Nueva conversación',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        conversation_id INT NOT NULL,
        sender ENUM('user', 'bot') NOT NULL,
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(100) NOT NULL,
        token VARCHAR(10) NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Columnas de perfil (ALTER IF NOT EXISTS es seguro y repetible)
    const profileCols = [
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS apodo VARCHAR(50) DEFAULT NULL",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500) DEFAULT NULL",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS area_estudio VARCHAR(100) DEFAULT NULL",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS nivel_academico VARCHAR(50) DEFAULT NULL",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS intereses TEXT DEFAULT NULL",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_done TINYINT(1) DEFAULT 0"
    ];
    for (const sql of profileCols) {
      await db.query(sql);
    }

    console.log('✅ Base de datos inicializada (tablas verificadas)');
  } catch (err) {
    console.error('❌ Error al inicializar la base de datos:', err.message);
    throw err;
  }
}

module.exports = { getPool, initDB };
