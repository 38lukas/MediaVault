'use client';

import { useEffect, useRef, useState } from 'react';
import { CircularProgress, InputAdornment, MenuItem, TextField } from '@mui/material';
import { skipToken } from '@reduxjs/toolkit/query';
import {
  useFetchTmdbTitleQuery,
  useLazyFetchTmdbSeasonQuery,
  type TmdbMediaType,
  type TmdbSeasonSummary,
} from '@/redux/api';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { lookupSelectionChanged, tmdbSeasonSelected } from '@/redux/slices/mediaModalSlice';

const WHOLE_SHOW = 0;

interface TmdbSeasonSelectProps {
  // Null until a TMDB show is picked.
  showId: number | null;
  mediaType: TmdbMediaType;
  fieldSx: object;
  onError: (error: unknown) => void;
}

function isAbortError(error: unknown): boolean {
  return (
    !!error &&
    typeof error === 'object' &&
    'name' in error &&
    (error as { name: string }).name === 'AbortError'
  );
}

function seasonLabel(season: Pick<TmdbSeasonSummary, 'name' | 'air_date'>): string {
  return season.air_date ? `${season.name} (${season.air_date.slice(0, 4)})` : season.name;
}

// Season picker for TMDB shows; choosing a season swaps in that season's poster and details.
export function TmdbSeasonSelect({ showId, mediaType, fieldSx, onError }: TmdbSeasonSelectProps) {
  const dispatch = useAppDispatch();
  const seasonNumber = useAppSelector((state) => state.mediaModal.form.seasonNumber);
  const seasonName = useAppSelector((state) => state.mediaModal.form.seasonName);
  const showQuery = useFetchTmdbTitleQuery(
    showId == null ? skipToken : { id: showId, mediaType },
  );
  const show = showQuery.data;
  const [fetchSeason, seasonState] = useLazyFetchTmdbSeasonQuery();
  const [pendingSeason, setPendingSeason] = useState<number | null>(null);
  const requestIdRef = useRef(0);
  const requestRef = useRef<ReturnType<typeof fetchSeason> | null>(null);

  useEffect(() => {
    if (showQuery.error) onError(showQuery.error);
  }, [showQuery.error, onError]);

  useEffect(
    () => () => {
      requestIdRef.current += 1;
      requestRef.current?.abort();
    },
    [],
  );

  const seasons = show?.seasons ?? [];
  // Keeps a saved season selectable while the list loads or if TMDB no longer lists it.
  const options =
    seasonNumber != null && !seasons.some((s) => s.season_number === seasonNumber)
      ? [
          ...seasons,
          { season_number: seasonNumber, name: seasonName || `Season ${seasonNumber}`, air_date: null },
        ]
      : seasons;

  const handleChange = async (value: number) => {
    if (!show || showId == null) return;
    const requestId = ++requestIdRef.current;
    requestRef.current?.abort();
    requestRef.current = null;

    if (value === WHOLE_SHOW) {
      setPendingSeason(null);
      dispatch(tmdbSeasonSelected({ show, season: null }));
      dispatch(lookupSelectionChanged({ name: show.name, loading: false }));
      return;
    }

    setPendingSeason(value);
    dispatch(lookupSelectionChanged({ name: show.name, loading: true }));
    const request = fetchSeason({ showId, seasonNumber: value });
    requestRef.current = request;
    try {
      const season = await request.unwrap();
      if (requestId === requestIdRef.current) dispatch(tmdbSeasonSelected({ show, season }));
    } catch (error) {
      if (isAbortError(error)) return;
      if (requestId === requestIdRef.current) onError(error);
    } finally {
      if (requestId === requestIdRef.current) {
        setPendingSeason(null);
        requestRef.current = null;
        dispatch(lookupSelectionChanged({ name: show.name, loading: false }));
      }
    }
  };

  const isLoading = showQuery.isFetching || seasonState.isFetching;

  return (
    <TextField
      select
      label="Season"
      fullWidth
      value={pendingSeason ?? seasonNumber ?? WHOLE_SHOW}
      onChange={(event) => void handleChange(Number(event.target.value))}
      disabled={!show}
      helperText={showId == null ? 'Pick a show from the title search to choose a season.' : undefined}
      sx={fieldSx}
      slotProps={{
        input: {
          endAdornment: isLoading ? (
            <InputAdornment position="end" sx={{ mr: 3 }}>
              <CircularProgress size={16} thickness={5} color="inherit" />
            </InputAdornment>
          ) : undefined,
        },
      }}
    >
      <MenuItem value={WHOLE_SHOW}>
        <em>Entire show</em>
      </MenuItem>
      {options.map((season) => (
        <MenuItem key={season.season_number} value={season.season_number}>
          {seasonLabel(season)}
        </MenuItem>
      ))}
    </TextField>
  );
}
