'use client';

import { Container, Typography, Box } from '@mui/material';
import { MediaGrid } from '@/components/MediaGrid';
import { MediaItem } from '@/components/MediaCard';

// Dummy-Daten zum Testen aller Status-Farben & Typen
const mockMedia: MediaItem[] = [
  {
    id: 1,
    title: 'Hades II',
    type: 'Game',
    status: 'Playing',
    cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co7yze.jpg',
  },
  {
    id: 2,
    title: 'Cyberpunk 2077',
    type: 'Game',
    status: 'Finished',
    cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1r7f.jpg',
  },
  {
    id: 3,
    title: 'Elden Ring',
    type: 'Game',
    status: 'Shelved',
    cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.jpg',
  },
  {
    id: 4,
    title: 'Silksong',
    type: 'Game',
    status: 'Wishlist',
    cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1r7b.jpg',
  },
  {
    id: 5,
    title: 'Dune: Part Two',
    type: 'Movie',
    status: 'Finished',
    cover_url: 'https://image.tmdb.org/t/p/w500/1pdfLPoL3VFiB2A2W263L2O3K5y.jpg',
  },
  {
    id: 6,
    title: 'Severance',
    type: 'Series',
    status: 'Watching',
    cover_url: 'https://image.tmdb.org/t/p/w500/p91stptq3d4U0BqT5E3mUqQ8R.jpg',
  },
  {
    id: 7,
    title: 'Frieren: Beyond Journey\'s End',
    type: 'Anime',
    status: 'Finished',
    cover_url: 'https://image.tmdb.org/t/p/w500/dq1A0bO9J1Xb99o15V0aO58z2eM.jpg',
  },
  {
    id: 8,
    title: 'The Bear',
    type: 'Series',
    status: 'Watchlist',
    cover_url: 'https://image.tmdb.org/t/p/w500/2f5348vE9o05k4j0L39j3n3m3n.jpg',
  },
];

export default function HomePage() {
  const handleItemClick = (item: MediaItem) => {
    console.log('Klick auf Medium:', item.title);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Meine Bibliothek
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Verwalte deine Filme, Serien, Animes und Games an einem Ort.
        </Typography>
      </Box>

      <MediaGrid items={mockMedia} onItemClick={handleItemClick} />
    </Container>
  );
}