const axios = require('axios');
const SearchStrategy = require('./SearchStrategy');

class CrossrefStrategy extends SearchStrategy {
    get name() {
        return 'CrossRef';
    }

    async search(query, filters, limit, offset = 0) {
        try {
            let url = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=${limit}&offset=${offset}`;

            const crossrefFilters = [];
            if (filters.yearMin) crossrefFilters.push(`from-pub-date:${filters.yearMin}`);
            if (filters.yearMax) crossrefFilters.push(`until-pub-date:${filters.yearMax}`);
            if (filters.language && filters.language !== 'Todos')
                crossrefFilters.push(`language:${filters.language}`);
            if (filters.openAccess === 'true' || filters.openAccess === 'Solo Open Access')
                crossrefFilters.push('license:*');

            // Filtro de tipo para CrossRef
            if (filters.articleType && filters.articleType !== 'Todos') {
                const t = filters.articleType.toLowerCase();
                if (t === 'journal') crossrefFilters.push('type:journal-article');
                else if (t === 'scientific') crossrefFilters.push('type:journal-article');
                else if (t === 'conference') crossrefFilters.push('type:proceedings-article');
            }

            if (crossrefFilters.length) url += `&filter=${crossrefFilters.join(',')}`;

            // Pedimos un poco más para compensar filtrado local
            const fetchLimit = limit * 2;
            url = url.replace(`rows=${limit}`, `rows=${fetchLimit}`);

            const { data } = await axios.get(url, { timeout: 10000 });
            const items = data?.message?.items || [];

            return items.map(item => ({
                source: 'CrossRef',
                title: item.title?.[0] || 'Título no disponible',
                author: item.author
                    ? item.author.map(a => `${a.family || ''}, ${a.given || ''}`).join('; ')
                    : 'Autor desconocido',
                year: item.issued?.['date-parts']?.[0]?.[0] ||
                    item['published-print']?.['date-parts']?.[0]?.[0] ||
                    item['published-online']?.['date-parts']?.[0]?.[0] ||
                    item.created?.['date-parts']?.[0]?.[0] || 's.f.',
                journal: item['container-title']?.[0] || '',
                doi: item.DOI ? `https://doi.org/${item.DOI}` : '',
                type: item.type || '',
                language: item.language || '',
                openAccess: !!item.license
            }));
        } catch (err) {
            console.error('Error CrossRef:', err.message);
            return [];
        }
    }
}

module.exports = CrossrefStrategy;
