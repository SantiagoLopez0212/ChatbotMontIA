const axios = require('axios');
const SearchStrategy = require('./SearchStrategy');

class OpenAlexStrategy extends SearchStrategy {
    get name() {
        return 'OpenAlex';
    }

    async search(query, filters, limit, offset = 0) {
        try {
            // OpenAlex usa paginación por página (page=1, page=2...)
            const page = Math.floor(offset / limit) + 1;
            const fetchLimit = limit * 2; // Pedir más resultados
            let url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per_page=${fetchLimit}&page=${page}`;

            const openAlexFilters = [];
            if (filters.yearMin)
                openAlexFilters.push(`from_publication_date:${filters.yearMin}-01-01`);
            if (filters.yearMax)
                openAlexFilters.push(`to_publication_date:${filters.yearMax}-12-31`);
            if (filters.language && filters.language !== 'Todos')
                openAlexFilters.push(`language:${filters.language}`);
            if (filters.openAccess === 'true' || filters.openAccess === 'Solo Open Access')
                openAlexFilters.push('is_oa:true');

            // Filtro de tipo para OpenAlex
            if (filters.articleType && filters.articleType !== 'Todos') {
                const t = filters.articleType.toLowerCase();
                if (t === 'journal' || t === 'scientific') openAlexFilters.push('type:article');
                // Para conference no aplicamos filtro estricto en OpenAlex por ahora
            }

            if (openAlexFilters.length) url += `&filter=${openAlexFilters.join(',')}`;

            const { data } = await axios.get(url, { timeout: 10000 });
            const results = data?.results || [];

            return results.map(w => ({
                source: 'OpenAlex',
                title: w.title || 'Sin título',
                author: (w.authorships || [])
                    .map(a => a.author?.display_name)
                    .filter(Boolean)
                    .join('; ') || 'Autor desconocido',
                year: w.publication_year || 's.f.',
                journal: w.primary_location?.source?.display_name || '',
                doi: w.doi || '',
                pdfUrl: w.primary_location?.pdf_url || '',
                type: w.type || '',
                language: w.language || '',
                openAccess: w.open_access?.is_oa || false
            }));
        } catch (err) {
            console.error('Error OpenAlex:', err.message);
            return [];
        }
    }
}

module.exports = OpenAlexStrategy;
