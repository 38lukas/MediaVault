import { Container } from '@mui/material';
import { AppHeader } from '@/components/common/AppHeader';
import { FriendViewBanner } from '@/components/common/FriendViewBanner';
import { MediaModal } from '@/components/media/mediaModal/MediaModal';
import { AuthGate } from '@/components/user/AuthGate';

// Authenticated shell with header, friend banner, and media modal
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <FriendViewBanner />
        <AppHeader />
        <MediaModal />
        {children}
      </Container>
    </AuthGate>
  );
}
