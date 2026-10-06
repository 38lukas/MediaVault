/** Shared UI color tokens for MediaVault. */

export const DEFAULT_PRIMARY_COLOR = '#ffbb3d';
export const DEFAULT_PRIMARY_CONTRAST = '#0a0a0a';

export const palette = {
  bg: 'rgba(0, 0, 0, 0.9)',
  surface: '#141414',
  surfaceElevated: '#1a1a1a',
  paper: '#1e1e1e',
  primary: 'var(--media-vault-primary, #ffbb3d)', // for buttons and links
  primaryContrast: 'var(--media-vault-primary-contrast, #0a0a0a)',
  border: 'rgba(255,255,255,0.08)',
  borderSubtle: 'rgba(255,255,255,0.06)',
  borderMuted: 'rgba(255,255,255,0.1)',
  borderStrong: 'rgba(255,255,255,0.16)',
  borderSelected: 'rgba(255,255,255,0.35)',
  fieldBg: 'rgba(255,255,255,0.03)',
  selectedBg: 'rgba(255,255,255,0.12)',
  footerBg: 'rgba(0,0,0,0.2)',
  textDisabled: 'rgba(255,255,255,0.3)',
  textOnDark: '#fff',
} as const;
