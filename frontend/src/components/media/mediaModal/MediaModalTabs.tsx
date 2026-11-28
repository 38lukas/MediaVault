'use client';

import { Box, Button } from '@mui/material';
import { CalendarMonthOutlinedIcon, InfoOutlinedIcon, ListAltIcon, PeopleOutlinedIcon } from '@/lib/icons';
import { palette } from '@/lib/palette';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setMediaModalTab, type MediaModalTab } from '@/redux/slices/mediaModalSlice';
import { isMatchableExternalId } from './constants';

// Modal tab definitions shown under the cover.
const TABS: { id: MediaModalTab; label: string; icon: typeof InfoOutlinedIcon }[] = [
  { id: 'overview', label: 'Overview', icon: InfoOutlinedIcon },
  { id: 'details', label: 'Details', icon: ListAltIcon },
  { id: 'journal', label: 'Journal', icon: CalendarMonthOutlinedIcon },
  { id: 'friends', label: 'Friends', icon: PeopleOutlinedIcon },
];

// Overview / Details / Journal / Friends switcher under the media cover; all tabs always visible.
export function MediaModalTabs() {
  const dispatch = useAppDispatch();
  const activeTab = useAppSelector((state) => state.mediaModal.activeTab);
  const isEdit = useAppSelector((state) => state.mediaModal.editingItem != null);
  const lookupSelected = useAppSelector((state) => state.mediaModal.lookupSelected);
  const externalId = useAppSelector((state) => state.mediaModal.form.externalId);
  const viewingAs = useAppSelector((state) => state.auth.viewingAs);
  const detailsAvailable = isEdit || lookupSelected;
  // Friend matches need a provider id; disabled in friend view since the list would be your friends, not theirs.
  const friendsAvailable = !viewingAs && isMatchableExternalId(externalId);

  const isDisabled = (id: MediaModalTab) =>
    (id === 'details' && !detailsAvailable) || (id === 'friends' && !friendsAvailable);

  return (
    <Box
      sx={{
        mt: 2,
        width: { xs: '100%', md: 148 },
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: '1fr' },
        gap: 1,
      }}
    >
      {TABS.map(({ id, label, icon: Icon }) => {
        const active = id === activeTab;
        return (
          <Button
            key={id}
            type="button"
            variant="outlined"
            startIcon={<Icon />}
            disabled={!active && isDisabled(id)}
            aria-pressed={active}
            onClick={() => dispatch(setMediaModalTab(id))}
            sx={{
              justifyContent: 'flex-start',
              ...(active
                ? {
                    border: `1px solid ${palette.primary}`,
                    backgroundColor: palette.selectedBg,
                    color: palette.primary,
                  }
                : {
                    borderColor: palette.borderMuted,
                    color: 'text.secondary',
                  }),
            }}
          >
            {label}
          </Button>
        );
      })}
    </Box>
  );
}
