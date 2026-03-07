class SearchAdapter {
  constructor(provider) {
    this.provider = provider;
  }

  async executeSearch(query) {
    return await this.provider.searchArticles(query);
  }
}

module.exports = SearchAdapter;
