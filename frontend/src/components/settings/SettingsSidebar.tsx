'use client';

import { List, ListItemButton, ListItemIcon, ListItemText, Paper } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import TuneIcon from '@mui/icons-material/Tune';
import PaletteIcon from '@mui/icons-material/Palette';
import { palette } from '@/lib/palette';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setActiveSection } from '@/redux/slices/settingsSlice';
import type { SettingsSection } from '@/types/media';

const SECTIONS: { id: SettingsSection; label: string; icon: typeof PersonIcon }[] = [
  { id: 'account', label: 'Account', icon: PersonIcon },
  { id: 'general', label: 'General', icon: TuneIcon },
  { id: 'appearance', label: 'Appearance', icon: PaletteIcon }
];

/** Settings sidebar: Account and General navigation.
 * @returns MUI list bound to settingsSlice.activeSection.
 */
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
