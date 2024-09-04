'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper } from '@mui/material';
import axios from 'axios';
import ClaimsSection from './ClaimsSection';

const express_url = 'http://mac-studio.local:3200';

export default function ClaimsList() {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [needsAttentionClaims, setNeedsAttentionClaims] = useState([]);
    const [pendingClaims, setPendingClaims] = useState([]);
    const [reviewingClaims, setReviewingClaims] = useState([]);
    const [deniedClaims, setDeniedClaims] = useState([]);
    const [approvedClaims, setApprovedClaims] = useState([]);

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
                setNeedsAttentionClaims(fetchedClaims.filter(claim => claim.internal_status === '2nd Level Review'));
                setPendingClaims(fetchedClaims.filter(claim => claim.status === 'Pending'));
                setReviewingClaims(fetchedClaims.filter(claim => claim.internal_status === 'Reviewing'));
                setDeniedClaims(fetchedClaims.filter(claim => claim.status === 'Denied'));
                setApprovedClaims(fetchedClaims.filter(claim => claim.status === 'Approved'));
                setLoading(false);
            } catch (error) {
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
