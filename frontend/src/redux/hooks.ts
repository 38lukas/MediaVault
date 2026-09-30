import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './store';
import { useGetUserSettingsQuery } from './mediaApi';

// Used to dispatch actions to the store.
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();

// Used to select data from the store.
export const useAppSelector = useSelector.withTypes<RootState>();

/** Whether ratings are enabled for the current user (defaults to true while loading).
 *
 * @returns true if ratings should be shown; false when the user disabled them
 */
export function useRatingsEnabled(): boolean {
  const username = useAppSelector((state) => state.auth.username);
  const { data } = useGetUserSettingsQuery(undefined, { skip: !username });
  return data?.ratings_enabled ?? true;
}
