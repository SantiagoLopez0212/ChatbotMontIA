const ChatHandler = require('./chatHandler');

class PaginationHandler extends ChatHandler {
  canHandle({ normalizedMessage, session }) {
    const words = normalizedMessage.split(' ');
    const keywords = ['mas', 'siguiente', 'ver mas', 'mostrar mas', 'mas resultados'];
    const hasKey = keywords.some(k => k.includes(' ') ? normalizedMessage.includes(k) : words.includes(k));
    return hasKey && session?.hasActiveSearch?.();
  }
  async handle({ session, searchGateway }) {
    const params = session.advancePage();
    try {
      const results = await searchGateway(params.query, params.limit, params.filters, params.offset);
      if (!results.length) { session.rollbackPage(); return 'No hay más resultados.'; }
      // Retornar objeto estructurado igual que SearchHandler
      return {
        text: `Aquí tienes más resultados para tu búsqueda:`,
        type: 'search_results',
        data: {
          query: params.query,
          results
        }
      };
    } catch (err) {
      session.rollbackPage();
      console.error('Error paginación:', err);
      return { text: 'No pude obtener más resultados en este momento.', type: 'text' };
    }
  }
}
module.exports = PaginationHandler;