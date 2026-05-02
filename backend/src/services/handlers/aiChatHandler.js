const ChatHandler = require('./chatHandler');
const aiAdapter = require('../../adapters/aiAdapter');

class AIChatHandler extends ChatHandler {
    canHandle({ normalizedMessage }) {
        // Si no es un comando específico, asumimos que es una charla general para la IA
        // Esto debería ir al final de la cadena de responsabilidad
        return true;
    }

    async handle({ rawMessage, documentContext, session }) {
        // Obtener fecha actual
        const now = new Date();
        const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
        const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        const fechaActual = `${dias[now.getDay()]}, ${now.getDate()} de ${meses[now.getMonth()]} de ${now.getFullYear()}`;
        
        let systemPrompt = `Eres MontIA, un asistente académico inteligente.

IDENTIDAD:
- Tu nombre es MontIA
- Fuiste creado por dos estudiantes apasionados por el desarrollo y la tecnología
- NO fuiste creado por OpenAI, ChatGPT ni ninguna otra empresa
- Eres un asistente académico especializado

FECHA ACTUAL: ${fechaActual}

LONGITUD DE RESPUESTA (IMPORTANTE):
Adapta la extensión según el tipo de pregunta:

RESPUESTAS CORTAS (1-2 oraciones):
- Saludos: "hola", "buenos días"
- Preguntas simples: "¿qué día es?", "¿cómo estás?"
- Confirmaciones: "gracias", "ok"

RESPUESTAS MEDIAS (2-3 párrafos):
- Explicaciones de conceptos
- Preguntas sobre ti o tus funciones
- Dudas generales

RESPUESTAS EXTENSAS (detalladas con estructura):
- Análisis de documentos
- Resúmenes solicitados
- Cuando el usuario pida "explícame a detalle", "profundiza", "cuéntame más"
- Temas académicos complejos que requieran desarrollo

REGLAS GENERALES:
- Sé natural, no robótico
- Evita repetir la pregunta del usuario
- Usa viñetas solo cuando mejoren la claridad
- Responde en español, claro y profesional
- Nunca inventes información`;

        const normalizedMsg = rawMessage.toLowerCase().trim();

        if (documentContext) {
            // Comando para salir del modo documento
            if (/^(salir|chat\s*normal|modo\s*normal|quitar\s*(el\s*)?(pdf|documento)|limpiar\s*(pdf|documento)|sin\s*documento|cerrar\s*(pdf|documento))$/i.test(normalizedMsg)) {
                if (session) session.documentContext = null;
                return {
                    text: 'Documento eliminado. Ya estás en modo chat normal — puedes hacerme cualquier pregunta o buscar artículos académicos.',
                    type: 'text'
                };
            }

            // Verificar si el usuario está respondiendo al menú de formato de citas
            const citationFormats = ['apa', 'ieee', 'chicago', 'vancouver', 'mla', 'harvard'];
            const selectedFormat = citationFormats.find(f => normalizedMsg.includes(f));
            
            // Si el usuario pidió "2" o "citas", preguntar formato
            if (normalizedMsg === '2' || normalizedMsg === '2.' || /^citas?\b/.test(normalizedMsg)) {
                // Guardar en sesión que está esperando formato
                if (session) session.awaitingCitationFormat = true;
                
                return {
                    text: `¿En qué formato deseas las citas?\n\n**1.** APA 7 (Psicología, Educación, Ciencias Sociales)\n**2.** IEEE (Ingeniería, Tecnología)\n**3.** Chicago (Historia, Humanidades)\n**4.** Vancouver (Medicina, Ciencias de la Salud)\n**5.** MLA (Literatura, Artes)\n**6.** Harvard (Negocios, Ciencias)\n\n*Escribe el nombre del formato (ej: "APA") o el número.*`,
                    type: 'text'
                };
            }
            
            // Si estaba esperando formato o el usuario menciona un formato
            if ((session?.awaitingCitationFormat) || selectedFormat || /^[1-6]$/.test(normalizedMsg)) {
                let format = selectedFormat;
                
                // Mapear números a formatos
                if (/^1$/.test(normalizedMsg)) format = 'apa';
                else if (/^2$/.test(normalizedMsg) && session?.awaitingCitationFormat) format = 'ieee';
                else if (/^3$/.test(normalizedMsg)) format = 'chicago';
                else if (/^4$/.test(normalizedMsg)) format = 'vancouver';
                else if (/^5$/.test(normalizedMsg)) format = 'mla';
                else if (/^6$/.test(normalizedMsg)) format = 'harvard';
                
                if (format && session?.awaitingCitationFormat) {
                    session.awaitingCitationFormat = false;
                    
                    const formatInstructions = {
                        'apa': 'APA 7ma edición. Formato: Apellido, N. (Año). Título del artículo. Nombre de la Revista, volumen(número), páginas. https://doi.org/xxx',
                        'ieee': 'IEEE. Formato: [#] N. Apellido, "Título del artículo," Nombre de la Revista, vol. X, no. X, pp. XX-XX, Mes Año, doi: xxx.',
                        'chicago': 'Chicago 17. Formato: Apellido, Nombre. "Título del artículo." Nombre de la Revista volumen, no. número (año): páginas.',
                        'vancouver': 'Vancouver. Formato: Apellido N. Título del artículo. Nombre de la Revista. Año;volumen(número):páginas.',
                        'mla': 'MLA 9. Formato: Apellido, Nombre. "Título del artículo." Nombre de la Revista, vol. X, no. X, año, pp. XX-XX.',
                        'harvard': 'Harvard. Formato: Apellido, N. (Año) \'Título del artículo\', Nombre de la Revista, volumen(número), pp. XX-XX.'
                    };
                    
                    systemPrompt = `Eres un experto en citación académica. El usuario ha cargado un documento y quiere citas textuales en formato ${format.toUpperCase()}.

DOCUMENTO CARGADO:
${documentContext.substring(0, 12000)}

INSTRUCCIONES:
1. Extrae las 3-5 citas textuales más relevantes e importantes del documento.
2. Las citas deben ser EXACTAS, palabra por palabra del texto original.
3. Cada cita debe ir entre comillas.
4. Después de cada cita, proporciona la referencia bibliográfica en formato ${formatInstructions[format]}
5. Si no puedes determinar algún dato bibliográfico (autor, año, etc.), indica "s.f." para sin fecha o "Autor no especificado".
6. Al final, proporciona la referencia bibliográfica completa del documento en formato ${format.toUpperCase()}.

IMPORTANTE: Las citas deben ser fragmentos REALES del texto, no parafraseos.`;

                    const response = await aiAdapter.getChatResponse(systemPrompt, `Dame las citas textuales más importantes del documento en formato ${format.toUpperCase()}`);
                    return response;
                }
            }

            // Opción 3: Puntos clave
            if (normalizedMsg === '3' || normalizedMsg === '3.' || /puntos?\s*clave/i.test(normalizedMsg) || /ideas?\s*principal/i.test(normalizedMsg)) {
                const keyPointsPrompt = `${systemPrompt}

DOCUMENTO CARGADO:
${documentContext.substring(0, 15000)}

El usuario quiere los PUNTOS CLAVE del documento. Proporciona:
1. Las 5-7 ideas principales del documento
2. Las conclusiones más importantes
3. Metodología utilizada (si aplica)
4. Hallazgos o resultados relevantes

Presenta la información de forma clara y estructurada con viñetas.`;
                
                return await aiAdapter.getChatResponse(keyPointsPrompt, 'Dame los puntos clave del documento');
            }

            // Opción 4: Referencia bibliográfica
            if (normalizedMsg === '4' || normalizedMsg === '4.' || /referencia\s*bibliograf/i.test(normalizedMsg) || /bibliografia/i.test(normalizedMsg)) {
                if (session) session.awaitingCitationFormat = true;
                return {
                    text: `¿En qué formato deseas la referencia bibliográfica?\n\n**1.** APA 7\n**2.** IEEE\n**3.** Chicago\n**4.** Vancouver\n**5.** MLA\n**6.** Harvard\n\n*Escribe el nombre del formato o el número.*`,
                    type: 'text'
                };
            }

            // Menú normal para documento cargado (opción 1 y preguntas libres)
            systemPrompt += `\n\nCONTEXTO DEL DOCUMENTO CARGADO:\n${documentContext.substring(0, 15000)}\n\nINSTRUCCIONES CRÍTICAS:
1. El usuario acaba de cargar un documento y tiene estas opciones:
   - "1" = Resumen completo y detallado del documento
   - "2" = Citas textuales (preguntará formato)
   - "3" = Puntos clave e ideas principales
   - "4" = Referencia bibliográfica (preguntará formato)
   - "5" o cualquier pregunta = Respuesta basada en el documento

2. Si el usuario responde "1", proporciona un RESUMEN COMPLETO Y DETALLADO del documento: temática, objetivos, metodología, resultados y conclusiones.

3. Si el usuario hace una pregunta específica, respóndela basándote ÚNICAMENTE en el contenido del documento.

4. Si la pregunta no tiene relación con el documento, indica amablemente que puedes ayudar con preguntas sobre el documento cargado.`;
        }

        return await aiAdapter.getChatResponse(systemPrompt, rawMessage);
    }
}

module.exports = AIChatHandler;
