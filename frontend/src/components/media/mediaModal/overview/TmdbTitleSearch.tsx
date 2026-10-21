'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Autocomplete,
  CircularProgress,
  InputAdornment,
  TextField,
} from '@mui/material';
import {
  useLazyFetchTmdbTitleQuery,
  useLazySearchTmdbTitlesQuery,
  type TmdbLookup,
  type TmdbMediaType,
  type TmdbSearchResult,
} from '@/redux/api';

const SEARCH_DEBOUNCE_MS = 650;
const MIN_QUERY_LENGTH = 3;
// Listbox padding is 8px on each end; a single-line option is 36px.
const VISIBLE_RESULT_ROWS = 5;
const LISTBOX_MAX_HEIGHT = 16 + 36 * VISIBLE_RESULT_ROWS;

interface TmdbTitleSearchProps {
  open: boolean;
  title: string;
  mediaType: TmdbMediaType;
  skipSearchForTitle?: string;
  fieldSx: object;
  onTitleChange: (title: string, hadSelection: boolean) => void;
  onSelectionChange: (result: TmdbSearchResult | null, loading: boolean) => void;
  onTitleLoaded: (result: TmdbLookup) => void;
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

// Debounced TMDB movie / show autocomplete that loads poster and details on select.
export function TmdbTitleSearch({
  open,
  title,
  mediaType,
  skipSearchForTitle,
  fieldSx,
  onTitleChange,
  onSelectionChange,
  onTitleLoaded,
  onError,
}: TmdbTitleSearchProps) {
  const [searchTitles] = useLazySearchTmdbTitlesQuery();
  const [fetchTitle, titleState] = useLazyFetchTmdbTitleQuery();
  const [results, setResults] = useState<TmdbSearchResult[]>([]);
  const [selected, setSelected] = useState<TmdbSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const searchRequestIdRef = useRef(0);
  const detailRequestIdRef = useRef(0);
  const detailRequestRef = useRef<ReturnType<typeof fetchTitle> | null>(null);

  useEffect(() => {
    if (!open || selected) return;

    const query = title.trim();
    if (
      query.length < MIN_QUERY_LENGTH ||
      (skipSearchForTitle && query.toLowerCase() === skipSearchForTitle.trim().toLowerCase())
    ) {
      return;
    }

    const requestId = ++searchRequestIdRef.current;
    let request: ReturnType<typeof searchTitles> | undefined;
    const timer = window.setTimeout(() => {
      setIsSearching(true);
      request = searchTitles({ name: query, mediaType });
      void request
        .unwrap()
        .then((matches) => {
          if (requestId === searchRequestIdRef.current) setResults(matches);
        })
        .catch((error: unknown) => {
          if (requestId !== searchRequestIdRef.current || isAbortError(error)) return;
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
  }, [open, title, mediaType, selected, skipSearchForTitle, searchTitles, onError]);

  const handleSelect = async (result: TmdbSearchResult | null) => {
    if (!result) return;

    const requestId = ++detailRequestIdRef.current;
    detailRequestRef.current?.abort();
    setSelected(result);
    setResults([]);
    onSelectionChange(result, true);

    const request = fetchTitle({ id: result.id, mediaType });
    detailRequestRef.current = request;
    try {
      const details = await request.unwrap();
      if (requestId === detailRequestIdRef.current) onTitleLoaded(details);
    } catch (error) {
      if (isAbortError(error)) return;
      if (requestId === detailRequestIdRef.current) onError(error);
    } finally {
      if (requestId === detailRequestIdRef.current) {
        onSelectionChange(result, false);
        detailRequestRef.current = null;
      }
    }
  };

  return (
    <Autocomplete
      options={selected ? [selected] : results}
      value={selected}
      inputValue={title}
      getOptionLabel={(option) =>
        option.release_date
          ? `${option.name} (${option.release_date.slice(0, 4)})`
          : option.name
      }
      getOptionKey={(option) => option.id}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      filterOptions={(options) => options}
      slotProps={{ listbox: { sx: { maxHeight: LISTBOX_MAX_HEIGHT } } }}
      loading={isSearching}
      noOptionsText={
        title.trim().length < MIN_QUERY_LENGTH
          ? 'Type at least 3 characters'
          : mediaType === 'Movie'
            ? 'No matching movies'
            : 'No matching shows'
      }
      onInputChange={(_event, value, reason) => {
        if (reason !== 'input' && reason !== 'clear') return;

        const hadSelection = selected !== null;
        detailRequestIdRef.current += 1;
        detailRequestRef.current?.abort();
        detailRequestRef.current = null;
        setSelected(null);
        setResults([]);
        setIsSearching(false);
        onSelectionChange(null, false);
        onTitleChange(value, hadSelection);
      }}
      onChange={(_event, result) => void handleSelect(result)}
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
                  {(isSearching || titleState.isFetching) && (
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
