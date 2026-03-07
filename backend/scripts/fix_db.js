const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function dropTable() {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'proyecto_chatbot',
            port: parseInt(process.env.DB_PORT, 10) || 3306
        });

        console.log('Eliminando tabla "users" incorrecta...');
        await pool.query('DROP TABLE IF EXISTS users');
        console.log('✅ Tabla eliminada. Reinicia el servidor para recrearla.');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

dropTable();

