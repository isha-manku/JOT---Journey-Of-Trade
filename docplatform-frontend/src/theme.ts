import { createTheme } from '@mui/material/styles';

const crmTheme = createTheme({
  palette: {
    primary: {
      main: '#0e2318', 
      dark: '#0a1a12',
      light: '#1f3e2b',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#c9a96e', 
      dark: '#b38e4a',
      light: '#dcc499',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f2eb', // CRM soft background color
      paper: '#ffffff',
    },
    text: {
      primary: '#2C3E50',
      secondary: '#6c757d',
    },
    divider: '#E9ECEF',
  },
  typography: {
    fontFamily: '"DM Sans", "Helvetica", "Arial", sans-serif',
    h4: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 700,
      color: '#0e2318',
    },
    h5: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 700,
      color: '#0e2318',
    },
    h6: {
      fontFamily: '"Playfair Display", serif',
      fontWeight: 600,
      color: '#0e2318',
    },
    subtitle1: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0px 4px 24px rgba(0, 0, 0, 0.04)',
        },
        rounded: {
          borderRadius: 16,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
        },
        containedPrimary: {
          backgroundColor: '#0e2318',
          '&:hover': {
            backgroundColor: '#0a1a12',
          },
        },
        containedSecondary: {
          backgroundColor: '#c9a96e',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#b38e4a',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: '#ffffff',
          '& fieldset': {
            borderColor: '#E9ECEF',
          },
          '&:hover fieldset': {
            borderColor: '#c9a96e',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#0e2318',
            borderWidth: '1px',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #f1f3f5',
          padding: '12px 16px',
        },
        head: {
          backgroundColor: '#ffffff',
          color: '#6c757d',
          fontWeight: 600,
          borderBottom: '2px solid #E9ECEF',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:last-child td, &:last-child th': {
            borderBottom: 0,
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          minWidth: 120,
          color: '#6c757d',
          '&.Mui-selected': {
            color: '#0e2318',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#c9a96e',
          height: 3,
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3,
        },
      },
    },
    MuiStepIcon: {
      styleOverrides: {
        root: {
          color: '#E9ECEF',
          '&.Mui-completed': {
            color: '#0e2318',
          },
          '&.Mui-active': {
            color: '#c9a96e',
          },
        },
      },
    },
  },
});

export default crmTheme;
