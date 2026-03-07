/**
 * server.js - Punto de entrada de la aplicación
 *
 * SRP: Solo arranca el servidor HTTP y llama a initDB().
 * La lógica de Express vive en app.js.
 * La lógica de la BD vive en config/db.js.
 */
const app = require('./app');
const { PORT } = require('./config/appConfig');
const { initDB } = require('./config/db');

app.listen(PORT, async () => {
  try {
    await initDB();
  } catch (err) {
    console.warn('⚠️  El servidor arrancó pero no se pudo conectar a la BD. Asegúrate de que MySQL esté activo.');
  }
  console.log(`✅ MontIA escuchando en http://localhost:${PORT}`);
});
