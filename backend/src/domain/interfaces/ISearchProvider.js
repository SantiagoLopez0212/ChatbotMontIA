class ISearchProvider {
  async searchArticles(query) {
    throw new Error("Método no implementado");
  }
}

module.exports = ISearchProvider;
