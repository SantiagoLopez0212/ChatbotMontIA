function normalizeText(text) {
  return (text || '')
    .toString()
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9ñáéíóúü\s]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function includesAny(text, keywords) {
  if (!text) return false;
  return keywords.some(k => text.includes(k));
}

module.exports = { normalizeText, includesAny };