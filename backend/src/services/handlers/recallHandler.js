const ChatHandler = require('./chatHandler');
const { includesAny } = require('../../domain/textUtils');

const NAME_ASK = ['como me llamo', 'cual es mi nombre'];
const CAREER_ASK = ['que estudio', 'que carrera estudio', 'cual es mi carrera'];
const LIKES_ASK = ['que me gusta', 'que cosas me gustan'];

class RecallHandler extends ChatHandler {
  canHandle({ normalizedMessage }) {
    return includesAny(normalizedMessage, NAME_ASK) || includesAny(normalizedMessage, CAREER_ASK) || includesAny(normalizedMessage, LIKES_ASK);
  }

  async handle({ normalizedMessage, memory, clientId }) {
    const p = memory.getProfile(clientId);
    if (!p) return 'Aún no tengo datos tuyos.';
    if (includesAny(normalizedMessage, NAME_ASK)) {
      return p.name ? `Me dijiste que te llamas ${p.name}.` : 'Aún no me dijiste tu nombre.';
    }
    if (includesAny(normalizedMessage, CAREER_ASK)) {
      return p.career ? `Estudias ${p.career}.` : 'Aún no me dijiste qué estudias.';
    }
    if (includesAny(normalizedMessage, LIKES_ASK)) {
      if (p.likes && p.likes.length) return `Me comentaste que te gusta: ${p.likes.join(', ')}.`;
      return 'Aún no me dijiste qué te gusta.';
    }
    return 'No estoy seguro de qué quieres recordar.';
  }
}

module.exports = RecallHandler;