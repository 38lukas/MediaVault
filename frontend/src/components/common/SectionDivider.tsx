'use client';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box, Typography } from '@mui/material';
import { StarRating } from '@/components/common/StarRating';
import { palette } from '@/lib/palette';
import { getStatusColor } from '@/utils/mediaStatus';

interface SectionDividerProps {
  label: string;
  rating?: number | null;
  statusStyle?: boolean;
  collapsed?: boolean;
  onLabelClick?: () => void;
}

// Section title row with optional rating stars and a horizontal rule.
export function SectionDivider({
  label,
  rating,
  statusStyle = false,
  collapsed = false,
  onLabelClick,
}: SectionDividerProps) {
  const colors = statusStyle ? getStatusColor(label) : null;
  const clickable = onLabelClick != null;

  const labelBody = (
    <>
      {clickable && (
        <ExpandMoreIcon
          sx={{
            fontSize: colors ? '1rem' : '1.15rem',
            transform: collapsed ? 'rotate(-90deg)' : 'none',
            transition: 'transform 0.15s ease',
          }}
        />
      )}
      {label}
    </>
  );

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: collapsed ? 0 : 2, mt: 1 }}>
      {rating != null && <StarRating value={rating} readOnly size="small" />}
      {colors ? (
        <Box
          component={clickable ? 'button' : 'div'}
          type={clickable ? 'button' : undefined}
          aria-expanded={clickable ? !collapsed : undefined}
          onClick={onLabelClick}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.25,
            py: 0.55,
            px: 1.25,
            borderRadius: 1.5,
            backgroundColor: colors.bg,
            border: `1px solid ${colors.border}`,
            color: colors.color,
            fontWeight: 700,
            fontSize: '0.75rem',
            fontFamily: 'inherit',
            letterSpacing: '0.02em',
            textTransform: 'capitalize',
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            cursor: clickable ? 'pointer' : 'default',
          }}
        >
          {labelBody}
        </Box>
      ) : (
        <Typography
          component={clickable ? 'button' : 'span'}
          variant="subtitle2"
          type={clickable ? 'button' : undefined}
          aria-expanded={clickable ? !collapsed : undefined}
          onClick={onLabelClick}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.25,
            fontWeight: 700,
            letterSpacing: 0.4,
            whiteSpace: 'nowrap',
            fontFamily: 'inherit',
            color: 'inherit',
            background: 'none',
            border: 'none',
            p: 0,
            cursor: clickable ? 'pointer' : 'default',
          }}
        >
          {labelBody}
        </Typography>
      )}
      <Box sx={{ flex: 1, height: '1px', backgroundColor: palette.borderStrong }} />
    </Box>
  );
}
