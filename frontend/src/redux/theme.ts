import { createTheme } from '@mui/material';

// Dark MUI theme so Dialogs, Buttons, and form fields match the page.
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0a0a0a',
      paper: '#1e1e1e',
    },
  },
});
