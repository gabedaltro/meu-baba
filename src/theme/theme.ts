import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1f7a4d',
      dark: '#155b39',
      light: '#58a876',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#1976a2',
      dark: '#125676',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#b7791f',
    },
    background: {
      default: '#f4f7f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#17251d',
      secondary: '#607064',
    },
    divider: '#dce6df',
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2rem',
      fontWeight: 700,
      letterSpacing: 0,
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 700,
      letterSpacing: 0,
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 700,
      letterSpacing: 0,
    },
    button: {
      fontWeight: 700,
      textTransform: 'none',
      letterSpacing: 0,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: '1px solid #dce6df',
          boxShadow: '0 6px 18px rgba(23, 37, 29, 0.06)',
        },
      },
    },
  },
})
