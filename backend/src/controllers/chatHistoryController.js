const { getPool } = require('../config/db');

// Obtener todas las conversaciones del usuario
async function getConversations(req, res) {
    const userId = req.user.id;
    try {
        const pool = getPool();
        const [rows] = await pool.query(
            'SELECT * FROM conversations WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener conversaciones.' });
    }
}

// Crear nueva conversación
async function createConversation(req, res) {
    const userId = req.user.id;
    const { title } = req.body;
    const finalTitle = title || 'Nueva conversación';

    try {
        const pool = getPool();
        const [result] = await pool.query(
            'INSERT INTO conversations (user_id, title) VALUES (?, ?)',
            [userId, finalTitle]
        );
        res.json({ id: result.insertId, title: finalTitle, created_at: new Date() });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al crear conversación.' });
    }
}

// Eliminar conversación
async function deleteConversation(req, res) {
    const userId = req.user.id;
    const { id } = req.params;

    try {
        const pool = getPool();
        // Verificar propiedad
        const [check] = await pool.query('SELECT id FROM conversations WHERE id = ? AND user_id = ?', [id, userId]);
        if (check.length === 0) return res.status(404).json({ error: 'Conversación no encontrada.' });

        await pool.query('DELETE FROM conversations WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al eliminar conversación.' });
    }
}

// Renombrar conversación
async function updateTitle(req, res) {
    const userId = req.user.id;
    const { id } = req.params;
    const { title } = req.body;

    try {
        const pool = getPool();
        const [result] = await pool.query(
            'UPDATE conversations SET title = ? WHERE id = ? AND user_id = ?',
            [title, id, userId]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'No se pudo actualizar.' });
        res.json({ success: true, title });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al renombrar.' });
    }
}

// Obtener mensajes de una conversación
async function getMessages(req, res) {
    const userId = req.user.id;
    const { id } = req.params;

    try {
        const pool = getPool();
        // Verificar acceso
        const [check] = await pool.query('SELECT id FROM conversations WHERE id = ? AND user_id = ?', [id, userId]);
        if (check.length === 0) return res.status(403).json({ error: 'Acceso denegado.' });

        const [rows] = await pool.query(
            'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
            [id]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener mensajes.' });
    }
}

// Guardar mensaje
async function addMessage(req, res) {
    const userId = req.user.id;
    const { id } = req.params;
    const { sender, content } = req.body; // sender: 'user' | 'bot'

    try {
        const pool = getPool();
        // Verificar acceso
        const [check] = await pool.query('SELECT id FROM conversations WHERE id = ? AND user_id = ?', [id, userId]);
        if (check.length === 0) return res.status(403).json({ error: 'Acceso denegado.' });

        const [result] = await pool.query(
            'INSERT INTO messages (conversation_id, sender, content) VALUES (?, ?, ?)',
            [id, sender, content]
        );
        res.json({ id: result.insertId, conversation_id: id, sender, content, created_at: new Date() });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al guardar mensaje.' });
    }
}

module.exports = {
    getConversations,
    createConversation,
    deleteConversation,
    updateTitle,
    getMessages,
    addMessage
};
