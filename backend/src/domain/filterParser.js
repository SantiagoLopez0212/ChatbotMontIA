/**
 * filterParser.js
 * Interpreta lenguaje natural del usuario para extraer filtros
 * (años, idioma, tipo, open access, palabra clave, etc.)
 */

function extractSearchParameters(message) {
  const normalized = normalizeText(message);
  const filters = {};

  // Año mínimo y máximo
  const yearRange = normalized.match(/desde\s*(\d{4})\s*(?:hasta|a)\s*(\d{4})/);
  if (yearRange) {
    filters.yearMin = yearRange[1];
    filters.yearMax = yearRange[2];
  } else {
    const yearMin = normalized.match(/desde\s*(\d{4})/);
    const yearMax = normalized.match(/(hasta|a)\s*(\d{4})/);
    if (yearMin) filters.yearMin = yearMin[1];
    if (yearMax) filters.yearMax = yearMax[2];
  }

  // Idioma
  if (/en español|idioma español|spanish/.test(normalized)) filters.language = 'es';
  if (/en inglés|idioma inglés|english/.test(normalized)) filters.language = 'en';
  if (/en portugués|portuguese/.test(normalized)) filters.language = 'pt';

  // Tipo de artículo
  if (/journal|revista|artículo científico|paper/.test(normalized)) filters.articleType = 'journal';
  if (/conferencia|conference|ponencia/.test(normalized)) filters.articleType = 'conference';
  if (/libro|book/.test(normalized)) filters.articleType = 'book';

  // Acceso abierto
  if (/open access|acceso abierto|de libre acceso/.test(normalized)) filters.openAccess = 'Solo Open Access';

  // Palabra clave
  const keywordMatch = normalized.match(/sobre\s+([a-z0-9\s]+)/);
  if (keywordMatch) filters.keyword = keywordMatch[1].trim();

  // Consulta principal
  const query = extractQueryWithoutFilters(message);

  return { query, filters };
}

/**
 * Extrae solo el tema real de búsqueda, eliminando verbos de intención,
 * palabras de tipo de documento y filtros de fecha/idioma.
 *
 * Ejemplos:
 *   "buscar papers sobre machine learning"  → "machine learning"
 *   "dame artículos sobre redes neuronales" → "redes neuronales"
 *   "investigaciones sobre blockchain"       → "blockchain"
 *   "inteligencia artificial"               → "inteligencia artificial"
 */
function extractQueryWithoutFilters(message) {
  let query = message;

  // 1. Eliminar filtros de fecha e idioma
  const metaPatterns = [
    /desde\s*\d{4}/gi,
    /(hasta|a)\s*\d{4}/gi,
    /en\s+(espa[ñn]ol|ingl[eé]s|portugu[eé]s)/gi,
    /(open\s+access|acceso\s+abierto|de\s+libre\s+acceso)/gi,
  ];
  metaPatterns.forEach(p => (query = query.replace(p, '')));

  // 2. Si hay "sobre <tema>", extraer solo el tema (estrategia más precisa)
  const sobreMatch = query.match(/\bsobre\s+(.+)/i);
  if (sobreMatch) {
    // Eliminar residuos de tipo de documento que puedan haber quedado después de "sobre"
    let topic = sobreMatch[1]
      .replace(/\b(art[ií]culos?|papers?|investigaciones?|journals?|libros?|conferencias?|ponencias?)\b/gi, '')
      .trim();
    if (topic.length > 1) return topic;
  }

  // 3. Sin "sobre": eliminar verbos de intención y palabras de tipo de documento
  const intentWords = [
    /\b(busca[r]?|busco|encuentra[s]?|encontrar|dame|mu[eé]strame|quiero|necesito|lista[r]?|trae[r]?|obt[eé]n)\b/gi,
    /\b(art[ií]culos?|papers?|investigaciones?|journals?|publicaciones?|documentos?|libros?|estudios?)\b/gi,
    /\b(cient[íi]ficos?|acad[eé]micos?|recientes?|nuevos?)\b/gi,
  ];
  intentWords.forEach(p => (query = query.replace(p, '')));

  // Limpiar espacios múltiples
  return query.replace(/\s{2,}/g, ' ').trim();
}

/**
 * Normaliza texto para facilitar coincidencias.
 */
function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Detecta si el mensaje tiene intención de búsqueda.
 */
function isSearchIntent(message) {
  const normalized = normalizeText(message);
  return /(buscar|muéstrame|dame|encuentra|articulos|papers|investigaciones|busca)/.test(normalized);
}

module.exports = {
  extractSearchParameters,
  extractQueryWithoutFilters,
  normalizeText,
  isSearchIntent
};
