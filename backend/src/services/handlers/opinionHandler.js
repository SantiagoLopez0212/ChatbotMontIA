const ChatHandler = require('./chatHandler');
const { normalizeText } = require('../../domain/textUtils');
const { summarizeResults } = require('../resultFormatter');

const OPINION_PATTERNS = [/que opinas de (.+)/,/que opinas sobre (.+)/,/que piensas de (.+)/,/que piensas sobre (.+)/,/cual es tu opinion sobre (.+)/];

function extractTopic(normalized){ for (const p of OPINION_PATTERNS){ const m = normalized.match(p); if (m && m[1]) return m[1].replace(/[?¿!¡]/g,'').trim(); } return ''; }

class OpinionHandler extends ChatHandler {
  canHandle({ normalizedMessage }) { return OPINION_PATTERNS.some(p=>p.test(normalizedMessage)); }
  async handle({ rawMessage, session, searchGateway, limit }){
    const topic = extractTopic(normalizeText(rawMessage));
    try {
      const findings = await searchGateway(topic, limit, {}, 0);
      session.setReferences(topic, findings);
      if (!findings.length) return 'No tengo una opinión personal, pero puedo ayudarte a investigarlo si me das más contexto.';
      const summary = summarizeResults(findings);
      return `Revisando bibliografía abierta sobre ${topic}, destacan aportes como ${summary}. Si quieres, puedo darte las referencias completas.`;
    } catch { return 'No pude consultar fuentes externas ahora mismo, intenta más tarde.'; }
  }
}
module.exports = OpinionHandler;