const axios = require('axios');

class OpenAlexAdapter {
  async searchArticles(query) {
    const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per_page=5`;
    const { data } = await axios.get(url, { timeout: 12000 });
    const items = data?.results || [];
    return items.map(w => {
      const title = w?.title || 'Sin título';
      const year  = w?.publication_year || null;
      const authors = (w?.authorships || []).map(a => a?.author?.display_name).filter(Boolean);
      const doi = (w?.doi || '').replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
      const urlFinal = w?.primary_location?.source?.homepage_url || w?.primary_location?.landing_page_url || w?.id;
      return {
        source: 'OpenAlex',
        title,
        authors,
        year,
        venue: w?.primary_location?.source?.display_name || '',
        doi: doi ? `https://doi.org/${doi}` : '',
        url: urlFinal,
        openAccess: !!w?.open_access?.is_oa
      };
    });
  }
}

module.exports = OpenAlexAdapter;
