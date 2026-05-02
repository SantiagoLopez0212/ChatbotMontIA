/**
 * SessionManager - Gestión de sesiones en memoria
 *
 * SRP: Separa la responsabilidad de gestión de sesiones del servicio del chatbot.
 * La clase Session encapsula el estado de una sesión de usuario individual.
 * SessionManager actúa como repositorio en memoria para esas sesiones.
 *
 * Alta Cohesión: todo lo relacionado con sesiones vive aquí.
 * Bajo Acoplamiento: chatbotService solo importa las funciones que necesita.
 */

class Session {
  constructor(id) {
    this.id = id;
    this.searchState = null;   // { query, filters, offset, limit }
    this.documentContext = null; // Texto extraído de un PDF
  }

  /** Inicia una nueva búsqueda en la sesión */
  start(query, filters) {
    this.searchState = { query, filters, offset: 0, limit: 5 };
  }

  /** Indica si hay una búsqueda activa */
  hasActiveSearch() {
    return !!this.searchState;
  }

  /** Avanza a la siguiente página de resultados */
  advancePage() {
    if (!this.searchState) return null;
    this.searchState.offset += this.searchState.limit;
    return this.searchState;
  }

  /** Retrocede a la página anterior de resultados */
  rollbackPage() {
    if (!this.searchState) return;
    this.searchState.offset = Math.max(0, this.searchState.offset - this.searchState.limit);
  }
}

// Almacén en memoria: userId → Session
const sessions = new Map();

/**
 * Obtiene o crea la sesión para un usuario dado en un chat específico.
 * @param {string|null} userId - ID del usuario (o null para anónimo)
 * @param {number|string|null} conversationId - ID del chat abierto
 * @returns {Session}
 */
function getSession(userId, conversationId) {
  const userKey = userId || 'anonymous';
  const chatKey = conversationId || 'default';
  const key = `${userKey}_${chatKey}`;

  if (!sessions.has(key)) {
    sessions.set(key, new Session(key));
  }
  return sessions.get(key);
}

/**
 * Establece el contexto de documento PDF en la sesión de un usuario para este chat puntual.
 * @param {string|null} userId
 * @param {number|string|null} conversationId
 * @param {string} text - Texto extraído del PDF
 */
function setDocumentContext(userId, conversationId, text) {
  const session = getSession(userId, conversationId);
  session.documentContext = text;
}

module.exports = { getSession, setDocumentContext };
