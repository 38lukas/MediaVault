'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Box, Button, Typography } from '@mui/material';
import { BookshelfIcon, CalendarMonthOutlinedIcon, FormatListBulletedOutlinedIcon, PeopleOutlinedIcon, PersonOutlinedIcon, SettingsIcon } from '@/lib/icons';
import { palette } from '@/lib/palette';
import { useAppSelector } from '@/redux/hooks';
import { useGetUserSettingsQuery } from '@/redux/api';

// Top-level app navigation entries and active-route matchers.
const NAV_ITEMS = [
  {
    id: 'profile',
    label: 'Profile',
    href: '/',
    icon: PersonOutlinedIcon,
    isActive: (pathname: string) => pathname === '/',
    hideWhileViewing: false,
  },
  {
    id: 'friends',
    label: 'Friends',
    href: '/friends',
    icon: PeopleOutlinedIcon,
    isActive: (pathname: string) => pathname.startsWith('/friends'),
    hideWhileViewing: true,
  },
  {
    id: 'library',
    label: 'Library',
    href: '/library',
    icon: BookshelfIcon,
    isActive: (pathname: string) => pathname.startsWith('/library'),
    hideWhileViewing: false,
  },
  {
    id: 'lists',
    label: 'Lists',
    href: '/lists',
    icon: FormatListBulletedOutlinedIcon,
    isActive: (pathname: string) => pathname.startsWith('/lists'),
    hideWhileViewing: false,
  },
  {
    id: 'journal',
    label: 'Journal',
    href: '/journal',
    icon: CalendarMonthOutlinedIcon,
    isActive: (pathname: string) => pathname.startsWith('/journal'),
    hideWhileViewing: false,
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: SettingsIcon,
    isActive: (pathname: string) => pathname.startsWith('/settings'),
    hideWhileViewing: true,
  },
] as const;

// Shared sizing for inactive header nav buttons.
const NAV_BUTTON_SX = {
  px: 1.75,
  overflow: 'visible',
  '& .MuiButton-startIcon': { mr: 0.75, ml: 0, overflow: 'visible' },
  '& .MuiButton-startIcon > *:nth-of-type(1)': { fontSize: 20 },
} as const;

// Active/disabled nav button styles (selected route look).
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

// App brand header with profile avatar and section navigation.
export function AppHeader() {
  const pathname = usePathname();
  const username = useAppSelector((state) => state.auth.username);
  const viewingAs = useAppSelector((state) => state.auth.viewingAs);
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
          lineHeight: 1,
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
          gap: 1.25,
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: { xs: 'flex-start', sm: 'flex-end' },
        }}
      >
        {NAV_ITEMS.filter((item) => !(viewingAs && item.hideWhileViewing)).map(
          ({ id, label, href, icon: Icon, isActive }) => {
            const active = isActive(pathname);
            const startIcon =
              id === 'profile' && avatarSrc ? (
                <Box
                  component="img"
                  src={avatarSrc}
                  alt=""
                  draggable={false}
                  sx={{
                    width: 26,
                    height: 26,
                    marginBlock: '-3px',
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
          }
        )}
      </Box>
    </Box>
  );
}
