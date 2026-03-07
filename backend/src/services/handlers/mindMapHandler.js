const aiAdapter = require('../../adapters/aiAdapter');

/**
 * MindMapHandler — Genera datos de grafo (nodos + aristas) a partir de resultados de búsqueda.
 * Usa Gemini AI para extraer relaciones temáticas entre artículos.
 * Fallback: grafo estrella con el tema central si la IA falla.
 */
class MindMapHandler {

    /**
     * Genera la estructura del mapa conceptual.
     * @param {string} query - Tema de búsqueda
     * @param {Array} results - Artículos encontrados
     * @returns {{ nodes: Array, edges: Array }}
     */
    async generateGraph(query, results) {
        if (!results || results.length === 0) {
            return this._fallbackGraph(query, []);
        }

        try {
            const aiGraph = await this._extractRelationshipsWithAI(query, results);
            if (aiGraph && aiGraph.nodes && aiGraph.nodes.length > 0) {
                return aiGraph;
            }
        } catch (err) {
            console.error('MindMapHandler: Error IA, usando fallback:', err.message);
        }

        return this._fallbackGraph(query, results);
    }

    /**
     * Usa Gemini para analizar artículos y extraer relaciones semánticas.
     */
    async _extractRelationshipsWithAI(query, results) {
        const articlesText = results.map((item, i) =>
            `${i + 1}. "${item.title}" (${item.year || 's.f.'}) - ${item.author || 'Desconocido'} [Fuente: ${item.journal || item.source || 'N/A'}]`
        ).join('\n');

        const systemPrompt = `Eres un analista de investigación académica. Tu tarea es analizar artículos científicos y generar un grafo de conocimiento en formato JSON.

INSTRUCCIONES ESTRICTAS:
1. Responde ÚNICAMENTE con un JSON válido, sin texto adicional, sin markdown, sin backticks.
2. Identifica temas comunes, metodologías compartidas, y brechas de investigación.
3. Crea nodos de tipo: "topic" (tema central), "article" (artículos), "theme" (temas emergentes), "gap" (brechas de investigación).
4. Crea aristas con etiquetas descriptivas que expliquen la relación.

FORMATO JSON requerido:
{
  "nodes": [
    { "id": 1, "label": "texto corto", "type": "topic|article|theme|gap", "detail": "descripción" }
  ],
  "edges": [
    { "from": 1, "to": 2, "label": "relación" }
  ]
}

REGLAS:
- El nodo 1 siempre es el tema central (type: "topic")
- Cada artículo debe ser un nodo (type: "article")
- Agrega 2-4 nodos de temas emergentes (type: "theme")
- Agrega 1-2 nodos de brechas de investigación (type: "gap")
- Conecta artículos con temas relacionados
- Cada nodo de brecha debe conectarse a al menos un tema`;

        const userMessage = `Tema de búsqueda: "${query}"\n\nArtículos encontrados:\n${articlesText}\n\nGenera el JSON del grafo de conocimiento:`;

        const response = await aiAdapter.getChatResponse(systemPrompt, userMessage);

        // Intentar extraer JSON de la respuesta
        const jsonStr = this._extractJSON(response);
        const parsed = JSON.parse(jsonStr);

        // Validar estructura mínima
        if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
            throw new Error('Respuesta de IA no contiene nodos válidos');
        }

        return parsed;
    }

    /**
     * Extrae un bloque JSON de una respuesta que puede contener texto adicional.
     */
    _extractJSON(text) {
        // Intentar encontrar JSON entre llaves
        const match = text.match(/\{[\s\S]*\}/);
        if (match) return match[0];
        throw new Error('No se encontró JSON en la respuesta');
    }

    /**
     * Genera un grafo estrella simple como fallback.
     */
    _fallbackGraph(query, results) {
        const nodes = [
            { id: 1, label: query, type: 'topic', detail: `Tema central: ${query}` }
        ];

        const edges = [];

        results.forEach((item, i) => {
            const id = i + 2;
            nodes.push({
                id,
                label: (item.title || 'Sin título').substring(0, 40) + '...',
                type: 'article',
                detail: `${item.author || 'Autor desconocido'} (${item.year || 's.f.'}) - ${item.journal || item.source || ''}`
            });
            edges.push({ from: 1, to: id, label: 'relacionado' });
        });

        // Agregar un nodo de brecha genérico
        if (results.length > 0) {
            const gapId = results.length + 2;
            nodes.push({
                id: gapId,
                label: '¿Qué falta explorar?',
                type: 'gap',
                detail: `Posible brecha de investigación en "${query}" — Se necesita más análisis.`
            });
            edges.push({ from: 1, to: gapId, label: 'brecha identificada' });
        }

        return { nodes, edges };
    }
}

module.exports = new MindMapHandler();
