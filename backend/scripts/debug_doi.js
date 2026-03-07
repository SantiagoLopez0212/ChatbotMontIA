const axios = require('axios');

async function checkDOI() {
    const doi = '10.5209/ling.006.02';
    const url = `https://api.crossref.org/works/${doi}`;

    try {
        console.log(`Querying CrossRef for DOI: ${doi}...`);
        const { data } = await axios.get(url);
        const item = data.message;

        console.log('--- Metadata from CrossRef ---');
        console.log('Title:', item.title?.[0]);
        console.log('URL:', item.URL);
        console.log('DOI:', item.DOI);
        console.log('Type:', item.type);
        console.log('Authors:', item.author?.map(a => `${a.given} ${a.family}`).join(', '));
    } catch (err) {
        console.error('Error querying CrossRef:', err.message);
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', err.response.data);
        }
    }
}

checkDOI();
