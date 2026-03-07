const ChatHandler = require('./chatHandler');
const { includesAny } = require('../../domain/textUtils');

const PURPOSE = ['que haces','para que sirves','cual es tu funcion'];
const CREATOR = ['quien te creo','quien te creó','quien te hizo','quien es tu creador'];
const FEELING = ['como te sientes','estas feliz','estas triste'];

class SmallTalkHandler extends ChatHandler {
  canHandle({ normalizedMessage }) {
    return includesAny(normalizedMessage, PURPOSE) || includesAny(normalizedMessage, CREATOR) || includesAny(normalizedMessage, FEELING);
  }
  async handle({ normalizedMessage }) {
    if (includesAny(normalizedMessage, CREATOR)) return 'Fui creado para un proyecto académico de Arquitectura de Sistemas.';
    if (includesAny(normalizedMessage, PURPOSE)) return 'Puedo conversar y ayudarte a encontrar artículos académicos relevantes.';
    if (includesAny(normalizedMessage, FEELING)) return 'No tengo emociones, pero estoy listo para ayudarte.';
    return 'Puedo charlar un poco, y apoyar con referencias cuando lo necesites.';
  }
}
module.exports = SmallTalkHandler;