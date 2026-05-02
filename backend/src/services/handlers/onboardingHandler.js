/**
 * onboardingHandler.js
 * Chain of Responsibility: Detecta usuarios nuevos y ejecuta el flujo de onboarding.
 * Si onboarding_done = 0, hace preguntas secuenciales para conocer al usuario.
 * Al completar: actualiza el perfil en BD y marca onboarding_done = 1.
 *
 * SRP: Solo gestiona el flujo de onboarding.
 * Bajo acoplamiento: accede a la BD y a la sesión, no conoce al chatbot principal.
 */
const { getPool } = require('../../config/db');

// Pasos del onboarding (pregunta → campo BD)
const ONBOARDING_STEPS = [
  {
    key: 'area_estudio',
    pregunta: '👋 ¡Hola! Soy **MontIA**, tu asistente académico. Antes de comenzar, me gustaría conocerte un poco mejor.\n\n📚 ¿En qué **área de estudio** te especializas? (Ej: Ingeniería, Medicina, Derecho, Computación...)'
  },
  {
    key: 'nivel_academico',
    pregunta: '¡Excelente! ¿Cuál es tu **nivel académico** actual?\n\nOpciones: Pregrado · Maestría · Doctorado · Investigador · Otro'
  },
  {
    key: 'intereses',
    pregunta: '¿Cuáles son tus **temas de investigación** o áreas de mayor interés? (Puedes mencionar varios separados por comas)\n\nEj: machine learning, salud digital, bioética...'
  },
  {
    key: 'apodo',
    pregunta: '¡Genial! Y por último... ¿Cómo quieres que te llame? Puedes decirme tu nombre, apodo o como prefieras 😊'
  }
];

class OnboardingHandler {
  constructor(nextHandler = null) {
    this.next = nextHandler;
  }

  isValid(context) {
    // Solo aplica a usuarios autenticados que no han completado el onboarding
    return context.userId && context.onboardingStep !== undefined;
  }

  async handle(context) {
    const { userId, onboardingStep, message } = context;

    // Verificar si el usuario necesita onboarding
    if (!userId) {
      return this.next ? this.next.handle(context) : null;
    }

    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT onboarding_done, apodo, area_estudio, nivel_academico, intereses FROM users WHERE id = ?',
      [userId]
    );

    if (!rows.length || rows[0].onboarding_done) {
      // Ya completó el onboarding → pasar al siguiente handler
      return this.next ? this.next.handle(context) : null;
    }

    // Determinar en qué paso está
    const step = onboardingStep || 0;

    // Si hay respuesta del usuario (paso > 0), guardar la respuesta anterior
    if (step > 0 && message) {
      const campo = ONBOARDING_STEPS[step - 1].key;
      await pool.query(`UPDATE users SET ${campo} = ? WHERE id = ?`, [message.trim(), userId]);
    }

    // Si terminamos todos los pasos
    if (step >= ONBOARDING_STEPS.length) {
      await pool.query('UPDATE users SET onboarding_done = 1 WHERE id = ?', [userId]);
      const [updated] = await pool.query(
        'SELECT apodo FROM users WHERE id = ?', [userId]
      );
      const apodo = updated[0]?.apodo || 'amigo';
      return {
        response: `¡Perfecto, **${apodo}**! 🎉 Ya te conozco mejor. A partir de ahora usaré esta información para darte recomendaciones académicas más precisas y relevantes.\n\n¿En qué puedo ayudarte hoy?`,
        onboardingCompleted: true,
        onboardingStep: -1 // señal de que terminó
      };
    }

    // Siguiente pregunta
    return {
      response: ONBOARDING_STEPS[step].pregunta,
      onboardingStep: step + 1
    };
  }
}

module.exports = OnboardingHandler;
