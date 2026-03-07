const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'proyecto_chatbot',
    port: parseInt(process.env.DB_PORT, 10) || 3306
};

async function createUser() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const email = 'santiagolopezgomez33@gmail.com';
        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log(`Creando usuario: ${email}`);

        // Verificar si existe
        const [existing] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            console.log('⚠️ El usuario ya existe. No se hizo nada.');
        } else {
            await connection.execute(
                'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
                ['Santiago Lopez', email, hashedPassword]
            );
            console.log('✅ Usuario creado exitosamente.');
        }

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

createUser();
