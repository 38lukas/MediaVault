'use client';

import { forwardRef, useState } from 'react';
import { keyframes } from '@emotion/react';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Tooltip,
  Typography,
  type BoxProps,
} from '@mui/material';
import { palette } from '@/lib/palette';
import type { Achievement, AchievementRarity } from '@/types/profile';

interface AchievementsProps {
  achievements: Achievement[];
}

const RARITY_COLOR: Record<AchievementRarity, string> = {
  Bronze: '#c17f4a',
  Silver: '#d5d8de',
  Gold: '#e2b340',
  Platinum: '#d7f1ff',
};

const SHINE_GLOW: Partial<Record<AchievementRarity, { soft: string; strong: string }>> = {
  Gold: {
    soft: 'rgba(255, 196, 70, 0.45)',
    strong: 'rgba(255, 214, 120, 0.95)',
  },
};

const RAINBOW_STOPS: [string, string, string][] = [
  ['0%', '#ff4d4d', 'rgba(255, 77, 77, 0.85)'],
  ['16%', '#ff9a1a', 'rgba(255, 154, 26, 0.85)'],
  ['33%', '#ffe14a', 'rgba(255, 225, 74, 0.85)'],
  ['50%', '#3dff7a', 'rgba(61, 255, 122, 0.8)'],
  ['66%', '#3de0ff', 'rgba(61, 224, 255, 0.85)'],
  ['83%', '#7a5cff', 'rgba(122, 92, 255, 0.85)'],
  ['100%', '#ff4d4d', 'rgba(255, 77, 77, 0.85)'],
];

const rainbowGlow = keyframes(
  Object.fromEntries(
    RAINBOW_STOPS.map(([at, hex, glow]) => [
      at,
      {
        borderColor: hex,
        boxShadow: `0 0 12px 3px ${glow}, 0 0 26px 8px ${glow}`,
      },
    ]),
  ),
);

const rainbowText = keyframes(
  Object.fromEntries(RAINBOW_STOPS.map(([at, hex]) => [at, { color: hex }])),
);

const rainbowSparkle = keyframes(
  Object.fromEntries(
    RAINBOW_STOPS.map(([at, hex]) => [
      at,
      { backgroundColor: hex, boxShadow: `0 0 6px 1px ${hex}` },
    ]),
  ),
);

const achievementSparkle = keyframes({
  '0%, 100%': { opacity: 0.15, transform: 'scale(0.45)' },
  '50%': { opacity: 1, transform: 'scale(1)' },
});

const achievementSheen = keyframes({
  '0%': { transform: 'translateX(-130%)' },
  '55%, 100%': { transform: 'translateX(130%)' },
});

const ICON_SIZE = 60;
const COLUMNS = 8;
const MAX_SLOTS = COLUMNS * 2;

