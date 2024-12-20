"use client";

import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Button, List, ListItem, ListItemText, Paper } from '@mui/material';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useUser } from './context/UserContext';

interface Policy {
  type: 'Windscreen' | 'Device';
  policy_number: string;
}

interface ApiPolicy extends Policy {
  policy_id: string;
  id: string;
  vehicle?: {
    make?: string;
    model?: string;
    year?: string;
    license_plate?: string;
  };
  device?: {
    manufacturer?: string;
    model?: string;
  };
}

interface Claim {
  id: string;
  policy_id: string;
  status: string;
  status_message: string;
}

export default function HomePage() {
  const router = useRouter();
  const { user, token, policies, setPolicies } = useUser();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [policiesFetched, setPoliciesFetched] = useState(false);
  const [signupsEnabled, setSignupsEnabled] = useState(false);

  const handleAddVehicleDevice = (policy: Policy) => {
    if (policy.type === 'Windscreen') {
      router.push(`/policies/${policy.policy_number}/add-vehicle`);
    } else if (policy.type === 'Device') {
      router.push(`/policies/${policy.policy_number}/add-device`);
    }
  };

  useEffect(() => {
    fetch('/api/system/features')
      .then(res => res.json())
      .then(data => {
        const isSignupsEnabled = data.signups_enabled === true || data.signups_enabled === 'true';
        setSignupsEnabled(isSignupsEnabled);
      })
      .catch(err => {
        console.error('Failed to fetch system features:', err);
        setSignupsEnabled(false);
      });
  }, []);

  useEffect(() => {
    if (user && token) {
      // If policies are not yet in context, fetch them
      if (policies.length === 0 && !policiesFetched) {
        axios.get(`/api/users/${user.id}/policies`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
          .then(response => {
            setPolicies(response.data); // Store policies in context
            setPoliciesFetched(true); // Set flag to true

            const policyClaimsPromises = response.data.map((policy: ApiPolicy) =>
              axios.get(`/api/users/${user.id}/policies/${policy.policy_id}/claims`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              })
            );
            return Promise.all(policyClaimsPromises);
          })
          .then(claimsResponses => {
            const allClaims = claimsResponses.flatMap(response => response.data);
            setClaims(allClaims);
          })
          .catch(error => console.error('Error fetching policies:', error));
      } else if (policies.length > 0) {
        // If policies are already in context, fetch claims for each policy
        const policyClaimsPromises = policies.map(policy =>
          axios.get(`/api/users/${user.id}/policies/${policy.policy_number}/claims`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
        );

        Promise.all(policyClaimsPromises)
          .then(claimsResponses => {
            const allClaims = claimsResponses.flatMap(response => response.data);
            setClaims(allClaims);
          })
          .catch(error => console.error('Error fetching claims:', error));
      }
    }
  }, [user, token, policies, setPolicies, policiesFetched]);

  return (
    <Container maxWidth="md" sx={{ mt: 8 }}>
      <Typography variant="h4" gutterBottom>
        Welcome to Acorn Ins. Claims Portal
      </Typography>
      <Typography variant="body1" gutterBottom>
        {user ? `Welcome back, ${user.first_name}!` : 'Please sign in or sign up to continue.'}
      </Typography>
      {!user && (
        <Box sx={{ mt: 4 }}>
          <Button
            variant="contained"
            color="primary"
            sx={{ mr: 2 }}
            onClick={() => router.push('/signin')}
          >
            Sign In
          </Button>
          {signupsEnabled && (
            <Button
              variant="outlined"
              color="primary"
              onClick={() => router.push('/signup')}
            >
              Sign Up
            </Button>
          )}
        </Box>
      )}
      {user && (
        <Box sx={{ mt: 4 }}>
          <Paper sx={{ p: 2, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Your Policies
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => router.push('/add-policy')}
                sx={{ mb: 2 }}
              >
                + Add Policy
              </Button>
            </Box>
            {policies.length > 0 ? (
              <List>
                {policies.map((policy, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={`Policy ID: ${policy.policy_number}`}
                      secondary={
                        policy.type === 'Windscreen' ? (
                          `Vehicle: ${policy.vehicle?.make || 'N/A'} ${policy.vehicle?.model || ''} (${policy.vehicle?.year || 'N/A'}) - License Plate: ${policy.vehicle?.license_plate || 'N/A'}`.trim()
                        ) : (
                          `Device: ${policy.device?.manufacturer || ''} - ${policy.device?.model || ''}`.trim()
                        )
                      }
                    />
                    {!policy.vehicle && policy.type === 'Windscreen' ? (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleAddVehicleDevice(policy)}
                      >
                        Add Vehicle
                      </Button>
                    ) : null}

                    {!policy.device && policy.type === 'Device' ? (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleAddVehicleDevice(policy)}
                      >
                        Add Device
                      </Button>
                    ) : null}

                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2">No policies found.</Typography>
            )}
          </Paper>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Your Claims
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => router.push('/new-claim')}
                sx={{ mb: 2 }}
              >
                + New Claim
              </Button>
            </Box>
            {claims.length > 0 ? (
              <List>
                {claims.map((claim, index) => {
                  // Find the corresponding policy for this claim
                  const policy = policies.find(p => p.id === claim.policy_id);
                  return (
                    <ListItem key={index}>
                      <ListItemText
                        primary={`Claim ID: ${claim.id} - ${claim.status}`}
                        secondary={`Policy ID: ${policy ? policy.policy_number : 'Unknown Policy'}  Comments: ${claim.status_message}`}
                      />
                    </ListItem>
                  );
                })}
              </List>
            ) : (
              <Typography variant="body2">No claims found.</Typography>
            )}
          </Paper>
        </Box>
      )}
    </Container>
  );
}
