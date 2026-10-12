'use client';

import {
  Box,
  Button,
  Chip,
  Collapse,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  SvgIcon,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterListIcon from '@mui/icons-material/FilterList';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import MovieOutlinedIcon from '@mui/icons-material/MovieOutlined';
import SportsEsportsOutlinedIcon from '@mui/icons-material/SportsEsportsOutlined';
import TvOutlinedIcon from '@mui/icons-material/TvOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import AppsOutlinedIcon from '@mui/icons-material/AppsOutlined';
import { palette } from '@/lib/palette';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { openCreateMediaModal } from '@/redux/slices/mediaModalSlice';
import {
  setCardSize,
  setSearchQuery,
  setSortDirection,
  setSortField,
  setStatusFilter,
  setTypeFilter,
  toggleFiltersOpen,
} from '@/redux/slices/libraryUiSlice';
import {
  CARD_SIZE_OPTIONS,
  SORT_FIELD_OPTIONS,
  TYPE_FILTER_LABELS,
  TYPE_FILTERS,
  isCardSize,
  statusesForTypeFilter,
  type SortDirection,
  type SortField,
  type TypeFilter,
} from '@/types/media';

const TYPE_FILTER_ICONS: Record<TypeFilter, typeof AppsOutlinedIcon> = {
  All: AppsOutlinedIcon,
  'Game/DLC': SportsEsportsOutlinedIcon,
  Movie: MovieOutlinedIcon,
  Series: TvOutlinedIcon,
  Anime: AutoAwesomeOutlinedIcon,
  Book: MenuBookOutlinedIcon,
};

// Library search bar with expandable type/status/sort filters.
export function LibraryToolbar() {
  const dispatch = useAppDispatch();
  const viewingAs = useAppSelector((state) => state.auth.viewingAs);
  const {
    typeFilter,
    statusFilter,
    sortField,
    sortDirection,
    searchQuery,
    cardSize,
    filtersOpen,
  } = useAppSelector((state) => state.libraryUi);

  const statusOptions = statusesForTypeFilter(typeFilter);
  const activeFilterCount =
    (typeFilter !== 'All' ? 1 : 0) +
    (statusFilter ? 1 : 0) +
    (sortField !== 'status' ? 1 : 0);

  return (
    <Stack spacing={1.5} sx={{ mb: 3 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            flexWrap: 'wrap',
            flex: '1 1 auto',
            minWidth: 0,
          }}
        >
          <TextField
            size="small"
            placeholder="Search title"
            value={searchQuery}
            onChange={(e) => dispatch(setSearchQuery(e.target.value))}
            sx={{ minWidth: 200, flex: '1 1 240px', maxWidth: 360 }}
            slotProps={{ htmlInput: { 'aria-label': 'Search by title' } }}
          />

          <Button
            variant={filtersOpen ? 'contained' : 'outlined'}
            size="small"
            startIcon={<FilterListIcon />}
            endIcon={
              <ExpandMoreIcon
                sx={{
                  transform: filtersOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s ease',
                }}
              />
            }
            onClick={() => dispatch(toggleFiltersOpen())}
            sx={{ whiteSpace: 'nowrap', minHeight: 40 }}
          >
            Filters
            {activeFilterCount > 0 && !filtersOpen ? ` (${activeFilterCount})` : ''}
          </Button>
        </Box>

        <Box
          sx={{
            display: 'flex',
            gap: 1.5,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {!viewingAs && (
            <Button
              variant="contained"
              startIcon={
                <SvgIcon fontSize="small">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </SvgIcon>
              }
              onClick={() => dispatch(openCreateMediaModal())}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Add Media
            </Button>
          )}
        </Box>
      </Box>

      <Collapse in={filtersOpen} timeout={150}>
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            border: `1px solid ${palette.border}`,
            backgroundColor: palette.surface,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mb: 1,
                fontWeight: 600,
                letterSpacing: 0.4,
                color: 'text.secondary',
                textTransform: 'uppercase',
              }}
            >
              Media type
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {TYPE_FILTERS.map((type) => {
                const Icon = TYPE_FILTER_ICONS[type];
                const selected = typeFilter === type;
                return (
                  <Chip
                    key={type}
                    icon={<Icon sx={{ fontSize: 18 }} />}
                    label={TYPE_FILTER_LABELS[type]}
                    clickable
                    onClick={() => dispatch(setTypeFilter(type))}
                    variant={selected ? 'filled' : 'outlined'}
                    sx={{
                      height: 36,
                      px: 0.5,
                      fontWeight: selected ? 700 : 500,
                      borderColor: selected ? palette.primary : palette.borderStrong,
                      backgroundColor: selected ? palette.primary : 'transparent',
                      color: selected ? palette.primaryContrast : 'text.primary',
                      '& .MuiChip-icon': {
                        color: selected ? palette.primaryContrast : 'text.secondary',
                      },
                      '&:hover': {
                        backgroundColor: selected
                          ? palette.primary
                          : palette.selectedBg,
                      },
                    }}
                  />
                );
              })}
            </Box>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.5,
              flexWrap: 'wrap',
            }}
          >
            <FormControl size="small" sx={{ minWidth: 180, flex: '1 1 160px' }}>
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                label="Status"
                value={statusFilter ?? ''}
                onChange={(e) =>
                  dispatch(setStatusFilter(e.target.value === '' ? null : e.target.value))
                }
              >
                <MenuItem value="">
                  <em>All statuses</em>
                </MenuItem>
                {statusOptions.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 180, flex: '1 1 160px' }}>
              <InputLabel id="sort-by-label">Sort by</InputLabel>
              <Select
                labelId="sort-by-label"
                label="Sort by"
                value={sortField}
                onChange={(e) => dispatch(setSortField(e.target.value as SortField))}
              >
                {SORT_FIELD_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <ToggleButtonGroup
              exclusive
              size="small"
              value={sortDirection}
              onChange={(_, next: SortDirection | null) => {
                if (next) dispatch(setSortDirection(next));
              }}
              aria-label="Sort direction"
              sx={{ height: 40 }}
            >
              <ToggleButton value="asc" aria-label="Ascending">
                Asc
              </ToggleButton>
              <ToggleButton value="desc" aria-label="Descending">
                Desc
              </ToggleButton>
            </ToggleButtonGroup>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="grid-size-label">Grid</InputLabel>
              <Select
                labelId="grid-size-label"
                label="Grid"
                value={cardSize}
                onChange={(e) => {
                  const size = Number(e.target.value);
                  if (isCardSize(size)) dispatch(setCardSize(size));
                }}
                aria-label="Grid size"
              >
                {CARD_SIZE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Collapse>
    </Stack>
  );
}
