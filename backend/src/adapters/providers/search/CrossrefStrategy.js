const axios = require('axios');
const SearchStrategy = require('./SearchStrategy');

// Cache simple en memoria para evitar llamadas repetidas
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

class CrossrefStrategy extends SearchStrategy {
    get name() {
        return 'CrossRef';
    }

    async search(query, filters, limit, offset = 0) {
        const cacheKey = `crossref:${query}:${JSON.stringify(filters)}:${limit}:${offset}`;
        
        // Verificar cache
        const cached = cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return cached.data;
        }

        try {
            // query.title restringe la búsqueda al título del artículo, reduciendo resultados irrelevantes
            let url = `https://api.crossref.org/works?query.title=${encodeURIComponent(query)}&rows=${limit}&offset=${offset}`;

            const crossrefFilters = [];
            if (filters.yearMin) crossrefFilters.push(`from-pub-date:${filters.yearMin}`);
            if (filters.yearMax) crossrefFilters.push(`until-pub-date:${filters.yearMax}`);
            if (filters.language && filters.language !== 'Todos')
                crossrefFilters.push(`language:${filters.language}`);
            // Filtro de tipo para CrossRef
            if (filters.articleType && filters.articleType !== 'Todos') {
                const t = filters.articleType.toLowerCase();
                if (t === 'journal') crossrefFilters.push('type:journal-article');
                else if (t === 'scientific') crossrefFilters.push('type:journal-article');
                else if (t === 'conference') crossrefFilters.push('type:proceedings-article');
            }

            if (crossrefFilters.length) url += `&filter=${crossrefFilters.join(',')}`;

            // Reducido de limit*3 a limit*2 para acelerar
            const fetchLimit = limit * 2;
            url = url.replace(`rows=${limit}`, `rows=${fetchLimit}`);

            const { data } = await axios.get(url, { timeout: 6000 });
            const items = data?.message?.items || [];

            const mappedItems = items.map(item => ({
                source: 'CrossRef',
                title: item.title?.[0] || 'Título no disponible',
                author: item.author
                    ? item.author.map(a => `${a.family || a.name || ''} ${a.given || ''}`.trim().replace(/,$/, '')).join('; ')
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

            // Filtro de calidad
            const result = mappedItems
                .filter(item =>
                    item.author !== 'Autor desconocido' &&
                    item.author.trim() !== '' &&
                    item.title !== 'Título no disponible' &&
                    item.year !== 's.f.'
                )
                .slice(0, limit);

            // Guardar en cache
            cache.set(cacheKey, { data: result, timestamp: Date.now() });
            
            return result;
        } catch (err) {
            console.error('Error CrossRef:', err.message);
            return [];
        }
    }
}

module.exports = CrossrefStrategy;
