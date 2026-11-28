'use client';

import { startTransition, useCallback } from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  SvgIcon,
  TextField,
} from '@mui/material';
import {
  ArrowDownwardIcon,
  ArrowUpwardIcon,
  CloseIcon,
  FavoriteIcon,
  FilterListOffIcon,
  SearchIcon,
  SORT_FIELD_ICONS,
  TYPE_FILTER_ICONS,
} from '@/lib/icons';
import { StarRating } from '@/components/common/StarRating';
import { OptionSelect } from '@/components/media/mediaModal/overview/OptionSelect';
import { MultiFilterSelect } from '@/components/library/MultiFilterSelect';
import { StatusMultiSelect } from '@/components/library/StatusMultiSelect';
import { palette } from '@/lib/palette';
import { CONTROL_HEIGHT } from '@/lib/theme';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { openCreateMediaModal } from '@/redux/slices/mediaModalSlice';
import {
  setRatingFilter,
  setFavoritesOnly,
  setSearchQuery,
  setSortDirection,
  setSortField,
  setStatusFilter,
  setTypeFilter,
} from '@/redux/slices/libraryUiSlice';
import {
  RATING_FILTER_UNRATED,
  SORT_FIELD_OPTIONS,
  TYPE_FILTER_LABELS,
  TYPE_FILTERS,
  statusesForTypeFilter,
  type SortField,
} from '@/types/media';
import { UNRATED_SECTION_LABEL } from '@/utils/rating';

