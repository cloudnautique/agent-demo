"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Typography, TextField, Button, Box, Alert } from '@mui/material';
import axios from 'axios';
import { useUser } from '../context/UserContext';

export default function SignUpPage() {
    const [userDetails, setUserDetails] = useState({
        first_name: '',
        last_name: '',
        username: '',
        email: '',
        phone: '',
        password: '',
    });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const router = useRouter();
    const { setUser } = useUser(); // Access the UserContext to update user state

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUserDetails({ ...userDetails, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        try {
            const response = await axios.post('/api/signup', userDetails);
            setSuccess(response.data.message);

            // Redirect to the main page
            router.push('/signin');
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to create user');
        }
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 8 }}>
            <Typography variant="h4" gutterBottom>
                Sign Up
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
            <form onSubmit={handleSubmit}>
                <TextField
                    label="First Name"
                    name="first_name"
                    value={userDetails.first_name}
                    onChange={handleChange}
                    fullWidth
                    required
                    margin="normal"
                />
                <TextField
                    label="Last Name"
                    name="last_name"
                    value={userDetails.last_name}
                    onChange={handleChange}
                    fullWidth
                    required
                    margin="normal"
                />
                <TextField
                    label="Username"
                    name="username"
                    value={userDetails.username}
                    onChange={handleChange}
                    fullWidth
                    required
                    margin="normal"
                />
                <TextField
                    label="Email"
                    name="email"
                    value={userDetails.email}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                />
                <TextField
                    label="Phone"
                    name="phone"
                    value={userDetails.phone}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                />
                <TextField
                    label="Password"
                    name="password"
                    type="password"
                    value={userDetails.password}
                    onChange={handleChange}
                    fullWidth
                    required
                    margin="normal"
                />
                <Box textAlign="center" mt={2}>
                    <Button type="submit" variant="contained" color="primary">
                        Sign Up
                    </Button>
                </Box>
            </form>
        </Container>
    );
}
