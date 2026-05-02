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
    _normalizeTitle(title) {
        return (title || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().substring(0, 40);
    }

    _injectUrls(nodes, results) {
        nodes.forEach(node => {
            if (node.type !== 'article') return;
            const nodeNorm = this._normalizeTitle(node.label);
            const match = results.find(r => {
                const rNorm = this._normalizeTitle(r.title);
                return rNorm.includes(nodeNorm.substring(0, 25)) || nodeNorm.includes(rNorm.substring(0, 25));
            });
            if (match) {
                const doi = (match.doi || '').replace('https://doi.org/', '');
                node.url = doi ? `https://doi.org/${doi}` : (match.pdfUrl || '');
            }
        });
    }

    async _extractRelationshipsWithAI(query, results) {
        const articlesText = results.map((item, i) =>
            `${i + 1}. "${item.title}" (${item.year || 's.f.'}) - ${item.author || 'Desconocido'} [Fuente: ${item.journal || item.source || 'N/A'}]`
        ).join('\n');

        const systemPrompt = `Eres un analista de investigación académica de talla mundial. Analiza estos artículos y genera un Mapa de Conocimiento NOVEDOSO, PROFUNDO y CRÍTICO en formato JSON.

INSTRUCCIONES ESTRICTAS:
1. Responde ÚNICAMENTE con un JSON válido, sin delimitadores \`\`\`json ni texto adicional.
2. Identifica conexiones no evidentes, convergencias metodológicas y divergencias teóricas entre los artículos.
3. Extrae ideas novedosas y creativas, no te quedes en resúmenes superficiales.
4. Tipo de nodos: "topic" (1 tema central), "article" (1 por artículo), "theme" (paradigmas o hallazgos clave), "gap" (brechas disruptivas para el futuro).
5. Las aristas deben tener etiquetas cortas pero explicativas (ej. "usa", "contradice", "extiende", "ignora", "valida").

FORMATO JSON:
{
  "nodes": [
    { "id": 1, "label": "Tema Central", "type": "topic", "detail": "Concepto principal" }
  ],
  "edges": [
    { "from": 1, "to": 2, "label": "relación" }
  ]
}

REGLAS DE DISEÑO:
- Nodo 1: El tema central de búsqueda (type: "topic").
- Crea máximo 2 nodos "theme" que agrupen inteligentemente varios artículos.
- Propón 1 o 2 nodos "gap" innovadores.
- Mantén el tamaño máximo STRICTO de 5 a 8 nodos en total para garantizar que se genere en pocos segundos.`;

        const userMessage = `Tema de búsqueda: "${query}"\n\nArtículos encontrados:\n${articlesText}\n\nGenera el JSON del grafo de conocimiento:`;

        const response = await aiAdapter.getChatResponse(systemPrompt, userMessage);

        // Intentar extraer JSON de la respuesta
        const jsonStr = this._extractJSON(response);
        const parsed = JSON.parse(jsonStr);

        // Validar estructura mínima
        if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
            throw new Error('Respuesta de IA no contiene nodos válidos');
        }

        this._injectUrls(parsed.nodes, results);
        return parsed;
    }

    /**
     * Extrae un bloque JSON de una respuesta que puede contener texto adicional.
     */
    _extractJSON(text) {
        // Encontrar JSON ignorando markdown como ```json ... ```
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '');
        const match = cleanedText.match(/\{[\s\S]*\}/);
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
            const doi = (item.doi || '').replace('https://doi.org/', '');
            nodes.push({
                id,
                label: (item.title || 'Sin título').substring(0, 40) + '...',
                type: 'article',
                detail: `${item.author || 'Autor desconocido'} (${item.year || 's.f.'}) - ${item.journal || item.source || ''}`,
                url: doi ? `https://doi.org/${doi}` : (item.pdfUrl || '')
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
