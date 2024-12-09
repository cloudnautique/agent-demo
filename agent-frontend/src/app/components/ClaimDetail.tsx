'use client';

import React, { useEffect, useState } from 'react';
import { Container, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper, Box, Button, TextField } from '@mui/material';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface Claim {
    id: string;
    status: string;
    internal_status: string;
    claim_date: string;
    damage_date: string;
    date_of_repair: string;
    cause_of_damage?: string;
    status_message?: string;
}

interface Policy {
    policy: {
        type: string;
        policy_number: string;
        vehicle?: {
            year: string;
            make: string;
            model: string;
            license_plate: string;
        };
        device?: {
            manufacturer: string;
            model: string;
        };
    };
}

interface Check {
    id: string;
    check_name: string;
    status: string;
    reviewed_value: string;
    expected_value: string;
    result_message: string;
    processed_at: string;
}

export default function ClaimDetail({ params }: { params: { id: string } }) {
    const [claim, setClaim] = useState<Claim | null>(null);
    const [policy, setPolicy] = useState<Policy | null>(null);
    const [checks, setChecks] = useState<Check[]>([]);
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
                const claimResponse = await axios.get(`/api/claims/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                setClaim(claimResponse.data);

                // Fetch the policy details
                const policyResponse = await axios.get(`/api/claims/${id}/policy`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                setPolicy(policyResponse.data);

                // Fetch the checks
                const checksResponse = await axios.get(`/api/claims/${id}/checks`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                setChecks(checksResponse.data);
                setLoading(false);
            } catch (error: any) {
                setError(error.response?.data?.message || 'Failed to fetch claim details');
                setLoading(false);
            }
        };

        fetchClaimDetails();
    }, [id]);

    const handleUpdateStatus = async (newStatus: string, newInternalStatus: string) => {
        try {
            const token = localStorage.getItem('jwtToken');
            await axios.put(`/api/claims/${id}`, {
                status: newStatus,
                internal_status: newInternalStatus,
                status_message: message
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            // Optionally refresh the claim details after the update
            setClaim(prev => prev ? {
                ...prev,
                status: newStatus,
                internal_status: newInternalStatus,
                status_message: message
            } : null);
        } catch (error: any) {
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
                                {claim.cause_of_damage && (
                                    <TableRow>
                                        <TableCell colSpan={6}>
                                            <Typography variant="h6">Cause of Damage</Typography>
                                            {claim.cause_of_damage}
                                        </TableCell>
                                    </TableRow>
                                )}
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
                                    <TableCell>
                                        {policy.policy.type === "Windscreen" ? (`Vehicle`) : (`Device`)}
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell>{policy.policy.policy_number}</TableCell>
                                    <TableCell>{policy.policy.type}</TableCell>
                                    <TableCell>
                                        {policy.policy.type === "Windscreen" ? (
                                            policy.policy.vehicle ? (
                                                `${policy.policy.vehicle.year} ${policy.policy.vehicle.make} ${policy.policy.vehicle.model} - license plate: ${policy.policy.vehicle.license_plate}`
                                            ) : (
                                                'N/A'
                                            )
                                        ) : policy.policy.type === "Device" ? (
                                            policy.policy.device ? (
                                                `${policy.policy.device.manufacturer} - ${policy.policy.device.model}`
                                            ) : (
                                                'N/A'
                                            )
                                        ) : (
                                            'N/A'
                                        )
                                        }
                                    </TableCell>
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
