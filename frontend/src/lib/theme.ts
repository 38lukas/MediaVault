import { createTheme } from '@mui/material';
import { palette } from '@/lib/palette';

// Shared sizes so every control lines up: inputs, selects and buttons are all 40px tall.
export const CONTROL_HEIGHT = 40;
export const CONTROL_RADIUS = 8; // buttons, inputs, selects, menus
export const SURFACE_RADIUS = 12; // dialogs and cards
export const PILL_RADIUS = 999; // chips, status pills

// Build the dark MUI theme for MediaVault. Component looks live here, not in per-component sx.
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
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            minHeight: CONTROL_HEIGHT,
            paddingInline: 16,
            borderRadius: CONTROL_RADIUS,
            fontWeight: 600,
            textTransform: 'none',
            whiteSpace: 'nowrap',
            variants: [
              // Neutral outlined buttons get the muted border; colored ones keep their color.
              {
                props: { variant: 'outlined', color: 'inherit' },
                style: {
                  borderColor: palette.borderMuted,
                  '&:hover': { borderColor: palette.borderStrong },
                },
              },
            ],
          },
          sizeSmall: { minHeight: 32, paddingInline: 12 },
        },
      },
      MuiTextField: { defaultProps: { size: 'small' } },
      MuiFormControl: { defaultProps: { size: 'small' } },
      MuiAutocomplete: {
        defaultProps: { size: 'small' },
        styleOverrides: {
          paper: {
            marginTop: 4,
            borderRadius: CONTROL_RADIUS,
            backgroundColor: palette.surfaceElevated,
            backgroundImage: 'none',
            border: `1px solid ${palette.border}`,
          },
        },
      },
      // Text fields, selects and autocompletes all render an OutlinedInput.
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: CONTROL_RADIUS,
            backgroundColor: 'transparent',
            '& .MuiOutlinedInput-notchedOutline': { borderColor: palette.borderStrong },
            // Hover and focus outlines use the primary color (the MUI default is white).
            '&:hover:not(.Mui-disabled) .MuiOutlinedInput-notchedOutline': {
              borderColor: palette.primary,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: palette.primary,
              borderWidth: 1,
            },
            // Number fields without spinner arrows.
            '& input[type="number"]': { MozAppearance: 'textfield' },
            '& input[type="number"]::-webkit-outer-spin-button, & input[type="number"]::-webkit-inner-spin-button':
              { WebkitAppearance: 'none', margin: 0 },
          },
          // Single-line small fields are exactly CONTROL_HEIGHT; multiline grows.
          sizeSmall: {
            '&:not(.MuiInputBase-multiline)': { minHeight: CONTROL_HEIGHT },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: { root: { '&.Mui-focused': { color: palette.primary } } },
      },
      MuiSelect: {
        styleOverrides: {
          // Same arrow position as the Autocomplete arrow.
          icon: { right: 10 },
        },
      },
      MuiPaper: {
        styleOverrides: { root: { backgroundImage: 'none' } },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            marginTop: 4,
            borderRadius: CONTROL_RADIUS,
            backgroundColor: palette.surfaceElevated,
            border: `1px solid ${palette.border}`,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: SURFACE_RADIUS,
            backgroundColor: palette.surface,
            border: `1px solid ${palette.border}`,
          },
        },
      },
      MuiDialogActions: {
        styleOverrides: { root: { padding: '12px 24px 20px' } },
      },
      // Pills are fully round everywhere (chips and the status pills).
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: PILL_RADIUS, fontWeight: 600 },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            borderRadius: CONTROL_RADIUS,
            backgroundColor: palette.surfaceElevated,
            border: `1px solid ${palette.border}`,
            fontSize: '0.8rem',
          },
        },
      },
    },
  });
}
