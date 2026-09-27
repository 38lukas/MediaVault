import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './store';

// Used to dispatch actions to the store.
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();

// Used to select data from the store.
export const useAppSelector = useSelector.withTypes<RootState>();
