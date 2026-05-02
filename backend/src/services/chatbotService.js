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
const OnboardingHandler = require('./handlers/onboardingHandler');

// Factory Method: instancia las estrategias de búsqueda
const SearchStrategyFactory = require('../factories/SearchStrategyFactory');
const searchStrategies = SearchStrategyFactory.createAllStrategies();

// Dependency Injection: SearchHandler recibe las estrategias
const searchHandlerInstance = new SearchHandler(null, searchStrategies);

// Gateway de búsqueda: desacopla PaginationHandler del SearchHandler concreto
const searchGateway = (query, limit, filters, offset) =>
  searchHandlerInstance.searchArticles(query, filters, limit, offset);

const onboardingHandler = new OnboardingHandler();

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
 * @param {number|string|null} conversationId
 * @returns {Promise<{text: string, type: string, data?: any}>}
 */
async function handleMessage(message, filters = {}, userId = null, conversationId = null) {
  const session = getSession(userId, conversationId);

  // Onboarding: tiene prioridad sobre cualquier otro handler
  const onboardingCtx = {
    userId,
    message,
    onboardingStep: session.onboardingStep || 0
  };

  if (userId) {
    const onboardingResult = await onboardingHandler.handle(onboardingCtx);
    if (onboardingResult) {
      // Actualizar el paso en la sesión
      if (onboardingResult.onboardingCompleted || onboardingResult.onboardingStep === -1) {
        session.onboardingStep = undefined;
      } else {
        session.onboardingStep = onboardingResult.onboardingStep;
      }
      return { text: onboardingResult.response, type: 'text' };
    }
  }

  const ctx = {
    rawMessage: message,
    normalizedMessage: normalizeText(message),
    filters,
    session,
    userId,
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
