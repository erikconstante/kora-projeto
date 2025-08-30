// assets/js/api.js
const BASE_URL = 'http://localhost:3000/api';

async function request(endpoint, options = {}) {
    const token = localStorage.getItem('kora_token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

    if (response.status === 401) {
        localStorage.removeItem('kora_token');
        window.location.href = '/login/';
        throw new Error('Não autorizado');
    }

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Ocorreu um erro.');
    }
    return data;
}

export const api = {
    get: (endpoint) => request(endpoint),
    post: (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    put: (endpoint, body) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
    del: (endpoint) => request(endpoint, { method: 'DELETE' }),
};