import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  CardSize,
  SortDirection,
  SortField,
  TypeFilter,
} from '@/types/media';
import { CARD_SIZE_DEFAULT } from '@/types/media';
import { SORT_FIELD_DEFAULT_DIRECTION } from '@/utils/mediaSort';
import { clearUsername } from './authSlice';
import { mediaApi } from '../api/mediaApi';

interface LibraryUiState {
  cardSize: CardSize; // 0 XL … 2 medium … 4 XS
  typeFilter: TypeFilter; // All, Game/DLC, Movie, Series, Anime
  sortField: SortField; // title, status, rating, started_at, finished_at, months
  sortDirection: SortDirection; // asc, desc
  searchQuery: string; // case-insensitive title substring filter
  defaultsApplied: boolean; // true after first getUserSettings applies account defaults
}

const initialSortField: SortField = 'status';

const initialState: LibraryUiState = {
  cardSize: CARD_SIZE_DEFAULT,
  typeFilter: 'All',
  sortField: initialSortField,
  sortDirection: SORT_FIELD_DEFAULT_DIRECTION[initialSortField],
  searchQuery: '',
  defaultsApplied: false,
};

// UI state for the library page with methods to update the state.
const libraryUiSlice = createSlice({
  name: 'libraryUi',
  initialState,
  reducers: {
    setCardSize(state, action: PayloadAction<CardSize>) {
      state.cardSize = action.payload;
    },
    setTypeFilter(state, action: PayloadAction<TypeFilter>) {
      state.typeFilter = action.payload;
    },
    setSortField(state, action: PayloadAction<SortField>) {
      state.sortField = action.payload;
      // Apply the configured default direction for this sort field.
      state.sortDirection = SORT_FIELD_DEFAULT_DIRECTION[action.payload];
    },
    setSortDirection(state, action: PayloadAction<SortDirection>) {
      state.sortDirection = action.payload;
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Let the next login apply that user's default sort.
    // addCase must come before addMatcher (RTK builder rule).
    builder.addCase(clearUsername, (state) => {
      state.defaultsApplied = false;
    });

    // Apply the user's library defaults once on first settings load.
    builder.addMatcher(
      mediaApi.endpoints.getUserSettings.matchFulfilled,
      (state, action) => {
        if (state.defaultsApplied) return;

        const { default_sort_field, default_card_size } = action.payload;
        state.sortField = default_sort_field;
        state.sortDirection = SORT_FIELD_DEFAULT_DIRECTION[default_sort_field];
        state.cardSize = default_card_size;
        state.defaultsApplied = true;
      },
    );

    // Keep the live grid size in sync when the account default changes.
    builder.addMatcher(
      mediaApi.endpoints.updateUserSettings.matchFulfilled,
      (state, action) => {
        if (action.meta.arg.originalArgs.default_card_size !== undefined) {
          state.cardSize = action.payload.default_card_size;
        }
      },
    );
  },
});

// Export the methods to be used in the components.
export const {
  setCardSize,
  setTypeFilter,
  setSortField,
  setSortDirection,
  setSearchQuery,
} = libraryUiSlice.actions;

// Export the reducer to be used in the store.
export default libraryUiSlice.reducer;
