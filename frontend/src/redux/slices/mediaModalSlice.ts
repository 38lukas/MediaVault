import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  STATUSES_BY_TYPE,
  isGameType,
  isMediaType,
  type MediaItem,
  type MediaType,
} from '@/types/media';
import { toDateInputValue } from '@/utils/date';
import { clearUsername } from './authSlice';
import type { IgdbGameLookup } from '../api';

export type MediaModalTab = 'overview' | 'details' | 'journal';

// Default empty form for create/edit media dialogs.
export const INITIAL_MEDIA_FORM = {
  title: '',
  mediaType: 'Game' as MediaType,
  status: 'Playing',
  playtimeHours: '',
  playtimeMinutes: '',
  releaseDate: '',
  platforms: [] as string[],
  franchises: [] as string[],
  genres: [] as string[],
  developers: [] as string[],
  publishers: [] as string[],
  platformPlayedOn: '',
  externalId: '',
  posterUrl: '',
  startedAt: '',
  finishedAt: '',
  rating: null as number | null,
  playedDates: [] as string[],
};

export type MediaForm = typeof INITIAL_MEDIA_FORM;

interface MediaModalState {
  isOpen: boolean;
  editingItem: MediaItem | null;
  activeTab: MediaModalTab;
  form: MediaForm;
  igdbSelected: boolean;
  igdbLoading: boolean;
  fetchError: string | null;
  lastCoverQueryKey: string | null;
}

const initialState: MediaModalState = {
  isOpen: false,
  editingItem: null,
  activeTab: 'overview',
  form: INITIAL_MEDIA_FORM,
  igdbSelected: false,
  igdbLoading: false,
  fetchError: null,
  lastCoverQueryKey: null,
};

// Fields cleared when media type changes or IGDB selection resets.
const IGDB_FIELDS_RESET = {
  releaseDate: '',
  platforms: [],
  franchises: [],
  genres: [],
  developers: [],
  publishers: [],
  platformPlayedOn: '',
};

// Cache key for a title + media-type cover lookup.
export function coverQueryKey(title: string, mediaType: MediaType): string {
  return `${mediaType}:${title.trim().toLowerCase()}`;
}

// Adds YYYY-MM-DD keys to playedDates (sorted, unique).
function withPlayedDates(dates: string[], ...keys: Array<string | null | undefined>): string[] {
  const next = new Set(dates);
  for (const key of keys) {
    if (key) next.add(key);
  }
  return [...next].sort();
}

// Keeps start / finish days in the journal list.
function syncMilestoneDates(form: MediaForm) {
  form.playedDates = withPlayedDates(form.playedDates, form.startedAt, form.finishedAt);
}

// Builds a form draft from an existing media entry.
function formFromItem(item: MediaItem): MediaForm {
  const mediaType = isMediaType(item.media_type) ? item.media_type : 'Game';
  const statuses = STATUSES_BY_TYPE[mediaType];
  const startedAt = toDateInputValue(item.started_at);
  const finishedAt = toDateInputValue(item.finished_at);
  return {
    title: item.title,
    mediaType,
    status: statuses.includes(item.status) ? item.status : statuses[0],
    playtimeHours: item.playtime == null ? '' : String(Math.floor(item.playtime / 60)),
    playtimeMinutes: item.playtime == null ? '' : String(item.playtime % 60),
    releaseDate: item.release_date ?? '',
    platforms: item.platforms ?? [],
    franchises: item.franchises ?? [],
    genres: item.genres ?? [],
    developers: item.developers ?? [],
    publishers: item.publishers ?? [],
    platformPlayedOn: item.platform_played_on ?? '',
    externalId: item.external_id ?? '',
    posterUrl: item.poster_path ?? '',
    startedAt,
    finishedAt,
    rating: item.rating ?? null,
    playedDates: withPlayedDates(item.played_dates ?? [], startedAt, finishedAt),
  };
}

// Prefers the fetched external id unless the user typed a custom one.
function pickExternalId(current: string, fetched: string): string {
  return !current.trim() || current.startsWith('manual_') ? fetched : current;
}

