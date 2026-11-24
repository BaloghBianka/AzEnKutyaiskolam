import { createTheme } from '@mui/material/styles';

export const adminTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#d7191f', dark: '#a8141a', contrastText: '#fff' },
    secondary: { main: '#111111', contrastText: '#fff' },
    background: { default: '#f4f5f7', paper: '#ffffff' },
    success: { main: '#2e7d32' }
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: 'Poppins, system-ui, sans-serif',
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 }
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiTextField: { defaultProps: { size: 'small', fullWidth: true } },
    MuiPaper: { defaultProps: { variant: 'outlined' } },
    MuiAccordion: { defaultProps: { disableGutters: true, variant: 'outlined' }, styleOverrides: { root: { '&:before': { display: 'none' } } } },
    MuiTooltip: { defaultProps: { arrow: true } }
  }
});
