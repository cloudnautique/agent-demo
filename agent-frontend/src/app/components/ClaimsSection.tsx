'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow, Paper, Typography, Box } from '@mui/material';
import { useRouter } from 'next/navigation';

interface Claim {
    id: string | number;
    status: string;
    claim_date: string;
    damage_date: string;
    date_of_repair: string;
}

const ClaimsSection = ({ title, claims }: { title: string, claims: Claim[] }) => {
    const router = useRouter();

    const handleRowClick = (id: string | number) => {
        router.push(`/claims/${id}`);
    };

    return (
        <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
                {title}
            </Typography>
            <Paper>
                <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Claim Date</TableCell>
                                <TableCell>Damage Date</TableCell>
                                <TableCell>Repair Date</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {claims.map((claim) => (
                                <TableRow key={claim.id}
                                    hover
                                    onClick={() => handleRowClick(claim.id)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <TableCell>{claim.id}</TableCell>
                                    <TableCell>{claim.status}</TableCell>
                                    <TableCell>{claim.claim_date}</TableCell>
                                    <TableCell>{claim.damage_date}</TableCell>
                                    <TableCell>{claim.date_of_repair}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Box>
            </Paper>
        </Box>
    );
};

export default ClaimsSection;
