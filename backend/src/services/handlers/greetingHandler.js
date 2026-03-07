const ChatHandler = require('./chatHandler');
const { includesAny } = require('../../domain/textUtils');

const GREETING_KEYWORDS = ['hola','buenos dias','buen dia','buenas tardes','buenas noches'];
function getGreetingByTime(){ const h=new Date().getHours(); if(h<12) return '¡Buenos días!'; if(h<19) return '¡Buenas tardes!'; return '¡Buenas noches!'; }

class GreetingHandler extends ChatHandler {
  canHandle({ normalizedMessage }){ return includesAny(normalizedMessage, GREETING_KEYWORDS); }
  async handle({ normalizedMessage, memory, clientId }){
    const profile = memory?.getProfile?.(clientId);
    const named = profile?.name ? ` ${profile.name}` : '';
    if (normalizedMessage.includes('hola')) return `¡Hola${named}!`;
    return `${getGreetingByTime()}${named ? ',' + named : ''}`;
  }
}
module.exports = GreetingHandler;