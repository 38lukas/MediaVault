import { createTheme } from '@mui/material';
import { palette } from '@/lib/palette';

export function createMediaVaultTheme(primaryColor: string, primaryContrast: string) {
  return createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: primaryColor,
        contrastText: primaryContrast,
      },
      background: {
        default: palette.bg,
        paper: palette.paper,
      },
    },
  });
}
