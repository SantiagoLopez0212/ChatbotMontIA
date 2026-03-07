/**
 * Interfaz base para estrategias de búsqueda (Strategy Pattern).
 * Cumple con OCP: permite agregar nuevos proveedores sin tocar el código base.
 */
class SearchStrategy {
    /**
     * Nombre del proveedor (para logs o debugging)
     */
    get name() {
        throw new Error('Debe implementar el getter "name"');
    }

    /**
     * Ejecuta la búsqueda.
     * @param {string} query
     * @param {object} filters
     * @param {number} limit
     * @param {number} offset
     * @returns {Promise<Array>}
     */
    async search(query, filters, limit, offset) {
        throw new Error('Debe implementar el método "search"');
    }
}

module.exports = SearchStrategy;
