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

export default function AddDevicePage() {
    const router = useRouter();
    const params = useParams();
    const { policy_number } = params;
    const { user, token } = useUser();

    const [deviceData, setDeviceData] = useState({
        manufacturer: '',
        model: '',
        storage: '',
        serial_number: '',
        purchase_date: '',
        purchase_amount: '',
        purchase_location: '',
    });

    const handleChange = (e) => {
        setDeviceData({ ...deviceData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        axios
            .post(`/api/users/${user.id}/policies/${policy_number}/devices`, deviceData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .then(() => {
                router.push('/');
            })
            .catch((error) => {
                console.error('Error adding device:', error);
            });
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 8 }}>
            <Typography variant="h5" gutterBottom>
                Add Device
            </Typography>
            <form onSubmit={handleSubmit}>
                <TextField
                    label="Manufacturer"
                    name="manufacturer"
                    value={deviceData.manufacturer}
                    onChange={handleChange}
                    fullWidth
                    required
                    margin="normal"
                />
                <TextField
                    label="Model"
                    name="model"
                    value={deviceData.model}
                    onChange={handleChange}
                    fullWidth
                    required
                    margin="normal"
                />
                <TextField
                    label="Storage"
                    name="storage"
                    value={deviceData.storage}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                />
                <TextField
                    label="Serial Number"
                    name="serial_number"
                    value={deviceData.serial_number}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                />
                <TextField
                    label="Purchase Date"
                    name="purchase_date"
                    type="date"
                    value={deviceData.purchase_date}
                    onChange={handleChange}
                    fullWidth
                    InputLabelProps={{
                        shrink: true,
                    }}
                    required
                    margin="normal"
                />
                <TextField
                    label="Purchase Amount"
                    name="purchase_amount"
                    type="number"
                    value={deviceData.purchase_amount}
                    onChange={handleChange}
                    fullWidth
                    required
                    margin="normal"
                />
                <TextField
                    label="Purchase Location"
                    name="purchase_location"
                    value={deviceData.purchase_location}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                />
                <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
                    Add Device
                </Button>
            </form>
        </Container>
    );
}
