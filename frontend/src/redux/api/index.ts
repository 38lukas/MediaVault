import './authEndpoints';
import './userEndpoints';
import './entriesEndpoints';
import './profileEndpoints';
import './friendsEndpoints';
import './listsEndpoints';
import './coversEndpoints';

export { mediaApi, resolveApiBaseUrl } from './baseApi';
export type { MediaEntryPayload } from '@/types/media';
export type {
  AccountUpdate,
  AuthUser,
  Friend,
  FriendEntry,
  IgdbGameLookup,
  IgdbGameSearchResult,
  OpenLibraryBookLookup,
  OpenLibraryBookSearchResult,
  TmdbLookup,
  TmdbMediaType,
  TmdbSearchResult,
  TmdbSeasonLookup,
  TmdbSeasonSummary,
  UserSettingsUpdate,
} from './types';

export {
  useLoginMutation,
  useUpdateAccountMutation,
} from './authEndpoints';

export {
  useGetUserSettingsQuery,
  useUpdateUserSettingsMutation,
  useUploadAvatarMutation,
} from './userEndpoints';

export {
  useGetMediaEntriesQuery,
  useCreateMediaEntryMutation,
  useUpdateMediaEntryMutation,
  useDeleteMediaEntryMutation,
} from './entriesEndpoints';

export { useGetProfileStatsQuery } from './profileEndpoints';

export {
  useGetFriendsQuery,
  useGetFriendEntriesQuery,
  useAddFriendMutation,
  useRemoveFriendMutation,
} from './friendsEndpoints';

export {
  useGetMediaListsQuery,
  useCreateMediaListMutation,
  useUpdateMediaListMutation,
  useDeleteMediaListMutation,
  useAddMediaListItemMutation,
  useRemoveMediaListItemMutation,
  useReorderMediaListMutation,
} from './listsEndpoints';

export {
  useLazyFetchIgdbCoverQuery,
  useLazySearchIgdbGamesQuery,
  useLazyFetchIgdbGameQuery,
  useLazyFetchTmdbCoverQuery,
  useLazySearchTmdbTitlesQuery,
  useLazyFetchTmdbTitleQuery,
  useFetchTmdbTitleQuery,
  useLazyFetchTmdbSeasonQuery,
  useLazyFetchOpenLibraryCoverQuery,
  useLazySearchOpenLibraryBooksQuery,
  useLazyFetchOpenLibraryBookQuery,
} from './coversEndpoints';
