'use client';

import { useState } from 'react';
import { Box, Button, Checkbox, CircularProgress, Stack, Typography } from '@mui/material';
import { VisibilityIcon, VisibilityOffIcon } from '@/lib/icons';
import { palette } from '@/lib/palette';
import { useAppSelector } from '@/redux/hooks';
import { useGetUserSettingsQuery, useUpdateUserSettingsMutation } from '@/redux/api';
import { PROFILE_SECTIONS } from '@/types/profile';

// One profile element as a card: title on the left, an eye checkbox on the right (open eye = shown).
// Cards are separate so more per-element options can be added to each later.
function ProfileElementCard({
  label,
  visible,
  onToggle,
}: {
  label: string;
  visible: boolean;
  onToggle: (visible: boolean) => void;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        px: 2,
        py: 1,
        borderRadius: 2,
        border: `1px solid ${visible ? palette.border : palette.borderSubtle}`,
        backgroundColor: palette.fieldBg,
      }}
    >
      <Typography sx={{ fontWeight: 600, color: visible ? 'text.primary' : 'text.secondary' }}>
        {label}
      </Typography>
      <Checkbox
        checked={visible}
        onChange={(e) => onToggle(e.target.checked)}
        icon={<VisibilityOffIcon />}
        checkedIcon={<VisibilityIcon />}
        slotProps={{
          input: { 'aria-label': `${visible ? 'Hide' : 'Show'} ${label} on the profile` },
        }}
        sx={{ color: 'text.secondary', '&.Mui-checked': { color: palette.primary } }}
      />
    </Box>
  );
}

// Profile settings: choose which elements of the profile page are shown. Changes are a draft until Apply.
export function ProfileSection() {
  const username = useAppSelector((state) => state.auth.username);
  const { data: settings, isLoading } = useGetUserSettingsQuery(undefined, { skip: !username });
  const [updateUserSettings, updateState] = useUpdateUserSettingsMutation();
  const [draft, setDraft] = useState<string[] | null>(null);

  const savedHidden = settings?.profile_hidden_sections ?? [];
  const hidden = draft ?? savedHidden;
  const dirty =
    draft != null &&
    (draft.length !== savedHidden.length || draft.some((id) => !savedHidden.includes(id)));

  const handleToggle = (id: string, visible: boolean) => {
    const without = hidden.filter((hiddenId) => hiddenId !== id);
    setDraft(visible ? without : [...without, id]);
  };

  const handleApply = async () => {
    if (!draft) return;
    try {
      await updateUserSettings({ profile_hidden_sections: draft }).unwrap();
      setDraft(null);
    } catch {
      // Keep the draft so the user can try again.
    }
  };

  if (isLoading && !settings) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Stack spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="body2" color="text.secondary">
        Choose which elements are shown on your profile page.
      </Typography>

      {PROFILE_SECTIONS.map(({ id, label }) => (
        <ProfileElementCard
          key={id}
          label={label}
          visible={!hidden.includes(id)}
          onToggle={(visible) => handleToggle(id, visible)}
        />
      ))}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pt: 1.5 }}>
        <Button
          variant="contained"
          disabled={!dirty || updateState.isLoading}
          onClick={() => void handleApply()}
        >
          {updateState.isLoading ? 'Applying…' : 'Apply'}
        </Button>
        {dirty && !updateState.isLoading && (
          <Button color="inherit" onClick={() => setDraft(null)} sx={{ color: 'text.secondary' }}>
            Discard
          </Button>
        )}
      </Box>
    </Stack>
  );
}
