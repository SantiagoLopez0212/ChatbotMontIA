const axios = require('axios');
const SearchStrategy = require('./SearchStrategy');

class GoogleBooksStrategy extends SearchStrategy {
    get name() {
        return 'Google Books';
    }

    async search(query, filters, limit, offset = 0) {
        try {
            let url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${limit}&startIndex=${offset}&printType=books`;

            if (filters.language && filters.language !== 'Todos') {
                url += `&langRestrict=${filters.language}`;
            }

            const { data } = await axios.get(url, { timeout: 10000 });
            const items = data.items || [];

            return items.map(item => {
                const info = item.volumeInfo || {};
                return {
                    source: 'Google Books',
                    title: info.title || 'Título no disponible',
                    author: (info.authors || []).join('; ') || 'Autor desconocido',
                    year: info.publishedDate ? info.publishedDate.substring(0, 4) : 's.f.',
                    journal: info.publisher || 'Editorial desconocida',
                    doi: info.infoLink || '',
                    type: 'book',
                    language: info.language || '',
                    openAccess: info.accessInfo?.viewability !== 'NO_PAGES'
                };
            });
        } catch (err) {
            console.error('Error Google Books:', err.message);
            return [];
        }
    }
}

module.exports = GoogleBooksStrategy;
