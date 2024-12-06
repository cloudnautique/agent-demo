// src/app/layout.tsx
'use client';

import Navbar from './components/Navbar';
import './globals.css';
import lightTheme from '../styles/theme';
import { ThemeProvider } from '@emotion/react';
import { CssBaseline, Box, Typography } from '@mui/material';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <html lang="en">
        <body>
          <Navbar />
          <Box component="main" sx={{ p: 3, pb: 8 }}>
            {children}
          </Box>
          <Box
            component="footer"
            sx={{
              position: 'fixed',
              bottom: 0,
              width: '100%',
              bgcolor: 'background.paper',
              p: 2,
              borderTop: 1,
              borderColor: 'divider',
              textAlign: 'center'
            }}
          >
            <Typography variant="body2" color="text.secondary">
              This app is for demonstration purposes only
            </Typography>
          </Box>
        </body>
      </html>
    </ThemeProvider>
  );
}
