// components/Navbar.js
'use client';

import React, { useState, useEffect } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Link from 'next/link';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { ThemeProvider } from '@mui/material/styles';
import lightTheme from '../../styles/theme';
import LoginForm from './LoginForm';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};

const Navbar = () => {
    const [open, setOpen] = useState(false);
    const [username, setUsername] = useState<string | null>(null);
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('username');
        setUsername(null);
        handleMenuClose();
        window.location.href = '/';
    };

    useEffect(() => {
        // Check if the user is already logged in
        const storedUsername = localStorage.getItem('username');
        if (storedUsername) {
            setUsername(storedUsername);
        }
    }, []);

    const handleLoginSuccess = (user: string) => {
        setUsername(user);
        handleClose();
    };

    return (
        <ThemeProvider theme={lightTheme}>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                            Acorn Ins Agent Claim Portal
                        </Link>
                    </Typography>
                    {username ? (
                        <>
                            <Button
                                color="inherit"
                                onClick={handleMenuOpen}
                            >
                                {username}
                            </Button>
                            <Menu
                                anchorEl={anchorEl}
                                open={Boolean(anchorEl)}
                                onClose={handleMenuClose}
                            >
                                <MenuItem onClick={handleLogout}>Logout</MenuItem>
                            </Menu>
                        </>
                    ) : (
                        <Button color="inherit" onClick={handleOpen}>
                            Login
                        </Button>
                    )}
                </Toolbar>
            </AppBar>

            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="login-modal-title"
                aria-describedby="login-modal-description"
            >
                <Box sx={style}>
                    <LoginForm onLoginSuccess={handleLoginSuccess} onClose={handleClose} />
                </Box>
            </Modal>
        </ThemeProvider>
    );
};

export default Navbar;
