import { Container } from '@mui/material';
import { AppHeader } from '@/components/common/AppHeader';
import { MediaModal } from '@/components/media/MediaModal';
import { AuthGate } from '@/components/user/AuthGate';

// Shared layout for pages
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <AppHeader />
        <MediaModal />
        {children}
      </Container>
    </AuthGate>
  );
}
