'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Autocomplete,
  CircularProgress,
  InputAdornment,
  TextField,
} from '@mui/material';
import {
  useLazyFetchIgdbGameQuery,
  useLazySearchIgdbGamesQuery,
  type IgdbGameLookup,
  type IgdbGameSearchResult,
} from '@/redux/mediaApi';

const SEARCH_DEBOUNCE_MS = 650;
const MIN_QUERY_LENGTH = 3;

interface IgdbGameSearchProps {
  open: boolean;
  title: string;
  skipSearchForTitle?: string;
  fieldSx: object;
  onTitleChange: (title: string, hadSelection: boolean) => void;
  onSelectionChange: (game: IgdbGameSearchResult | null, loading: boolean) => void;
  onGameLoaded: (game: IgdbGameLookup) => void;
  onError: (error: unknown) => void;
}

function formatReleaseYear(timestamp: number): string {
  return String(new Date(timestamp * 1000).getUTCFullYear());
}

export function IgdbGameSearch({
  open,
  title,
  skipSearchForTitle,
  fieldSx,
  onTitleChange,
  onSelectionChange,
  onGameLoaded,
  onError,
}: IgdbGameSearchProps) {
  const [searchGames] = useLazySearchIgdbGamesQuery();
  const [fetchGame, gameState] = useLazyFetchIgdbGameQuery();
  const [results, setResults] = useState<IgdbGameSearchResult[]>([]);
  const [selectedGame, setSelectedGame] = useState<IgdbGameSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const searchRequestIdRef = useRef(0);
  const detailRequestIdRef = useRef(0);
  const detailRequestRef = useRef<ReturnType<typeof fetchGame> | null>(null);

  useEffect(() => {
    if (!open || selectedGame) return;

    const query = title.trim();
    if (
      query.length < MIN_QUERY_LENGTH ||
      (skipSearchForTitle && query.toLowerCase() === skipSearchForTitle.trim().toLowerCase())
    ) {
      return;
    }

    const requestId = ++searchRequestIdRef.current;
    let request: ReturnType<typeof searchGames> | undefined;
    const timer = window.setTimeout(() => {
      setIsSearching(true);
      request = searchGames(query);
      void request
        .unwrap()
        .then((matches) => {
          if (requestId === searchRequestIdRef.current) setResults(matches);
        })
        .catch((error: unknown) => {
          if (
            requestId !== searchRequestIdRef.current ||
            (error && typeof error === 'object' && 'name' in error &&
              (error as { name: string }).name === 'AbortError')
          ) {
            return;
          }
          onError(error);
        })
        .finally(() => {
          if (requestId === searchRequestIdRef.current) setIsSearching(false);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      searchRequestIdRef.current += 1;
      request?.abort();
    };
  }, [open, title, selectedGame, skipSearchForTitle, searchGames, onError]);

  const handleSelect = async (game: IgdbGameSearchResult | null) => {
    if (!game) return;

    const requestId = ++detailRequestIdRef.current;
    detailRequestRef.current?.abort();
    setSelectedGame(game);
    setResults([]);
    onSelectionChange(game, true);

    const request = fetchGame(game.id);
    detailRequestRef.current = request;
    try {
      const result = await request.unwrap();
      if (requestId === detailRequestIdRef.current) onGameLoaded(result);
    } catch (error) {
      if (
        error && typeof error === 'object' && 'name' in error &&
        (error as { name: string }).name === 'AbortError'
      ) {
        return;
      }
      if (requestId === detailRequestIdRef.current) onError(error);
    } finally {
      if (requestId === detailRequestIdRef.current) {
        onSelectionChange(game, false);
        detailRequestRef.current = null;
      }
    }
  };

  return (
    <Autocomplete
      options={selectedGame ? [selectedGame] : results}
      value={selectedGame}
      inputValue={title}
      getOptionLabel={(option) =>
        option.first_release_date == null
          ? option.name
          : `${option.name} (${formatReleaseYear(option.first_release_date)})`
      }
      getOptionKey={(option) => option.id}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      filterOptions={(options) => options}
      loading={isSearching}
      noOptionsText={
        title.trim().length < MIN_QUERY_LENGTH
          ? 'Type at least 3 characters'
          : 'No matching games'
      }
      onInputChange={(_event, value, reason) => {
        if (reason !== 'input' && reason !== 'clear') return;

        const hadSelection = selectedGame !== null;
        detailRequestIdRef.current += 1;
        detailRequestRef.current?.abort();
        detailRequestRef.current = null;
        setSelectedGame(null);
        setResults([]);
        setIsSearching(false);
        onSelectionChange(null, false);
        onTitleChange(value, hadSelection);
      }}
      onChange={(_event, game) => void handleSelect(game)}
      renderInput={(params) => (
        <TextField
          {...params}
          required
          label="Title"
          fullWidth
          sx={fieldSx}
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps.input,
              endAdornment: (
                <>
                  {(isSearching || gameState.isFetching) && (
                    <InputAdornment position="end">
                      <CircularProgress size={16} thickness={5} color="inherit" />
                    </InputAdornment>
                  )}
                  {params.slotProps.input.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
    />
  );
}
