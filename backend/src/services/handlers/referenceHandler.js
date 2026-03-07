const ChatHandler = require('./chatHandler');
const { includesAny } = require('../../domain/textUtils');
const { formatResultLine } = require('../resultFormatter');

const REFERENCE_KEYWORDS = ['referencias','fuentes','citame','cítame','dame las referencias'];

class ReferenceHandler extends ChatHandler {
  canHandle({ normalizedMessage, session }){
    if (!includesAny(normalizedMessage, REFERENCE_KEYWORDS)) return false;
    const refs = session?.getReferences?.();
    return Boolean(refs && refs.items && refs.items.length);
  }
  async handle({ session }){
    const refs = session.getReferences();
    const lines = refs.items.slice(0,7).map((r,i)=>formatResultLine(r, i+1));
    return `Aquí tienes algunas referencias sobre "${refs.topic}":\n${lines.join('\n')}`;
  }
}
module.exports = ReferenceHandler;