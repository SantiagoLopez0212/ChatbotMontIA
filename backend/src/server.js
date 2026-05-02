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
