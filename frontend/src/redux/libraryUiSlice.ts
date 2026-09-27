import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  MediaItem,
  SortDirection,
  SortField,
  TypeFilter,
  ViewMode,
} from '@/types/media';

interface LibraryUiState {
  viewMode: ViewMode;
  typeFilter: TypeFilter;
  sortField: SortField;
  sortDirection: SortDirection;
  groupByFinishedMonth: boolean;
  isMediaModalOpen: boolean;
  editingItem: MediaItem | null;
}

const initialState: LibraryUiState = {
  viewMode: 'cards',
  typeFilter: 'All',
  sortField: 'title',
  sortDirection: 'asc',
  groupByFinishedMonth: false,
  isMediaModalOpen: false,
  editingItem: null,
};

/**
 * UI state for the library page (filters, sort, modal).
 * Server data stays in RTK Query (`mediaApi`).
 */
const libraryUiSlice = createSlice({
  name: 'libraryUi',
  initialState,
  reducers: {
    setViewMode(state, action: PayloadAction<ViewMode>) {
      state.viewMode = action.payload;
    },
    setTypeFilter(state, action: PayloadAction<TypeFilter>) {
      state.typeFilter = action.payload;
    },
    setSortField(state, action: PayloadAction<SortField>) {
      state.sortField = action.payload;
    },
    setSortDirection(state, action: PayloadAction<SortDirection>) {
      state.sortDirection = action.payload;
    },
    toggleGroupByFinishedMonth(state) {
      state.groupByFinishedMonth = !state.groupByFinishedMonth;
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
});

export const {
  setViewMode,
  setTypeFilter,
  setSortField,
  setSortDirection,
  toggleGroupByFinishedMonth,
  openCreateMediaModal,
  openEditMediaModal,
  closeMediaModal,
} = libraryUiSlice.actions;

export default libraryUiSlice.reducer;
