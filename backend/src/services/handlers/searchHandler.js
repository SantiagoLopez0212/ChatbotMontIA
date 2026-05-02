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
    if (normalizedMessage.includes('quiero hacer focus mode')) return false;

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

  // Búsqueda combinada con filtros - OPTIMIZADA
  async searchArticles(query, filters, limit = 5, offset = 0) {
    // Timeout externo alineado con el timeout interno de cada estrategia (8s > 7s de axios)
    const withTimeout = (promise, ms) => {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), ms)
      );
      return Promise.race([promise, timeout]);
    };

    // 1. Ejecutar estrategias en paralelo con timeout de 8s
    const promises = this.searchStrategies.map(strategy =>
      withTimeout(strategy.search(query, filters, limit, offset), 8000)
        .catch(err => {
          console.warn(`[${strategy.name}] no disponible temporalmente: ${err.message}`);
          return [];
        })
    );

    const resultsArrays = await Promise.all(promises);

    // 2. Aplanar resultados
    const all = resultsArrays.flat();

    // 3. Eliminar duplicados por DOI o Título
    const unique = all.filter(
      (v, i, arr) => arr.findIndex(t => (t.doi && t.doi === v.doi) || (t.title === v.title && t.author === v.author)) === i
    );

    // 4. Filtrar por relevancia temática (el título debe contener palabras clave del query)
    const relevant = this._filterByRelevance(unique, query);

    // 5. Aplicar filtros adicionales localmente
    const filtered = this.applyLocalFilters(relevant, filters);

    return filtered.slice(0, limit);
  }


  // Filtra resultados cuyo título no contenga ninguna palabra significativa del query.
  // Evita que artículos sobre temas completamente distintos aparezcan en los resultados.
  _filterByRelevance(results, query) {
    const STOPWORDS = new Set([
      'de','del','la','el','los','las','en','y','a','o','un','una','unos','unas',
      'sobre','para','con','por','que','se','no','al','lo','su','sus','es','son',
      'le','les','me','mi','tu','si','ya','mas','muy','esto','este','esta','the',
      'of','in','and','for','to','an','on','with','by','at','from'
    ]);

    // Palabras de intención que no describen el tema y no deben usarse para
    // juzgar relevancia (causan falsos positivos cuando aparecen en títulos)
    const INTENT_WORDS = new Set([
      'buscar','busca','busco','encuentra','encontrar','dame','muestrame',
      'quiero','necesito','listar','traer','obtener','articulos','articulo',
      'papers','paper','investigaciones','investigacion','publicaciones',
      'publicacion','documentos','documento','libros','libro','estudios',
      'estudio','journals','journal','conferencias','conferencia'
    ]);

    const norm = t => (t || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const queryWords = norm(query)
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOPWORDS.has(w) && !INTENT_WORDS.has(w));

    if (queryWords.length === 0) return results;

    return results.filter(item => {
      const titleNorm = norm(item.title);
      return queryWords.some(word => titleNorm.includes(word));
    });
  }

  // ... applyLocalFilters se mantiene igual ...
  applyLocalFilters(results, filters) {
    return results.filter(item => {
      const year = parseInt(item.year);

      if (filters.yearMin && !isNaN(year) && year < parseInt(filters.yearMin)) return false;
      if (filters.yearMax && !isNaN(year) && year > parseInt(filters.yearMax)) return false;

      if (filters.language && filters.language !== 'Todos') {
        const lang = (item.language || '').toLowerCase();
        const wantedLang = filters.language.toLowerCase();

        // Rechazar si el metadato de idioma es explícitamente diferente
        if (lang && !lang.startsWith(wantedLang)) return false;

        // Heurística de respaldo: algunos artículos tienen metadatos de idioma
        // incorrectos en las APIs. Detectamos el idioma real por caracteres del título.
        const title = item.title || '';
        if (wantedLang === 'en' && /[áéíóúüñãõàèìòùâêîôûäëïöÿç]/i.test(title)) return false;
        if (wantedLang === 'es' && !/[áéíóúüñ]/i.test(title) && /^[a-zA-Z0-9\s.,;:()\-'"]+$/.test(title)) return false;
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
