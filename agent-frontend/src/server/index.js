const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
const server_url = 'http://127.0.0.1:5100'
app.use(bodyParser.json());

let jwtToken = null;

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const response = await axios.post(`${server_url}/login`, {
            username,
            password,
        });

        jwtToken = response.data.access_token; // Store the JWT token
        res.json({ token: jwtToken, user: username });
    } catch (error) {
        console.error('Login failed:', error.response ? error.response.data : error.message);
        res.status(500).json({ message: 'Login failed' });
    }
});

app.get('/api/claims', async (req, res) => {
    const { status } = req.query;
    const token = req.headers.authorization.split(' ')[1];
    try {
        const response = await axios.get(`${server_url}/claims`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            params: {
                status,
            },
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching claims:', error.response ? error.response.data : error.message);
        res.status(500).json({ message: 'Error fetching claims' });
    }
});

app.get('/api/claims/:id', async (req, res) => {
    const { id } = req.params;
    const token = req.headers.authorization.split(' ')[1];

    try {
        const response = await axios.get(`${server_url}/claims/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error getting claim:', error.response ? error.response.data : error.message);
        res.status(500).json({ message: 'Error getting claim' });
    }
});

app.put('/api/claims/:id', async (req, res) => {
    const { id } = req.params;
    const payload = req.body;
    const token = req.headers.authorization.split(' ')[1];

    try {
        const response = await axios.put(`${server_url}/claims/${id}`, payload, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error updating claim:', error.response ? error.response.data : error.message);
        res.status(500).json({ message: 'Error updating claim' });
    }
});

app.get('/api/claims/:id/checks', async (req, res) => {
    const { id } = req.params;
    const token = req.headers.authorization.split(' ')[1];

    try {
        const response = await axios.get(`${server_url}/claims/${id}/checks`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching checks:', error.response ? error.response.data : error.message);
        res.status(500).json({ message: 'Error fetching checks' });
    }
});

app.get('/api/claims/:id/policy', async (req, res) => {
    const { id } = req.params;
    const token = req.headers.authorization.split(' ')[1];

    try {
        const response = await axios.get(`${server_url}/claims/${id}/policy`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching policy:', error.response ? error.response.data : error.message);
        res.status(500).json({ message: 'Error fetching policy' });
    }
});

module.exports = app;