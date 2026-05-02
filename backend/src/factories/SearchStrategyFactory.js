const CrossrefStrategy = require('../adapters/providers/search/CrossrefStrategy');
const OpenAlexStrategy = require('../adapters/providers/search/OpenAlexStrategy');
const GoogleBooksStrategy = require('../adapters/providers/search/GoogleBooksStrategy');

class SearchStrategyFactory {
    /**
     * Crea y retorna todas las estrategias de búsqueda disponibles.
     * @returns {Array<SearchStrategy>} Lista de estrategias instanciadas.
     */
    static createAllStrategies() {
        return [
            new CrossrefStrategy(),
            new OpenAlexStrategy(),
            new GoogleBooksStrategy()
        ];
    }

    /**
     * (Opcional) Crea una estrategia específica por nombre.
     * @param {string} name - Nombre de la estrategia ('crossref', 'openalex', 'googlebooks')
     */
    static createStrategy(name) {
        switch (name.toLowerCase()) {
            case 'crossref': return new CrossrefStrategy();
            case 'openalex': return new OpenAlexStrategy();
            case 'googlebooks': return new GoogleBooksStrategy();
            default: throw new Error(`Estrategia desconocida: ${name}`);
        }
    }
}

module.exports = SearchStrategyFactory;
