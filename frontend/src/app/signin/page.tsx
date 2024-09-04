"use client";

import React, { useState } from 'react';
import { Container, Typography, TextField, Button, Box, Alert } from '@mui/material';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useUser } from '../context/UserContext';

export default function SignInPage() {
    const [credentials, setCredentials] = useState({
        username: '',
        password: '',
    });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const router = useRouter();
    const { setUser } = useUser();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        try {
            const response = await axios.post('/api/signin', credentials);
            setSuccess('Login successful');

            // Update the user context with the logged-in user's details
            // Assume that the backend returns user details (this should be adjusted based on your actual backend response)
            const { access_token, user } = response.data;
            setUser(user, access_token);

            // Redirect to the main page
            router.push('/');
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to sign in');
        }
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 8 }}>
            <Typography variant="h4" gutterBottom>
                Sign In
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
            <form onSubmit={handleSubmit}>
                <TextField
                    label="Username"
                    name="username"
                    value={credentials.username}
                    onChange={handleChange}
                    fullWidth
                    required
                    margin="normal"
                />
                <TextField
                    label="Password"
                    name="password"
                    type="password"
                    value={credentials.password}
                    onChange={handleChange}
                    fullWidth
                    required
                    margin="normal"
                />
                <Box textAlign="center" mt={2}>
                    <Button type="submit" variant="contained" color="primary">
                        Sign In
                    </Button>
                </Box>
            </form>
        </Container>
    );
}
