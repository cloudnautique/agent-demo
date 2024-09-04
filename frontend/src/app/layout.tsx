"use client";

import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Avatar, Box, Button, Menu, MenuItem } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import lightTheme from '../styles/theme';
import { Home as HomeIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { UserProvider, useUser } from './context/UserContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <UserProvider>
      <ThemeProvider theme={lightTheme}>
        <CssBaseline />
        <html lang="en">
          <head>
            <link rel="icon" href="/favicon.ico" />
          </head>
          <body>
            <AppBar position="static">
              <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                  <Button color="inherit" onClick={() => router.push('/')} startIcon={<HomeIcon />}>
                    Acorn Ins Claims Portal
                  </Button>
                </Typography>
                <UserOptions />
              </Toolbar>
            </AppBar>
            <Box component="main" sx={{ p: 3 }}>
              {children}
            </Box>
          </body>
        </html>
      </ThemeProvider>
    </UserProvider>
  );
}

function UserOptions() {
  const { user, setUser } = useUser();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    setUser(null); // Clear user context
    router.push('/'); // Redirect to the home page
    handleClose();
  };

  if (user) {
    const initials = `${user.first_name[0]}${user.last_name[0]}`;
    return (
      <>
        <Avatar
          sx={{ bgcolor: 'primary.main', ml: 2 }}
          onClick={handleClick}
          style={{ cursor: 'pointer' }}
        >
          {initials}
        </Avatar>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem onClick={handleLogout}>Logout</MenuItem>
        </Menu>
      </>
    );
  }

  return (
    <>
      <Button color="inherit" onClick={() => router.push('/signin')}>
        Sign In
      </Button>
      <Button color="inherit" onClick={() => router.push('/signup')}>
        Sign Up
      </Button>
    </>
  );
}
