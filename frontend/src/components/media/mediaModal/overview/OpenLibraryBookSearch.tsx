'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Autocomplete,
  CircularProgress,
  InputAdornment,
  TextField,
} from '@mui/material';
import {
  useLazyFetchOpenLibraryBookQuery,
  useLazySearchOpenLibraryBooksQuery,
  type OpenLibraryBookLookup,
  type OpenLibraryBookSearchResult,
} from '@/redux/api';

const SEARCH_DEBOUNCE_MS = 650;
const MIN_QUERY_LENGTH = 3;

interface OpenLibraryBookSearchProps {
  open: boolean;
  title: string;
  skipSearchForTitle?: string;
  fieldSx: object;
  onTitleChange: (title: string, hadSelection: boolean) => void;
  onSelectionChange: (book: OpenLibraryBookSearchResult | null, loading: boolean) => void;
  onBookLoaded: (book: OpenLibraryBookLookup) => void;
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

// Debounced Open Library book autocomplete that loads cover and details on select.
export function OpenLibraryBookSearch({
  open,
  title,
  skipSearchForTitle,
  fieldSx,
  onTitleChange,
  onSelectionChange,
  onBookLoaded,
  onError,
}: OpenLibraryBookSearchProps) {
  const [searchBooks] = useLazySearchOpenLibraryBooksQuery();
  const [fetchBook, bookState] = useLazyFetchOpenLibraryBookQuery();
  const [results, setResults] = useState<OpenLibraryBookSearchResult[]>([]);
  const [selectedBook, setSelectedBook] = useState<OpenLibraryBookSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const searchRequestIdRef = useRef(0);
  const detailRequestIdRef = useRef(0);
  const detailRequestRef = useRef<ReturnType<typeof fetchBook> | null>(null);

  useEffect(() => {
    if (!open || selectedBook) return;

    const query = title.trim();
    if (
      query.length < MIN_QUERY_LENGTH ||
      (skipSearchForTitle && query.toLowerCase() === skipSearchForTitle.trim().toLowerCase())
    ) {
      return;
    }

    const requestId = ++searchRequestIdRef.current;
    let request: ReturnType<typeof searchBooks> | undefined;
    const timer = window.setTimeout(() => {
      setIsSearching(true);
      request = searchBooks(query);
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
  }, [open, title, selectedBook, skipSearchForTitle, searchBooks, onError]);

  const handleSelect = async (book: OpenLibraryBookSearchResult | null) => {
    if (!book) return;

    const requestId = ++detailRequestIdRef.current;
    detailRequestRef.current?.abort();
    setSelectedBook(book);
    setResults([]);
    onSelectionChange(book, true);

    const request = fetchBook(book.id);
    detailRequestRef.current = request;
    try {
      const result = await request.unwrap();
      if (requestId === detailRequestIdRef.current) onBookLoaded(result);
    } catch (error) {
      if (isAbortError(error)) return;
      if (requestId === detailRequestIdRef.current) onError(error);
    } finally {
      if (requestId === detailRequestIdRef.current) {
        onSelectionChange(book, false);
        detailRequestRef.current = null;
      }
    }
  };

  return (
    <Autocomplete
      options={selectedBook ? [selectedBook] : results}
      value={selectedBook}
      inputValue={title}
      getOptionLabel={(option) =>
        option.first_publish_year == null
          ? option.name
          : `${option.name} (${option.first_publish_year})`
      }
      getOptionKey={(option) => option.id}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      filterOptions={(options) => options}
      loading={isSearching}
      noOptionsText={
        title.trim().length < MIN_QUERY_LENGTH
          ? 'Type at least 3 characters'
          : 'No matching books'
      }
      onInputChange={(_event, value, reason) => {
        if (reason !== 'input' && reason !== 'clear') return;

        const hadSelection = selectedBook !== null;
        detailRequestIdRef.current += 1;
        detailRequestRef.current?.abort();
        detailRequestRef.current = null;
        setSelectedBook(null);
        setResults([]);
        setIsSearching(false);
        onSelectionChange(null, false);
        onTitleChange(value, hadSelection);
      }}
      onChange={(_event, book) => void handleSelect(book)}
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
                  {(isSearching || bookState.isFetching) && (
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
