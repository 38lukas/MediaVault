'use client';

import { Button, Stack } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ListAltIcon from '@mui/icons-material/ListAlt';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import { palette } from '@/lib/palette';
import { isGameType } from '@/types/media';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setMediaModalTab, type MediaModalTab } from '@/redux/slices/mediaModalSlice';

const TABS: { id: MediaModalTab; label: string; icon: typeof InfoOutlinedIcon }[] = [
  { id: 'overview', label: 'Overview', icon: InfoOutlinedIcon },
  { id: 'details', label: 'Details', icon: ListAltIcon },
  { id: 'journal', label: 'Journal', icon: CalendarMonthOutlinedIcon },
];

/** Overview / Details / Journal switcher shown under the media cover.
 *
 * @returns Button group bound to mediaModalSlice.activeTab.
 */
export function MediaModalTabs() {
  const dispatch = useAppDispatch();
  const activeTab = useAppSelector((state) => state.mediaModal.activeTab);
  const mediaType = useAppSelector((state) => state.mediaModal.form.mediaType);
  const isEdit = useAppSelector((state) => state.mediaModal.editingItem != null);
  const igdbSelected = useAppSelector((state) => state.mediaModal.igdbSelected);
  const detailsAvailable = isGameType(mediaType) && (isEdit || igdbSelected);

  return (
    <Stack
      direction={{ xs: 'row', md: 'column' }}
      spacing={1}
      sx={{ mt: 2, width: { xs: '100%', md: 148 }, justifyContent: 'center' }}
    >
      {TABS.map(({ id, label, icon: Icon }) => {
        const active = activeTab === id;
        return (
          <Button
            key={id}
            type="button"
            variant="outlined"
            startIcon={<Icon />}
            disabled={id === 'details' && !detailsAvailable}
            aria-pressed={active}
            onClick={() => dispatch(setMediaModalTab(id))}
            sx={{
              justifyContent: { md: 'flex-start' },
              borderRadius: 2,
              fontWeight: 600,
              textTransform: 'none',
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
    </Stack>
  );
}
