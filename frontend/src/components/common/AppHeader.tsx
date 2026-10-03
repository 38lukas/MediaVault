'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Box, Button, Typography } from '@mui/material';
import LibraryBooksOutlinedIcon from '@mui/icons-material/LibraryBooksOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import { palette } from '@/lib/palette';

// Define the navigation buttons for the app header
const NAV_ITEMS = [
  {
    id: 'library',
    label: 'Library',
    href: '/library',
    icon: LibraryBooksOutlinedIcon,
    isActive: (pathname: string) => pathname.startsWith('/library'),
  },
  {
    id: 'profile',
    label: 'Profile',
    href: '/',
    icon: PersonOutlinedIcon,
    isActive: (pathname: string) => pathname === '/',
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: SettingsIcon,
    isActive: (pathname: string) => pathname.startsWith('/settings'),
  },
] as const;

// Define the styles for the active button
const ACTIVE_BUTTON_SX = {
  whiteSpace: 'nowrap',
  border: `1px solid ${palette.primary}`,
  backgroundColor: palette.selectedBg,
  color: palette.primary,
  '&.Mui-disabled': {
    border: `1px solid ${palette.primary}`,
    backgroundColor: palette.selectedBg,
    color: palette.primary,
  },
} as const;

/** Shared app header with brand title and Library / Profile / Settings nav.
 *
 * @returns Header row shown on authenticated pages; active route is non-clickable.
 */
export function AppHeader() {
  const pathname = usePathname();

  return (
    <Box
      sx={{
        mb: 4,
        display: 'flex',
        alignItems: { xs: 'stretch', sm: 'center' },
        justifyContent: 'space-between',
        gap: 2,
        flexWrap: 'wrap',
        flexDirection: { xs: 'column', sm: 'row' },
      }}
    >
      <Typography
        variant="h4"
        component={Link}
        href="/"
        sx={{
          fontWeight: 'bold',
          color: palette.primary,
          textDecoration: 'none',
          '&:hover': { color: palette.primary },
        }}
      >
        MediaVault
      </Typography>

      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: { xs: 'flex-start', sm: 'flex-end' },
        }}
      >
        {NAV_ITEMS.map(({ id, label, href, icon: Icon, isActive }) => {
          const active = isActive(pathname);

          if (active) {
            return (
              <Button
                key={id}
                variant="outlined"
                disabled
                startIcon={<Icon />}
                aria-current="page"
                sx={ACTIVE_BUTTON_SX}
              >
                {label}
              </Button>
            );
          }

          return (
            <Button
              key={id}
              variant="outlined"
              component={Link}
              href={href}
              startIcon={<Icon />}
              sx={{ whiteSpace: 'nowrap' }}
            >
              {label}
            </Button>
          );
        })}
      </Box>
    </Box>
  );
}
