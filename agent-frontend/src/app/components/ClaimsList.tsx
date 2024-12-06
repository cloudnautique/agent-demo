'use client';

import React, { useEffect, useState } from 'react';
import { Claim } from './types';
import { Container, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper } from '@mui/material';
import axios from 'axios';
import ClaimsSection from './ClaimsSection';

const express_url = 'http://mac-studio.local:3200';

export default function ClaimsList() {
    const [claims, setClaims] = useState<Claim[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [needsAttentionClaims, setNeedsAttentionClaims] = useState<Claim[]>([]);
    const [pendingClaims, setPendingClaims] = useState<Claim[]>([]);
    const [reviewingClaims, setReviewingClaims] = useState<Claim[]>([]);
    const [deniedClaims, setDeniedClaims] = useState<Claim[]>([]);
    const [approvedClaims, setApprovedClaims] = useState<Claim[]>([]);

    useEffect(() => {
        const fetchClaims = async () => {
            const token = localStorage.getItem('jwtToken');
            if (!token) {
                return;
            }

            try {
                const response = await axios.get(`${express_url}/api/claims`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const fetchedClaims = response.data;
                setClaims(fetchedClaims);
                setNeedsAttentionClaims(fetchedClaims.filter((claim: Claim) => claim.internal_status === '2nd Level Review'));
                setPendingClaims(fetchedClaims.filter((claim: Claim) => claim.status === 'Pending'));
                setReviewingClaims(fetchedClaims.filter((claim: Claim) => claim.internal_status === 'Reviewing'));
                setDeniedClaims(fetchedClaims.filter((claim: Claim) => claim.status === 'Denied'));
                setApprovedClaims(fetchedClaims.filter((claim: Claim) => claim.status === 'Approved'));
                setLoading(false);
            } catch (error: any) {
                setError(error.response?.data?.message || 'Failed to fetch claims');
                setLoading(false);
            }
        };

        fetchClaims();
    }, []);



    if (loading) {
        return <Typography>Login first...</Typography>;
    }

    if (error) {
        return <Typography color="error">{error}</Typography>;
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
            <Typography variant="h4" gutterBottom>
                Claims
            </Typography>
            <ClaimsSection title="Needs Attention" claims={needsAttentionClaims} />
            <ClaimsSection title="Pending" claims={pendingClaims} />
            <ClaimsSection title="Reviewing" claims={reviewingClaims} />
            <ClaimsSection title="Denied" claims={deniedClaims} />
            <ClaimsSection title="Approved" claims={approvedClaims} />
        </Container>
    );
}
