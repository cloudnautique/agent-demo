'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '../../../context/UserContext';
import axios from 'axios';
import {
    Container,
    TextField,
    Button,
    Typography,
} from '@mui/material';

export default function AddVehiclePage() {
    const router = useRouter();
    const params = useParams();
    const { policy_number } = params;
    const { user, token, policies, setPolicies } = useUser();
    const [vehicleData, setVehicleData] = useState({
        make: '',
        model: '',
        year: '',
        license_plate: '',
    });

    const handleChange = (e) => {
        setVehicleData({ ...vehicleData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        axios
            .post(`/api/users/${user.id}/policies/${policy_number}/vehicles`, vehicleData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .then(() => {
                // Update policies in context
                const updatedPolicies = policies.map(policy => {
                    if (policy.policy_number === policy_number) {
                        return { ...policy, vehicle: vehicleData };
                    }
                    return policy;
                });

                setPolicies(updatedPolicies);
                router.push('/');
            })
            .catch((error) => {
                console.error('Error adding vehicle:', error);
            });
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 8 }}>
            <Typography variant="h5" gutterBottom>
                Add Vehicle
            </Typography>
            <form onSubmit={handleSubmit}>
                <TextField
                    label="Make"
                    name="make"
                    value={vehicleData.make}
                    onChange={handleChange}
                    fullWidth
                    required
                    margin="normal"
                />
                <TextField
                    label="Model"
                    name="model"
                    value={vehicleData.model}
                    onChange={handleChange}
                    fullWidth
                    required
                    margin="normal"
                />
                <TextField
                    label="Year"
                    name="year"
                    value={vehicleData.year}
                    onChange={handleChange}
                    type="number"
                    fullWidth
                    required
                    margin="normal"
                />
                <TextField
                    label="License Plate"
                    name="license_plate"
                    value={vehicleData.license_plate}
                    onChange={handleChange}
                    fullWidth
                    required
                    margin="normal"
                />
                <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
                    Add Vehicle
                </Button>
            </form>
        </Container>
    );
}
