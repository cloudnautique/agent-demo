"use client";

import React, { useState } from 'react';
import { Container, TextField, Button, Typography, Box, MenuItem } from '@mui/material';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useUser } from '../context/UserContext';

export default function NewClaimPage() {
    const router = useRouter();
    const { user, token, policies } = useUser();
    const [policyId, setPolicyId] = useState('');
    const [invoice, setInvoice] = useState<File | null>(null); // To hold the uploaded file
    const [claimDate] = useState(new Date().toISOString().split('T')[0]); // Automatically set to current date
    const [repairDate, setRepairDate] = useState(''); // Repair date
    const [dateOfRepair, setDateOfRepair] = useState(''); // Date of repair
    const [causeOfDamage, setCauseOfDamage] = useState('');

    const selectedPolicy = policies.find((policy) => policy.policy_number === policyId);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInvoice(e.target.files?.[0] || null);
    };

    const handleSubmit = async () => {
        try {
            if (!user) {
                console.error('No user found');
                return;
            }

            const formData = new FormData();
            if (invoice) {
                formData.append('invoice', invoice);
            }
            formData.append('claim_date', claimDate);
            formData.append('damage_date', repairDate);
            formData.append('date_of_repair', dateOfRepair);

            // Only append cause_of_damage if it's relevant (i.e., for a device claim)
            if (selectedPolicy && selectedPolicy.type === 'Device') {
                formData.append('cause_of_damage', causeOfDamage);
            }

            const response = await axios.post(`/api/users/${user.id}/policies/${policyId}/claims`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('Claim filed successfully:', response.data);
            router.push('/'); // Redirect back to the homepage after successful submission
        } catch (error) {
            console.error('Error filing claim:', error);
        }
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 8 }}>
            <Typography variant="h4" gutterBottom>
                File a New Claim
            </Typography>
            <Box sx={{ mt: 4 }}>
                <TextField
                    select
                    label="Policy"
                    variant="outlined"
                    fullWidth
                    value={policyId}
                    onChange={(e) => setPolicyId(e.target.value)}
                    sx={{ mb: 2 }}
                >
                    {policies.map((policy) => (
                        <MenuItem key={policy.policy_number} value={policy.policy_number}>
                            {`Policy ID: ${policy.policy_number} (${policy.type} - ${policy.type === "Device"
                                ? policy.device.model
                                : policy.type === "Windscreen"
                                    ? policy.vehicle.make
                                    : ''
                                })`}
                        </MenuItem>
                    ))}
                </TextField>
                <TextField
                    label="Claim Date"
                    type="date"
                    variant="outlined"
                    fullWidth
                    value={claimDate}
                    disabled // Disable editing of the claim date field
                    sx={{ mb: 2 }}
                    InputLabelProps={{
                        shrink: true,
                    }}
                />
                <TextField
                    label="Date Damage Occurred"
                    type="date"
                    variant="outlined"
                    fullWidth
                    value={repairDate}
                    onChange={(e) => setRepairDate(e.target.value)}
                    sx={{ mb: 2 }}
                    InputLabelProps={{
                        shrink: true,
                    }}
                />
                <TextField
                    label="Date of Repair Completion"
                    type="date"
                    variant="outlined"
                    fullWidth
                    value={dateOfRepair}
                    onChange={(e) => setDateOfRepair(e.target.value)}
                    sx={{ mb: 2 }}
                    InputLabelProps={{
                        shrink: true,
                    }}
                />
                {selectedPolicy && selectedPolicy.type === 'Device' && (
                    <TextField
                        label="Cause of Damage"
                        variant="outlined"
                        fullWidth
                        value={causeOfDamage}
                        onChange={(e) => setCauseOfDamage(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                )}
                <Typography variant="body1" gutterBottom>
                    Upload Invoice:
                </Typography>
                <input
                    type="file"
                    onChange={handleFileChange}
                    accept="application/pdf,image/*"
                    style={{ display: 'block', margin: '20px 0' }}
                />

                <Button variant="contained" color="primary" onClick={handleSubmit}>
                    Submit Claim
                </Button>
            </Box>
        </Container>
    );
}
