'use client';

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'class', // Select color scheme via className (e.g. .dark class on html element)
  },
  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: '#4c57eb', // zinc-600/indigo
        },
        background: {
          default: '#f4f6ff',
          paper: '#ffffff',
        },
        text: {
          primary: '#0c0f4d',
          secondary: '#4b5563',
        },
      },
    },
    dark: {
      palette: {
        primary: {
          main: '#6b77ff', // zinc-500/indigo-light
        },
        background: {
          default: '#070a13',
          paper: '#111827',
        },
        text: {
          primary: '#f3f4f6',
          secondary: '#9ca3af',
        },
      },
    },
  },
  typography: {
    fontFamily: 'var(--font-sans)',
  },
});

export default theme;
