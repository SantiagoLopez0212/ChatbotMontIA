const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getPool } = require('../config/db');
const { JWT_SECRET } = require('../config/appConfig');

// Registro
async function register(req, res) {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Faltan campos obligatorios.' });

  try {
    const pool = getPool();
    // Verificar si el usuario ya existe
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Este correo ya está registrado.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashed]
    );

    const newUser = { id: result.insertId, name, email };
    const token = jwt.sign({ id: newUser.id, email }, JWT_SECRET, { expiresIn: '2h' });

    res.json({ user: newUser, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar usuario.', details: err.message });
  }
}

// Inicio de sesión
async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Faltan credenciales.' });

  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado.' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Contraseña incorrecta.' });
    }

    const token = jwt.sign({ id: user.id, email }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ user: { id: user.id, name: user.name, email: user.email }, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al iniciar sesión.', details: err.message });
  }
}

// Validar sesión actual
async function me(req, res) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Token faltante.' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const pool = getPool();
    const [rows] = await pool.query('SELECT id, name, email FROM users WHERE id = ?', [decoded.id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    res.json({ user: rows[0] });
  } catch (err) {
    res.status(401).json({ error: 'Token inválido o expirado.' });
  }
}

const { sendRecoveryEmail } = require('../services/mailer');

async function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requerido.' });

  try {
    const pool = await getPool();
    const [users] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await pool.execute(
      'INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)',
      [email, code, expiresAt]
    );

    await sendRecoveryEmail(email, code);

    res.json({ message: 'Código enviado. Revisa tu consola (Mock).' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al procesar solicitud.' });
  }
}

async function resetPassword(req, res) {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'Todos los campos son requeridos.' });
  }

  try {
    const pool = await getPool();

    const [resets] = await pool.execute(
      'SELECT * FROM password_resets WHERE email = ? AND token = ? AND expires_at > NOW() ORDER BY id DESC LIMIT 1',
      [email, code]
    );

    if (resets.length === 0) {
      return res.status(400).json({ error: 'Código inválido o expirado.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.execute('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);
    await pool.execute('DELETE FROM password_resets WHERE email = ?', [email]);

    res.json({ message: 'Contraseña actualizada correctamente.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al restablecer contraseña.' });
  }
}

module.exports = { register, login, me, forgotPassword, resetPassword };