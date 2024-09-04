'use client';

import React, { useEffect, useState } from 'react';
import { Container, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper, Box, Button, TextField } from '@mui/material';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const express_url = 'http://mac-studio.local:3200';

export default function ClaimDetail({ params }) {
    const [claim, setClaim] = useState(null);
    const [policy, setPolicy] = useState(null);
    const [checks, setChecks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const router = useRouter();

    const { id } = params;

    useEffect(() => {
        const fetchClaimDetails = async () => {
            try {
                const token = localStorage.getItem('jwtToken');

                // Fetch the claim details
                const claimResponse = await axios.get(`${express_url}/api/claims/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                setClaim(claimResponse.data);

                // Fetch the policy details
                const policyResponse = await axios.get(`${express_url}/api/claims/${id}/policy`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                setPolicy(policyResponse.data);

                // Fetch the checks
                const checksResponse = await axios.get(`${express_url}/api/claims/${id}/checks`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                setChecks(checksResponse.data);
                setLoading(false);
            } catch (error) {
                setError(error.response?.data?.message || 'Failed to fetch claim details');
                setLoading(false);
            }
        };

        fetchClaimDetails();
    }, [id]);

    const handleUpdateStatus = async (newStatus, newInternalStatus) => {
        try {
            const token = localStorage.getItem('jwtToken');
            await axios.put(`${express_url}/api/claims/${id}`, {
                status: newStatus,
                internal_status: newInternalStatus,
                status_message: message
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            // Optionally refresh the claim details after the update
            setClaim(prev => ({ ...prev, status: newStatus, internal_status: newInternalStatus, status_message: message }));
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to update claim status');
        }
    };

    if (loading) {
        return <Typography>Loading...</Typography>;
    }

    if (error) {
        return <Typography color="error">{error}</Typography>;
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
            <Typography variant="h4" gutterBottom>
                Claim Details
            </Typography>
            {claim && (
                <Box mb={4}>
                    <Paper sx={{ mt: 2 }}>
                        <Typography variant="h6">Claim Information</Typography>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Internal Status</TableCell>
                                    <TableCell>Claim Date</TableCell>
                                    <TableCell>Damage Date</TableCell>
                                    <TableCell>Repair Date</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell>{claim.id}</TableCell>
                                    <TableCell>{claim.status}</TableCell>
                                    <TableCell>{claim.internal_status}</TableCell>
                                    <TableCell>{claim.claim_date}</TableCell>
                                    <TableCell>{claim.damage_date}</TableCell>
                                    <TableCell>{claim.date_of_repair}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </Paper>
                </Box>
            )}

            <Box mb={4}>
                <TextField
                    label="Message"
                    fullWidth
                    multiline
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    sx={{ mb: 2 }}
                />
                <Button variant="contained" color="primary" onClick={() => handleUpdateStatus('Approved', 'Approved')}>
                    Approve
                </Button>
                <Button variant="contained" color="secondary" onClick={() => handleUpdateStatus('Denied', 'Denied')} sx={{ ml: 2 }}>
                    Deny
                </Button>
            </Box>


            {policy && (
                <Box mb={4}>
                    <Paper sx={{ mt: 2 }}>
                        <Typography variant="h6">Policy Information</Typography>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Policy Number</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Vehicle</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell>{policy.policy.policy_number}</TableCell>
                                    <TableCell>{policy.policy.type}</TableCell>
                                    <TableCell>{policy.policy.vehicle ? `${policy.policy.vehicle.year} ${policy.policy.vehicle.make} ${policy.policy.vehicle.model} - license plate: ${policy.policy.vehicle.license_plate}` : 'N/A'}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </Paper>
                </Box>
            )}

            <Paper>
                <Typography variant="h6" gutterBottom sx={{ mt: 4, p: 2 }}>
                    Checks
                </Typography>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Reviewed Value</TableCell>
                            <TableCell>Expected Value</TableCell>
                            <TableCell>Result Message</TableCell>
                            <TableCell>Processed At</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {checks.map((check) => (
                            <TableRow key={check.id}>
                                <TableCell>{check.id}</TableCell>
                                <TableCell>{check.check_name}</TableCell>
                                <TableCell>{check.status}</TableCell>
                                <TableCell>{check.reviewed_value}</TableCell>
                                <TableCell>{check.expected_value}</TableCell>
                                <TableCell>{check.result_message}</TableCell>
                                <TableCell>{check.processed_at}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>
        </Container>
    );
}
