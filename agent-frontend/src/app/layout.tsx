// src/app/layout.tsx
'use client';

import Navbar from './components/Navbar';
import './globals.css';
import lightTheme from '../styles/theme';
import { ThemeProvider } from '@emotion/react';
import { CssBaseline } from '@mui/material';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <html lang="en">
        <body>
          <Navbar />
          <main>{children}</main>
        </body>
      </html>
    </ThemeProvider>
  );
}
