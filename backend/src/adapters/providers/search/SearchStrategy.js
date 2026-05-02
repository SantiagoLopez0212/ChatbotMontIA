class SearchStrategy {
    /**
     * Nombre del proveedor (para logs o debugging)
     */
    get name() {
        throw new Error('Debe implementar el getter "name"');
    }

    /**
     * Aqui ejecutamos la busqueda 
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
