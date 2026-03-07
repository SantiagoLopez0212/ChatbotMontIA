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
 * Extrae el texto de búsqueda sin los filtros detectados.
 */
function extractQueryWithoutFilters(message) {
  let query = message;
  const patterns = [
    /desde\s*\d{4}/gi,
    /(hasta|a)\s*\d{4}/gi,
    /en\s+(español|inglés|portugués)/gi,
    /(open access|acceso abierto|de libre acceso)/gi,
    /(artículo|journal|conferencia|libro|paper)/gi
  ];
  patterns.forEach(p => (query = query.replace(p, '')));
  return query.trim();
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
