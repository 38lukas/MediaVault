import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  STATUSES_BY_TYPE,
  isGameType,
  isMediaType,
  type MediaItem,
  type MediaType,
} from '@/types/media';
import { toDateInputValue, toIsoDateOrNull } from '@/utils/date';
import { clearUsername } from './authSlice';
import type {
  IgdbGameLookup,
  OpenLibraryBookLookup,
  TmdbLookup,
  TmdbSeasonLookup,
} from '../api';

export type MediaModalTab = 'overview' | 'details' | 'journal' | 'friends';

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
  directors: [] as string[],
  creators: [] as string[],
  productionCompanies: [] as string[],
  runtime: null as number | null,
  lastAirDate: '',
  numberOfSeasons: null as number | null,
  numberOfEpisodes: null as number | null,
  originalTitle: '',
  // Null = entry covers the whole show.
  seasonNumber: null as number | null,
  seasonName: '',
  authors: [] as string[],
  firstPublishDate: '',
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
  // IGDB / TMDB / Open Library search result picked, and whether its details are still loading.
  lookupSelected: boolean;
  lookupLoading: boolean;
  fetchError: string | null;
}

const initialState: MediaModalState = {
  isOpen: false,
  editingItem: null,
  activeTab: 'overview',
  form: INITIAL_MEDIA_FORM,
  lookupSelected: false,
  lookupLoading: false,
  fetchError: null,
};

// IGDB / TMDB / Open Library fields cleared when media type changes or the looked-up title resets.
const METADATA_FIELDS_RESET = {
  releaseDate: '',
  platforms: [],
  franchises: [],
  genres: [],
  developers: [],
  publishers: [],
  directors: [],
  creators: [],
  productionCompanies: [],
  runtime: null,
  lastAirDate: '',
  numberOfSeasons: null,
  numberOfEpisodes: null,
  originalTitle: '',
  seasonNumber: null,
  seasonName: '',
  authors: [],
  firstPublishDate: '',
  platformPlayedOn: '',
};

// Maps a TMDB lookup (movie or TV shape) onto form fields.
function formFieldsFromTmdb(result: TmdbLookup): Partial<MediaForm> {
  return {
    releaseDate: toIsoDateOrNull(result.release_date ?? result.first_air_date ?? '') ?? '',
    lastAirDate: toIsoDateOrNull(result.last_air_date ?? '') ?? '',
    genres: result.genres,
    franchises: result.collection ? [result.collection] : [],
    directors: result.directors ?? [],
    creators: result.created_by ?? [],
    productionCompanies: result.production_companies,
    runtime: result.runtime ?? null,
    numberOfSeasons: result.number_of_seasons ?? null,
    numberOfEpisodes: result.number_of_episodes ?? null,
    originalTitle: result.original_title ?? '',
  };
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
    directors: item.directors ?? [],
    creators: item.creators ?? [],
    productionCompanies: item.production_companies ?? [],
    runtime: item.runtime ?? null,
    lastAirDate: item.last_air_date ?? '',
    numberOfSeasons: item.number_of_seasons ?? null,
    numberOfEpisodes: item.number_of_episodes ?? null,
    originalTitle: item.original_title ?? '',
    seasonNumber: item.season_number ?? null,
    seasonName: item.season_name ?? '',
    authors: item.authors ?? [],
    firstPublishDate: item.first_publish_date ?? '',
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
  return !current.trim() || /^(manual|igdb|tmdb|openlibrary)_/.test(current) ? fetched : current;
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
      return {
        ...initialState,
        isOpen: true,
        editingItem: action.payload,
        form: formFromItem(action.payload),
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
        Object.assign(form, METADATA_FIELDS_RESET);
        form.externalId = form.externalId.replace(/^(tmdb_tv_\d+)_s\d+$/, '$1');
        state.lookupSelected = false;
        state.lookupLoading = false;
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
    lookupTitleChanged(state, action: PayloadAction<{ title: string; hadSelection: boolean }>) {
      const { title, hadSelection } = action.payload;
      const form = state.form;
      state.lookupSelected = false;
      state.lookupLoading = false;
      state.fetchError = null;
      if (hadSelection) {
        form.posterUrl = '';
        if (/^(igdb|tmdb|openlibrary)_/.test(form.externalId)) form.externalId = '';
      }
      form.title = title;
      Object.assign(form, METADATA_FIELDS_RESET);
    },
    lookupSelectionChanged(
      state,
      action: PayloadAction<{ name: string | null; loading: boolean }>,
    ) {
      const { name, loading } = action.payload;
      state.lookupSelected = name != null;
      state.lookupLoading = loading;
      if (name != null) state.form.title = name;
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
    tmdbTitleLoaded(state, action: PayloadAction<TmdbLookup>) {
      const result = action.payload;
      Object.assign(state.form, METADATA_FIELDS_RESET, formFieldsFromTmdb(result), {
        title: result.name,
        posterUrl: result.poster_path ?? '',
        externalId: pickExternalId(state.form.externalId, result.external_id),
      });
    },
    // Applies show-wide TMDB data, then the picked season's overrides (null = whole show).
    tmdbSeasonSelected(
      state,
      action: PayloadAction<{ show: TmdbLookup; season: TmdbSeasonLookup | null }>,
    ) {
      const { show, season } = action.payload;
      Object.assign(state.form, METADATA_FIELDS_RESET, formFieldsFromTmdb(show), {
        title: show.name,
        posterUrl: show.poster_path ?? '',
        externalId: show.external_id,
      });
      if (!season) return;
      Object.assign(state.form, {
        seasonNumber: season.season_number,
        seasonName: season.name,
        posterUrl: season.poster_path ?? show.poster_path ?? '',
        externalId: season.external_id,
        releaseDate: toIsoDateOrNull(season.air_date ?? '') ?? '',
        lastAirDate: toIsoDateOrNull(season.last_air_date ?? '') ?? '',
        numberOfEpisodes: season.episode_count,
      });
    },
    openLibraryBookLoaded(state, action: PayloadAction<OpenLibraryBookLookup>) {
      const result = action.payload;
      Object.assign(state.form, METADATA_FIELDS_RESET, {
        title: result.name,
        posterUrl: result.poster_path ?? '',
        authors: result.author_name,
        firstPublishDate: result.first_publish_date ?? '',
        genres: result.subjects,
        publishers: result.publishers,
        franchises: result.series,
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
  lookupTitleChanged,
  lookupSelectionChanged,
  igdbGameLoaded,
  tmdbTitleLoaded,
  tmdbSeasonSelected,
  openLibraryBookLoaded,
  togglePlayedDate,
} = mediaModalSlice.actions;

export default mediaModalSlice.reducer;
