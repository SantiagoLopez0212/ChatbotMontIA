const axios = require('axios');

class CrossRefAdapter {
  async searchArticles(query) {
    const url = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=5`;
    const response = await axios.get(url);
    return response.data.message.items.map(item => ({
      title: item.title[0],
      author: item.author ? item.author[0].family : 'Desconocido',
      year: item.created['date-parts'][0][0],
      doi: item.DOI,
      link: item.URL
    }));
  }
}

module.exports = CrossRefAdapter;
