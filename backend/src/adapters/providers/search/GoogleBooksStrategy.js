const axios = require('axios');
const SearchStrategy = require('./SearchStrategy');

class GoogleBooksStrategy extends SearchStrategy {
    get name() {
        return 'Google Books';
    }

    async search(query, filters, limit, offset = 0) {
        const fetchLimit = limit * 3;
        // intitle: restringe la búsqueda al título del libro, evitando resultados irrelevantes
        let url = `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(query)}&maxResults=${fetchLimit}&startIndex=${offset}&printType=books`;

        if (filters.language && filters.language !== 'Todos') {
            url += `&langRestrict=${filters.language}`;
        }

        // Hasta 2 intentos en caso de 503 (rate limit / sobrecarga temporal de Google)
        const MAX_RETRIES = 2;
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const { data } = await axios.get(url, { timeout: 7000 });
                const items = data.items || [];

                const mappedResults = items.map(item => {
                    const info = item.volumeInfo || {};
                    // Los libros no tienen DOI; guardamos el enlace por separado para no contaminar citas APA
                    const isbn = (info.industryIdentifiers || [])
                        .find(id => id.type === 'ISBN_13' || id.type === 'ISBN_10');
                    return {
                        source: 'Google Books',
                        title: info.title || 'Título no disponible',
                        author: (info.authors || []).join('; ') || 'Autor desconocido',
                        year: info.publishedDate ? info.publishedDate.substring(0, 4) : 's.f.',
                        journal: info.publisher || '',
                        doi: '',
                        isbn: isbn ? isbn.identifier : '',
                        url: info.infoLink || '',
                        type: 'book',
                        language: info.language || '',
                        openAccess: info.accessInfo?.viewability !== 'NO_PAGES'
                    };
                });

                return mappedResults
                    .filter(item => item.author !== 'Autor desconocido' && item.title !== 'Título no disponible')
                    .slice(0, limit);

            } catch (err) {
                const status = err.response?.status;
                // 503 = sobrecarga temporal; reintentar después de una pausa corta
                if (status === 503 && attempt < MAX_RETRIES) {
                    await new Promise(r => setTimeout(r, 1000 * attempt));
                    continue;
                }
                console.warn(`[Google Books] no disponible (intento ${attempt}/${MAX_RETRIES}): ${err.message}`);
                return [];
            }
        }
        return [];
    }
}

module.exports = GoogleBooksStrategy;
