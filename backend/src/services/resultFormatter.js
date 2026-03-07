/**
 * Función principal
 * Devuelve cada resultado con formato:
 *  1. Apellido, N. (Año). Título. Revista. DOI
 */
function formatResultLine(item, index) {
  let authorStr = formatAuthors(item.author);
  const year = formatYear(item.year);
  const title = capitalizeFirstLetter(item.title || 'Título no disponible');
  const journal = item.journal ? ` *${item.journal}*` : '';
  const doi = item.doi ? ` ${item.doi}` : '';

  // Regla APA 7: Si no hay autor, el título pasa a la posición del autor
  if (!authorStr || authorStr === 'Autor desconocido') {
    return `${index}. ${title}. (${year}).${journal}.${doi}`;
  }

  return `${index}. ${authorStr} (${year}). ${title}.${journal}.${doi}`;
}

/**
 *  Formatea los autores al estilo APA (Apellido, N.)
 */
function formatAuthors(authorStr) {
  if (!authorStr || authorStr === 'Autor desconocido') return '';

  let authors = [];

  // Si ya es string (ej. CrossRef)
  if (typeof authorStr === 'string') {
    authors = authorStr.split(/[,;]+/).map(a => a.trim()).filter(Boolean);
  } else if (Array.isArray(authorStr)) {
    // Si es array (ej. OpenAlex)
    authors = authorStr.map(a => (typeof a === 'string' ? a : a.name || ''));
  }

  if (authors.length === 0) return '';

  // Limpiar y formatear cada autor como "Apellido, I."
  const formatted = authors.map(name => {
    if (name.includes(',')) {
      // Formato "Apellido, Nombre"
      const parts = name.split(',').map(p => p.trim());
      const lastName = parts[0];
      const initial = parts[1] ? parts[1].charAt(0).toUpperCase() : '';
      return initial ? `${lastName}, ${initial}.` : lastName;
    } else {
      // Formato "Nombre Apellido"
      const parts = name.split(' ').filter(Boolean);
      if (parts.length >= 2) {
        const lastName = parts[parts.length - 1];
        const initial = parts[0].charAt(0).toUpperCase();
        return `${lastName}, ${initial}.`;
      }
    }
    return name;
  });

  if (formatted.length === 1) return formatted[0];
  if (formatted.length === 2) return `${formatted[0]} & ${formatted[1]}`;
  if (formatted.length > 2)
    return `${formatted.slice(0, 2).join(', ')} et al.`;

  return '';
}

/**
 *  Formatea el año de publicación
 */
function formatYear(year) {
  if (!year) return 's.f.';
  if (typeof year === 'number' || /^\d{4}$/.test(year)) return year;
  const match = String(year).match(/\d{4}/);
  return match ? match[0] : 's.f.';
}

/**
 *  Capitaliza la primera letra del título
 */
function capitalizeFirstLetter(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 *  Formatea una lista completa de resultados
 */
function formatResultsList(results) {
  return results.map((r, i) => formatResultLine(r, i + 1)).join('\n');
}

module.exports = {
  formatResultLine,
  formatResultsList,
  formatAuthors,
  formatYear,
  capitalizeFirstLetter
};
