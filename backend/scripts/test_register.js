const axios = require('axios');

async function testRegister() {
    console.log('Intentando registrar usuario de prueba...');
    try {
        const res = await axios.post('http://127.0.0.1:3000/api/auth/register', {
            name: 'Test User',
            email: `test${Date.now()}@example.com`,
            password: 'password123'
        });

        console.log('Status:', res.status);
        console.log('Response:', JSON.stringify(res.data, null, 2));
    } catch (err) {
        if (err.response) {
            console.log('Status:', err.response.status);
            console.log('Error Response:', JSON.stringify(err.response.data, null, 2));
        } else {
            console.error('Error de red:', err.message);
        }
    }
}

testRegister();
