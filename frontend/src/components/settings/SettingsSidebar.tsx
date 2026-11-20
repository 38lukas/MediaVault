'use client';

import type { ElementType } from 'react';
import { List, ListItemButton, ListItemIcon, ListItemText, Paper } from '@mui/material';
import { BookshelfIcon, PaletteIcon, PersonIcon, PersonOutlinedIcon } from '@/lib/icons';
import { palette } from '@/lib/palette';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setActiveSection } from '@/redux/slices/settingsSlice';
import type { SettingsSection } from '@/types/media';

// Settings sidebar section list (account, appearance, profile, library). The library section's id stays 'general'.
const SECTIONS: { id: SettingsSection; label: string; icon: ElementType }[] = [
  { id: 'account', label: 'Account', icon: PersonIcon },
  { id: 'appearance', label: 'Appearance', icon: PaletteIcon },
  { id: 'profile', label: 'Profile', icon: PersonOutlinedIcon },
  { id: 'general', label: 'Library', icon: BookshelfIcon },
];

// Settings sidebar navigation bound to the active section.
export function SettingsSidebar() {
  const dispatch = useAppDispatch();
  const activeSection = useAppSelector((state) => state.settings.activeSection);

  return (
    <Paper
      sx={{
        minWidth: { xs: '100%', sm: 220 },
        flexShrink: 0,
        borderRadius: 2,
        backgroundImage: 'none',
        backgroundColor: palette.surface,
        border: `1px solid ${palette.border}`,
      }}
    >
      <List disablePadding>
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <ListItemButton
            key={id}
            selected={activeSection === id}
            onClick={() => dispatch(setActiveSection(id))}
            sx={{
              '&.Mui-selected': {
                backgroundColor: palette.selectedBg,
                '&:hover': { backgroundColor: palette.selectedBg },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: palette.primary }}>
              <Icon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={label} />
          </ListItemButton>
        ))}
      </List>
    </Paper>
  );
}
