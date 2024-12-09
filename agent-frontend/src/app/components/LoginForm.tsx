// src/app/components/LoginForm.tsx

'use client';

import React, { useState } from 'react';
import { Container, Typography, TextField, Button, Box, Alert } from '@mui/material';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function LoginForm({
    onClose,
    onLoginSuccess
}: {
    onClose?: () => void;
    onLoginSuccess?: (username: string) => void;
}) {
    const [credentials, setCredentials] = useState({
        username: '',
        password: '',
    });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        try {
            const response = await axios.post('/api/login', credentials);

            const { token, user } = response.data;
            localStorage.setItem('jwtToken', token);
            localStorage.setItem('username', user);

            // Notify the Navbar of the login success and username
            setSuccess('Successfully signed in');
            if (onLoginSuccess) {
                onLoginSuccess(user);
            }

            if (onClose) {
                onClose();
            }

            // Redirect to the main page
            window.location.href = '/';
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to sign in');
        }
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ color: 'text.primary' }}>
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
