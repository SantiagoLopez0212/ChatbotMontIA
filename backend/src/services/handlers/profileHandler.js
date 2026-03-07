const ChatHandler = require('./chatHandler');

// Expresiones simples para capturar datos del usuario
const NAME_PATTERNS = [/\bme llamo\s+([a-záéíóúñü\s]{2,})\b/i, /\bmi nombre es\s+([a-záéíóúñü\s]{2,})\b/i];
const CAREER_PATTERNS = [/\bestudio\s+([a-záéíóúñü\s]{2,})\b/i, /\bmi carrera es\s+([a-záéíóúñü\s]{2,})\b/i];
const JOB_PATTERNS = [/\btrabajo como\s+([a-záéíóúñü\s]{2,})\b/i];
const LIKE_PATTERNS = [/\bme (?:gusta|gustan)\s+([a-záéíóúñü\s]{2,})\b/i];
const DISLIKE_PATTERNS = [/\bno me (?:gusta|gustan)\s+([a-záéíóúñü\s]{2,})\b/i];

class ProfileHandler extends ChatHandler {
  canHandle({ rawMessage }) {
    const text = rawMessage || '';
    return [NAME_PATTERNS, CAREER_PATTERNS, JOB_PATTERNS, LIKE_PATTERNS, DISLIKE_PATTERNS]
      .some(arr => arr.some(rx => rx.test(text)));
  }

  async handle({ rawMessage, memory, clientId }) {
    const text = rawMessage || '';
    const tryMatch = (arr) => {
      for (const rx of arr) { const m = text.match(rx); if (m && m[1]) return m[1].trim(); }
      return null;
    };

    const name = tryMatch(NAME_PATTERNS);
    if (name) { memory.setName(clientId, name); return `Encantado, ${name}. Lo tendré presente.`; }

    const career = tryMatch(CAREER_PATTERNS);
    if (career) { memory.setCareer(clientId, career); return `Perfecto. Registraré que estudias ${career}.`; }

    const job = tryMatch(JOB_PATTERNS);
    if (job) { memory.setJob(clientId, job); return `Gracias. Anoto que trabajas como ${job}.`; }

    const like = tryMatch(LIKE_PATTERNS);
    if (like) { memory.addLike(clientId, like); return `Anotado: te gusta ${like}.`; }

    const dislike = tryMatch(DISLIKE_PATTERNS);
    if (dislike) { memory.addDislike(clientId, dislike); return `Entendido: no te gusta ${dislike}.`; }

    return 'He registrado tu información.';
  }
}

module.exports = ProfileHandler;