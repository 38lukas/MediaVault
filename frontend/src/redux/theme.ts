import { createTheme } from '@mui/material';
import { palette } from '@/lib/palette';

// Dark MUI theme so Dialogs, Buttons, and form fields match the page.
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: palette.primary,
      contrastText: palette.primaryContrast,
    },
    background: {
      default: palette.bg,
      paper: palette.paper,
    },
  },
});
