import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  CardSize,
  SortDirection,
  SortField,
  TypeFilter,
} from '@/types/media';
import { CARD_SIZE_DEFAULT, statusesForTypeFilter } from '@/types/media';
import { SORT_FIELD_DEFAULT_DIRECTION } from '@/utils/mediaSort';
import { clearUsername } from './authSlice';
import { userEndpoints } from '../api/userEndpoints';

interface LibraryUiState {
  cardSize: CardSize;
  typeFilter: TypeFilter;
  statusFilter: string | null;
  sortField: SortField;
  sortDirection: SortDirection;
  searchQuery: string;
  filtersOpen: boolean;
  defaultsApplied: boolean;
}

const initialSortField: SortField = 'status';

const initialState: LibraryUiState = {
  cardSize: CARD_SIZE_DEFAULT,
  typeFilter: 'All',
  statusFilter: null,
  sortField: initialSortField,
  sortDirection: SORT_FIELD_DEFAULT_DIRECTION[initialSortField],
  searchQuery: '',
  filtersOpen: false,
  defaultsApplied: false,
};

// Library toolbar UI: card size, filters, sort, search, and settings defaults.
const libraryUiSlice = createSlice({
  name: 'libraryUi',
  initialState,
  reducers: {
    setCardSize(state, action: PayloadAction<CardSize>) {
      state.cardSize = action.payload;
    },
    setTypeFilter(state, action: PayloadAction<TypeFilter>) {
      state.typeFilter = action.payload;
      if (
        state.statusFilter &&
        !statusesForTypeFilter(action.payload).includes(state.statusFilter)
      ) {
        state.statusFilter = null;
      }
    },
    setStatusFilter(state, action: PayloadAction<string | null>) {
      state.statusFilter = action.payload;
    },
    setSortField(state, action: PayloadAction<SortField>) {
      state.sortField = action.payload;
      state.sortDirection = SORT_FIELD_DEFAULT_DIRECTION[action.payload];
    },
    setSortDirection(state, action: PayloadAction<SortDirection>) {
      state.sortDirection = action.payload;
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    setFiltersOpen(state, action: PayloadAction<boolean>) {
      state.filtersOpen = action.payload;
    },
    toggleFiltersOpen(state) {
      state.filtersOpen = !state.filtersOpen;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(clearUsername, (state) => {
      state.defaultsApplied = false;
      state.statusFilter = null;
      state.filtersOpen = false;
    });

    builder.addMatcher(
      userEndpoints.endpoints.getUserSettings.matchFulfilled,
      (state, action) => {
        if (state.defaultsApplied) return;

        const { default_sort_field, default_card_size, default_type_filter } = action.payload;
        state.sortField = default_sort_field;
        state.sortDirection = SORT_FIELD_DEFAULT_DIRECTION[default_sort_field];
        state.cardSize = default_card_size;
        state.typeFilter = default_type_filter ?? 'All';
        state.defaultsApplied = true;
      },
    );

    builder.addMatcher(
      userEndpoints.endpoints.updateUserSettings.matchFulfilled,
      (state, action) => {
        if (action.meta.arg.originalArgs.default_card_size !== undefined) {
          state.cardSize = action.payload.default_card_size;
        }
      },
    );
  },
});

export const {
  setCardSize,
  setTypeFilter,
  setStatusFilter,
  setSortField,
  setSortDirection,
  setSearchQuery,
  setFiltersOpen,
  toggleFiltersOpen,
} = libraryUiSlice.actions;

export default libraryUiSlice.reducer;
