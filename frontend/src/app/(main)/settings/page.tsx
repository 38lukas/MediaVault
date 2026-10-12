'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Paper, Typography } from '@mui/material';
import { AccountSection } from '@/components/settings/AccountSection';
import { AppearanceSection } from '@/components/settings/AppearanceSection';
import { GeneralSection } from '@/components/settings/GeneralSection';
import { SettingsSidebar } from '@/components/settings/SettingsSidebar';
import { palette } from '@/lib/palette';
import { useAppSelector } from '@/redux/hooks';

export default function SettingsPage() {
  const router = useRouter();
  const viewingAs = useAppSelector((state) => state.auth.viewingAs);
  const activeSection = useAppSelector((state) => state.settings.activeSection);

  useEffect(() => {
    if (viewingAs) {
      router.replace('/');
    }
  }, [viewingAs, router]);

  if (viewingAs) return null;

  return (
    <>
      <Typography
        variant="h4"
        component="h1"
        sx={{ fontWeight: 'bold', color: palette.primary, mb: 4 }}
      >
        Settings
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 3,
          alignItems: 'flex-start',
        }}
      >
        <SettingsSidebar />
        <Paper
          sx={{
            flex: 1,
            minWidth: 0,
            p: 3,
            borderRadius: 2,
            backgroundImage: 'none',
            backgroundColor: palette.surface,
            border: `1px solid ${palette.border}`,
          }}
        >
          {activeSection === 'account' ? (
            <AccountSection />
          ) : activeSection === 'general' ? (
            <GeneralSection />
          ) : (
            <AppearanceSection />
          )}
        </Paper>
      </Box>
    </>
  );
}
