const ChatHandler = require('./chatHandler');
const { extractSearchParameters, isSearchIntent } = require('../../domain/filterParser');
const { formatResultLine } = require('../resultFormatter');

const SEARCH_TIP =
  'Di "más" para ver más resultados. También puedes filtrar con año, idioma, tipo o acceso abierto.';

class SearchHandler extends ChatHandler {
  constructor(conversationService, searchStrategies = []) {
    super(conversationService);
    this.searchStrategies = searchStrategies;
  }

  canHandle({ normalizedMessage }) {
    // Evitar capturar intenciones de paginación o explicación
    if (/^(dame\s+m[aá]s|ver\s+m[aá]s|siguientes|más resultados|mostrar\s+m[aá]s)$/.test(normalizedMessage)) return false;
    if (/^(explicar|expl[íi]came|resumir|resumen|analizar|act[uú]a)\b/.test(normalizedMessage)) return false;

    return isSearchIntent(normalizedMessage);
  }

  async handle({ rawMessage, session, limit, filters = {} }) {
    const { query } = extractSearchParameters(rawMessage);

    try {
      const results = await this.searchArticles(query, filters, limit || 5);
      session?.setReferences?.(query, results);

      if (!results.length) {
        return {
          text: 'No encontré resultados con esos filtros. Intenta ampliar el rango o quitar algún filtro.',
          type: 'text'
        };
      }

      session?.start?.(query, filters);

      // Retornamos objeto estructurado para que el frontend decida cómo mostrarlo
      return {
        text: `Aquí tienes los artículos encontrados sobre "${query}". Puedes ver los detalles, generar citas o explorar el mapa de conocimiento.`,
        type: 'search_results',
        data: {
          query,
          results // Array de objetos con { title, author, year, doi, etc }
        }
      };
    } catch (err) {
      console.error('Error en SearchHandler:', err.message);
      return {
        text: 'Hubo un problema al consultar las bases de datos. Intenta de nuevo en unos minutos.',
        type: 'text'
      };
    }
  }

  // Búsqueda combinada con filtros
  async searchArticles(query, filters, limit = 5, offset = 0) {
    // 1. Ejecutar estrategias en paralelo
    const promises = this.searchStrategies.map(strategy =>
      strategy.search(query, filters, limit, offset)
    );

    const resultsArrays = await Promise.all(promises);

    // 2. Aplanar resultados
    const all = resultsArrays.flat();

    // 3. Eliminar duplicados por DOI o Título
    const unique = all.filter(
      (v, i, arr) => arr.findIndex(t => (t.doi && t.doi === v.doi) || (t.title === v.title && t.author === v.author)) === i
    );

    // 4. Aplicar filtros adicionales localmente
    const filtered = this.applyLocalFilters(unique, filters);

    return filtered.slice(0, limit);
  }


  // ... applyLocalFilters se mantiene igual ...
  applyLocalFilters(results, filters) {
    return results.filter(item => {
      const year = parseInt(item.year);

      if (filters.yearMin && !isNaN(year) && year < parseInt(filters.yearMin)) return false;
      if (filters.yearMax && !isNaN(year) && year > parseInt(filters.yearMax)) return false;

      if (filters.language && filters.language !== 'Todos') {
        const lang = (item.language || '').toLowerCase();
        if (!lang.includes(filters.language.toLowerCase())) return false;
      }

      if (filters.articleType && filters.articleType !== 'Todos') {
        const type = (item.type || '').toLowerCase();
        const filter = filters.articleType.toLowerCase();

        // Mapeo de tipos para coincidir con las APIs
        if (filter === 'scientific') {
          // "Científico" incluye artículos de revista, research, etc.
          if (!type.includes('article') && !type.includes('journal') && !type.includes('research')) return false;
        } else if (filter === 'journal') {
          if (!type.includes('journal') && !type.includes('article')) return false;
        } else if (filter === 'conference') {
          if (!type.includes('proceeding') && !type.includes('conference')) return false;
        } else {
          // Fallback genérico
          if (!type.includes(filter)) return false;
        }
      }

      if (filters.openAccess && (filters.openAccess === 'true' || filters.openAccess === 'Solo Open Access' || filters.openAccess === true)) {
        if (!(item.openAccess === true || item.access === 'open')) return false;
      }

      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        const title = (item.title || '').toLowerCase();
        if (!title.includes(keyword)) return false;
      }

      return true;
    });
  }



}

module.exports = SearchHandler;
module.exports.SEARCH_TIP = SEARCH_TIP;
