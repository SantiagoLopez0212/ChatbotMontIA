const ChatHandler = require('./chatHandler');
const { includesAny } = require('../../domain/textUtils');

const PURPOSE = ['que haces','para que sirves','cual es tu funcion','que puedes hacer','como funcionas'];
const CREATOR = ['quien te creo','quien te creó','quien te hizo','quien es tu creador','de donde vienes','quien te desarrollo','quien te desarrolló'];
const FEELING = ['como te sientes','estas feliz','estas triste','como estas','que tal'];
const IDENTITY = ['como te llamas','cual es tu nombre','quien eres','eres chatgpt','eres openai','eres gpt','que eres'];

class SmallTalkHandler extends ChatHandler {
  canHandle({ normalizedMessage }) {
    return includesAny(normalizedMessage, PURPOSE) || 
           includesAny(normalizedMessage, CREATOR) || 
           includesAny(normalizedMessage, FEELING) ||
           includesAny(normalizedMessage, IDENTITY);
  }
  async handle({ normalizedMessage }) {
    if (includesAny(normalizedMessage, IDENTITY)) {
      return 'Soy MontIA, tu asistente académico inteligente. Estoy aquí para ayudarte con búsquedas de artículos científicos, generación de citas y referencias bibliográficas, y análisis de documentos. ¿En qué puedo ayudarte hoy?';
    }
    if (includesAny(normalizedMessage, CREATOR)) {
      return '¡Mis creadores fueron dos estudiantes apasionados por el mundo del desarrollo y la tecnología! 👨‍💻👩‍💻 Me diseñaron como parte de un proyecto académico para facilitar la investigación científica y hacer más accesible el conocimiento. ¡Estoy muy orgulloso de poder ayudarte!';
    }
    if (includesAny(normalizedMessage, PURPOSE)) {
      return 'Soy MontIA, un asistente académico. Puedo ayudarte a:\n\n• Buscar artículos científicos de CrossRef, OpenAlex y Google Books\n• Generar citas y referencias en formatos APA, IEEE, Chicago, etc.\n• Analizar documentos PDF y extraer información clave\n• Crear mapas de conocimiento\n\n¿Qué te gustaría hacer?';
    }
    if (includesAny(normalizedMessage, FEELING)) {
      return '¡Estoy muy bien, gracias por preguntar! Listo para ayudarte con tus búsquedas académicas. ¿En qué puedo asistirte?';
    }
    return 'Puedo charlar un poco, pero mi especialidad es ayudarte con investigación académica. ¿Necesitas buscar artículos o generar referencias?';
  }
}
module.exports = SmallTalkHandler;