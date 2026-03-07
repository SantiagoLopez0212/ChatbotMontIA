const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'proyecto_chatbot',
    port: parseInt(process.env.DB_PORT, 10) || 3306
};

async function createTable() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('Conectado a la base de datos (MySQL Workbench).');

        const createTableQuery = `
      CREATE TABLE IF NOT EXISTS password_resets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        token VARCHAR(6) NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

        await connection.execute(createTableQuery);
        console.log('Tabla "password_resets" creada o verificada correctamente.');
        await connection.end();
    } catch (error) {
        console.error('Error creando la tabla:', error);
    }
}

createTable();

