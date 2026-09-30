import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  CardSize,
  MediaItem,
  SortDirection,
  SortField,
  TypeFilter,
  ViewMode,
} from '@/types/media';
import { CARD_SIZE_DEFAULT } from '@/types/media';
import { SORT_FIELD_DEFAULT_DIRECTION } from '@/utils/mediaSort';
import { clearUsername } from './authSlice';
import { mediaApi } from './mediaApi';

interface LibraryUiState {
  viewMode: ViewMode; // cards, list
  cardSize: CardSize; // 0 XL … 2 medium … 4 XS (cards view only)
  typeFilter: TypeFilter; // All, Game/DLC, Movie, Series, Anime
  sortField: SortField; // title, status, rating, started_at, finished_at, months
  sortDirection: SortDirection; // asc, desc
  searchQuery: string; // case-insensitive title substring filter
  isMediaModalOpen: boolean;
  editingItem: MediaItem | null;
  defaultSortApplied: boolean; // true after first getUserSettings applies default_sort_field
}

const initialSortField: SortField = 'status';

const initialState: LibraryUiState = {
  viewMode: 'cards',
  cardSize: CARD_SIZE_DEFAULT,
  typeFilter: 'All',
  sortField: initialSortField,
  sortDirection: SORT_FIELD_DEFAULT_DIRECTION[initialSortField],
  searchQuery: '',
  isMediaModalOpen: false,
  editingItem: null,
  defaultSortApplied: false,
};

// UI state for the library page with methods to update the state.
const libraryUiSlice = createSlice({
  name: 'libraryUi',
  initialState,
  reducers: {
    setViewMode(state, action: PayloadAction<ViewMode>) {
      state.viewMode = action.payload;
    },
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
    openCreateMediaModal(state) {
      state.editingItem = null;
      state.isMediaModalOpen = true;
    },
    openEditMediaModal(state, action: PayloadAction<MediaItem>) {
      state.editingItem = action.payload;
      state.isMediaModalOpen = true;
    },
    closeMediaModal(state) {
      state.isMediaModalOpen = false;
      state.editingItem = null;
    },
  },
  extraReducers: (builder) => {
    // Let the next login apply that user's default sort.
    // addCase must come before addMatcher (RTK builder rule).
    builder.addCase(clearUsername, (state) => {
      state.defaultSortApplied = false;
    });

    // Apply the user's default sort once; keep sort valid when ratings are off.
    builder.addMatcher(
      mediaApi.endpoints.getUserSettings.matchFulfilled,
      (state, action) => {
        const { default_sort_field, ratings_enabled } = action.payload;

        if (!state.defaultSortApplied) {
          state.sortField = default_sort_field;
          state.sortDirection = SORT_FIELD_DEFAULT_DIRECTION[default_sort_field];
          state.defaultSortApplied = true;
        }

        // Drop rating sort whenever ratings are disabled.
        if (!ratings_enabled && state.sortField === 'rating') {
          state.sortField = 'status';
          state.sortDirection = SORT_FIELD_DEFAULT_DIRECTION.status;
        }
      },
    );
  },
});

// Export the methods to be used in the components.
export const {
  setViewMode,
  setCardSize,
  setTypeFilter,
  setSortField,
  setSortDirection,
  setSearchQuery,
  openCreateMediaModal,
  openEditMediaModal,
  closeMediaModal,
} = libraryUiSlice.actions;

// Export the reducer to be used in the store.
export default libraryUiSlice.reducer;
