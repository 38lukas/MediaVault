import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  MediaItem,
  SortDirection,
  SortField,
  TypeFilter,
  ViewMode,
} from '@/types/media';

interface LibraryUiState {
  viewMode: ViewMode; // cards, list
  typeFilter: TypeFilter; // All, Movie, Series, Anime, Game, DLC
  sortField: SortField; // title, status, started_at, finished_at, months
  sortDirection: SortDirection; // asc, desc
  isMediaModalOpen: boolean;
  editingItem: MediaItem | null;
}

const initialState: LibraryUiState = {
  viewMode: 'cards',
  typeFilter: 'All',
  sortField: 'status',
  sortDirection: 'asc',
  isMediaModalOpen: false,
  editingItem: null,
};

// UI state for the library page with methods to update the state.
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

// Export the methods to be used in the components.
export const {
  setViewMode,
  setTypeFilter,
  setSortField,
  setSortDirection,
  openCreateMediaModal,
  openEditMediaModal,
  closeMediaModal,
} = libraryUiSlice.actions;

// Export the reducer to be used in the store.
export default libraryUiSlice.reducer;
