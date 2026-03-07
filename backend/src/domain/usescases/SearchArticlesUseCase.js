class SearchArticlesUseCase {
  constructor(searchAdapter) {
    this.searchAdapter = searchAdapter;
  }

  async execute(query) {
    if (!query || query.trim() === "") {
      return [{ title: "Por favor ingresa un término válido para buscar artículos." }];
    }
    return await this.searchAdapter.executeSearch(query);
  }
}

module.exports = SearchArticlesUseCase;
