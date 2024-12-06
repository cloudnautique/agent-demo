const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
const FormData = require('form-data');

const backendURL = 'http://127.0.0.1:5000';

const app = express();
app.use(cors());
app.use(bodyParser.json());

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Store files in an 'uploads' directory
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

app.post('/api/signup', async (req, res) => {
  try {
    const userPayload = req.body;
    const response = await axios.post(`${backendURL}/users/`, userPayload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    res.status(200).json({ message: 'User created successfully', data: response.data });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user', error: error.response?.data || error.message });
  }
});

app.post('/api/signin', async (req, res) => {
  try {
    const credentials = req.body; // Expecting { username: '', password: '' }

    // Post to the backend to authenticate and get the JWT token
    const response = await axios.post(`${backendURL}/users/login`, credentials, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const { access_token, user } = response.data;

    // Return the token and user details to the frontend
    res.status(200).json({ access_token, user });
  } catch (error) {
    console.error('Error signing in:', error);
    res.status(401).json({ message: 'Invalid username or password' });
  }
});

// Get all policies for a specific user
app.get('/api/users/:id/policies', async (req, res) => {
  const userId = req.params.id;
  const token = req.headers.authorization.split(' ')[1]; // Expecting "Bearer <token>"
  try {
    const response = await axios.get(`${backendURL}/users/${userId}/policies`, {
      headers: {
        'Authorization': `Bearer ${token}`, // Include the JWT token in the request
      },
    });
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching policies:', error);
    res.status(500).json({ message: 'Error fetching policies' });
  }
});

app.post('/api/users/:id/policies', async (req, res) => {
  const userId = req.params.id;
  const token = req.headers.authorization.split(' ')[1]; // Expecting
  try {
    const policyPayload = req.body;
    const response = await axios.post(`${backendURL}/users/${userId}/policies`, policyPayload, {
      headers: {
        'Authorization': `Bearer ${token}`, // Include the JWT token in the request
        'Content-Type': 'application/json',
      },
    });
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error creating policy:', error);
    res.status(500).json({ message: 'Error creating policy' });
  }
});

// Get a specific policy for a specific user
app.get('/api/users/:user_id/policies/:policy_number', async (req, res) => {
  const { user_id, policy_id } = req.params;
  const token = req.headers.authorization.split(' ')[1]; // Expecting "Bearer <token>"
  try {
    const response = await axios.get(`${backendURL}/users/${user_id}/policies/${policy_id}`, {
      headers: {
        'Authorization': `Bearer ${token}`, // Include the JWT token in the request
      },
    });
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching policy:', error);
    res.status(500).json({ message: 'Error fetching policy' });
  }
});

// Get all claims for a specific policy
app.get('/api/users/:user_id/policies/:policy_number/claims', async (req, res) => {
  const { user_id, policy_number } = req.params;

  if (policy_number === 'undefined') {
    return res.status(400).json({ message: 'Policy number is required' });
  }

  try {
    const response = await axios.get(`${backendURL}/users/${user_id}/policies/${policy_number}/claims`, {
      headers: {
        Authorization: req.headers.authorization, // Forward the Authorization header
        'Content-Type': 'application/json',
      },
    });

    // Send the response data back to the client
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching claims:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      message: 'Error fetching claims',
      error: error.response?.data || error.message,
    });
  }
});

app.post('/api/users/:user_id/policies/:policy_number/claims', upload.single('invoice'), async (req, res) => {
  try {
    const { user_id, policy_number } = req.params;
    const { claim_date, damage_date, date_of_repair, cause_of_damage } = req.body;
    const invoicePath = req.file.path;

    const formData = new FormData();
    formData.append('invoice', fs.createReadStream(invoicePath));
    formData.append('claim_date', claim_date);
    formData.append('damage_date', damage_date);
    formData.append('date_of_repair', date_of_repair);
    if (cause_of_damage) {
      formData.append('cause_of_damage', cause_of_damage);
    }

    const response = await axios.post(`${backendURL}/users/${user_id}/policies/${policy_number}/claims`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': req.headers.authorization,
      },
    });

    res.status(200).json({ message: 'Claim filed successfully', data: response.data });
  } catch (error) {
    console.error('Error filing claim:', error);
    res.status(500).json({ message: 'Error filing claim', error: error.response?.data || error.message });
  }
});

app.post('/api/users/:user_id/policies/:policy_number/vehicles', async (req, res) => {
  const { user_id, policy_number } = req.params;
  const token = req.headers.authorization.split(' ')[1]; // Expecting
  try {
    const vehiclePayload = req.body;
    const response = await axios.post(`${backendURL}/users/${user_id}/policies/${policy_number}/vehicles`, vehiclePayload, {
      headers: {
        'Authorization': `Bearer ${token}`, // Include the JWT token in the request
        'Content-Type': 'application/json',
      },
    });
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error adding vehicle:', error);
    res.status(500).json({ message: 'Error adding vehicle' });
  }
});

// Add a device to a policy
app.post('/api/users/:user_id/policies/:policy_number/devices', async (req, res) => {
  const { user_id, policy_number } = req.params;
  const token = req.headers.authorization?.split(' ')[1];

  try {
    const deviceData = req.body;
    const response = await axios.post(
      `${backendURL}/users/${user_id}/policies/${policy_number}/devices`,
      deviceData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    res.status(201).json(response.data);
  } catch (error) {
    console.error('Error adding device:', error.response?.data || error.message);
    res.status(500).json({
      message: 'Error adding device',
      error: error.response?.data || error.message,
    });
  }
});

// Get system feature flags
app.get('/api/system/features', async (req, res) => {
  const response = await axios.get(`${backendURL}/system/features`);
  res.status(200).json(response.data);
});

module.exports = app;
