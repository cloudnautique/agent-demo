'use client';

// why isn't it reloading
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../context/UserContext';
import axios from 'axios';
import {
    Container,
    TextField,
    Button,
    Typography,
    MenuItem,
} from '@mui/material';

export default function AddPolicyPage() {
    const router = useRouter();
    const { user, token } = useUser();
    const [policyData, setPolicyData] = useState({
        type: '',
        policy_number: '',
        deductible: '',
    });
    const [policiesFetched, setPoliciesFetched] = useState(false);

    const handleChange = (e) => {
        setPolicyData({ ...policyData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        axios
            .post(`/api/users/${user.id}/policies`, policyData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .then(() => {
                setPoliciesFetched(false); // Reset policiesFetched in context
                router.push('/');
            })
            .catch((error) => {
                console.error('Error adding policy:', error);
            });
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 8 }}>
            <Typography variant="h5" gutterBottom>
                Add New Policy
            </Typography>
            <form onSubmit={handleSubmit}>
                <TextField
                    select
                    label="Policy Type"
                    name="type"
                    value={policyData.type}
                    onChange={handleChange}
                    fullWidth
                    required
                    margin="normal"
                >
                    <MenuItem value="Windscreen">Windscreen</MenuItem>
                    <MenuItem value="Device">Device</MenuItem>
                </TextField>
                <TextField
                    label="Policy Number"
                    name="policy_number"
                    value={policyData.policy_number}
                    onChange={handleChange}
                    fullWidth
                    required
                    margin="normal"
                />
                <TextField
                    label="Deductible"
                    name="deductible"
                    value={policyData.deductible}
                    onChange={handleChange}
                    type="number"
                    fullWidth
                    margin="normal"
                />
                <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
                    Add Policy
                </Button>
            </form>
        </Container>
    );
}