// Rating dropdown options: unrated, favorites (heart), then DB ratings best first.
const FAVORITES_OPTION = 'favorites';
const RATING_OPTIONS: string[] = [RATING_FILTER_UNRATED, FAVORITES_OPTION, ...[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(String)];

const SORT_FIELD_LABELS = Object.fromEntries(
  SORT_FIELD_OPTIONS.map((opt) => [opt.value, opt.label])
) as Record<SortField, string>;

// Library toolbar: search and add on top, then media type chips with status / rating / sort filters.
export function LibraryToolbar() {
  const dispatch = useAppDispatch();
  const viewingAs = useAppSelector((state) => state.auth.viewingAs);
  const {
    typeFilter,
    statusFilter,
    ratingFilter,
    favoritesOnly,
    sortField,
    sortDirection,
    searchQuery,
  } = useAppSelector((state) => state.libraryUi);

  const statusOptions = statusesForTypeFilter(typeFilter);
  const hasActiveFilters =
    typeFilter !== 'All' || statusFilter.length > 0 ||
    ratingFilter.length > 0 ||
    favoritesOnly ||
    searchQuery !== '';

  // Keep filter UI responsive while the grid catches up.
  const deferDispatch = useCallback(
    (action: Parameters<typeof dispatch>[0]) => {
      startTransition(() => {
        dispatch(action);
      });
    },
    [dispatch]
  );

  const resetFilters = () => {
    dispatch(setSearchQuery(''));
    startTransition(() => {
      dispatch(setTypeFilter('All'));
      dispatch(setStatusFilter([]));
      dispatch(setRatingFilter([]));
      dispatch(setFavoritesOnly(false));
    });
  };

  return (
    <Box
      sx={{
        mb: 3,
        p: 2,
        borderRadius: 2,
        border: `1px solid ${palette.border}`,
        backgroundColor: palette.surface,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search your library"
          value={searchQuery}
          onChange={(e) => dispatch(setSearchQuery(e.target.value))}
          sx={{ flex: '1 1 260px', minWidth: 200 }}
          slotProps={{
            htmlInput: { 'aria-label': 'Search by title' },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    edge="end"
                    aria-label="Clear search"
                    onClick={() => dispatch(setSearchQuery(''))}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
            },
          }}
        />

        {!viewingAs && (
          <Button
            variant="contained"
            startIcon={
              <SvgIcon fontSize="small">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </SvgIcon>
            }
            onClick={() => dispatch(openCreateMediaModal())}
          >
            Add Media
          </Button>
        )}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        {TYPE_FILTERS.map((type) => {
          const Icon = TYPE_FILTER_ICONS[type];
          const selected = typeFilter === type;
          return (
            <Chip
              key={type}
              icon={<Icon sx={{ fontSize: 18 }} />}
              label={TYPE_FILTER_LABELS[type]}
              clickable
              onClick={() => deferDispatch(setTypeFilter(type))}
              variant={selected ? 'filled' : 'outlined'}
              sx={{
                height: CONTROL_HEIGHT,
                px: 0.5,
                fontWeight: selected ? 700 : 500,
                borderColor: selected ? palette.primary : palette.borderStrong,
                backgroundColor: selected ? palette.primary : 'transparent',
                color: selected ? palette.primaryContrast : 'text.primary',
                '& .MuiChip-icon': {
                  color: selected ? palette.primaryContrast : 'text.secondary',
                },
                '&:hover': {
                  backgroundColor: selected ? palette.primary : palette.selectedBg,
                },
              }}
            />
          );
        })}

        <Box sx={{ width: 170, ml: 0.5 }}>
          <StatusMultiSelect
            label="Status"
            options={statusOptions}
            value={statusFilter}
            onChange={(statuses) => deferDispatch(setStatusFilter(statuses))}
          />
        </Box>

        <Box sx={{ width: 150 }}>
          <MultiFilterSelect
            label="Rating"
            options={RATING_OPTIONS}
            value={[...(favoritesOnly ? [FAVORITES_OPTION] : []), ...ratingFilter.map(String)]}
            onChange={(selected) => {
              deferDispatch(setFavoritesOnly(selected.includes(FAVORITES_OPTION)));
              deferDispatch(
                setRatingFilter(
                  selected
                    .filter((option) => option !== FAVORITES_OPTION)
                    .map((option) => (option === RATING_FILTER_UNRATED ? RATING_FILTER_UNRATED : Number(option)))
                )
              );
            }}
            renderOption={(option) =>
              option === FAVORITES_OPTION ? (
                <FavoriteIcon
                  aria-label="Favorites"
                  titleAccess="Favorites"
                  sx={{ fontSize: 22, color: palette.primary }}
                />
              ) : option === RATING_FILTER_UNRATED ? (
                UNRATED_SECTION_LABEL
              ) : (
                <StarRating value={Number(option)} readOnly size="small" />
              )
            }
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 0.75, width: 190 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <OptionSelect
              label="Sort by"
              options={SORT_FIELD_OPTIONS.map((opt) => opt.value)}
              value={sortField}
              onChange={(field) => deferDispatch(setSortField(field))}
              renderOption={(field) => {
                const Icon = SORT_FIELD_ICONS[field];
                return (
                  <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                    <Icon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    {SORT_FIELD_LABELS[field]}
                  </Box>
                );
              }}
            />
          </Box>
          <IconButton
            aria-label={
              sortDirection === 'asc'
                ? 'Ascending, switch to descending'
                : 'Descending, switch to ascending'
            }
            title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
            onClick={() =>
              deferDispatch(setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc'))
            }
            sx={{
              width: CONTROL_HEIGHT,
              height: CONTROL_HEIGHT,
              borderRadius: 2,
              border: `1px solid ${palette.borderStrong}`,
              color: 'text.secondary',
              '&:hover': { borderColor: palette.primary, color: palette.primary },
            }}
          >
            {sortDirection === 'asc' ? (
              <ArrowUpwardIcon fontSize="small" />
            ) : (
              <ArrowDownwardIcon fontSize="small" />
            )}
          </IconButton>
        </Box>

        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {hasActiveFilters && (
            <Button
              color="inherit"
              size="small"
              startIcon={<FilterListOffIcon />}
              onClick={resetFilters}
              sx={{ color: 'text.secondary' }}
            >
              Reset
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}