// Square achievement icons. image is a custom icon; otherwise a placeholder glyph.
export function Achievements({ achievements }: AchievementsProps) {
  const [open, setOpen] = useState(false);
  const ordered = [...achievements].sort((a, b) => Number(b.unlocked) - Number(a.unlocked));
  const overflow = ordered.length > MAX_SLOTS;
  const visible = overflow ? ordered.slice(0, MAX_SLOTS - 1) : ordered;
  const hiddenCount = ordered.length - visible.length;

  return (
    <Box>
      <Typography
        variant="subtitle2"
        component="h2"
        sx={{ fontWeight: 700, letterSpacing: 0.4, mb: 1.5 }}
      >
        Achievements
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(${COLUMNS}, ${ICON_SIZE}px)`,
          gap: 1.75,
          pt: 1,
          pl: 1,
        }}
      >
        {visible.map((achievement) => (
          <AchievementTooltip key={achievement.id} achievement={achievement} />
        ))}
        {overflow && (
          <Box
            component="button"
            type="button"
            aria-label={`Show ${hiddenCount} more achievements`}
            onClick={() => setOpen(true)}
            sx={{
              width: ICON_SIZE,
              height: ICON_SIZE,
              p: 0,
              borderRadius: 1.5,
              border: `2px solid ${palette.borderMuted}`,
              backgroundColor: palette.surface,
              color: palette.textOnDark,
              fontWeight: 700,
              fontSize: '1rem',
              fontFamily: 'inherit',
              cursor: 'pointer',
              '&:hover': {
                borderColor: palette.primary,
                color: palette.primary,
              },
            }}
          >
            +{hiddenCount}
          </Box>
        )}
      </Box>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="md"
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
              backgroundColor: palette.surface,
              border: `1px solid ${palette.border}`,
              backgroundImage: 'none',
            },
          },
        }}
      >
        <DialogTitle>Achievements</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, pt: 1, pl: 1, pb: 1 }}>
            {ordered.map((achievement) => (
              <AchievementTooltip key={achievement.id} achievement={achievement} />
            ))}
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

function AchievementTooltip({ achievement }: { achievement: Achievement }) {
  return (
    <Tooltip
      arrow
      placement="top"
      enterDelay={80}
      title={
        <Box sx={{ py: 0.25, px: 0.5, maxWidth: 220 }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 700, color: palette.textOnDark, lineHeight: 1.3 }}
          >
            {achievement.title}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: 'rgba(255,255,255,0.72)', lineHeight: 1.35 }}
          >
            {achievement.description}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 0.5,
              fontWeight: 700,
              lineHeight: 1.35,
              color: RARITY_COLOR[achievement.rarity],
              ...(achievement.rarity === 'Platinum' && {
                animation: `${rainbowText} 3.6s linear infinite`,
              }),
            }}
          >
            Rarity: {achievement.rarity}
          </Typography>
        </Box>
      }
      slotProps={{
        tooltip: {
          sx: {
            backgroundColor: palette.surfaceElevated,
            border: `1px solid ${palette.border}`,
            boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
          },
        },
        arrow: {
          sx: {
            color: palette.surfaceElevated,
            '&::before': {
              border: `1px solid ${palette.border}`,
              backgroundColor: palette.surfaceElevated,
              boxSizing: 'border-box',
            },
          },
        },
      }}
    >
      <AchievementIcon achievement={achievement} />
    </Tooltip>
  );
}

const AchievementIcon = forwardRef<HTMLDivElement, BoxProps & { achievement: Achievement }>(
  function AchievementIcon({ achievement, ...props }, ref) {
  const showSparkles =
    achievement.unlocked &&
    (achievement.rarity === 'Silver' || achievement.rarity === 'Platinum');
  const rainbow = achievement.unlocked && achievement.rarity === 'Platinum';
  const shine = achievement.unlocked && !rainbow ? SHINE_GLOW[achievement.rarity] : undefined;

  return (
    <Box
      {...props}
      ref={ref}
      role="img"
      aria-label={`${achievement.title}. ${achievement.description}. Rarity: ${achievement.rarity}. ${
        achievement.unlocked ? 'Unlocked' : 'Locked'
      }`}
      sx={{
        position: 'relative',
        width: ICON_SIZE,
        height: ICON_SIZE,
        flexShrink: 0,
        cursor: 'default',
        '&:hover .achievement-image': {
          transform: 'scale(1.06)',
        },
      }}
    >
      {showSparkles && <Sparkles rainbow={rainbow} />}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          borderRadius: 1.5,
          border: `2px solid ${RARITY_COLOR[achievement.rarity]}`,
          backgroundColor: palette.surface,
          ...(!achievement.unlocked && {
            filter: 'grayscale(1)',
            opacity: 0.45,
          }),
          ...(rainbow && {
            animation: `${rainbowGlow} 3.6s linear infinite`,
          }),
          ...(shine && {
            animation: 'achievementShine 2.8s ease-in-out infinite',
            '@keyframes achievementShine': {
              '0%, 100%': {
                boxShadow: `0 0 6px 1px ${shine.soft}`,
              },
              '50%': {
                boxShadow: `0 0 14px 4px ${shine.strong}, 0 0 28px 10px ${shine.soft}`,
              },
            },
          }),
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: '100%',
            borderRadius: 1.5,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {achievement.image ? (
            <Box
              className="achievement-image"
              component="img"
              src={achievement.image}
              alt=""
              draggable={false}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                transition: 'transform 0.15s ease',
              }}
            />
          ) : (
            <PlaceholderGlyph id={achievement.id} />
          )}
          {(shine || rainbow) && (
            <Box
              aria-hidden
              sx={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                background:
                  'linear-gradient(115deg, transparent 32%, rgba(255,255,255,0.55) 50%, transparent 68%)',
                animation: `${achievementSheen} 3.2s ease-in-out infinite`,
              }}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
  },
);

const SPARKLE_LAYOUT: {
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  size: number;
  delay: string;
}[] = [
  { top: -6, left: 10, size: 7, delay: '0s' },
  { top: -4, right: 8, size: 4, delay: '0.7s' },
  { top: 18, left: -7, size: 5, delay: '1.1s' },
  { bottom: 10, right: -6, size: 6, delay: '0.35s' },
  { bottom: -5, left: 22, size: 4, delay: '1.4s' },
  { top: 34, right: -5, size: 3, delay: '0.9s' },
];

function Sparkles({ rainbow = false }: { rainbow?: boolean }) {
  return (
    <>
      {SPARKLE_LAYOUT.map((sparkle, index) => (
        <Box
          key={index}
          aria-hidden
          sx={{
            position: 'absolute',
            top: sparkle.top,
            left: sparkle.left,
            right: sparkle.right,
            bottom: sparkle.bottom,
            width: sparkle.size,
            height: sparkle.size,
            pointerEvents: 'none',
            backgroundColor: rainbow ? '#ff4d4d' : '#f4f6fa',
            boxShadow: rainbow ? '0 0 6px 1px #ff4d4d' : '0 0 6px 1px #f4f6fa',
            clipPath:
              'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
            animation: rainbow
              ? `${achievementSparkle} 1.8s ease-in-out infinite, ${rainbowSparkle} 3.6s linear infinite`
              : `${achievementSparkle} 1.8s ease-in-out infinite`,
            animationDelay: sparkle.delay,
          }}
        />
      ))}
    </>
  );
}

function PlaceholderGlyph({ id }: { id: string }) {
  const mark = id.match(/_(\d+)$/)?.[1] ?? '';

  return (
    <Box
      className="achievement-image"
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        transition: 'transform 0.15s ease',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.16), transparent 55%), #2a2418',
        color: palette.primary,
        fontWeight: 700,
        fontSize: mark.length > 2 ? '0.85rem' : '1rem',
        letterSpacing: -0.3,
      }}
    >
      {mark}
    </Box>
  );
}
