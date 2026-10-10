'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Box, Button, SvgIcon, Typography, type SvgIconProps } from '@mui/material';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import { palette } from '@/lib/palette';
import { useAppSelector } from '@/redux/hooks';
import { useGetUserSettingsQuery } from '@/redux/api/mediaApi';

/** Three books stacked flat — MUI has no stacked-books icon. */
function BookshelfIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {/* Top book */}
        <rect x={5} y={3.5} width={14} height={5} rx={0.7} />
        <path d="M7.25 3.5v5" />
        {/* Middle book (offset) */}
        <rect x={3.5} y={9.5} width={15} height={5} rx={0.7} />
        <path d="M5.75 9.5v5" />
        {/* Bottom book */}
        <rect x={4.5} y={15.5} width={16} height={5} rx={0.7} />
        <path d="M6.75 15.5v5" />
      </g>
    </SvgIcon>
  );
}

// Define the navigation buttons for the app header
const NAV_ITEMS = [
  {
    id: 'profile',
    label: 'Profile',
    href: '/',
    icon: PersonOutlinedIcon,
    isActive: (pathname: string) => pathname === '/',
  },
  {
    id: 'library',
    label: 'Library',
    href: '/library',
    icon: BookshelfIcon,
    isActive: (pathname: string) => pathname.startsWith('/library'),
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: SettingsIcon,
    isActive: (pathname: string) => pathname.startsWith('/settings'),
  },
] as const;

// Shared size for nav buttons (fixed height so a larger avatar doesn't stretch them)
const NAV_BUTTON_SX = {
  whiteSpace: 'nowrap',
  px: 2.25,
  py: 1,
  minHeight: 42,
  height: 42,
  fontSize: '1rem',
  overflow: 'visible',
  '& .MuiButton-startIcon': { mr: 1, overflow: 'visible' },
  '& .MuiButton-startIcon > *:nth-of-type(1)': { fontSize: 24 },
} as const;

// Define the styles for the active button
const ACTIVE_BUTTON_SX = {
  ...NAV_BUTTON_SX,
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
  const username = useAppSelector((state) => state.auth.username);
  const { data: settings } = useGetUserSettingsQuery(undefined, {
    skip: !username,
  });
  const avatarSrc = settings?.avatar_path ?? null;

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
          const startIcon =
            id === 'profile' && avatarSrc ? (
              <Box
                component="img"
                src={avatarSrc}
                alt=""
                draggable={false}
                sx={{
                  width: 32,
                  height: 32,
                  marginBlock: '-5px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            ) : (
              <Icon />
            );

          if (active) {
            return (
              <Button
                key={id}
                variant="outlined"
                disabled
                startIcon={startIcon}
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
              startIcon={startIcon}
              sx={NAV_BUTTON_SX}
            >
              {label}
            </Button>
          );
        })}
      </Box>
    </Box>
  );
}
