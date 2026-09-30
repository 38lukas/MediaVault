'use client';

import { Box, Container, Paper } from '@mui/material';
import { AuthGate } from '@/components/user/AuthGate';
import { AccountSection } from '@/components/settings/AccountSection';
import { GeneralSection } from '@/components/settings/GeneralSection';
import { SettingsHeader } from '@/components/settings/SettingsHeader';
import { SettingsSidebar } from '@/components/settings/SettingsSidebar';
import { palette } from '@/lib/palette';
import { useAppSelector } from '@/redux/hooks';

/**
 * Settings page: auth gate, header, sidebar, and the active section panel.
 * @returns Settings layout behind AuthGate.
 */
export default function SettingsPage() {
  const activeSection = useAppSelector((state) => state.settings.activeSection);

  return (
    <AuthGate>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <SettingsHeader />
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
            {activeSection === 'account' ? <AccountSection /> : <GeneralSection />}
          </Paper>
        </Box>
      </Container>
    </AuthGate>
  );
}
