/**
 * chatbotService.js - Orquestador principal del chatbot
 *
 * SRP: Este servicio SOLO orquesta los handlers y las sesiones.
 * La gestión de sesiones fue extraída a domain/SessionManager.js.
 * 
 * Patrón: Chain of Responsibility — los handlers se encadenan en orden.
 * Patrón: Factory Method — las estrategias de búsqueda se crean via Factory.
 * Patrón: Dependency Injection — SearchHandler recibe las estrategias como parámetro.
 */
const { normalizeText } = require('../domain/textUtils');
const { getSession, setDocumentContext } = require('../domain/SessionManager');

// Handlers (Chain of Responsibility)
const GreetingHandler = require('./handlers/greetingHandler');
const SmallTalkHandler = require('./handlers/smallTalkHandler');
const ReferenceHandler = require('./handlers/referenceHandler');
const PaginationHandler = require('./handlers/paginationHandler');
const OpinionHandler = require('./handlers/opinionHandler');
const RecallHandler = require('./handlers/recallHandler');
const ProfileHandler = require('./handlers/profileHandler');
const AIChatHandler = require('./handlers/aiChatHandler');
const SearchHandler = require('./handlers/searchHandler');

// Factory Method: instancia las estrategias de búsqueda
const SearchStrategyFactory = require('../factories/SearchStrategyFactory');
const searchStrategies = SearchStrategyFactory.createAllStrategies();

// Dependency Injection: SearchHandler recibe las estrategias
const searchHandlerInstance = new SearchHandler(null, searchStrategies);

// Gateway de búsqueda: desacopla PaginationHandler del SearchHandler concreto
const searchGateway = (query, limit, filters, offset) =>
  searchHandlerInstance.searchArticles(query, filters, limit, offset);

// Cadena de handlers en orden de prioridad
const handlers = [
  new GreetingHandler(),
  new SmallTalkHandler(),
  new ProfileHandler(),
  searchHandlerInstance,
  new ReferenceHandler(),
  new PaginationHandler(),
  new OpinionHandler(),
  new RecallHandler(),
  new AIChatHandler(),
];

/**
 * Procesa un mensaje del usuario y retorna la respuesta del chatbot.
 * @param {string} message
 * @param {Object} filters
 * @param {string|null} userId
 * @returns {Promise<{text: string, type: string, data?: any}>}
 */
async function handleMessage(message, filters = {}, userId = null) {
  const session = getSession(userId);

  const ctx = {
    rawMessage: message,
    normalizedMessage: normalizeText(message),
    filters,
    session,
    documentContext: session.documentContext,
    searchGateway,
    limit: 5
  };

  for (const handler of handlers) {
    if (handler.canHandle(ctx)) {
      const output = await handler.handle(ctx);
      return typeof output === 'string'
        ? { text: output, type: 'text' }
        : output;
    }
  }

  return {
    text: "No entendí tu mensaje. Prueba: 'hola', '¿qué puedes hacer?', o 'busca artículos sobre IA'.",
    type: 'text'
  };
}

module.exports = { handleMessage, setDocumentContext };
