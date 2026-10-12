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
  cardSize: CardSize;
  typeFilter: TypeFilter;
  sortField: SortField;
  sortDirection: SortDirection;
  searchQuery: string;
  defaultsApplied: boolean;
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
    builder.addCase(clearUsername, (state) => {
      state.defaultsApplied = false;
    });

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

export const {
  setCardSize,
  setTypeFilter,
  setSortField,
  setSortDirection,
  setSearchQuery,
} = libraryUiSlice.actions;

export default libraryUiSlice.reducer;