// Create/edit media dialog: open state, active tab, and form draft.
const mediaModalSlice = createSlice({
  name: 'mediaModal',
  initialState,
  reducers: {
    openCreateMediaModal() {
      return { ...initialState, isOpen: true };
    },
    openEditMediaModal(_state, action: PayloadAction<MediaItem>) {
      const form = formFromItem(action.payload);
      return {
        ...initialState,
        isOpen: true,
        editingItem: action.payload,
        form,
        lastCoverQueryKey: coverQueryKey(form.title, form.mediaType),
      };
    },
    closeMediaModal(state) {
      state.isOpen = false;
      state.editingItem = null;
    },
    setMediaModalTab(state, action: PayloadAction<MediaModalTab>) {
      state.activeTab = action.payload;
    },
    patchForm(state, action: PayloadAction<Partial<MediaForm>>) {
      Object.assign(state.form, action.payload);
      if ('startedAt' in action.payload || 'finishedAt' in action.payload) {
        syncMilestoneDates(state.form);
      }
    },
    setMediaType(state, action: PayloadAction<MediaType>) {
      const type = action.payload;
      const form = state.form;
      if (type !== form.mediaType) {
        Object.assign(form, IGDB_FIELDS_RESET);
        state.igdbSelected = false;
        state.igdbLoading = false;
        state.lastCoverQueryKey = null;
      }
      if (!isGameType(type)) {
        form.playtimeHours = '';
        form.playtimeMinutes = '';
      }
      const statuses = STATUSES_BY_TYPE[type];
      if (!statuses.includes(form.status)) form.status = statuses[0];
      form.mediaType = type;
    },
    setFetchError(state, action: PayloadAction<string | null>) {
      state.fetchError = action.payload;
    },
    applyFetchedCover(
      state,
      action: PayloadAction<{
        title: string;
        mediaType: MediaType;
        posterUrl: string;
        externalId: string;
      }>,
    ) {
      const { title, mediaType, posterUrl, externalId } = action.payload;
      const form = state.form;
      state.lastCoverQueryKey = coverQueryKey(title, mediaType);
      if (
        form.title.trim().toLowerCase() !== title.toLowerCase() ||
        form.mediaType !== mediaType
      ) {
        return;
      }
      form.posterUrl = posterUrl;
      form.externalId = pickExternalId(form.externalId, externalId);
    },
    igdbTitleChanged(state, action: PayloadAction<{ title: string; hadSelection: boolean }>) {
      const { title, hadSelection } = action.payload;
      const form = state.form;
      state.igdbSelected = false;
      state.igdbLoading = false;
      state.fetchError = null;
      state.lastCoverQueryKey = null;
      if (hadSelection) {
        form.posterUrl = '';
        if (form.externalId.startsWith('igdb_')) form.externalId = '';
      }
      form.title = title;
      Object.assign(form, IGDB_FIELDS_RESET);
    },
    igdbSelectionChanged(
      state,
      action: PayloadAction<{ name: string | null; loading: boolean }>,
    ) {
      const { name, loading } = action.payload;
      state.igdbSelected = name != null;
      state.igdbLoading = loading;
      if (name != null) {
        state.lastCoverQueryKey = coverQueryKey(name, state.form.mediaType);
        state.form.title = name;
      }
    },
    igdbGameLoaded(state, action: PayloadAction<IgdbGameLookup>) {
      const result = action.payload;
      Object.assign(state.form, {
        title: result.name,
        posterUrl: result.poster_path ?? '',
        releaseDate:
          result.first_release_date == null
            ? ''
            : new Date(result.first_release_date * 1000).toISOString(),
        platforms: result.platforms,
        franchises: result.franchises,
        genres: result.genres,
        developers: result.developers,
        publishers: result.publishers,
        externalId: pickExternalId(state.form.externalId, result.external_id),
      });
    },
    togglePlayedDate(state, action: PayloadAction<string>) {
      const dates = state.form.playedDates;
      const index = dates.indexOf(action.payload);
      if (index >= 0) {
        dates.splice(index, 1);
      } else {
        dates.push(action.payload);
        dates.sort();
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(clearUsername, () => initialState);
  },
});

export const {
  openCreateMediaModal,
  openEditMediaModal,
  closeMediaModal,
  setMediaModalTab,
  patchForm,
  setMediaType,
  setFetchError,
  applyFetchedCover,
  igdbTitleChanged,
  igdbSelectionChanged,
  igdbGameLoaded,
  togglePlayedDate,
} = mediaModalSlice.actions;

export default mediaModalSlice.reducer;
