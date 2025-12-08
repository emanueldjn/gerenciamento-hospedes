import { createTheme } from '@mui/material/styles';
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3b82f6',  // Azul principal
    },
    secondary: {
      main: '#f97316',  // Laranja secundário
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800 },
    h2: { fontWeight: 800 },
  },
  shape: {
    borderRadius: 12,  // Bordas arredondadas
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',  // Sem CAPS
          fontWeight: 600,
          borderRadius: 12,
        },
      },
    },
  },
});
export default theme;