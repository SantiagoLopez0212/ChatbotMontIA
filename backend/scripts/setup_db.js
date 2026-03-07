const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT, 10) || 3306
};

const DB_NAME = process.env.DB_NAME || 'proyecto_chatbot';

async function setupDatabase() {
    let connection;
    try {
        console.log('1. Conectando a MySQL (MySQL Workbench)...');
        connection = await mysql.createConnection(dbConfig);

        console.log(`2. Creando base de datos "${DB_NAME}" si no existe...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);

        console.log('3. Usando base de datos...');
        await connection.query(`USE \`${DB_NAME}\``);

        console.log('4. Creando tabla "password_resets"...');
        const createTableQuery = `
          CREATE TABLE IF NOT EXISTS password_resets (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            token VARCHAR(6) NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `;
        await connection.query(createTableQuery);

        console.log('✅ BASE DE DATOS Y TABLAS CONFIGURADAS CORRECTAMENTE.');
    } catch (error) {
        console.error('❌ ERROR CRÍTICO:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('   -> Asegúrate de que MySQL Server esté corriendo en el puerto ' + (process.env.DB_PORT || 3306) + '.');
        }
    } finally {
        if (connection) await connection.end();
    }
}

setupDatabase();

