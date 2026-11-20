'use client';

import { useState } from 'react';
import { Box, Button, Collapse, Stack } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ListAltIcon from '@mui/icons-material/ListAlt';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
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

// Overview / Details / Journal / Friends switcher under the media cover; shows the current tab and expands to the others.
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

  const [expanded, setExpanded] = useState(false);
  const current = TABS.find((tab) => tab.id === activeTab) ?? TABS[0];
  const CurrentIcon = current.icon;

  return (
    <Box sx={{ mt: 2, width: { xs: '100%', md: 148 } }}>
      <Button
        type="button"
        variant="outlined"
        startIcon={<CurrentIcon />}
        endIcon={
          <ExpandMoreIcon
            sx={{
              transform: expanded ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s ease',
            }}
          />
        }
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
        sx={{
          width: '100%',
          justifyContent: 'flex-start',
          borderRadius: 2,
          fontWeight: 600,
          textTransform: 'none',
          border: `1px solid ${palette.primary}`,
          backgroundColor: palette.selectedBg,
          color: palette.primary,
          '& .MuiButton-endIcon': { ml: 'auto' },
        }}
      >
        {current.label}
      </Button>
      <Collapse in={expanded} unmountOnExit>
        <Stack direction={{ xs: 'row', md: 'column' }} spacing={1} sx={{ pt: 1 }}>
          {TABS.filter(({ id }) => id !== activeTab).map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              type="button"
              variant="outlined"
              startIcon={<Icon />}
              disabled={isDisabled(id)}
              onClick={() => {
                dispatch(setMediaModalTab(id));
                setExpanded(false);
              }}
              sx={{
                justifyContent: 'flex-start',
                borderRadius: 2,
                fontWeight: 600,
                textTransform: 'none',
                borderColor: palette.borderMuted,
                color: 'text.secondary',
              }}
            >
              {label}
            </Button>
          ))}
        </Stack>
      </Collapse>
    </Box>
  );
}
