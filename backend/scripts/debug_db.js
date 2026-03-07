const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function checkColumns() {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'proyecto_chatbot',
            port: parseInt(process.env.DB_PORT, 10) || 3306
        });

        console.log('Verificando columnas de la tabla "users"...');
        const [columns] = await pool.query('SHOW COLUMNS FROM users');
        console.log(columns.map(c => c.Field));
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

checkColumns();

